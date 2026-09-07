import { Link, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useGameStore } from '../../store/gameStore';

export default function NavBar() {
  const { player } = useGameStore();
  const location = useLocation();

  // Hide nav on landing page
  if (location.pathname === '/') return null;

  return (
    <>
      {/* TOP NAVIGATION */}
      <motion.nav
        initial={{ y: -50 }}
        animate={{ y: 0 }}
        className="navbar"
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          height: '50px',
          background: 'linear-gradient(180deg, rgba(10,11,15,0.95) 0%, rgba(10,11,15,0.7) 100%)',
          borderBottom: '1px solid rgba(255,255,255,0.05)',
          backdropFilter: 'blur(10px)',
          zIndex: 100,
          display: 'flex',
          alignItems: 'center',
          padding: '0 2rem',
          justifyContent: 'space-between',
          fontFamily: 'var(--font-display)',
          color: '#fff'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '3rem' }}>
          <Link to="/" style={{ textDecoration: 'none', color: '#fff', fontSize: '1.4rem', letterSpacing: '0.1em' }}>
            KLUSTOR <span style={{ color: 'var(--neon-cyan)' }}>// THE FIXER</span>
          </Link>
          
          <div style={{ display: 'flex', gap: '2rem', fontSize: '1.1rem', marginTop: '4px' }}>
            <Link to="/case" style={{ color: location.pathname === '/case' ? '#fff' : 'var(--text-muted)', textDecoration: 'none', transition: 'color 0.2s' }}>JOB BOARD</Link>
            <Link to="/board" style={{ color: location.pathname === '/board' ? '#fff' : 'var(--text-muted)', textDecoration: 'none', transition: 'color 0.2s' }}>THE WALL</Link>
            <Link to="/map" style={{ color: location.pathname === '/map' ? '#fff' : 'var(--text-muted)', textDecoration: 'none', transition: 'color 0.2s' }}>CITY</Link>
            <Link to="/contacts" style={{ color: location.pathname === '/contacts' ? '#fff' : 'var(--text-muted)', textDecoration: 'none', transition: 'color 0.2s' }}>CONTACTS</Link>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '2rem', fontFamily: 'var(--font-mono)', fontSize: '0.75rem' }}>
          <Link to="/" style={{ color: 'var(--text-muted)', textDecoration: 'none', letterSpacing: '0.1em' }}>
            EXIT TO SYSTEM
          </Link>
        </div>
      </motion.nav>

      {/* BOTTOM HUD */}
      <motion.div
        initial={{ y: 50 }}
        animate={{ y: 0 }}
        style={{
          position: 'fixed',
          bottom: '1.5rem',
          right: '2rem',
          zIndex: 100,
          display: 'flex',
          gap: '1.5rem',
          background: 'rgba(10,11,15,0.8)',
          border: '1px solid rgba(255,255,255,0.1)',
          padding: '0.5rem 1.5rem',
          borderRadius: '4px',
          fontFamily: 'var(--font-mono)',
          backdropFilter: 'blur(5px)'
        }}
      >
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start' }}>
          <span style={{ fontSize: '0.5rem', color: 'var(--text-muted)', letterSpacing: '0.1em' }}>BALANCE</span>
          <span style={{ fontSize: '1.1rem', color: 'var(--neon-green)' }}>${player.cash.toLocaleString()}</span>
        </div>
        <div style={{ width: '1px', background: 'rgba(255,255,255,0.1)' }} />
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start' }}>
          <span style={{ fontSize: '0.5rem', color: 'var(--text-muted)', letterSpacing: '0.1em' }}>REP</span>
          <span style={{ fontSize: '1.1rem', color: '#fff' }}>{player.reputation}</span>
        </div>
        <div style={{ width: '1px', background: 'rgba(255,255,255,0.1)' }} />
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start' }}>
          <span style={{ fontSize: '0.5rem', color: 'var(--text-muted)', letterSpacing: '0.1em' }}>HEAT</span>
          <span style={{ fontSize: '1.1rem', color: 'var(--neon-red)' }}>{player.heat}</span>
        </div>
      </motion.div>
    </>
  );
}
