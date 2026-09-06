import { useParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useState, useCallback } from 'react';
import { useGameStore } from '../store/gameStore';
import { case017 } from '../data/cases/case017';
import InvestigationEditor from '../components/editor/InvestigationEditor';
import ScannerOverlay from '../components/editor/ScannerOverlay';
import ClueReveal from '../components/clues/ClueReveal';
import type { Clue } from '../types';

export default function EditorPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { saveInvestigation, discoverClue, discoveredClues, getUnlockedEvidence } = useGameStore();

  const [activeClue, setActiveClue] = useState<Clue | null>(null);
  const [scanMode, setScanMode] = useState(false);
  const [scanMessage, setScanMessage] = useState<string | null>(null);
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

  const handleEditorSave = useCallback(
    (dataUrl: string) => {
      saveInvestigation(evidence.id, dataUrl, {
        annotations: [],
        discoveredClueIds: [],
        savedImage: dataUrl,
        timestamp: new Date().toISOString(),
      });
      setSavedThisSession(true);
    },
    [evidence.id, saveInvestigation]
  );

  const calculateIoU = (rect1: any, rect2: any) => {
    const xLeft = Math.max(rect1.x, rect2.x);
    const yTop = Math.max(rect1.y, rect2.y);
    const xRight = Math.min(rect1.x + rect1.width, rect2.x + rect2.width);
    const yBottom = Math.min(rect1.y + rect1.height, rect2.y + rect2.height);

    if (xRight < xLeft || yBottom < yTop) return 0;

    const intersectionArea = (xRight - xLeft) * (yBottom - yTop);
    const rect1Area = rect1.width * rect1.height;
    const rect2Area = rect2.width * rect2.height;
    const unionArea = rect1Area + rect2Area - intersectionArea;

    return intersectionArea / unionArea;
  };

  const handleAnalyzeRegion = (normalizedRect: { x: number; y: number; width: number; height: number }) => {
    setScanMode(false);
    
    let foundClueId: string | null = null;
    let maxIou = 0;

    for (const zone of evidence.clueZones) {
      const clueId = evidence.clueIds[evidence.clueZones.indexOf(zone)];
      if (discoveredClues.includes(clueId)) continue; // Already found

      const iou = calculateIoU(normalizedRect, zone);
      if (iou > maxIou) {
        maxIou = iou;
        foundClueId = clueId;
      }
    }

    // Tighter threshold for scanning logic: 0.30 as requested.
    if (maxIou >= 0.30 && foundClueId) {
      const clue = case017.clues.find(c => c.id === foundClueId);
      if (clue) {
        discoverClue(clue.id);
        setActiveClue(clue);
        setScanMessage(null);
      }
    } else {
      setScanMessage("NOTHING CONCLUSIVE");
      setTimeout(() => setScanMessage(null), 3000);
    }
  };

  const handleClueRevealClose = () => {
    setActiveClue(null);
    const remaining = availableClues.filter((c) => !discoveredClues.includes(c.id));
    if (remaining.length === 0) {
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
        paddingTop: '40px', // Adjusted for thin NavBar
        display: 'flex',
        flexDirection: 'column',
        height: '100vh',
      }}
    >
      {/* HUD Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1rem 2rem', background: 'rgba(0,0,0,0.8)', borderBottom: '1px solid var(--border-default)' }}>
        <div>
          <div className="font-mono" style={{ color: 'var(--neon-cyan)', fontSize: '0.7rem', letterSpacing: '0.15em', marginBottom: '0.2rem' }}>
            KLUSTOR INVESTIGATION WORKSTATION
          </div>
          <h2 className="font-display" style={{ fontSize: '2rem', margin: 0, color: '#fff', lineHeight: 1 }}>
            EVIDENCE #{String(evidenceIndex + 1).padStart(2, '0')} // {evidence.title}
          </h2>
        </div>
        <button className="btn btn-ghost" onClick={() => navigate('/case')} style={{ fontSize: '1rem' }}>
          ← ABORT
        </button>
      </div>

      <div
        style={{
          flex: 1,
          display: 'grid',
          gridTemplateColumns: '1fr 320px',
          minHeight: 0,
        }}
      >
        {/* CENTER: The Official Unlayer React Image Editor or Scanner Overlay */}
        <div
          style={{
            position: 'relative',
            overflow: 'hidden',
            background: 'var(--bg-primary)',
          }}
        >
          {scanMode ? (
            <ScannerOverlay 
              imageSrc={evidence.imageSrc}
              clueZones={evidence.clueZones as any}
              onAnalyze={handleAnalyzeRegion}
              onCancel={() => setScanMode(false)}
            />
          ) : (
            <InvestigationEditor
              imageSrc={evidence.imageSrc}
              evidenceId={evidence.id}
              onSave={handleEditorSave}
            />
          )}
        </div>

        {/* RIGHT SIDEBAR: Game Objectives & Scanning */}
        <div
          style={{
            background: 'rgba(10, 11, 18, 0.9)',
            borderLeft: '1px solid rgba(255,255,255,0.05)',
            display: 'flex',
            flexDirection: 'column',
            overflowY: 'auto',
          }}
        >
          <div style={{ padding: '2rem' }}>
            <h3 className="font-display" style={{ fontSize: '1.5rem', color: '#fff', marginBottom: '1rem' }}>
              OBJECTIVES
            </h3>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginBottom: '3rem' }}>
              {evidence.clueIds.map((clueId, idx) => {
                const isDiscovered = discoveredClues.includes(clueId);
                const clueTitle = case017.clues.find(c => c.id === clueId)?.title || 'Unknown Clue';
                const hint = evidence.clueZones[idx]?.label || 'Anomaly';
                
                return (
                  <div key={clueId} style={{ display: 'flex', alignItems: 'flex-start', gap: '0.75rem' }}>
                    <div style={{ 
                      width: '16px', height: '16px', border: `1px solid ${isDiscovered ? 'var(--neon-cyan)' : 'var(--text-muted)'}`, 
                      display: 'flex', alignItems: 'center', justifyContent: 'center', marginTop: '2px', background: isDiscovered ? 'rgba(0, 212, 212, 0.2)' : 'transparent'
                    }}>
                      {isDiscovered && <div style={{ width: '8px', height: '8px', background: 'var(--neon-cyan)' }} />}
                    </div>
                    <div>
                      <div className="font-mono" style={{ fontSize: '0.8rem', color: isDiscovered ? '#fff' : 'var(--text-secondary)' }}>
                        {isDiscovered ? clueTitle : `Find: ${hint}`}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="divider" style={{ margin: '2rem 0', background: 'rgba(255,255,255,0.1)' }} />

            <h3 className="font-display" style={{ fontSize: '1.2rem', color: 'var(--neon-cyan)', marginBottom: '1rem' }}>
              CLUE DETECTION
            </h3>
            
            <p className="font-mono" style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '1.5rem', lineHeight: 1.6 }}>
              {scanMode 
                ? "SCAN MODE ACTIVE. Drag a bounding box over the suspicious area." 
                : "Enhance the image using the editor, then scan regions to discover clues."}
            </p>

            {!scanMode && availableClues.length > 0 && (
              <button 
                className="btn btn-primary" 
                style={{ width: '100%', padding: '1rem' }}
                onClick={() => setScanMode(true)}
              >
                SCAN REGION
              </button>
            )}

            {scanMode && (
              <div style={{ padding: '1rem', border: '1px dashed var(--neon-cyan)', background: 'rgba(0,212,212,0.05)', textAlign: 'center' }}>
                <span className="font-mono animate-flicker" style={{ color: 'var(--neon-cyan)', fontSize: '0.8rem' }}>
                  AWAITING SELECTION...
                </span>
              </div>
            )}

            {scanMessage && (
              <motion.div
                initial={{ opacity: 0, y: -5 }}
                animate={{ opacity: 1, y: 0 }}
                style={{
                  padding: '1rem',
                  background: 'rgba(230, 57, 70, 0.05)',
                  border: '1px solid rgba(230, 57, 70, 0.2)',
                  marginTop: '1rem',
                  textAlign: 'center',
                }}
              >
                <span className="font-mono" style={{ fontSize: '0.75rem', color: 'var(--neon-red)' }}>
                  {scanMessage}
                </span>
              </motion.div>
            )}

            {availableClues.length === 0 && (
              <div style={{ padding: '1rem', background: 'rgba(57, 217, 138, 0.05)', border: '1px solid rgba(57, 217, 138, 0.2)', textAlign: 'center' }}>
                <span className="font-mono" style={{ color: 'var(--neon-green)', fontSize: '0.75rem' }}>
                  ALL OBJECTIVES COMPLETE
                </span>
              </div>
            )}
          </div>
        </div>
      </div>

      <ClueReveal clue={activeClue} onClose={handleClueRevealClose} />
    </motion.div>
  );
}
