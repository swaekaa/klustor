import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useGameStore } from '../store/gameStore';
import { case017 } from '../data/cases/case017';
import type { Decision } from '../types';

export default function DecisionPage() {
  const navigate = useNavigate();
  const { makeDecision, discoveredClues, canMakeDecision } = useGameStore();

  const handleDecision = (decision: Decision) => {
    makeDecision(decision.id);
    navigate('/results');
  };

  const clueCount = discoveredClues.length;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="page"
      style={{ paddingTop: '56px', minHeight: '100vh' }}
    >
      {/* Background glow */}
      <div
        style={{
          position: 'fixed',
          inset: 0,
          background:
            'radial-gradient(ellipse 70% 50% at 50% 50%, rgba(255, 45, 107, 0.04) 0%, transparent 70%)',
          pointerEvents: 'none',
        }}
      />

      <div
        className="container"
        style={{
          paddingTop: '4rem',
          paddingBottom: '4rem',
          maxWidth: '800px',
          margin: '0 auto',
        }}
      >
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          style={{ textAlign: 'center', marginBottom: '3rem' }}
        >
          <span className="badge badge-red" style={{ marginBottom: '1rem' }}>
            ◉ CRITICAL MOMENT
          </span>

          <h1
            className="font-display"
            style={{
              fontSize: 'clamp(2.5rem, 6vw, 4.5rem)',
              color: 'var(--text-bright)',
              lineHeight: 1,
              marginBottom: '0.5rem',
            }}
          >
            YOU HAVE ENOUGH EVIDENCE
          </h1>

          <div
            className="font-display"
            style={{
              fontSize: 'clamp(1.5rem, 4vw, 2.5rem)',
              color: 'var(--text-secondary)',
              marginBottom: '1.5rem',
            }}
          >
            WHAT WILL YOU DO?
          </div>

          {/* Evidence summary */}
          <div
            className="panel"
            style={{
              display: 'inline-flex',
              gap: '2rem',
              padding: '0.75rem 1.5rem',
              margin: '0 auto',
            }}
          >
            <div style={{ textAlign: 'center' }}>
              <div
                className="font-mono"
                style={{ fontSize: '0.55rem', color: 'var(--text-muted)', marginBottom: '0.2rem' }}
              >
                CLUES FOUND
              </div>
              <div
                className="font-display"
                style={{ fontSize: '1.4rem', color: 'var(--neon-cyan)' }}
              >
                {clueCount}
              </div>
            </div>
            <div style={{ textAlign: 'center' }}>
              <div
                className="font-mono"
                style={{ fontSize: '0.55rem', color: 'var(--text-muted)', marginBottom: '0.2rem' }}
              >
                CASE
              </div>
              <div
                className="font-display"
                style={{ fontSize: '1.4rem', color: 'var(--neon-yellow)' }}
              >
                017
              </div>
            </div>
            <div style={{ textAlign: 'center' }}>
              <div
                className="font-mono"
                style={{ fontSize: '0.55rem', color: 'var(--text-muted)', marginBottom: '0.2rem' }}
              >
                STATUS
              </div>
              <div
                className="font-display"
                style={{ fontSize: '1.4rem', color: 'var(--neon-red)' }}
              >
                CRITICAL
              </div>
            </div>
          </div>
        </motion.div>

        {/* Decision Cards */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {case017.decisions.map((decision, i) => (
            <motion.div
              key={decision.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.1 + 0.2 }}
            >
              <motion.button
                onClick={() => handleDecision(decision)}
                whileHover={{
                  scale: 1.01,
                  borderColor: getDecisionColor(decision.id),
                  boxShadow: `0 0 20px ${getDecisionGlow(decision.id)}`,
                }}
                whileTap={{ scale: 0.99 }}
                style={{
                  width: '100%',
                  background: 'var(--bg-surface)',
                  border: '1px solid var(--border-default)',
                  borderRadius: 'var(--radius-md)',
                  padding: '1.5rem',
                  cursor: 'pointer',
                  textAlign: 'left',
                  transition: 'all 0.2s ease',
                }}
              >
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'flex-start',
                    justifyContent: 'space-between',
                    gap: '1rem',
                  }}
                >
                  <div style={{ flex: 1 }}>
                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.75rem',
                        marginBottom: '0.5rem',
                      }}
                    >
                      <span
                        className="font-display"
                        style={{ fontSize: '1.5rem', color: getDecisionColor(decision.id) }}
                      >
                        {decision.label}
                      </span>
                      <div
                        style={{
                          display: 'flex',
                          gap: '0.4rem',
                        }}
                      >
                        <span
                          className="badge"
                          style={{
                            color: decision.reputationDelta >= 0 ? 'var(--neon-cyan)' : 'var(--neon-red)',
                            borderColor:
                              decision.reputationDelta >= 0
                                ? 'rgba(0,212,212,0.3)'
                                : 'rgba(230,57,70,0.3)',
                            background: 'transparent',
                          }}
                        >
                          REP {decision.reputationDelta >= 0 ? '+' : ''}
                          {decision.reputationDelta}
                        </span>
                        <span
                          className="badge"
                          style={{
                            color: decision.heatDelta >= 0 ? 'var(--neon-red)' : 'var(--neon-green)',
                            borderColor:
                              decision.heatDelta >= 0
                                ? 'rgba(230,57,70,0.3)'
                                : 'rgba(57,217,138,0.3)',
                            background: 'transparent',
                          }}
                        >
                          HEAT {decision.heatDelta >= 0 ? '+' : ''}
                          {decision.heatDelta}
                        </span>
                      </div>
                    </div>
                    <p
                      style={{
                        fontSize: '0.85rem',
                        color: 'var(--text-secondary)',
                        marginBottom: '0.5rem',
                        lineHeight: 1.5,
                      }}
                    >
                      {decision.description}
                    </p>
                    <p
                      className="font-mono"
                      style={{ fontSize: '0.65rem', color: 'var(--text-muted)', fontStyle: 'italic' }}
                    >
                      "{decision.consequence}"
                    </p>
                  </div>
                  <div
                    style={{
                      color: getDecisionColor(decision.id),
                      fontSize: '1.5rem',
                      opacity: 0.5,
                      flexShrink: 0,
                    }}
                  >
                    →
                  </div>
                </div>
              </motion.button>
            </motion.div>
          ))}
        </div>

        {/* Back */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6 }}
          style={{ marginTop: '2rem', textAlign: 'center' }}
        >
          <button className="btn btn-ghost btn-sm" onClick={() => navigate('/case')}>
            ← RETURN TO CASE (KEEP INVESTIGATING)
          </button>
        </motion.div>
      </div>
    </motion.div>
  );
}

function getDecisionColor(id: string): string {
  const colors: Record<string, string> = {
    report: 'var(--neon-cyan)',
    publish: 'var(--neon-yellow)',
    sell: 'var(--neon-red)',
    investigate: 'var(--neon-pink)',
  };
  return colors[id] ?? 'var(--text-secondary)';
}

function getDecisionGlow(id: string): string {
  const glows: Record<string, string> = {
    report: 'rgba(0, 212, 212, 0.08)',
    publish: 'rgba(245, 200, 66, 0.08)',
    sell: 'rgba(230, 57, 70, 0.08)',
    investigate: 'rgba(255, 45, 107, 0.08)',
  };
  return glows[id] ?? 'transparent';
}
