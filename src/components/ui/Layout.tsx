import { Link, useLocation, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useGameStore } from '../../store/gameStore';
import RetroBubble from './RetroBubble';

export default function Layout({ children }: { children: React.ReactNode }) {
  const { player, resetGame } = useGameStore();
  const location = useLocation();
  const navigate = useNavigate();

  // The landing page doesn't use the shell
  if (location.pathname === '/') {
    return <>{children}</>;
  }

  const tabs = [
    { path: '/case', label: 'JOBS', icon: '●', color: 'var(--color-nav)' },
    { path: '/board', label: 'WALL', icon: '◉', color: 'var(--color-success)' },
    { path: '/map', label: 'MAP', icon: '◎', color: 'var(--color-warning)' },
    { path: '/contacts', label: 'CONTACTS', icon: '◇', color: 'var(--color-social)' },
  ];

  return (
    <div style={{
      display: 'grid',
      gridTemplateColumns: '1fr',
      gridTemplateRows: 'auto 1fr auto',
      height: '100vh',
      overflow: 'hidden',
      background: 'var(--bg-primary)'
    }}>
      {/* 1. GLOBAL HEADER - Horizontal top dashboard */}
      <header style={{
        gridRow: '1',
        display: 'flex',
        flexDirection: 'column',
        padding: '1.5rem 3rem 0 3rem',
        background: 'transparent',
        zIndex: 10
      }}>
        {/* Top line with logo, bubbles, and stats */}
        <div style={{ 
          display: 'flex', 
          alignItems: 'flex-start', 
          justifyContent: 'space-between',
          gap: '2rem'
        }}>
          {/* Logo Module */}
          <div style={{ 
            display: 'flex', 
            flexDirection: 'row', 
            alignItems: 'center', 
            background: 'var(--bg-panel-solid)',
            padding: '0.25rem 1.5rem 0.25rem 0.5rem',
            borderRadius: 'var(--radius-pill)',
            border: '1px solid var(--border-light)',
            boxShadow: 'inset 0 1px 2px rgba(255,255,255,0.8), 0 4px 12px rgba(30,40,50,0.05)',
            height: '48px',
            gap: '0.75rem',
            width: 'auto'
          }}>
            <div style={{
              width: '32px', height: '32px', borderRadius: '50%', background: 'var(--color-nav)',
              display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: '1rem', fontWeight: 'bold'
            }}>K</div>
            <div className="font-display" style={{ fontSize: '1.2rem', color: 'var(--text-primary)', letterSpacing: '0.1em', lineHeight: 1 }}>
              KLUSTOR
            </div>
          </div>
          
          {/* Bubbles Navigation */}
          <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
            {tabs.map((tab) => {
              const isActive = location.pathname.startsWith(tab.path);
              return (
                <RetroBubble
                  key={tab.path}
                  label={tab.label}
                  icon={tab.icon}
                  isActive={isActive}
                  color={tab.color}
                  onClick={() => navigate(tab.path)}
                />
              );
            })}
            <RetroBubble
              label="RESTART"
              icon="⨂"
              color="var(--neon-red)"
              onClick={() => {
                resetGame();
                navigate('/');
              }}
            />
          </div>

          {/* Player Stats Module */}
          <div style={{ 
            display: 'flex', 
            flexDirection: 'row',
            gap: '1rem',
            background: 'var(--bg-panel-solid)',
            padding: '0 1rem',
            borderRadius: 'var(--radius-pill)',
            border: '1px solid var(--border-light)',
            boxShadow: 'inset 0 1px 2px rgba(255,255,255,0.8), 0 4px 12px rgba(30,40,50,0.05)',
            height: '48px',
            alignItems: 'center'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', fontWeight: 'bold' }}>CASH</span>
              <span style={{ fontWeight: 'bold', color: 'var(--color-success)', fontSize: '1rem', lineHeight: 1 }}>${player.cash.toLocaleString()}</span>
            </div>
            <div style={{ width: '2px', height: '16px', background: 'var(--border-light)' }} />
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', fontWeight: 'bold' }}>REP</span>
              <span style={{ fontWeight: 'bold', color: 'var(--text-primary)', fontSize: '1rem', lineHeight: 1 }}>{player.reputation}</span>
            </div>
            <div style={{ width: '2px', height: '16px', background: 'var(--border-light)' }} />
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', fontWeight: 'bold' }}>HEAT</span>
              <span style={{ fontWeight: 'bold', color: 'var(--color-social)', fontSize: '1rem', lineHeight: 1 }}>{player.heat}</span>
            </div>
          </div>
        </div>
      </header>

      {/* 2. MAIN CONTENT GRID */}
      <main style={{
        gridRow: '2',
        overflowY: 'hidden',
        overflowX: 'hidden',
        position: 'relative',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center'
      }}>
        <div style={{ width: '100%', maxWidth: '100%', padding: '1rem 3rem', flex: 1, display: 'flex', flexDirection: 'column', minHeight: 0 }}>
          <AnimatePresence mode="wait">
            <motion.div
              key={location.pathname}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
              style={{ flex: 1, display: 'flex', flexDirection: 'column', minHeight: 0 }}
            >
              {children}
            </motion.div>
          </AnimatePresence>
        </div>
      </main>

      {/* 3. GLOBAL FOOTER / ACTION BAR */}
      <footer style={{
        gridRow: '3',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '0 3rem',
        height: '60px',
        borderTop: '2px solid var(--border-light)',
        background: 'transparent',
        fontFamily: 'var(--font-mono)',
        fontSize: '0.8rem',
        color: 'var(--text-muted)',
        zIndex: 5
      }}>
        <div style={{ display: 'flex', gap: '2rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <span style={{ color: 'var(--color-nav)', fontWeight: 'bold', fontSize: '1.2rem' }}>●</span>
            <span style={{ fontWeight: 'bold' }}>SELECT</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <span style={{ color: 'var(--color-warning)', fontWeight: 'bold', fontSize: '1.2rem' }}>▲</span>
            <span style={{ fontWeight: 'bold' }}>BACK</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <span style={{ color: 'var(--color-success)', fontWeight: 'bold', fontSize: '1.2rem' }}>■</span>
            <span style={{ fontWeight: 'bold' }}>OPEN</span>
          </div>
        </div>
        <div style={{ fontWeight: 'bold', letterSpacing: '0.1em', display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <Link to="/" onClick={resetGame} style={{ color: 'var(--text-muted)', textDecoration: 'none' }}>
            QUIT
          </Link>
          <div style={{ width: '4px', height: '4px', borderRadius: '50%', background: 'var(--text-muted)' }} />
          SYSTEM READY
        </div>
      </footer>
    </div>
  );
}
