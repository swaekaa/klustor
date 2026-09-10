import { Link, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useGameStore } from '../../store/gameStore';

export default function NavBar() {
  const { player, resetGame } = useGameStore();
  const location = useLocation();

  // Hide nav on landing page
  if (location.pathname === '/') return null;

  const tabs = [
    { path: '/case', label: 'JOB BOARD' },
    { path: '/board', label: 'THE WALL' },
    { path: '/map', label: 'CITY MAP' },
    { path: '/contacts', label: 'CONTACTS' },
  ];

  return (
    <>
      {/* TOP NAVIGATION: CONSOLE DASHBOARD STYLE */}
      <motion.nav
        initial={{ y: -50, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          zIndex: 100,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          padding: '2rem 2rem 0 2rem',
          pointerEvents: 'none',
        }}
      >
        {/* Top Logo */}
        <div style={{ marginBottom: '1rem', pointerEvents: 'auto' }}>
          <div style={{ 
            background: 'var(--bg-panel)', 
            padding: '0.5rem 2rem', 
            borderRadius: '12px',
            border: '2px solid var(--border-light)',
            boxShadow: '0 8px 20px rgba(30, 40, 50, 0.1), inset 0 2px 5px rgba(255, 255, 255, 0.8)',
            display: 'inline-flex',
            alignItems: 'center'
          }}>
            <Link to="/" style={{ textDecoration: 'none', color: 'var(--text-primary)', fontSize: '1.8rem', letterSpacing: '0.1em', fontFamily: 'var(--font-display)', fontWeight: 'bold' }}>
              KLUSTOR
            </Link>
          </div>
        </div>
        
        {/* Horizontal Menu Dashboard */}
        <div style={{ 
          display: 'flex', 
          gap: '0.5rem', 
          pointerEvents: 'auto',
          background: 'var(--bg-secondary)',
          padding: '0.5rem',
          borderRadius: '24px',
          border: '1px solid var(--border-dark)',
          boxShadow: '0 10px 30px rgba(0,0,0,0.2), inset 0 1px 3px rgba(0,0,0,0.1)'
        }}>
          {tabs.map((tab) => {
            const isActive = location.pathname.startsWith(tab.path);
            return (
              <Link 
                key={tab.path}
                to={tab.path} 
                style={{
                  background: isActive ? 'var(--klustor-blue)' : 'transparent',
                  color: isActive ? 'var(--text-primary)' : 'var(--text-muted)',
                  padding: isActive ? '0.75rem 2.5rem' : '0.75rem 1.5rem',
                  borderRadius: '18px',
                  textDecoration: 'none',
                  boxShadow: isActive ? 'inset 0 1px 4px rgba(255,255,255,0.6), inset 0 -2px 5px rgba(0,0,0,0.1), 0 4px 10px rgba(168, 199, 216, 0.4)' : 'none',
                  border: isActive ? '1px solid rgba(255,255,255,0.5)' : '1px solid transparent',
                  transition: 'all 0.2s cubic-bezier(0.25, 0.8, 0.25, 1)',
                  fontFamily: 'var(--font-display)',
                  fontWeight: isActive ? 700 : 500,
                  fontSize: '1.1rem',
                  letterSpacing: '0.05em',
                  transform: isActive ? 'scale(1.05)' : 'scale(1)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem'
                }}
              >
                {isActive && <span style={{ width: '8px', height: '8px', background: 'var(--text-primary)', borderRadius: '50%', display: 'inline-block' }} />}
                {tab.label}
              </Link>
            );
          })}
          
          <div style={{ width: '1px', background: 'var(--border-dark)', margin: '0 0.5rem' }} />
          
          <Link 
            to="/" 
            onClick={resetGame} 
            style={{ 
              background: 'transparent',
              color: 'var(--text-muted)',
              padding: '0.75rem 1.5rem',
              borderRadius: '18px',
              textDecoration: 'none',
              transition: 'all 0.2s',
              fontFamily: 'var(--font-display)',
              fontWeight: 500,
              fontSize: '1.1rem',
              letterSpacing: '0.05em',
              display: 'flex',
              alignItems: 'center'
            }}
            onMouseEnter={(e) => { e.currentTarget.style.color = 'var(--klustor-pink)' }}
            onMouseLeave={(e) => { e.currentTarget.style.color = 'var(--text-muted)' }}
          >
            QUIT
          </Link>
        </div>
      </motion.nav>

      {/* BOTTOM HUD - RETRO GAME STYLE */}
      <motion.div
        initial={{ y: 50, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        style={{
          position: 'fixed',
          bottom: '2rem',
          right: '2rem',
          zIndex: 100,
          display: 'flex',
          gap: '2rem',
          background: 'var(--bg-panel)',
          border: '2px solid var(--border-light)',
          padding: '0.75rem 1.5rem',
          borderRadius: '8px',
          boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.8), 0 10px 20px rgba(0,0,0,0.15)',
          fontFamily: 'var(--font-mono)'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.5rem' }}>
          <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 'bold' }}>CASH</span>
          <span style={{ fontWeight: 'bold', color: 'var(--klustor-green)', fontSize: '1.2rem', textShadow: '0 1px 2px rgba(0,0,0,0.1)' }}>${player.cash.toLocaleString()}</span>
        </div>
        
        <div style={{ width: '1px', background: 'var(--border-dark)', opacity: 0.5 }} />
        
        <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.5rem' }}>
          <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 'bold' }}>REP</span>
          <span style={{ fontWeight: 'bold', color: 'var(--text-primary)', fontSize: '1.2rem', textShadow: '0 1px 2px rgba(0,0,0,0.1)' }}>{player.reputation}</span>
        </div>

        <div style={{ width: '1px', background: 'var(--border-dark)', opacity: 0.5 }} />
        
        <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.5rem' }}>
          <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 'bold' }}>HEAT</span>
          <span style={{ fontWeight: 'bold', color: 'var(--klustor-pink)', fontSize: '1.2rem', textShadow: '0 1px 2px rgba(0,0,0,0.1)' }}>{player.heat}</span>
        </div>
      </motion.div>
    </>
  );
}
