import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useMultiplayerStore } from '../../store/multiplayerStore';

export default function Lobby() {
  const { roomCode } = useParams<{ roomCode: string }>();
  const navigate = useNavigate();
  const { room, socket, leaveRoom, setReady, startChallenge, error, clearError } = useMultiplayerStore();
  
  const [copied, setCopied] = useState(false);

  // If room starts editing, transition to challenge page
  useEffect(() => {
    if (room?.status === 'editing') {
      navigate(`/multiplayer/challenge/${room.code}`);
    }
  }, [room?.status, navigate]);

  if (!room) {
    return (
      <div className="page" style={{ padding: '2rem', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '100vh' }}>
        <h2 className="font-display" style={{ fontSize: '2rem' }}>LOADING LOBBY...</h2>
      </div>
    );
  }

  const myId = socket?.id;
  const me = room.players.find(p => p.id === myId);
  const isLeader = me?.isLeader;
  const allReady = room.players.every(p => p.isReady || p.isLeader || p.status === 'disconnected');

  const handleCopy = () => {
    navigator.clipboard.writeText(room.code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleStart = async () => {
    try {
      await startChallenge();
    } catch (e) {
      console.error(e);
    }
  };

  const handleReady = async () => {
    if (!me) return;
    try {
      await setReady(!me.isReady);
    } catch (e) {
      console.error(e);
    }
  };

  const handleLeave = () => {
    leaveRoom();
    navigate('/multiplayer');
  };

  return (
    <div className="page" style={{ padding: '2rem', display: 'flex', flexDirection: 'column', alignItems: 'center', minHeight: '100vh' }}>
      
      {/* HEADER & NAV */}
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginBottom: '2rem', width: '100%' }}>
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

      <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%', maxWidth: '900px', marginBottom: '2rem' }}>
        <h1 className="font-display" style={{ fontSize: '2rem', color: 'var(--text-primary)', margin: 0 }}>LOBBY</h1>
        <button className="btn" onClick={handleLeave} style={{ background: 'transparent', border: '1px solid var(--border-light)' }}>LEAVE ROOM</button>
      </div>

      {error && (
        <div style={{ background: '#FF4D4D', color: '#FFF', padding: '1rem', borderRadius: '8px', marginBottom: '2rem', fontFamily: 'var(--font-mono)', width: '100%', maxWidth: '900px' }}>
          {error}
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '2rem', width: '100%', maxWidth: '900px' }}>
        
        {/* LEFT PANEL: ROOM INFO */}
        <div style={{ background: 'var(--bg-secondary)', padding: '2rem', borderRadius: '24px', border: '1px solid var(--border-light)', display: 'flex', flexDirection: 'column' }}>
          <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
            <div className="font-mono" style={{ fontSize: '0.9rem', color: 'var(--text-muted)' }}>ROOM CODE</div>
            <div className="font-display" style={{ fontSize: '3rem', letterSpacing: '0.1em', cursor: 'pointer' }} onClick={handleCopy} title="Click to copy">
              {room.code}
            </div>
            {copied && <div className="font-mono" style={{ fontSize: '0.8rem', color: 'var(--klustor-green)' }}>COPIED!</div>}
          </div>

          <div style={{ flex: 1 }}>
            <h3 className="font-display" style={{ fontSize: '1.5rem', marginBottom: '0.5rem' }}>{room.title}</h3>
            {room.description && <p className="font-mono" style={{ fontSize: '0.9rem', color: 'var(--text-muted)', marginBottom: '1.5rem' }}>{room.description}</p>}
            
            <div style={{ display: 'flex', justifyContent: 'space-between', fontFamily: 'var(--font-mono)', fontSize: '0.9rem', borderBottom: '1px solid var(--border-light)', paddingBottom: '0.5rem', marginBottom: '0.5rem' }}>
              <span>TIME LIMIT</span> <span>{room.editingDurationSeconds < 60 ? `${room.editingDurationSeconds} SEC` : `${room.editingDurationSeconds / 60} MIN`}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontFamily: 'var(--font-mono)', fontSize: '0.9rem', borderBottom: '1px solid var(--border-light)', paddingBottom: '0.5rem', marginBottom: '0.5rem' }}>
              <span>RACING</span> <span>{room.racingEnabled ? 'ENABLED' : 'DISABLED'}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontFamily: 'var(--font-mono)', fontSize: '0.9rem' }}>
              <span>PLAYERS</span> <span>{room.players.filter(p => p.status !== 'disconnected').length} / {room.maxPlayers}</span>
            </div>
          </div>

          {isLeader ? (
            <button 
              className="btn" 
              onClick={handleStart} 
              disabled={room.players.length < 1} // Can start solo for MVP testing
              style={{ padding: '1rem', marginTop: '2rem', background: 'var(--klustor-cyan)', border: 'none', width: '100%' }}
            >
              START CHALLENGE
            </button>
          ) : (
            <button 
              className="btn" 
              onClick={handleReady} 
              style={{ padding: '1rem', marginTop: '2rem', background: me?.isReady ? 'var(--klustor-green)' : 'var(--bg-primary)', color: me?.isReady ? '#fff' : 'var(--text-primary)', border: me?.isReady ? 'none' : '2px solid var(--border-light)', width: '100%' }}
            >
              {me?.isReady ? 'READY!' : 'MARK AS READY'}
            </button>
          )}
        </div>

        {/* RIGHT PANEL: PLAYERS */}
        <div style={{ background: 'var(--bg-secondary)', padding: '2rem', borderRadius: '24px', border: '1px solid var(--border-light)' }}>
          <h2 className="font-display" style={{ fontSize: '1.8rem', marginBottom: '1.5rem' }}>PLAYERS</h2>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            {room.players.map(p => (
              <div key={p.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '1rem', background: p.id === myId ? 'rgba(0, 255, 255, 0.1)' : 'var(--bg-primary)', borderRadius: '12px', border: '1px solid var(--border-light)', opacity: p.status === 'disconnected' ? 0.5 : 1 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                  {p.isLeader && <span title="Room Leader">👑</span>}
                  <span className="font-display" style={{ fontSize: '1.2rem' }}>{p.displayName}</span>
                  {p.id === myId && <span className="font-mono" style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>(YOU)</span>}
                  {p.status === 'disconnected' && <span className="font-mono" style={{ fontSize: '0.8rem', color: '#FF4D4D' }}>DISCONNECTED</span>}
                </div>
                
                {p.status !== 'disconnected' && (
                  <div className="font-mono" style={{ fontSize: '0.9rem', color: (p.isReady || p.isLeader) ? 'var(--klustor-green)' : 'var(--text-muted)' }}>
                    {(p.isReady || p.isLeader) ? 'READY' : 'WAITING'}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

      </div>
    </div>
  );
}
