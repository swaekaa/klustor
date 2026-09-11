import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useState, useEffect } from 'react';

export default function LandingPage() {
  const navigate = useNavigate();
  const [selectedItem, setSelectedItem] = useState(0);
  const [bootState, setBootState] = useState<'loading' | 'ready'>('loading');

  useEffect(() => {
    const t = setTimeout(() => setBootState('ready'), 1800);
    return () => clearTimeout(t);
  }, []);

  const menuItems = [
    { label: 'GARAGE', sub: 'Customize & Launch', action: () => navigate('/garage'), color: 'var(--klustor-cyan)' },
    { label: 'QUICK RACE', sub: 'Hit the circuit now', action: () => navigate('/race'), color: 'var(--klustor-pink)' },
    { label: 'LEADERBOARD', sub: 'See the fastest times', action: () => navigate('/leaderboard'), color: 'var(--klustor-yellow)' },
  ];

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0, transition: { duration: 0.4 } }}
      style={{
        height: '100vh',
        overflow: 'hidden',
        position: 'relative',
        display: 'flex',
        flexDirection: 'column',
        background: 'linear-gradient(180deg, #FAF9F3 0%, #F5E6D3 35%, #E9C5A8 55%, #8FD5D1 85%, #A8C7D8 100%)',
      }}
    >
      {/* Atmospheric layers */}
      <div style={{
        position: 'absolute', inset: 0, zIndex: 0,
        background: 'radial-gradient(ellipse 80% 60% at 50% 0%, rgba(255,255,255,0.6) 0%, transparent 70%)',
      }} />
      {/* Horizon line / ocean shimmer */}
      <div style={{
        position: 'absolute', bottom: 0, left: 0, right: 0, height: '40%', zIndex: 0,
        background: 'linear-gradient(0deg, rgba(143,213,209,0.5) 0%, transparent 100%)',
        borderTop: '1px solid rgba(255,255,255,0.5)',
      }} />
      {/* Subtle vignette */}
      <div style={{
        position: 'absolute', inset: 0, zIndex: 1,
        background: 'radial-gradient(circle at center, transparent 25%, rgba(30,41,51,0.18) 100%)',
      }} />

      {/* Boot sequence text */}
      {bootState === 'loading' && (
        <motion.div
          initial={{ opacity: 0 }} animate={{ opacity: 1 }}
          style={{
            position: 'absolute', bottom: '4rem', right: '4rem', zIndex: 10,
            fontFamily: 'Consolas, monospace', color: 'rgba(255,255,255,0.8)',
            fontSize: '0.9rem', letterSpacing: '0.1em',
            textShadow: '0 2px 6px rgba(0,0,0,0.8)',
          }}
        >
          LOADING VICE COAST CIRCUIT... [■■■■■□□□□□]
        </motion.div>
      )}

      {/* Main content */}
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: bootState === 'ready' ? 1 : 0, scale: bootState === 'ready' ? 1 : 0.95 }}
        transition={{ duration: 0.6, ease: 'easeOut' }}
        style={{ position: 'relative', zIndex: 10, flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}
      >
        {/* Logo block */}
        <div style={{ textAlign: 'center', marginBottom: '3.5rem' }}>
          <motion.h1
            initial={{ y: -20 }}
            animate={{ y: bootState === 'ready' ? 0 : -20 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            style={{
              fontFamily: 'Trebuchet MS, Arial Black, sans-serif',
              fontSize: 'clamp(4rem, 10vw, 8rem)',
              margin: 0, lineHeight: 0.9,
              color: '#fff',
              textTransform: 'uppercase',
              letterSpacing: '0.05em',
              textShadow: '0 6px 30px rgba(0,0,0,0.7), 0 2px 8px rgba(0,0,0,0.5)',
            }}
          >
            KLUSTOR
          </motion.h1>
          <div style={{
            fontFamily: 'Trebuchet MS, sans-serif', fontSize: 'clamp(1rem, 2.5vw, 1.6rem)',
            color: 'var(--klustor-cyan)', letterSpacing: '0.35em',
            textShadow: '0 2px 10px rgba(0,0,0,0.7)', marginTop: '0.4rem', fontWeight: 'bold',
          }}>
            // VICE COAST RACING
          </div>
          <div style={{
            marginTop: '1rem', fontFamily: 'Consolas, monospace', fontSize: '0.8rem',
            color: 'rgba(255,255,255,0.6)', letterSpacing: '0.2em',
          }}>
            DESIGN YOUR CAR. RACE YOUR DESIGN.
          </div>
        </div>

        {/* Menu */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem', width: '100%', maxWidth: '380px', padding: '0 2rem' }}>
          {menuItems.map((item, i) => {
            const isSelected = selectedItem === i;
            return (
              <motion.button
                key={item.label}
                onMouseEnter={() => setSelectedItem(i)}
                onClick={item.action}
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.98 }}
                style={{
                  background: isSelected ? 'rgba(250,249,243,0.97)' : 'rgba(250,249,243,0.55)',
                  backdropFilter: 'blur(12px)',
                  border: `2px solid ${isSelected ? item.color : 'rgba(255,255,255,0.3)'}`,
                  borderRadius: '14px',
                  padding: '1rem 1.75rem',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '1rem',
                  boxShadow: isSelected
                    ? `0 8px 24px rgba(0,0,0,0.2), inset 0 2px 4px rgba(255,255,255,0.8), 0 0 0 2px ${item.color}30`
                    : '0 4px 12px rgba(0,0,0,0.12)',
                  transition: 'all 0.2s ease',
                  width: '100%',
                }}
              >
                <div style={{
                  width: '10px', height: '10px', borderRadius: '50%',
                  background: isSelected ? item.color : 'rgba(30,41,51,0.3)',
                  flexShrink: 0,
                }} />
                <div style={{ textAlign: 'left' }}>
                  <div style={{
                    fontFamily: 'Trebuchet MS, sans-serif', fontWeight: 'bold',
                    fontSize: '1.15rem', letterSpacing: '0.08em', color: '#1E2933',
                    textTransform: 'uppercase',
                  }}>
                    {item.label}
                  </div>
                  <div style={{
                    fontFamily: 'Consolas, monospace', fontSize: '0.7rem',
                    color: 'var(--text-muted)', letterSpacing: '0.05em', marginTop: '2px',
                  }}>
                    {item.sub}
                  </div>
                </div>
              </motion.button>
            );
          })}
        </div>

        {/* Version tag */}
        <div style={{
          position: 'absolute', bottom: '2rem',
          fontFamily: 'Consolas, monospace', fontSize: '0.7rem',
          color: 'rgba(255,255,255,0.5)', letterSpacing: '0.2em',
        }}>
          KLUSTOR // VICE COAST RACING — 2004 EDITION
        </div>
      </motion.div>

      {/* Bottom controls hint */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: bootState === 'ready' ? 1 : 0 }}
        transition={{ delay: 0.5 }}
        style={{
          position: 'absolute', bottom: '2rem', left: '0', right: '0',
          display: 'flex', justifyContent: 'space-between', padding: '0 3rem',
          fontFamily: 'Consolas, monospace', fontSize: '0.75rem',
          color: 'rgba(255,255,255,0.65)', zIndex: 10,
        }}
      >
        <div style={{ display: 'flex', gap: '1.5rem' }}>
          {[['●', 'SELECT', '#A8C99B'], ['▲', 'BACK', '#E9B58D']].map(([icon, label, color]) => (
            <div key={label} style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <span style={{ background: color, color: '#fff', borderRadius: '50%', width: '20px', height: '20px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '9px', fontWeight: 'bold' }}>{icon}</span>
              <span>{label}</span>
            </div>
          ))}
        </div>
        <div>SUN. SPEED. NO LIMITS.</div>
      </motion.div>
    </motion.div>
  );
}
