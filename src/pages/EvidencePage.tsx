import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useState } from 'react';
import { useGameStore } from '../store/gameStore';
import { case017 } from '../data/cases/case017';

export default function EvidencePage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { isEvidenceReviewed, reviewEvidence, discoveredClues, savedImages, getUnlockedEvidence } =
    useGameStore();
  const [imageLoaded, setImageLoaded] = useState(false);

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

  const reviewed = isEvidenceReviewed(evidence.id);
  const hasSavedImage = !!savedImages[evidence.id];
  const discoveredClueCount = evidence.clueIds.filter((cId) => discoveredClues.includes(cId)).length;

  const handleOpenEditor = () => {
    reviewEvidence(evidence.id);
    navigate(`/editor/${evidence.id}`);
  };

  // Index for display
  const evidenceIndex = case017.evidence.findIndex((e) => e.id === evidence.id);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="page"
      style={{ paddingTop: '56px', minHeight: '100vh' }}
    >
      <div className="container" style={{ paddingTop: '2rem', paddingBottom: '4rem' }}>
        {/* Back link */}
        <motion.div
          initial={{ opacity: 0, x: -10 }}
          animate={{ opacity: 1, x: 0 }}
          style={{ marginBottom: '2rem' }}
        >
          <button
            className="btn btn-ghost btn-sm"
            onClick={() => navigate('/case')}
          >
            ← CASE 017
          </button>
        </motion.div>

        {/* Main layout */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: '1fr 380px',
            gap: '2rem',
            alignItems: 'start',
          }}
        >
          {/* LEFT: Image */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            <div
              style={{
                position: 'relative',
                borderRadius: 'var(--radius-md)',
                overflow: 'hidden',
                border: '1px solid var(--border-default)',
                background: 'var(--bg-elevated)',
                aspectRatio: '16/9',
              }}
            >
              {!imageLoaded && (
                <div
                  className="skeleton"
                  style={{
                    position: 'absolute',
                    inset: 0,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <span
                    className="font-mono"
                    style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}
                  >
                    LOADING EVIDENCE...
                  </span>
                </div>
              )}
              <img
                src={hasSavedImage ? savedImages[evidence.id] : evidence.imageSrc}
                alt={evidence.title}
                onLoad={() => setImageLoaded(true)}
                onError={(e) => {
                  (e.target as HTMLImageElement).src = `https://picsum.photos/seed/${evidence.id}/900/506`;
                  setImageLoaded(true);
                }}
                style={{
                  width: '100%',
                  height: '100%',
                  objectFit: 'cover',
                  display: imageLoaded ? 'block' : 'none',
                  filter: hasSavedImage ? 'none' : 'brightness(0.8)',
                }}
              />

              {/* Corner markers — evidence room aesthetic */}
              {[
                { top: '0.5rem', left: '0.5rem', transform: 'none' },
                { top: '0.5rem', right: '0.5rem', transform: 'scaleX(-1)' },
                { bottom: '0.5rem', left: '0.5rem', transform: 'scaleY(-1)' },
                { bottom: '0.5rem', right: '0.5rem', transform: 'scale(-1,-1)' },
              ].map((style, i) => (
                <div
                  key={i}
                  style={{
                    position: 'absolute',
                    width: '20px',
                    height: '20px',
                    borderTop: '2px solid var(--neon-yellow)',
                    borderLeft: '2px solid var(--neon-yellow)',
                    opacity: 0.6,
                    ...style,
                  }}
                />
              ))}

              {/* Evidence ID watermark */}
              <div
                style={{
                  position: 'absolute',
                  bottom: '0.75rem',
                  left: '0.75rem',
                }}
              >
                <span
                  className="font-mono"
                  style={{
                    fontSize: '0.65rem',
                    color: 'rgba(245,200,66,0.7)',
                    background: 'rgba(0,0,0,0.6)',
                    padding: '0.2rem 0.5rem',
                    letterSpacing: '0.1em',
                  }}
                >
                  VCI // EVIDENCE #{String(evidenceIndex + 1).padStart(2, '0')} //
                  {evidence.timestamp}
                </span>
              </div>

              {/* Saved badge */}
              {hasSavedImage && (
                <div
                  style={{
                    position: 'absolute',
                    top: '0.75rem',
                    right: '0.75rem',
                    background: 'rgba(57, 217, 138, 0.15)',
                    border: '1px solid rgba(57, 217, 138, 0.4)',
                    padding: '0.2rem 0.6rem',
                    borderRadius: '2px',
                  }}
                >
                  <span
                    className="font-mono"
                    style={{
                      fontSize: '0.6rem',
                      color: 'var(--neon-green)',
                      letterSpacing: '0.1em',
                    }}
                  >
                    ✓ INVESTIGATED
                  </span>
                </div>
              )}
            </div>

            {/* Caption */}
            {hasSavedImage && (
              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.3 }}
                className="font-mono"
                style={{
                  fontSize: '0.65rem',
                  color: 'var(--text-muted)',
                  marginTop: '0.5rem',
                  textAlign: 'center',
                  letterSpacing: '0.08em',
                }}
              >
                ↑ THIS IMAGE HAS BEEN INVESTIGATED AND SAVED AS EVIDENCE
              </motion.p>
            )}
          </motion.div>

          {/* RIGHT: Evidence metadata */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
            style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}
          >
            {/* Evidence header */}
            <div className="panel">
              <div
                className="font-mono"
                style={{
                  fontSize: '0.55rem',
                  color: 'var(--text-muted)',
                  letterSpacing: '0.15em',
                  marginBottom: '0.5rem',
                }}
              >
                EVIDENCE #{String(evidenceIndex + 1).padStart(2, '0')}
              </div>
              <h1
                className="font-display"
                style={{ fontSize: '2rem', color: 'var(--text-bright)', marginBottom: '0.25rem' }}
              >
                {evidence.title}
              </h1>
              <div
                className="font-mono"
                style={{
                  fontSize: '0.65rem',
                  color: 'var(--neon-cyan)',
                  letterSpacing: '0.08em',
                }}
              >
                {evidence.location}
              </div>
            </div>

            {/* Metadata grid */}
            <div className="panel">
              {[
                { label: 'CAPTURED', value: evidence.timestamp },
                { label: 'SOURCE', value: 'ANONYMOUS' },
                {
                  label: 'STATUS',
                  value: hasSavedImage ? 'VERIFIED' : reviewed ? 'UNDER REVIEW' : 'UNVERIFIED',
                  color: hasSavedImage
                    ? 'var(--neon-green)'
                    : reviewed
                    ? 'var(--neon-yellow)'
                    : 'var(--text-secondary)',
                },
                {
                  label: 'CLUES FOUND',
                  value: `${discoveredClueCount} / ${evidence.clueIds.length}`,
                  color: 'var(--neon-cyan)',
                },
              ].map((row) => (
                <div
                  key={row.label}
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    padding: '0.5rem 0',
                    borderBottom: '1px solid var(--border-subtle)',
                  }}
                >
                  <span
                    className="font-mono"
                    style={{ fontSize: '0.6rem', color: 'var(--text-muted)', letterSpacing: '0.1em' }}
                  >
                    {row.label}
                  </span>
                  <span
                    className="font-mono"
                    style={{
                      fontSize: '0.65rem',
                      color: row.color || 'var(--text-secondary)',
                      letterSpacing: '0.05em',
                    }}
                  >
                    {row.value}
                  </span>
                </div>
              ))}
            </div>

            {/* Description */}
            <div className="panel">
              <div
                className="font-mono"
                style={{
                  fontSize: '0.55rem',
                  color: 'var(--text-muted)',
                  letterSpacing: '0.12em',
                  marginBottom: '0.5rem',
                }}
              >
                FIELD NOTES
              </div>
              <p
                style={{
                  fontSize: '0.82rem',
                  color: 'var(--text-secondary)',
                  lineHeight: 1.7,
                  marginBottom: '0.75rem',
                }}
              >
                {evidence.description}
              </p>
              <div
                className="font-mono"
                style={{
                  fontSize: '0.65rem',
                  color: 'var(--neon-yellow)',
                  padding: '0.5rem',
                  background: 'rgba(245, 200, 66, 0.05)',
                  border: '1px solid rgba(245, 200, 66, 0.15)',
                  borderRadius: '2px',
                }}
              >
                ANOMALY: {evidence.anomalyHint}
              </div>
            </div>

            {/* Possible clue zones */}
            <div className="panel">
              <div
                className="font-mono"
                style={{
                  fontSize: '0.55rem',
                  color: 'var(--text-muted)',
                  letterSpacing: '0.12em',
                  marginBottom: '0.75rem',
                }}
              >
                CLUES POSSIBLY PRESENT
              </div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem' }}>
                {evidence.clueZones.map((zone) => {
                  const clueId = evidence.clueIds[evidence.clueZones.indexOf(zone)];
                  const isFound = clueId && discoveredClues.includes(clueId);
                  return (
                    <span
                      key={zone.id}
                      className="badge"
                      style={{
                        color: isFound ? 'var(--neon-cyan)' : 'var(--text-secondary)',
                        borderColor: isFound
                          ? 'rgba(0,212,212,0.3)'
                          : 'var(--border-default)',
                        background: isFound
                          ? 'rgba(0,212,212,0.08)'
                          : 'transparent',
                      }}
                    >
                      {isFound ? '✓' : '○'} {zone.label}
                    </span>
                  );
                })}
              </div>
            </div>

            {/* CTA */}
            <motion.button
              className="btn btn-primary btn-lg"
              onClick={handleOpenEditor}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              style={{ width: '100%' }}
            >
              {hasSavedImage ? '↩ RE-INVESTIGATE IMAGE' : '◉ INVESTIGATE IMAGE'}
            </motion.button>

            <button
              className="btn btn-ghost"
              onClick={() => navigate('/case')}
              style={{ width: '100%' }}
            >
              ← BACK TO CASE
            </button>
          </motion.div>
        </div>
      </div>

      {/* Responsive: stack on mobile */}
      <style>{`
        @media (max-width: 900px) {
          .evidence-layout {
            grid-template-columns: 1fr !important;
          }
        }
      `}</style>
    </motion.div>
  );
}
