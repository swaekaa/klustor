import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMultiplayerStore } from '../../store/multiplayerStore';
import { useGameStore } from '../../store/gameStore';

const CAR_AVATARS = ['🚗', '🚕', '🚙', '🚌', '🏎️', '🚓', '🚑', '🚒', '🚐', '🛻', '🚚', '🚛', '🚜', '🛵', '🏍️', '🛺'];

export default function JoinRoom() {
  const navigate = useNavigate();
  const { joinRoom, connect, error, clearError } = useMultiplayerStore();
  const player = useGameStore(s => s.player);
  const updateDriverAvatar = useGameStore(s => s.updateDriverAvatar);

  const [roomCode, setRoomCode] = useState('');
  const [displayName, setDisplayName] = useState(player.driverName === 'KLUSTOR_07' ? '' : player.driverName);
  const [avatar, setAvatar] = useState(player.driverAvatar || '🚗');
  const [isJoining, setIsJoining] = useState(false);

  useEffect(() => {
    connect();
    clearError();
  }, [connect, clearError]);

  const handleJoin = async () => {
    clearError();
    if (!roomCode.trim()) { setError('Please enter a ROOM CODE.'); return; }
    if (!displayName.trim()) { setError('Please enter a DISPLAY NAME.'); return; }
    setIsJoining(true);
    updateDriverAvatar(avatar);
    try {
      const room = await joinRoom(roomCode.toUpperCase(), displayName.toUpperCase(), avatar);
      navigate(`/multiplayer/room/${room.code}`);
    } catch (e) {
      console.error(e);
      setIsJoining(false);
    }
  };

  return (
    <div className="page" style={{ padding: '2rem', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
      
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

      <div style={{ width: '100%', maxWidth: '500px', background: 'var(--bg-secondary)', padding: '2rem', borderRadius: '24px', boxShadow: '0 8px 24px rgba(0,0,0,0.05)', border: '1px solid var(--border-light)' }}>
        <h2 className="font-display" style={{ fontSize: '2rem', marginBottom: '1.5rem', textAlign: 'center' }}>JOIN ROOM</h2>
        
        {error && (
          <div style={{ background: '#FF4D4D', color: '#FFF', padding: '1rem', borderRadius: '8px', marginBottom: '1rem', fontFamily: 'var(--font-mono)' }}>
            {error}
          </div>
        )}

        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          <div>
            <label className="font-mono" style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem', color: 'var(--text-muted)' }}>ROOM CODE</label>
            <input 
              type="text" 
              value={roomCode} 
              onChange={e => setRoomCode(e.target.value.toUpperCase())} 
              placeholder="e.g. VICE-4821" 
              maxLength={9}
              style={{ ...inputStyle, textAlign: 'center', letterSpacing: '0.2em' }} 
            />
          </div>
          
          <div>
            <label className="font-mono" style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem', color: 'var(--text-muted)' }}>DISPLAY NAME</label>
            <input 
              type="text" 
              value={displayName} 
              onChange={e => setDisplayName(e.target.value.toUpperCase())} 
              placeholder="ENTER NAME" 
              maxLength={16}
              style={{ ...inputStyle, textAlign: 'center' }} 
            />
          </div>

          <div>
            <label className="font-mono" style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem', color: 'var(--text-muted)' }}>SELECT AVATAR</label>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(8, 1fr)', gap: '0.5rem', background: 'var(--bg-secondary)', padding: '1rem', borderRadius: '8px', border: '1px solid var(--border-light)' }}>
              {CAR_AVATARS.map(emoji => (
                <button
                  key={emoji}
                  onClick={() => setAvatar(emoji)}
                  style={{
                    fontSize: '1.5rem',
                    background: avatar === emoji ? 'var(--klustor-pink)' : 'transparent',
                    border: avatar === emoji ? '2px solid var(--text-primary)' : '2px solid transparent',
                    borderRadius: '8px',
                    padding: '0.25rem',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease',
                    boxShadow: avatar === emoji ? '2px 2px 0px var(--text-primary)' : 'none'
                  }}
                >
                  {emoji}
                </button>
              ))}
            </div>
          </div>

          <div style={{ display: 'flex', gap: '1rem', marginTop: '1rem' }}>
            <button className="btn" onClick={() => navigate('/multiplayer')} style={{ flex: 1, padding: '1rem', background: 'transparent', border: '1px solid var(--border-light)' }}>CANCEL</button>
            <button className="btn" onClick={handleJoin} disabled={isJoining} style={{ flex: 2, padding: '1rem', background: 'var(--klustor-pink)', color: '#FFF', border: 'none' }}>
              {isJoining ? 'JOINING...' : 'JOIN ROOM'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

const inputStyle = {
  width: '100%', padding: '0.75rem 1rem', background: 'var(--bg-primary)',
  border: '2px solid var(--border-light)', borderRadius: '8px',
  fontFamily: 'var(--font-display)', fontSize: '1.2rem', color: 'var(--text-primary)',
  outline: 'none', transition: 'border-color 0.2s ease'
};
