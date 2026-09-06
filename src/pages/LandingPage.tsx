import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useGameStore } from '../store/gameStore';
import { useState } from 'react';

export default function LandingPage() {
  const navigate = useNavigate();
  const { startCase } = useGameStore();
  const [selectedItem, setSelectedItem] = useState(0);

  const menuItems = [
    { label: 'STORY MODE', action: () => handleStart() },
    { label: 'CASE FILES', action: () => navigate('/case') },
    { label: 'EVIDENCE BOARD', action: () => navigate('/board') },
    { label: 'CITY MAP', action: () => navigate('/map') },
    { label: 'CONTACTS', action: () => navigate('/contacts') },
    { label: 'OPTIONS', action: () => {} }
  ];

  const handleStart = () => {
    startCase('case-017');
    navigate('/case');
  };

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
      {/* Cinematic Full Screen Background */}
      <div 
        style={{
          position: 'absolute',
          inset: 0,
          backgroundImage: "url('/bg-landing.jpg')",
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          filter: 'brightness(0.6) contrast(1.1)',
          zIndex: 0,
          transition: 'transform 10s ease-out',
          transform: 'scale(1.05)'
        }}
      />

      {/* Vignette / Dark Gradient Overlay */}
      <div 
        style={{
          position: 'absolute',
          inset: 0,
          background: 'radial-gradient(circle at center, transparent 30%, rgba(0,0,0,0.8) 100%), linear-gradient(0deg, rgba(0,0,0,0.9) 0%, transparent 40%)',
          zIndex: 1
        }}
      />

      {/* Main Content Area */}
      <div style={{ position: 'relative', zIndex: 10, flex: 1, display: 'flex', flexDirection: 'column', padding: '4rem 4rem 2rem 4rem' }}>
        
        {/* Top Logo */}
        <motion.div 
          initial={{ y: -50, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.2, duration: 0.8 }}
          style={{ marginBottom: 'auto' }}
        >
          <h1 className="font-display" style={{ fontSize: '5rem', margin: 0, lineHeight: 0.9, textShadow: '0 4px 20px rgba(0,0,0,0.8)', color: '#fff' }}>
            KLUSTOR
          </h1>
          <div className="font-mono" style={{ fontSize: '1rem', color: 'var(--neon-cyan)', letterSpacing: '0.2em', textShadow: '0 2px 10px rgba(0,0,0,0.8)' }}>
            VICE CITY INVESTIGATIONS
          </div>
        </motion.div>

        {/* Bottom Menu Area */}
        <div style={{ display: 'flex', gap: '4rem', alignItems: 'flex-end', marginTop: 'auto' }}>
          
          {/* Menu Options */}
          <div style={{ flex: 1, maxWidth: '400px' }}>
            {menuItems.map((item, index) => (
              <motion.button
                key={item.label}
                className={`gta-menu-item ${selectedItem === index ? 'active' : ''}`}
                onMouseEnter={() => setSelectedItem(index)}
                onClick={item.action}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.4 + (index * 0.1) }}
              >
                {item.label}
              </motion.button>
            ))}
          </div>

          {/* Contextual Description Panel */}
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1 }}
            style={{ 
              flex: 1, 
              background: 'rgba(0,0,0,0.6)', 
              backdropFilter: 'blur(10px)',
              padding: '2rem',
              borderLeft: '4px solid var(--neon-cyan)',
              maxWidth: '600px',
              marginBottom: '1rem'
            }}
          >
            <div className="font-mono" style={{ fontSize: '0.8rem', color: 'var(--neon-cyan)', marginBottom: '0.5rem' }}>
              CURRENT SELECTION
            </div>
            <h2 className="font-display" style={{ fontSize: '2.5rem', margin: '0 0 1rem 0', color: '#fff' }}>
              CASE FILE 017<br/>
              <span style={{ color: 'rgba(255,255,255,0.6)' }}>THE OCEAN DRIVE INCIDENT</span>
            </h2>
            <p style={{ color: 'rgba(255,255,255,0.7)', lineHeight: 1.6, fontSize: '0.95rem' }}>
              At 2:13 AM, a mysterious incident took place near Ocean Drive. An anonymous witness sends you several photographs. The police have not connected the evidence. You must determine what happened.
            </p>
          </motion.div>

        </div>
      </div>
      {/* Footer Credit */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 2 }}
        style={{
          position: 'absolute',
          bottom: '1.5rem',
          right: '2rem',
          fontFamily: 'var(--font-mono)',
          fontSize: '0.65rem',
          color: 'rgba(255,255,255,0.3)',
          letterSpacing: '0.15em',
          whiteSpace: 'nowrap',
          zIndex: 10
        }}
      >
        POWERED BY UNLAYER REACT IMAGE EDITOR // KLUSTOR // 2024
      </motion.div>
    </motion.div>
  );
}
