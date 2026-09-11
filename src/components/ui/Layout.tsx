import { useLocation, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useGameStore } from '../../store/gameStore';
import RetroBubble from './RetroBubble';

export default function Layout({ children }: { children: React.ReactNode }) {
  const { player, resetGame } = useGameStore();
  const location = useLocation();
  const navigate = useNavigate();

  // Landing, race, and customize pages are full-screen — no shell
  if (
    location.pathname === '/' ||
    location.pathname.startsWith('/race') ||
    location.pathname.startsWith('/customize')
  ) {
    return <>{children}</>;
  }

  const formatTime = (ms: number | null) => {
    if (ms === null) return '--:--.--';
    const s = Math.floor(ms / 1000);
    const min = Math.floor(s / 60);
    const sec = s % 60;
    const cs = Math.floor((ms % 1000) / 10);
    return `${String(min).padStart(2,'0')}:${String(sec).padStart(2,'0')}.${String(cs).padStart(2,'0')}`;
  };

  const tabs = [
    { path: '/garage', label: 'GARAGE', icon: '◈', color: 'var(--klustor-cyan)' },
    { path: '/race', label: 'RACE', icon: '●', color: 'var(--klustor-pink)' },
    { path: '/leaderboard', label: 'LEADERBOARD', icon: '◉', color: 'var(--klustor-yellow)' },
  ];

  return (
    <div style={{
      display: 'grid',
      gridTemplateColumns: '1fr',
      gridTemplateRows: 'auto 1fr',
      height: '100vh',
      overflow: 'hidden',
      background: 'var(--bg-primary)',
    }}>
      {/* Global Header */}
      <header style={{
        gridRow: '1',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '0.75rem 2rem',
        background: 'var(--bg-panel-solid)',
        borderBottom: '2px solid var(--border-light)',
        zIndex: 10,
        flexShrink: 0,
      }}>
        {/* Logo */}
        <div
          onClick={() => navigate('/garage')}
          style={{
            display: 'flex', alignItems: 'center', gap: '0.75rem',
            background: 'var(--bg-secondary)', padding: '0.35rem 1.25rem 0.35rem 0.5rem',
            borderRadius: 'var(--radius-pill)', border: '1px solid var(--border-light)',
            boxShadow: 'inset 0 1px 2px rgba(255,255,255,0.8), 0 2px 8px rgba(30,40,50,0.06)',
            cursor: 'pointer', userSelect: 'none',
          }}
        >
          <div style={{
            width: '30px', height: '30px', borderRadius: '50%',
            background: 'linear-gradient(135deg, var(--klustor-cyan), var(--klustor-pink))',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            color: '#fff', fontSize: '0.9rem', fontWeight: 'bold',
          }}>K</div>
          <div>
            <div className="font-display" style={{ fontSize: '0.95rem', color: 'var(--text-primary)', letterSpacing: '0.1em', lineHeight: 1 }}>KLUSTOR</div>
            <div style={{ fontFamily: 'Consolas,monospace', fontSize: '0.55rem', color: 'var(--text-muted)', letterSpacing: '0.15em' }}>// VICE COAST RACING</div>
          </div>
        </div>

        {/* Nav tabs */}
        <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
          {tabs.map(tab => {
            const isActive = location.pathname === tab.path;
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
            label="RESET"
            icon="⨂"
            color="var(--klustor-peach)"
            onClick={() => { resetGame(); navigate('/'); }}
          />
        </div>

        {/* Player stats */}
        <div style={{
          display: 'flex', gap: '1.25rem', alignItems: 'center',
          background: 'var(--bg-secondary)', padding: '0.4rem 1.25rem',
          borderRadius: 'var(--radius-pill)', border: '1px solid var(--border-light)',
          boxShadow: 'inset 0 1px 2px rgba(255,255,255,0.8), 0 2px 8px rgba(30,40,50,0.06)',
        }}>
          {[
            { label: 'CASH', value: `$${player.cash.toLocaleString()}`, color: 'var(--klustor-green)' },
            { label: 'REP', value: String(player.rep), color: 'var(--text-primary)' },
            { label: 'BEST', value: formatTime(player.bestTime), color: 'var(--klustor-cyan)' },
            { label: 'WINS', value: String(player.racesWon), color: 'var(--klustor-yellow)' },
          ].map((s, i) => (
            <div key={s.label} style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              {i > 0 && <div style={{ width: '1px', height: '14px', background: 'var(--border-light)' }} />}
              <span style={{ fontSize: '0.65rem', color: 'var(--text-muted)', fontWeight: 'bold', fontFamily: 'Consolas,monospace' }}>{s.label}</span>
              <span style={{ fontWeight: 'bold', color: s.color, fontSize: '0.9rem', lineHeight: 1, fontFamily: 'Trebuchet MS,sans-serif' }}>{s.value}</span>
            </div>
          ))}
        </div>
      </header>

      {/* Main content */}
      <main style={{
        gridRow: '2',
        overflow: 'hidden',
        position: 'relative',
        display: 'flex',
        flexDirection: 'column',
      }}>
        <div style={{ width: '100%', height: '100%', padding: '1rem 1.5rem', flex: 1, display: 'flex', flexDirection: 'column', minHeight: 0 }}>
          <AnimatePresence mode="wait">
            <motion.div
              key={location.pathname}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.18 }}
              style={{ flex: 1, display: 'flex', flexDirection: 'column', minHeight: 0 }}
            >
              {children}
            </motion.div>
          </AnimatePresence>
        </div>
      </main>
    </div>
  );
}
