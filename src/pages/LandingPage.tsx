import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useGameStore } from '../store/gameStore';

export default function LandingPage() {
  const navigate = useNavigate();
  const { startCase } = useGameStore();

  const handleBegin = () => {
    startCase('case-017');
    navigate('/case');
  };

  return (
    <div
      style={{
        minHeight: '100vh',
        position: 'relative',
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'var(--bg-primary)',
      }}
    >
      {/* Animated Background City Gradient */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          background:
            'radial-gradient(ellipse 80% 60% at 50% 100%, rgba(0, 80, 100, 0.3) 0%, transparent 70%)',
          pointerEvents: 'none',
        }}
      />

      {/* Neon Glow Orbs */}
      <motion.div
        animate={{
          opacity: [0.15, 0.3, 0.15],
          scale: [1, 1.05, 1],
        }}
        transition={{ duration: 6, repeat: Infinity, ease: 'easeInOut' }}
        style={{
          position: 'absolute',
          width: '600px',
          height: '300px',
          borderRadius: '50%',
          background: 'radial-gradient(ellipse, rgba(0, 212, 212, 0.12) 0%, transparent 70%)',
          top: '20%',
          left: '50%',
          transform: 'translateX(-50%)',
          pointerEvents: 'none',
        }}
      />

      <motion.div
        animate={{
          opacity: [0.08, 0.18, 0.08],
          x: [-20, 20, -20],
        }}
        transition={{ duration: 9, repeat: Infinity, ease: 'easeInOut' }}
        style={{
          position: 'absolute',
          width: '400px',
          height: '200px',
          borderRadius: '50%',
          background: 'radial-gradient(ellipse, rgba(255, 45, 107, 0.12) 0%, transparent 70%)',
          bottom: '25%',
          right: '15%',
          pointerEvents: 'none',
        }}
      />

      {/* City Silhouette */}
      <div
        style={{
          position: 'absolute',
          bottom: 0,
          left: 0,
          right: 0,
          height: '200px',
          background: `
            linear-gradient(to top, rgba(0,0,0,0.8) 0%, transparent 100%)
          `,
          pointerEvents: 'none',
        }}
      />
      <svg
        viewBox="0 0 1440 200"
        preserveAspectRatio="none"
        style={{
          position: 'absolute',
          bottom: 0,
          left: 0,
          right: 0,
          width: '100%',
          height: '200px',
          opacity: 0.4,
        }}
      >
        {/* City skyline silhouette */}
        <path
          d="M0,200 L0,140 L40,140 L40,100 L60,100 L60,80 L80,80 L80,60 L100,60 L100,80 L120,80 L120,70 L150,70 L150,90 L170,90 L170,50 L190,50 L190,90 L210,90 L210,75 L240,75 L240,60 L260,60 L260,40 L280,40 L280,60 L300,60 L300,90 L340,90 L340,70 L360,70 L360,100 L380,100 L380,80 L400,80 L400,60 L420,60 L420,30 L440,30 L440,60 L460,60 L460,80 L480,80 L480,50 L510,50 L510,70 L540,70 L540,40 L570,40 L570,20 L590,20 L590,40 L620,40 L620,70 L650,70 L650,55 L680,55 L680,35 L700,35 L700,15 L720,15 L720,35 L750,35 L750,55 L780,55 L780,70 L820,70 L820,50 L850,50 L850,80 L880,80 L880,60 L910,60 L910,40 L930,40 L930,60 L960,60 L960,90 L990,90 L990,70 L1020,70 L1020,100 L1050,100 L1050,80 L1080,80 L1080,60 L1110,60 L1110,80 L1140,80 L1140,100 L1170,100 L1170,80 L1200,80 L1200,60 L1230,60 L1230,80 L1260,80 L1260,100 L1290,100 L1290,120 L1320,120 L1320,100 L1360,100 L1360,130 L1400,130 L1400,140 L1440,140 L1440,200 Z"
          fill="var(--bg-surface)"
        />
        {/* Palm trees */}
        <ellipse cx="350" cy="88" rx="12" ry="6" fill="rgba(0,212,212,0.15)" />
        <ellipse cx="700" cy="32" rx="14" ry="7" fill="rgba(0,212,212,0.12)" />
        <ellipse cx="1100" cy="78" rx="11" ry="5" fill="rgba(0,212,212,0.1)" />
      </svg>

      {/* Horizontal scan line */}
      <motion.div
        animate={{ y: ['0vh', '100vh'] }}
        transition={{ duration: 8, repeat: Infinity, ease: 'linear' }}
        style={{
          position: 'absolute',
          left: 0,
          right: 0,
          height: '1px',
          background: 'linear-gradient(90deg, transparent, rgba(0,212,212,0.08), transparent)',
          pointerEvents: 'none',
        }}
      />

      {/* Main Content */}
      <div
        style={{
          position: 'relative',
          zIndex: 1,
          textAlign: 'center',
          padding: '2rem',
          maxWidth: '700px',
        }}
      >
        {/* VCI Tag */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          style={{ marginBottom: '1.5rem' }}
        >
          <span className="badge badge-cyan animate-flicker">
            VICE CITY INVESTIGATIONS // CASE FILE 017
          </span>
        </motion.div>

        {/* Main Title */}
        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4, duration: 0.7 }}
          style={{
            fontFamily: 'var(--font-display)',
            fontSize: 'clamp(3.5rem, 10vw, 7rem)',
            lineHeight: 0.95,
            letterSpacing: '0.02em',
            color: 'var(--text-bright)',
            marginBottom: '0.5rem',
          }}
        >
          THE PHOTO
        </motion.h1>

        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.55, duration: 0.7 }}
          style={{
            fontFamily: 'var(--font-display)',
            fontSize: 'clamp(3.5rem, 10vw, 7rem)',
            lineHeight: 0.95,
            letterSpacing: '0.02em',
            marginBottom: '1.5rem',
          }}
          className="glow-cyan"
        >
          NEVER LIES
        </motion.h1>

        {/* Location / time badge */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.8 }}
          className="font-mono"
          style={{
            fontSize: '0.8rem',
            color: 'var(--text-secondary)',
            letterSpacing: '0.2em',
            marginBottom: '2rem',
          }}
        >
          VICE CITY // 02:13 AM
        </motion.div>

        {/* Horizontal divider */}
        <motion.div
          initial={{ scaleX: 0 }}
          animate={{ scaleX: 1 }}
          transition={{ delay: 0.9, duration: 0.5 }}
          style={{
            height: '1px',
            background: 'linear-gradient(90deg, transparent, var(--neon-cyan), transparent)',
            opacity: 0.3,
            margin: '0 auto 2rem',
            maxWidth: '300px',
          }}
        />

        {/* Tagline */}
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.0 }}
          style={{
            fontFamily: 'var(--font-body)',
            fontSize: '1rem',
            color: 'var(--text-secondary)',
            marginBottom: '2.5rem',
            lineHeight: 1.7,
          }}
        >
          A photograph can expose a secret.
          <br />
          <span style={{ color: 'var(--text-muted)' }}>
            One photo. Multiple stories. Your choices change what happens next.
          </span>
        </motion.p>

        {/* CTA Button */}
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 1.2, type: 'spring', stiffness: 150 }}
        >
          <motion.button
            className="btn btn-primary btn-lg"
            onClick={handleBegin}
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
            style={{ fontSize: '0.9rem', letterSpacing: '0.2em' }}
          >
            ▶ BEGIN INVESTIGATION
          </motion.button>
        </motion.div>

        {/* Secondary info */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.5 }}
          style={{
            marginTop: '3rem',
            display: 'flex',
            justifyContent: 'center',
            gap: '2rem',
          }}
        >
          {[
            { label: 'CASE FILE', value: '017' },
            { label: 'STATUS', value: 'OPEN', color: 'var(--neon-red)' },
            { label: 'EVIDENCE', value: '5 PHOTOS' },
          ].map((item) => (
            <div key={item.label} style={{ textAlign: 'center' }}>
              <div
                className="font-mono"
                style={{
                  fontSize: '0.55rem',
                  color: 'var(--text-muted)',
                  letterSpacing: '0.15em',
                  marginBottom: '0.2rem',
                }}
              >
                {item.label}
              </div>
              <div
                className="font-mono"
                style={{
                  fontSize: '0.75rem',
                  color: item.color || 'var(--text-secondary)',
                  letterSpacing: '0.08em',
                }}
              >
                {item.value}
              </div>
            </div>
          ))}
        </motion.div>
      </div>

      {/* Footer Credit */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 2 }}
        style={{
          position: 'absolute',
          bottom: '1.5rem',
          left: '50%',
          transform: 'translateX(-50%)',
          fontFamily: 'var(--font-mono)',
          fontSize: '0.55rem',
          color: 'var(--text-muted)',
          letterSpacing: '0.15em',
          whiteSpace: 'nowrap',
        }}
      >
        POWERED BY UNLAYER REACT IMAGE EDITOR // VICE CITY INVESTIGATIONS // 2024
      </motion.div>
    </div>
  );
}
