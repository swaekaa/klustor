import { Link, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useGameStore } from '../../store/gameStore';

export default function NavBar() {
  const { player } = useGameStore();
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
      {/* TOP NAVIGATION: XBOX BLADES STYLE */}
      <motion.nav
        initial={{ y: -50 }}
        animate={{ y: 0 }}
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          zIndex: 100,
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-start',
          padding: '0 2rem',
          pointerEvents: 'none', // let clicks pass through the container
        }}
      >
        {/* Left Side: Brand */}
        <div style={{ display: 'flex', alignItems: 'center', pointerEvents: 'auto', background: 'var(--bg-blade)', padding: '1rem 2rem', borderBottomLeftRadius: '16px', borderBottomRightRadius: '16px', border: '2px solid var(--border-light)', borderTop: 'none', boxShadow: '0 4px 15px rgba(0,0,0,0.2)' }}>
          <Link to="/" style={{ textDecoration: 'none', color: 'var(--gta-black)', fontSize: '1.5rem', letterSpacing: '0.05em', fontFamily: 'var(--font-display)', fontWeight: 'bold' }}>
            KLUSTOR
          </Link>
        </div>
        
        {/* Center: Blades */}
        <div style={{ display: 'flex', gap: '0.5rem', pointerEvents: 'auto' }}>
          {tabs.map((tab) => {
            const isActive = location.pathname.startsWith(tab.path);
            return (
              <Link 
                key={tab.path}
                to={tab.path} 
                style={{
                  background: isActive ? 'var(--bg-blade)' : 'rgba(255,255,255,0.4)',
                  color: isActive ? 'var(--gta-black)' : 'rgba(0,0,0,0.5)',
                  padding: isActive ? '1.5rem 2.5rem 1rem 2.5rem' : '1rem 2rem',
                  borderBottomLeftRadius: '24px',
                  borderBottomRightRadius: '24px',
                  textDecoration: 'none',
                  boxShadow: isActive ? '0 8px 20px rgba(0,0,0,0.2)' : 'none',
                  border: '2px solid var(--border-light)',
                  borderTop: 'none',
                  marginTop: 0,
                  transition: 'all 0.2s',
                  fontFamily: 'var(--font-body)',
                  fontWeight: isActive ? 700 : 500,
                  fontSize: '1.1rem',
                  backdropFilter: isActive ? 'none' : 'blur(4px)'
                }}
              >
                {tab.label}
              </Link>
            );
          })}
        </div>

        {/* Right Side: Exit */}
        <div style={{ pointerEvents: 'auto', background: 'rgba(255,255,255,0.8)', padding: '1rem 1.5rem', borderBottomLeftRadius: '16px', borderBottomRightRadius: '16px', border: '2px solid var(--border-light)', borderTop: 'none', backdropFilter: 'blur(10px)' }}>
          <Link to="/" style={{ color: 'var(--gta-red)', textDecoration: 'none', fontFamily: 'var(--font-body)', fontWeight: 700, fontSize: '0.9rem' }}>
            SIGN OUT
          </Link>
        </div>
      </motion.nav>

      {/* BOTTOM HUD: XBOX BUTTON PROMPTS */}
      <motion.div
        initial={{ y: 50 }}
        animate={{ y: 0 }}
        style={{
          position: 'fixed',
          bottom: '1.5rem',
          right: '2rem',
          zIndex: 100,
          display: 'flex',
          gap: '2rem',
          background: 'var(--bg-blade)',
          border: '2px solid var(--border-light)',
          padding: '0.75rem 2rem',
          borderRadius: '50px',
          boxShadow: '0 10px 30px rgba(0,0,0,0.3)',
          fontFamily: 'var(--font-body)'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <div style={{ width: '24px', height: '24px', borderRadius: '50%', background: 'var(--xbox-green)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold', fontSize: '0.8rem', boxShadow: 'inset -2px -2px 4px rgba(0,0,0,0.2)' }}>A</div>
          <span style={{ fontWeight: 'bold', color: 'var(--gta-black)', fontSize: '1.1rem' }}>${player.cash.toLocaleString()}</span>
        </div>
        
        <div style={{ width: '2px', background: 'rgba(0,0,0,0.1)' }} />
        
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <div style={{ width: '24px', height: '24px', borderRadius: '50%', background: 'var(--gta-blue)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold', fontSize: '0.8rem', boxShadow: 'inset -2px -2px 4px rgba(0,0,0,0.2)' }}>X</div>
          <span style={{ fontWeight: 'bold', color: 'var(--gta-black)', fontSize: '1.1rem' }}>REP {player.reputation}</span>
        </div>

        <div style={{ width: '2px', background: 'rgba(0,0,0,0.1)' }} />
        
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <div style={{ width: '24px', height: '24px', borderRadius: '50%', background: 'var(--gta-red)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold', fontSize: '0.8rem', boxShadow: 'inset -2px -2px 4px rgba(0,0,0,0.2)' }}>B</div>
          <span style={{ fontWeight: 'bold', color: 'var(--gta-black)', fontSize: '1.1rem' }}>HEAT {player.heat}</span>
        </div>
      </motion.div>
    </>
  );
}
