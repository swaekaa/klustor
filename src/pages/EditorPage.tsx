import { useParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useState, useCallback } from 'react';
import { useGameStore } from '../store/gameStore';
import { case017 } from '../data/cases/case017';
import InvestigationEditor from '../components/editor/InvestigationEditor';
import ClueReveal from '../components/clues/ClueReveal';
import type { Clue } from '../types';

export default function EditorPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { saveInvestigation, discoverClue, discoveredClues, getUnlockedEvidence } = useGameStore();

  const [activeClue, setActiveClue] = useState<Clue | null>(null);
  const [showClueSelector, setShowClueSelector] = useState(false);
  const [savedThisSession, setSavedThisSession] = useState(false);

  const evidence = case017.evidence.find((e) => e.id === id);
  const unlockedIds = getUnlockedEvidence();

  if (!evidence || !unlockedIds.includes(evidence.id)) {
    return (
      <div
        className="page"
        style={{
          paddingTop: '80px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <div style={{ textAlign: 'center' }}>
          <div className="font-display" style={{ fontSize: '2rem', color: 'var(--text-muted)' }}>
            EVIDENCE LOCKED
          </div>
          <button
            className="btn btn-ghost"
            style={{ marginTop: '1rem' }}
            onClick={() => navigate('/case')}
          >
            ← BACK TO CASE
          </button>
        </div>
      </div>
    );
  }

  const evidenceIndex = case017.evidence.findIndex((e) => e.id === evidence.id);

  // Get undiscovered clues for this evidence
  const availableClues = evidence.clueIds
    .map((cId) => case017.clues.find((c) => c.id === cId))
    .filter((c): c is Clue => !!c && !discoveredClues.includes(c.id));

  // Handle save from the Unlayer editor
  // Receives the dataUrl (base64 encoded edited image) from the editor's onSave callback
  const handleEditorSave = useCallback(
    (dataUrl: string) => {
      // Save the investigation with the edited dataUrl
      saveInvestigation(evidence.id, dataUrl, {
        annotations: [],
        discoveredClueIds: [],
        savedImage: dataUrl,
        timestamp: new Date().toISOString(),
      });

      setSavedThisSession(true);

      // Show clue discovery selector if there are undiscovered clues
      if (availableClues.length > 0) {
        setTimeout(() => setShowClueSelector(true), 600);
      }
    },
    [evidence.id, saveInvestigation, availableClues.length]
  );

  // User confirms which clue they found
  const handleClueSelect = (clue: Clue) => {
    discoverClue(clue.id);
    setShowClueSelector(false);
    setActiveClue(clue);
  };

  const handleClueRevealClose = () => {
    setActiveClue(null);
    // Check if there are more clues to discover
    const remaining = availableClues.filter((c) => !discoveredClues.includes(c.id));
    if (remaining.length === 0) {
      // Navigate back to evidence page
      setTimeout(() => navigate(`/evidence/${evidence.id}`), 300);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="page"
      style={{
        paddingTop: '56px',
        display: 'flex',
        flexDirection: 'column',
        height: '100vh',
      }}
    >
      {/* Editor Header Bar */}
      <div
        style={{
          background: 'var(--bg-surface)',
          borderBottom: '1px solid var(--border-default)',
          padding: '0.75rem 1.5rem',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '1rem',
          flexShrink: 0,
        }}
      >
        {/* Left: breadcrumb */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <button
            className="btn btn-ghost btn-sm"
            onClick={() => navigate(`/evidence/${evidence.id}`)}
          >
            ← CASE 017
          </button>
          <span
            className="font-mono"
            style={{ fontSize: '0.6rem', color: 'var(--text-muted)' }}
          >
            /
          </span>
          <span
            className="font-mono"
            style={{
              fontSize: '0.65rem',
              color: 'var(--text-secondary)',
              letterSpacing: '0.1em',
            }}
          >
            EVIDENCE #{String(evidenceIndex + 1).padStart(2, '0')}
          </span>
          <span
            className="font-mono"
            style={{ fontSize: '0.6rem', color: 'var(--text-muted)' }}
          >
            /
          </span>
          <span
            className="font-mono"
            style={{
              fontSize: '0.65rem',
              color: 'var(--text-bright)',
              letterSpacing: '0.1em',
            }}
          >
            {evidence.title}
          </span>
        </div>

        {/* Center: mode label */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <div
            style={{
              width: '6px',
              height: '6px',
              borderRadius: '50%',
              background: 'var(--neon-red)',
              boxShadow: '0 0 6px var(--neon-red)',
              animation: 'pulse 1s ease-in-out infinite',
            }}
          />
          <span
            className="font-mono"
            style={{
              fontSize: '0.65rem',
              color: 'var(--neon-yellow)',
              letterSpacing: '0.15em',
            }}
          >
            INVESTIGATION MODE
          </span>
        </div>

        {/* Right: clue hints */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <span
            className="font-mono"
            style={{ fontSize: '0.55rem', color: 'var(--text-muted)', letterSpacing: '0.08em' }}
          >
            CLUES POSSIBLY PRESENT:
          </span>
          {evidence.clueZones.slice(0, 3).map((zone) => (
            <span key={zone.id} className="badge badge-yellow" style={{ fontSize: '0.55rem' }}>
              {zone.label}
            </span>
          ))}
        </div>
      </div>

      {/* Main: Editor + Sidebar */}
      <div
        style={{
          flex: 1,
          display: 'grid',
          gridTemplateColumns: '1fr 280px',
          minHeight: 0,
        }}
      >
        {/* CENTER: The Official Unlayer React Image Editor */}
        <div
          style={{
            position: 'relative',
            overflow: 'hidden',
            background: 'var(--bg-primary)',
          }}
        >
          <InvestigationEditor
            imageSrc={evidence.imageSrc}
            evidenceId={evidence.id}
            onSave={handleEditorSave}
          />
        </div>

        {/* RIGHT SIDEBAR: Investigation context */}
        <div
          style={{
            background: 'var(--bg-surface)',
            borderLeft: '1px solid var(--border-default)',
            padding: '1.25rem',
            overflowY: 'auto',
            display: 'flex',
            flexDirection: 'column',
            gap: '1rem',
          }}
        >
          {/* Evidence context */}
          <div>
            <div
              className="font-mono"
              style={{
                fontSize: '0.55rem',
                color: 'var(--text-muted)',
                letterSpacing: '0.12em',
                marginBottom: '0.5rem',
              }}
            >
              EVIDENCE CONTEXT
            </div>
            <div
              className="font-display"
              style={{ fontSize: '1.1rem', color: 'var(--text-bright)', marginBottom: '0.25rem' }}
            >
              {evidence.title}
            </div>
            <div
              className="font-mono"
              style={{ fontSize: '0.6rem', color: 'var(--neon-cyan)', marginBottom: '0.75rem' }}
            >
              {evidence.location}
            </div>
            <p
              style={{
                fontSize: '0.75rem',
                color: 'var(--text-secondary)',
                lineHeight: 1.6,
              }}
            >
              {evidence.description}
            </p>
          </div>

          <div className="divider" />

          {/* Investigator guidance */}
          <div>
            <div
              className="font-mono"
              style={{
                fontSize: '0.55rem',
                color: 'var(--text-muted)',
                letterSpacing: '0.12em',
                marginBottom: '0.5rem',
              }}
            >
              INVESTIGATOR NOTES
            </div>
            {[
              'Use CROP to isolate suspicious areas.',
              'Use DRAW to circle evidence.',
              'Add TEXT to write your notes.',
              'Use SHAPES to mark regions.',
              'Apply FILTERS to reveal detail.',
            ].map((tip, i) => (
              <div
                key={i}
                style={{
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: '0.5rem',
                  marginBottom: '0.5rem',
                  padding: '0.4rem',
                  background: 'rgba(255,255,255,0.02)',
                  borderRadius: '2px',
                }}
              >
                <span style={{ color: 'var(--neon-cyan)', fontSize: '0.6rem', marginTop: '0.1rem' }}>
                  ›
                </span>
                <span
                  className="font-mono"
                  style={{ fontSize: '0.62rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}
                >
                  {tip}
                </span>
              </div>
            ))}
          </div>

          <div className="divider" />

          {/* Anomaly hint */}
          <div
            style={{
              padding: '0.75rem',
              background: 'rgba(245, 200, 66, 0.05)',
              border: '1px solid rgba(245, 200, 66, 0.15)',
              borderRadius: '2px',
            }}
          >
            <div
              className="font-mono"
              style={{
                fontSize: '0.55rem',
                color: 'var(--neon-yellow)',
                letterSpacing: '0.12em',
                marginBottom: '0.3rem',
              }}
            >
              ◈ ANOMALY DETECTED
            </div>
            <p
              className="font-mono"
              style={{ fontSize: '0.65rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}
            >
              {evidence.anomalyHint}
            </p>
          </div>

          <div className="divider" />

          {/* Clue zones */}
          <div>
            <div
              className="font-mono"
              style={{
                fontSize: '0.55rem',
                color: 'var(--text-muted)',
                letterSpacing: '0.12em',
                marginBottom: '0.5rem',
              }}
            >
              SEARCH FOR
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.3rem' }}>
              {evidence.clueZones.map((zone) => {
                const clueId = evidence.clueIds[evidence.clueZones.indexOf(zone)];
                const isFound = clueId && discoveredClues.includes(clueId);
                return (
                  <div
                    key={zone.id}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.5rem',
                      padding: '0.4rem 0.6rem',
                      background: isFound ? 'rgba(0,212,212,0.05)' : 'transparent',
                      border: `1px solid ${isFound ? 'rgba(0,212,212,0.15)' : 'var(--border-subtle)'}`,
                      borderRadius: '2px',
                    }}
                  >
                    <span
                      style={{
                        color: isFound ? 'var(--neon-cyan)' : 'var(--text-muted)',
                        fontSize: '0.8rem',
                      }}
                    >
                      {isFound ? '✓' : '○'}
                    </span>
                    <span
                      className="font-mono"
                      style={{
                        fontSize: '0.62rem',
                        color: isFound ? 'var(--neon-cyan)' : 'var(--text-secondary)',
                        letterSpacing: '0.05em',
                      }}
                    >
                      {zone.label}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="divider" />

          {/* Instructions */}
          <div
            className="font-mono"
            style={{
              fontSize: '0.6rem',
              color: 'var(--text-muted)',
              lineHeight: 1.6,
              letterSpacing: '0.05em',
            }}
          >
            After investigating, click the{' '}
            <span style={{ color: 'var(--neon-cyan)' }}>SAVE</span> button in the editor toolbar to
            log your findings and discover clues.
          </div>

          {/* Save status */}
          {savedThisSession && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              style={{
                padding: '0.75rem',
                background: 'rgba(57, 217, 138, 0.05)',
                border: '1px solid rgba(57, 217, 138, 0.2)',
                borderRadius: '2px',
                textAlign: 'center',
              }}
            >
              <div
                className="font-mono"
                style={{ fontSize: '0.65rem', color: 'var(--neon-green)' }}
              >
                ✓ EVIDENCE SAVED TO CASE FILE
              </div>
            </motion.div>
          )}

          {/* Back button */}
          <button
            className="btn btn-ghost"
            onClick={() => navigate(`/evidence/${evidence.id}`)}
            style={{ width: '100%', marginTop: 'auto' }}
          >
            ← BACK TO EVIDENCE
          </button>
        </div>
      </div>

      {/* CLUE SELECTOR MODAL */}
      <AnimatePresence>
        {showClueSelector && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="modal-overlay"
          >
            <motion.div
              initial={{ opacity: 0, y: 30, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="modal-panel"
              style={{ maxWidth: '520px' }}
            >
              <div
                className="font-display"
                style={{
                  fontSize: '1.5rem',
                  color: 'var(--text-bright)',
                  marginBottom: '0.25rem',
                }}
              >
                WHAT DID YOU FIND?
              </div>
              <p
                className="font-mono"
                style={{
                  fontSize: '0.7rem',
                  color: 'var(--text-secondary)',
                  marginBottom: '1.5rem',
                  lineHeight: 1.5,
                }}
              >
                Your investigation revealed something. Select what you identified in the photograph:
              </p>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                {availableClues.map((clue) => (
                  <motion.button
                    key={clue.id}
                    onClick={() => handleClueSelect(clue)}
                    whileHover={{ scale: 1.01, backgroundColor: 'rgba(0,212,212,0.08)' }}
                    whileTap={{ scale: 0.99 }}
                    style={{
                      display: 'flex',
                      alignItems: 'flex-start',
                      gap: '0.75rem',
                      padding: '0.85rem 1rem',
                      background: 'rgba(255,255,255,0.02)',
                      border: '1px solid var(--border-default)',
                      borderRadius: 'var(--radius-sm)',
                      cursor: 'pointer',
                      textAlign: 'left',
                      transition: 'all 0.15s ease',
                    }}
                  >
                    <span style={{ color: 'var(--neon-yellow)', fontSize: '1rem', marginTop: '-2px' }}>
                      ◉
                    </span>
                    <div>
                      <div
                        className="font-display"
                        style={{
                          fontSize: '1rem',
                          color: 'var(--text-bright)',
                          marginBottom: '0.15rem',
                        }}
                      >
                        {clue.title}
                      </div>
                      <div
                        className="font-mono"
                        style={{
                          fontSize: '0.62rem',
                          color: 'var(--text-secondary)',
                          lineHeight: 1.4,
                        }}
                      >
                        {clue.description}
                      </div>
                    </div>
                    <span
                      className="font-mono"
                      style={{
                        marginLeft: 'auto',
                        color: 'var(--neon-yellow)',
                        fontSize: '0.7rem',
                        whiteSpace: 'nowrap',
                        paddingLeft: '0.5rem',
                      }}
                    >
                      +{clue.xp} XP
                    </span>
                  </motion.button>
                ))}
              </div>

              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  marginTop: '1.25rem',
                  gap: '0.75rem',
                }}
              >
                <button
                  className="btn btn-ghost"
                  onClick={() => setShowClueSelector(false)}
                  style={{ flex: 1 }}
                >
                  NOTHING YET
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* CLUE REVEAL CINEMATIC */}
      <ClueReveal clue={activeClue} onClose={handleClueRevealClose} />
    </motion.div>
  );
}
