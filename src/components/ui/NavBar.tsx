import { Link, NavLink, useNavigate } from 'react-router-dom';
import { useGameStore } from '../../store/gameStore';

export default function NavBar() {
  const { player, discoveredClues, canMakeDecision, resetGame } = useGameStore();
  const navigate = useNavigate();

  const handleReset = () => {
    resetGame();
    navigate('/');
  };

  return (
    <nav className="nav-bar">
      <Link to="/case" className="nav-bar__brand">
        VCI<span> // THE PHOTO NEVER LIES</span>
      </Link>

      <ul className="nav-bar__links">
        <li>
          <NavLink to="/case" className={({ isActive }) => (isActive ? 'active' : '')}>
            CASE 017
          </NavLink>
        </li>
        <li>
          <NavLink to="/board" className={({ isActive }) => (isActive ? 'active' : '')}>
            BOARD
          </NavLink>
        </li>
        {canMakeDecision() && (
          <li>
            <NavLink to="/decision" className={({ isActive }) => (isActive ? 'active' : '')}>
              DECISION
            </NavLink>
          </li>
        )}
        <li style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginLeft: '0.5rem' }}>
          <span
            className="font-mono"
            style={{ fontSize: '0.6rem', color: 'var(--text-secondary)', letterSpacing: '0.08em' }}
          >
            CLUES:{' '}
            <span style={{ color: 'var(--neon-cyan)' }}>
              {discoveredClues.length}/{13}
            </span>
          </span>
          <span
            className="font-mono"
            style={{ fontSize: '0.6rem', color: 'var(--text-secondary)', letterSpacing: '0.08em' }}
          >
            REP:{' '}
            <span style={{ color: 'var(--neon-yellow)' }}>
              {player.reputation}
            </span>
          </span>
        </li>
        <li>
          <button
            onClick={handleReset}
            className="btn btn-ghost btn-sm"
            style={{ padding: '0.3rem 0.7rem' }}
          >
            ↩ EXIT
          </button>
        </li>
      </ul>
    </nav>
  );
}
