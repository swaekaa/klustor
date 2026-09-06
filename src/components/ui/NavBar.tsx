import { Link, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useGameStore } from '../../store/gameStore';

export default function NavBar() {
  const { player, currentCaseId } = useGameStore();
  const location = useLocation();

  if (!currentCaseId) return null;

  return (
    <motion.nav
      initial={{ y: -50 }}
      animate={{ y: 0 }}
      className="navbar"
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        height: '40px',
        background: 'linear-gradient(180deg, rgba(0,0,0,0.9) 0%, rgba(0,0,0,0.4) 100%)',
        borderBottom: '1px solid rgba(255,255,255,0.1)',
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
        <Link to="/" style={{ textDecoration: 'none', color: 'var(--neon-cyan)', fontSize: '1.2rem', letterSpacing: '0.1em' }}>
          KLUSTOR
        </Link>
        
        <div style={{ display: 'flex', gap: '1.5rem', fontSize: '1rem' }}>
          <Link to="/case" style={{ color: location.pathname === '/case' ? '#fff' : 'var(--text-muted)', textDecoration: 'none', transition: 'color 0.2s' }}>STORY</Link>
          <Link to="/board" style={{ color: location.pathname === '/board' ? '#fff' : 'var(--text-muted)', textDecoration: 'none', transition: 'color 0.2s' }}>EVIDENCE BOARD</Link>
          <Link to="/map" style={{ color: location.pathname === '/map' ? '#fff' : 'var(--text-muted)', textDecoration: 'none', transition: 'color 0.2s' }}>MAP</Link>
          <Link to="/contacts" style={{ color: location.pathname === '/contacts' ? '#fff' : 'var(--text-muted)', textDecoration: 'none', transition: 'color 0.2s' }}>CONTACTS</Link>
        </div>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: '2rem', fontFamily: 'var(--font-mono)', fontSize: '0.75rem' }}>
        <div style={{ display: 'flex', gap: '1rem' }}>
          <span style={{ color: 'var(--text-muted)' }}>REP <span style={{ color: '#fff', marginLeft: '0.2rem' }}>{player.reputation}</span></span>
          <span style={{ color: 'var(--text-muted)' }}>HEAT <span style={{ color: 'var(--neon-red)', marginLeft: '0.2rem' }}>{player.heat}%</span></span>
          <span style={{ color: 'var(--text-muted)' }}>CASE <span style={{ color: 'var(--neon-cyan)', marginLeft: '0.2rem' }}>{currentCaseId}</span></span>
        </div>
        
        <Link to="/" style={{ color: 'var(--neon-red)', textDecoration: 'none', letterSpacing: '0.1em' }}>
          EXIT
        </Link>
      </div>
    </motion.nav>
  );
}
