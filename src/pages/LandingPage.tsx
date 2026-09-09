import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useState } from 'react';

export default function LandingPage() {
  const navigate = useNavigate();
  const [selectedItem, setSelectedItem] = useState(0);

  const menuItems = [
    { label: 'STORY MODE', action: () => navigate('/case') },
    { label: 'FREE PLAY', action: () => {} }, // Placeholder
    { label: 'OPTIONS', action: () => {} },
    { label: 'QUIT', action: () => {} }
  ];

  const getMenuContext = (index: number) => {
    switch (index) {
      case 0:
        return {
          title: 'THE FIXER',
          subtitle: 'START CAMPAIGN',
          desc: "You don't ask questions. You deliver. Enter the neon-soaked underworld of Vice City as an independent creative fixer. Turn raw evidence into exactly what your clients need."
        };
      case 1:
        return {
          title: 'FREE PLAY',
          subtitle: 'UNRESTRICTED ACCESS',
          desc: "Access the Fixer Lab without a client brief. Edit any image, master the tools, and save to your portfolio without heat or consequences."
        };
      default:
        return {
          title: 'SYSTEM',
          subtitle: 'CONFIGURATION',
          desc: "Adjust audio, visuals, and game settings."
        };
    }
  };

  const context = getMenuContext(selectedItem);

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
      {/* Cinematic Full Screen Background is now handled globally in index.css */}

      {/* Vignette / Dark Gradient Overlay */}
      <div 
        style={{
          position: 'absolute',
          inset: 0,
          background: 'radial-gradient(circle at center, transparent 30%, rgba(0,0,0,0.85) 100%), linear-gradient(0deg, rgba(0,0,0,0.95) 0%, transparent 50%)',
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
          <h1 className="font-display" style={{ fontSize: '6rem', margin: 0, lineHeight: 0.9, textShadow: '0 4px 20px rgba(0,0,0,0.8)', color: '#fff' }}>
            KLUSTOR
          </h1>
          <div className="font-display" style={{ fontSize: '1.8rem', color: 'var(--xbox-green)', letterSpacing: '0.1em', textShadow: '0 2px 10px rgba(0,0,0,0.8)', marginTop: '0.5rem' }}>
            // THE FIXER
          </div>
        </motion.div>

        {/* Bottom Menu Area */}
        <div style={{ display: 'flex', gap: '4rem', alignItems: 'flex-end', marginTop: 'auto' }}>
          
          {/* Menu Options */}
          <div style={{ flex: 1, maxWidth: '400px' }}>
            {menuItems.map((item, index) => (
              <motion.button
                key={item.label}
                className={'gta-menu-item ' + (selectedItem === index ? 'active' : '')}
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
            key={selectedItem}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="panel"
            style={{ 
              flex: 1, 
              background: 'rgba(255, 255, 255, 0.7)', 
              backdropFilter: 'blur(10px)',
              padding: '2.5rem',
              borderLeft: '8px solid var(--xbox-green)',
              maxWidth: '600px',
              marginBottom: '1rem',
              boxShadow: '0 20px 40px rgba(0,0,0,0.3)',
              borderRadius: '0 16px 16px 0'
            }}
          >
            <div className="font-body" style={{ fontSize: '1rem', color: 'var(--gta-blue)', marginBottom: '0.5rem', fontWeight: 700 }}>
              {context.subtitle}
            </div>
            <h2 className="font-display" style={{ fontSize: '3.5rem', margin: '0 0 1rem 0', color: 'var(--gta-black)', lineHeight: 1 }}>
              {context.title}
            </h2>
            <p className="font-body" style={{ color: 'var(--text-secondary)', lineHeight: 1.6, fontSize: '1.1rem', fontWeight: 500 }}>
              {context.desc}
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
        POWERED BY UNLAYER REACT IMAGE EDITOR // KLUSTOR FIXER // 2024
      </motion.div>
    </motion.div>
  );
}
