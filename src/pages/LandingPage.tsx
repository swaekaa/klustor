import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useState, useEffect } from 'react';

export default function LandingPage() {
  const navigate = useNavigate();
  const [selectedItem, setSelectedItem] = useState(0);
  const [bootState, setBootState] = useState<'loading' | 'ready'>('loading');

  useEffect(() => {
    const timer = setTimeout(() => {
      setBootState('ready');
    }, 1500);
    return () => clearTimeout(timer);
  }, []);

  const menuItems = [
    { label: 'STORY MODE', action: () => navigate('/case') },
    { label: 'FREE PLAY', action: () => {} },
    { label: 'JOB BOARD', action: () => navigate('/case') },
    { label: 'THE WALL', action: () => navigate('/board') },
    { label: 'OPTIONS', action: () => {} }
  ];



  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0, transition: { duration: 0.5 } }}
      className="page"
      style={{
        height: '100vh',
        overflow: 'hidden',
        position: 'relative',
        display: 'flex',
        flexDirection: 'column'
      }}
    >
      {/* Abstract Miami Sunrise/Sunset Background */}
      <div 
        style={{
          position: 'absolute',
          inset: 0,
          background: 'linear-gradient(180deg, #FAF9F3 0%, #F5E6D3 40%, #E9B58D 60%, #8FD5D1 100%)',
          zIndex: 0,
          transition: 'transform 10s ease-out',
          transform: 'scale(1.05)'
        }}
      />
      {/* Sun Circle & Horizon */}
      <div 
        style={{
          position: 'absolute',
          inset: 0,
          zIndex: 0,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          pointerEvents: 'none'
        }}
      >
        <div style={{ width: '400px', height: '400px', borderRadius: '50%', background: 'linear-gradient(180deg, rgba(255,255,255,0.8) 0%, rgba(255,255,255,0) 100%)', opacity: 0.5, transform: 'translateY(-20%)' }} />
        <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: '40%', background: 'linear-gradient(180deg, rgba(168, 199, 216, 0.4) 0%, transparent 100%)', borderTop: '2px solid rgba(255,255,255,0.5)' }} />
      </div>
      
      {/* Vignette overlay */}
      <div 
        style={{
          position: 'absolute',
          inset: 0,
          background: 'radial-gradient(circle at center, transparent 30%, rgba(30,41,51,0.2) 100%)',
          zIndex: 1
        }}
      />

      {/* Main Content Area */}
      <div style={{ position: 'relative', zIndex: 10, flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
        
        {/* Boot Sequence Overlay */}
        {bootState === 'loading' && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            style={{
              position: 'absolute',
              bottom: '4rem',
              right: '4rem',
              fontFamily: 'var(--font-mono)',
              color: 'var(--text-light)',
              fontSize: '1.2rem',
              textShadow: '0 2px 4px rgba(0,0,0,1)'
            }}
          >
            LOADING CITY... [■■■■■■□□□□]
          </motion.div>
        )}

        <motion.div 
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: bootState === 'ready' ? 1 : 0, scale: bootState === 'ready' ? 1 : 0.9 }}
          transition={{ duration: 0.5 }}
          style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: '100%' }}
        >
          {/* Top Logo */}
          <div style={{ textAlign: 'center', marginBottom: '4rem' }}>
            <h1 className="font-display" style={{ fontSize: '7rem', margin: 0, lineHeight: 0.9, textShadow: '0 8px 30px rgba(0,0,0,0.9)', color: '#fff' }}>
              KLUSTOR
            </h1>
            <div className="font-display" style={{ fontSize: '2rem', color: 'var(--klustor-cyan)', letterSpacing: '0.2em', textShadow: '0 2px 10px rgba(0,0,0,0.8)', marginTop: '0.5rem' }}>
              // THE FIXER
            </div>
          </div>

          {/* Centered Console Menu */}
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1rem', width: '100%', maxWidth: '400px' }}>
            {menuItems.map((item, index) => {
              const isSelected = selectedItem === index;
              return (
                <motion.button
                  key={item.label}
                  onMouseEnter={() => setSelectedItem(index)}
                  onClick={item.action}
                  style={{
                    background: isSelected ? 'var(--bg-secondary)' : 'transparent',
                    color: isSelected ? 'var(--text-primary)' : 'rgba(255,255,255,0.7)',
                    border: isSelected ? '2px solid var(--klustor-blue)' : '2px solid transparent',
                    padding: isSelected ? '1rem 3rem' : '0.75rem 2rem',
                    borderRadius: '8px',
                    fontFamily: 'var(--font-display)',
                    fontSize: isSelected ? '1.5rem' : '1.2rem',
                    letterSpacing: '0.1em',
                    cursor: 'pointer',
                    width: '100%',
                    textAlign: 'center',
                    boxShadow: isSelected ? 'inset 0 0 20px rgba(168, 199, 216, 0.5), 0 10px 30px rgba(0,0,0,0.5)' : 'none',
                    transform: isSelected ? 'scale(1.05)' : 'scale(1)',
                    transition: 'all 0.2s cubic-bezier(0.25, 0.8, 0.25, 1)'
                  }}
                >
                  {item.label}
                </motion.button>
              );
            })}
          </div>
        </motion.div>
      </div>

      {/* Bottom Controls HUD */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: bootState === 'ready' ? 1 : 0 }}
        style={{
          position: 'absolute',
          bottom: '2rem',
          left: '0',
          right: '0',
          display: 'flex',
          justifyContent: 'space-between',
          padding: '0 4rem',
          fontFamily: 'var(--font-mono)',
          color: 'rgba(255,255,255,0.8)',
          zIndex: 10
        }}
      >
        <div style={{ display: 'flex', gap: '2rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <span style={{ background: 'var(--klustor-green)', color: '#fff', borderRadius: '50%', width: '24px', height: '24px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold' }}>●</span>
            <span>SELECT</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <span style={{ background: 'var(--klustor-peach)', color: '#fff', borderRadius: '50%', width: '24px', height: '24px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold', fontSize: '10px' }}>▲</span>
            <span>BACK</span>
          </div>
        </div>
        <div style={{ letterSpacing: '0.1em' }}>
          KLUSTOR // 2004
        </div>
      </motion.div>
    </motion.div>
  );
}
