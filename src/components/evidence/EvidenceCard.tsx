import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import type { Evidence, EvidenceStatus } from '../../types';
import { useGameStore } from '../../store/gameStore';

interface EvidenceCardProps {
  evidence: Evidence;
  isUnlocked: boolean;
  index: number;
}

const STATUS_COLORS: Record<EvidenceStatus, string> = {
  locked: 'var(--text-muted)',
  unreviewed: 'var(--text-secondary)',
  investigating: 'var(--neon-yellow)',
  verified: 'var(--neon-cyan)',
  complete: 'var(--neon-green)',
};

const STATUS_LABELS: Record<EvidenceStatus, string> = {
  locked: 'LOCKED',
  unreviewed: 'UNREVIEWED',
  investigating: 'INVESTIGATING',
  verified: 'VERIFIED',
  complete: 'COMPLETE',
};

export default function EvidenceCard({ evidence, isUnlocked, index }: EvidenceCardProps) {
  const navigate = useNavigate();
  const { isEvidenceReviewed, savedImages, discoveredClues } = useGameStore();

  const reviewed = isEvidenceReviewed(evidence.id);
  const hasSavedImage = !!savedImages[evidence.id];
  
  // Count discovered clues for this evidence
  const discoveredClueCount = evidence.clueIds.filter((id) => discoveredClues.includes(id)).length;

  // Determine effective status
  let status: EvidenceStatus = 'locked';
  if (isUnlocked) {
    if (hasSavedImage && discoveredClueCount > 0) status = 'complete';
    else if (hasSavedImage) status = 'verified';
    else if (reviewed) status = 'investigating';
    else status = 'unreviewed';
  }

  const handleOpen = () => {
    if (!isUnlocked) return;
    navigate(`/evidence/${evidence.id}`);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.08, duration: 0.4 }}
      onClick={handleOpen}
      style={{
        background: 'var(--bg-surface)',
        border: `1px solid ${isUnlocked ? 'var(--border-default)' : 'var(--border-subtle)'}`,
        borderRadius: 'var(--radius-md)',
        overflow: 'hidden',
        cursor: isUnlocked ? 'pointer' : 'default',
        opacity: isUnlocked ? 1 : 0.45,
        transition: 'all 0.25s ease',
        position: 'relative',
      }}
      whileHover={
        isUnlocked
          ? {
              borderColor: 'var(--neon-cyan)',
              boxShadow: '0 0 20px rgba(0,212,212,0.08)',
              y: -2,
            }
          : {}
      }
    >
      {/* Image Container */}
      <div style={{ position: 'relative', aspectRatio: '16/9', overflow: 'hidden' }}>
        {isUnlocked ? (
          <img
            src={hasSavedImage ? savedImages[evidence.id] : evidence.imageSrc}
            alt={evidence.title}
            className="evidence-img"
            style={{
              filter: hasSavedImage ? 'none' : 'brightness(0.7)',
              transition: 'filter 0.3s ease',
            }}
            onError={(e) => {
              (e.target as HTMLImageElement).src = `https://picsum.photos/seed/${evidence.id}/640/360`;
            }}
          />
        ) : (
          <div
            style={{
              width: '100%',
              height: '100%',
              background: 'var(--bg-elevated)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              minHeight: '160px',
            }}
          >
            <span
              className="font-display"
              style={{
                fontSize: '2rem',
                color: 'var(--text-muted)',
                letterSpacing: '0.2em',
              }}
            >
              ◈ LOCKED
            </span>
          </div>
        )}

        {/* Status overlay */}
        <div
          style={{
            position: 'absolute',
            top: '0.5rem',
            left: '0.5rem',
          }}
        >
          <span
            className="badge"
            style={{
              color: STATUS_COLORS[status],
              borderColor: `${STATUS_COLORS[status]}40`,
              backgroundColor: `${STATUS_COLORS[status]}10`,
            }}
          >
            ● {STATUS_LABELS[status]}
          </span>
        </div>

        {/* Saved indicator */}
        {hasSavedImage && (
          <div
            style={{
              position: 'absolute',
              top: '0.5rem',
              right: '0.5rem',
              width: '8px',
              height: '8px',
              borderRadius: '50%',
              background: 'var(--neon-cyan)',
              boxShadow: '0 0 8px var(--neon-cyan)',
            }}
          />
        )}

        {/* Evidence number overlay */}
        <div
          style={{
            position: 'absolute',
            bottom: '0.5rem',
            right: '0.5rem',
          }}
        >
          <span
            className="font-mono"
            style={{
              fontSize: '0.6rem',
              color: 'rgba(255,255,255,0.5)',
              background: 'rgba(0,0,0,0.6)',
              padding: '0.15rem 0.4rem',
              borderRadius: '2px',
            }}
          >
            #{String(index + 1).padStart(2, '0')}
          </span>
        </div>
      </div>

      {/* Card Body */}
      <div style={{ padding: '1rem' }}>
        {/* Location & timestamp */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'flex-start',
            marginBottom: '0.5rem',
          }}
        >
          <span
            className="font-display"
            style={{
              fontSize: '1rem',
              color: isUnlocked ? 'var(--text-bright)' : 'var(--text-muted)',
            }}
          >
            {evidence.title}
          </span>
          <span
            className="font-mono"
            style={{ fontSize: '0.6rem', color: 'var(--text-muted)' }}
          >
            {evidence.timestamp}
          </span>
        </div>

        {/* Location */}
        <div
          className="font-mono"
          style={{
            fontSize: '0.65rem',
            color: 'var(--text-secondary)',
            marginBottom: '0.75rem',
          }}
        >
          {isUnlocked ? evidence.location : '██████████████████'}
        </div>

        {/* Clue count + CTA */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          {isUnlocked && (
            <span
              className="font-mono"
              style={{ fontSize: '0.6rem', color: 'var(--text-secondary)' }}
            >
              CLUES:{' '}
              <span style={{ color: 'var(--neon-cyan)' }}>
                {discoveredClueCount}/{evidence.clueIds.length}
              </span>
            </span>
          )}

          {isUnlocked && (
            <button
              className="btn btn-evidence btn-sm"
              onClick={handleOpen}
            >
              {reviewed ? 'RE-EXAMINE' : 'REVIEW'} →
            </button>
          )}
        </div>
      </div>
    </motion.div>
  );
}
