import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useGameStore } from '../store/gameStore';
import { case017 } from '../data/cases/case017';
import EvidenceCard from '../components/evidence/EvidenceCard';

export default function CasePage() {
  const navigate = useNavigate();
  const {
    player,
    discoveredClues,
    reviewedEvidence,
    progress,
    canMakeDecision,
    getUnlockedEvidence,
  } = useGameStore();

  const unlockedIds = getUnlockedEvidence();
  const totalClues = case017.clues.length;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="page"
      style={{ paddingTop: '56px' }}
    >
      {/* Background glow */}
      <div
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          height: '300px',
          background:
            'radial-gradient(ellipse 60% 100% at 50% 0%, rgba(0,212,212,0.04) 0%, transparent 100%)',
          pointerEvents: 'none',
        }}
      />

      <div className="container" style={{ paddingTop: '2rem', paddingBottom: '4rem' }}>
        {/* Case Header */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          style={{ marginBottom: '2.5rem' }}
        >
          <div
            style={{
              display: 'flex',
              alignItems: 'flex-end',
              justifyContent: 'space-between',
              flexWrap: 'wrap',
              gap: '1rem',
              marginBottom: '1rem',
            }}
          >
            <div>
              <div
                className="font-mono"
                style={{
                  fontSize: '0.65rem',
                  color: 'var(--text-secondary)',
                  letterSpacing: '0.15em',
                  marginBottom: '0.4rem',
                }}
              >
                VICE CITY INVESTIGATIONS // {case017.subtitle}
              </div>
              <h1
                className="font-display"
                style={{
                  fontSize: 'clamp(2rem, 5vw, 3.5rem)',
                  color: 'var(--text-bright)',
                  marginBottom: '0.25rem',
                }}
              >
                {case017.title}
              </h1>
              <p
                style={{
                  color: 'var(--text-secondary)',
                  fontSize: '0.85rem',
                  maxWidth: '560px',
                  lineHeight: 1.6,
                }}
              >
                {case017.briefing.substring(0, 120)}...
              </p>
            </div>
            <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
              <span className="badge badge-red">● ACTIVE</span>
              <span className="badge badge-cyan">CASE 017</span>
              <span className="badge badge-yellow">02:13 AM</span>
            </div>
          </div>

          {/* Progress Bar */}
          <div className="progress-bar" style={{ marginBottom: '0.4rem' }}>
            <div className="progress-bar__fill" style={{ width: `${progress}%` }} />
          </div>
          <div
            className="font-mono"
            style={{
              fontSize: '0.6rem',
              color: 'var(--text-muted)',
              letterSpacing: '0.1em',
            }}
          >
            INVESTIGATION: {progress}% COMPLETE
          </div>
        </motion.div>

        {/* Stats Row */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))',
            gap: '1rem',
            marginBottom: '2.5rem',
          }}
        >
          {[
            {
              label: 'EVIDENCE REVIEWED',
              value: `${reviewedEvidence.length} / 5`,
              color: 'var(--neon-cyan)',
            },
            {
              label: 'CLUES DISCOVERED',
              value: `${discoveredClues.length} / ${totalClues}`,
              color: 'var(--neon-yellow)',
            },
            {
              label: 'REPUTATION',
              value: player.reputation,
              color: 'var(--neon-cyan)',
            },
            {
              label: 'HEAT LEVEL',
              value: `${player.heat}%`,
              color: 'var(--neon-red)',
            },
            {
              label: 'RANK',
              value: player.rank,
              color: 'var(--text-secondary)',
            },
          ].map((stat) => (
            <div
              key={stat.label}
              className="panel"
              style={{ padding: '1rem', textAlign: 'center' }}
            >
              <div
                className="font-mono"
                style={{
                  fontSize: '0.55rem',
                  color: 'var(--text-muted)',
                  letterSpacing: '0.12em',
                  marginBottom: '0.4rem',
                }}
              >
                {stat.label}
              </div>
              <div
                className="font-display"
                style={{ fontSize: '1.4rem', color: stat.color }}
              >
                {stat.value}
              </div>
            </div>
          ))}
        </motion.div>

        {/* Section divider */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '1rem',
            marginBottom: '1.5rem',
          }}
        >
          <span
            className="font-display"
            style={{ fontSize: '1.2rem', color: 'var(--text-secondary)', whiteSpace: 'nowrap' }}
          >
            EVIDENCE FILES
          </span>
          <div className="divider" />
          <span
            className="font-mono"
            style={{ fontSize: '0.6rem', color: 'var(--text-muted)', whiteSpace: 'nowrap' }}
          >
            {unlockedIds.length} / {case017.evidence.length} ACCESSIBLE
          </span>
        </motion.div>

        {/* Evidence Grid */}
        <div className="evidence-grid">
          {case017.evidence.map((ev, index) => (
            <EvidenceCard
              key={ev.id}
              evidence={ev}
              isUnlocked={unlockedIds.includes(ev.id)}
              index={index}
            />
          ))}
        </div>

        {/* Decision CTA */}
        {canMakeDecision() && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            style={{
              marginTop: '3rem',
              padding: '2rem',
              background: 'rgba(0, 212, 212, 0.04)',
              border: '1px solid rgba(0, 212, 212, 0.2)',
              borderRadius: 'var(--radius-md)',
              textAlign: 'center',
            }}
          >
            <div
              className="font-mono"
              style={{
                fontSize: '0.65rem',
                color: 'var(--neon-cyan)',
                letterSpacing: '0.15em',
                marginBottom: '0.75rem',
              }}
            >
              ● YOU HAVE ENOUGH EVIDENCE
            </div>
            <h2
              className="font-display"
              style={{ fontSize: '1.8rem', marginBottom: '0.5rem', color: 'var(--text-bright)' }}
            >
              WHAT WILL YOU DO?
            </h2>
            <p
              style={{
                color: 'var(--text-secondary)',
                fontSize: '0.85rem',
                marginBottom: '1.5rem',
              }}
            >
              You've gathered significant evidence. The time to act is now.
            </p>
            <motion.button
              className="btn btn-primary btn-lg"
              onClick={() => navigate('/decision')}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              MAKE YOUR DECISION →
            </motion.button>
          </motion.div>
        )}

        {/* Evidence Board Link */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6 }}
          style={{
            marginTop: '2rem',
            textAlign: 'center',
          }}
        >
          <button
            className="btn btn-ghost"
            onClick={() => navigate('/board')}
          >
            ◈ VIEW EVIDENCE BOARD
          </button>
        </motion.div>
      </div>
    </motion.div>
  );
}
