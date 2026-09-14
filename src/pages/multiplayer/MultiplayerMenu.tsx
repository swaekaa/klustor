import { useNavigate } from 'react-router-dom';

export default function MultiplayerMenu() {
  const navigate = useNavigate();

  return (
    <div className="page" style={{ padding: '2rem', display: 'flex', flexDirection: 'column', alignItems: 'center', minHeight: '100vh' }}>
      
      {/* HEADER & NAV */}
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginBottom: '3rem', width: '100%' }}>
        <h1 className="font-display" style={{ fontSize: '2.5rem', letterSpacing: '0.15em', color: 'var(--text-primary)', marginBottom: '1.5rem' }}>
          KLUSTOR
        </h1>
        <div style={{ display: 'flex', gap: '1rem', background: 'var(--bg-secondary)', padding: '0.5rem', borderRadius: '999px', boxShadow: '0 4px 12px rgba(0,0,0,0.05)' }}>
          <button className="btn" onClick={() => navigate('/')} style={{ background: 'transparent', border: 'none', boxShadow: 'none' }}>
             GARAGE
          </button>
          <button className="btn" onClick={() => navigate('/leaderboard')} style={{ background: 'transparent', border: 'none', boxShadow: 'none' }}>
             LEADERBOARD
          </button>
          <button className="btn" onClick={() => navigate('/multiplayer')} style={{ background: 'var(--klustor-pink)', border: 'none', boxShadow: 'none' }}>
             MULTIPLAYER
          </button>
        </div>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginBottom: '3rem', width: '100%', maxWidth: '600px' }}>
        <h1 className="font-display" style={{ fontSize: '3rem', letterSpacing: '0.15em', color: 'var(--text-primary)', marginBottom: '0.5rem', textAlign: 'center' }}>
          MULTIPLAYER LOBBY
        </h1>
        <p className="font-mono" style={{ color: 'var(--text-muted)', textAlign: 'center', marginBottom: '2rem' }}>
          TIMED CAR-DESIGN CHALLENGES
        </p>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', width: '100%' }}>
          <button 
            className="btn font-display" 
            onClick={() => navigate('/multiplayer/create')}
            style={{ 
              padding: '1.5rem', fontSize: '1.5rem', borderRadius: '999px', 
              background: 'var(--klustor-cyan)', color: 'var(--text-primary)', 
              border: '3px solid var(--text-primary)', boxShadow: '6px 6px 0px var(--text-primary)',
              fontWeight: 900, width: '100%', cursor: 'pointer', transition: 'all 0.2s ease'
            }}
          >
            CREATE ROOM
          </button>
          
          <button 
            className="btn font-display" 
            onClick={() => navigate('/multiplayer/join')}
            style={{ 
              padding: '1.5rem', fontSize: '1.5rem', borderRadius: '999px', 
              background: 'var(--klustor-pink)', color: 'var(--text-primary)', 
              border: '3px solid var(--text-primary)', boxShadow: '6px 6px 0px var(--text-primary)',
              fontWeight: 900, width: '100%', cursor: 'pointer', transition: 'all 0.2s ease'
            }}
          >
            JOIN ROOM
          </button>
          
          <button 
            className="btn font-display" 
            onClick={() => navigate('/')}
            style={{ 
              padding: '1.2rem', fontSize: '1.2rem', borderRadius: '999px', 
              background: 'var(--bg-secondary)', color: 'var(--text-primary)', 
              border: '3px solid var(--text-primary)', boxShadow: '4px 4px 0px var(--text-primary)',
              fontWeight: 900, marginTop: '1rem', width: '100%', cursor: 'pointer', transition: 'all 0.2s ease'
            }}
          >
            BACK TO GARAGE
          </button>
        </div>
      </div>
    </div>
  );
}
