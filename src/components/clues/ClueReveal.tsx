import { motion, AnimatePresence } from 'framer-motion';
import { useEffect, useState } from 'react';
import type { Clue } from '../../types';

interface ClueRevealProps {
  clue: Clue | null;
  onClose: () => void;
}

export default function ClueReveal({ clue, onClose }: ClueRevealProps) {
  const [phase, setPhase] = useState<'flash' | 'reveal' | 'done'>('flash');

  useEffect(() => {
    if (!clue) return;
    setPhase('flash');
    const t1 = setTimeout(() => setPhase('reveal'), 600);
    const t2 = setTimeout(() => setPhase('done'), 4000);
    const t3 = setTimeout(() => onClose(), 4200);
    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(t3);
    };
  }, [clue, onClose]);

  if (!clue) return null;

  return (
    <AnimatePresence>
      {phase !== 'done' && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0, transition: { duration: 0.4 } }}
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 2000,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: phase === 'flash' ? 'rgba(0, 212, 212, 0.08)' : 'rgba(8, 11, 15, 0.92)',
            backdropFilter: 'blur(12px)',
          }}
          onClick={onClose}
        >
          <AnimatePresence mode="wait">
            {phase === 'flash' && (
              <motion.div
                key="flash"
                initial={{ opacity: 0, scale: 2 }}
                animate={{ opacity: [0, 1, 0], scale: [2, 1, 0.8] }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.5 }}
                style={{ textAlign: 'center' }}
              >
                <div
                  className="font-display glow-cyan"
                  style={{ fontSize: '3rem', letterSpacing: '0.3em' }}
                >
                  EVIDENCE VERIFIED
                </div>
              </motion.div>
            )}

            {phase === 'reveal' && (
              <motion.div
                key="reveal"
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.4, ease: 'easeOut' }}
                style={{
                  textAlign: 'center',
                  padding: '2rem',
                  maxWidth: '480px',
                }}
                onClick={(e) => e.stopPropagation()}
              >
                {/* Clue type badge */}
                <motion.div
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.1 }}
                  style={{ marginBottom: '1rem' }}
                >
                  <span className="badge badge-yellow">
                    ◉ CLUE DISCOVERED
                  </span>
                </motion.div>

                {/* Clue title */}
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.2 }}
                  className="font-display glow-cyan"
                  style={{
                    fontSize: '2.5rem',
                    marginBottom: '0.5rem',
                    lineHeight: 1,
                  }}
                >
                  {clue.title}
                </motion.div>

                {/* Divider */}
                <motion.div
                  initial={{ scaleX: 0 }}
                  animate={{ scaleX: 1 }}
                  transition={{ delay: 0.35, duration: 0.3 }}
                  className="divider--cyan"
                  style={{
                    height: '1px',
                    background: 'linear-gradient(90deg, transparent, var(--neon-cyan), transparent)',
                    margin: '1rem auto',
                    width: '60%',
                  }}
                />

                {/* Clue description */}
                <motion.p
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.4 }}
                  style={{
                    fontFamily: 'var(--font-mono)',
                    fontSize: '0.8rem',
                    color: 'var(--text-secondary)',
                    marginBottom: '1.5rem',
                    lineHeight: 1.7,
                  }}
                >
                  {clue.description}
                </motion.p>

                {/* XP badge */}
                <motion.div
                  initial={{ opacity: 0, scale: 0.7 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.5, type: 'spring', stiffness: 200 }}
                  style={{ marginBottom: '1.5rem' }}
                >
                  <span
                    className="font-mono"
                    style={{
                      color: 'var(--neon-yellow)',
                      fontSize: '1.1rem',
                      fontWeight: 700,
                    }}
                  >
                    +{clue.xp} XP
                  </span>
                  <span
                    className="font-mono"
                    style={{
                      display: 'block',
                      color: 'var(--text-muted)',
                      fontSize: '0.65rem',
                      marginTop: '0.2rem',
                      letterSpacing: '0.1em',
                    }}
                  >
                    NEW LEAD UNLOCKED
                  </span>
                </motion.div>

                {/* Click to continue */}
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: [0, 1, 0, 1] }}
                  transition={{ delay: 1.5, duration: 1, repeat: Infinity, repeatDelay: 0.5 }}
                  style={{
                    fontFamily: 'var(--font-mono)',
                    fontSize: '0.6rem',
                    color: 'var(--text-muted)',
                    letterSpacing: '0.15em',
                    textTransform: 'uppercase',
                    cursor: 'pointer',
                  }}
                  onClick={onClose}
                >
                  CLICK TO CONTINUE
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
