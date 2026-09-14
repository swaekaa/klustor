import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMultiplayerStore } from '../../store/multiplayerStore';
import { useGameStore } from '../../store/gameStore';

export default function CreateRoom() {
  const navigate = useNavigate();
  const { createRoom, connect, error, clearError } = useMultiplayerStore();
  const { player } = useGameStore();

  const [leaderName, setLeaderName] = useState(player.driverName === 'KLUSTOR_07' ? '' : player.driverName);
  const [name, setName] = useState('');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [duration, setDuration] = useState(60); // 1 min
  const [maxPlayers, setMaxPlayers] = useState(8);
  const [racingEnabled, setRacingEnabled] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    connect();
    clearError();
  }, [connect, clearError]);

  const handleCreate = async () => {
    clearError();
    if (!leaderName.trim()) { setError('Please enter a LEADER NAME.'); return; }
    if (!name.trim()) { setError('Please enter a ROOM NAME.'); return; }
    if (!title.trim()) { setError('Please enter a CHALLENGE TITLE.'); return; }
    setIsSubmitting(true);
    try {
      const room = await createRoom(leaderName, {
        name,
        title,
        description,
        editingDurationSeconds: duration,
        maxPlayers,
        racingEnabled
      });
      navigate(`/multiplayer/room/${room.code}`);
    } catch (e) {
      console.error(e);
      setIsSubmitting(false);
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

      <div style={{ width: '100%', maxWidth: '600px', background: 'var(--bg-secondary)', padding: '2rem', borderRadius: '24px', boxShadow: '0 8px 24px rgba(0,0,0,0.05)', border: '1px solid var(--border-light)' }}>
        <h2 className="font-display" style={{ fontSize: '2rem', marginBottom: '1.5rem', textAlign: 'center' }}>CREATE ROOM</h2>
        
        {error && (
          <div style={{ background: '#FF4D4D', color: '#FFF', padding: '1rem', borderRadius: '8px', marginBottom: '1rem', fontFamily: 'var(--font-mono)' }}>
            {error}
          </div>
        )}

        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          <div>
            <label className="font-mono" style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem', color: 'var(--text-muted)' }}>LEADER NAME</label>
            <input type="text" value={leaderName} onChange={e => setLeaderName(e.target.value.toUpperCase())} placeholder="ENTER NAME" maxLength={16} style={inputStyle} />
          </div>

          <div>
            <label className="font-mono" style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem', color: 'var(--text-muted)' }}>ROOM NAME</label>
            <input type="text" value={name} onChange={e => setName(e.target.value)} placeholder="e.g. Midnight Run" style={inputStyle} />
          </div>
          
          <div>
            <label className="font-mono" style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem', color: 'var(--text-muted)' }}>CHALLENGE TITLE</label>
            <input type="text" value={title} onChange={e => setTitle(e.target.value)} placeholder="e.g. Neon Cyberpunk" style={inputStyle} />
          </div>

          <div>
            <label className="font-mono" style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem', color: 'var(--text-muted)' }}>DESCRIPTION (OPTIONAL)</label>
            <textarea value={description} onChange={e => setDescription(e.target.value)} placeholder="Design a car using only bright neon colors..." style={{ ...inputStyle, minHeight: '80px', resize: 'vertical' }} />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <div>
              <label className="font-mono" style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem', color: 'var(--text-muted)' }}>TIME LIMIT</label>
              <select value={duration} onChange={e => setDuration(Number(e.target.value))} style={inputStyle}>
                <option value={20}>20 Seconds</option>
                <option value={30}>30 Seconds</option>
                <option value={45}>45 Seconds</option>
                <option value={60}>1 Minute</option>
                <option value={120}>2 Minutes</option>
              </select>
            </div>
            <div>
              <label className="font-mono" style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem', color: 'var(--text-muted)' }}>MAX PLAYERS</label>
              <select value={maxPlayers} onChange={e => setMaxPlayers(Number(e.target.value))} style={inputStyle}>
                <option value={2}>2 Players</option>
                <option value={4}>4 Players</option>
                <option value={8}>8 Players</option>
                <option value={16}>16 Players</option>
              </select>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginTop: '0.5rem' }}>
            <input type="checkbox" id="raceToggle" checked={racingEnabled} onChange={e => setRacingEnabled(e.target.checked)} style={{ width: '20px', height: '20px' }} />
            <label htmlFor="raceToggle" className="font-mono" style={{ fontSize: '1rem' }}>ENABLE OPTIONAL RACE AFTER DESIGN</label>
          </div>

          <div style={{ display: 'flex', gap: '1rem', marginTop: '1rem' }}>
            <button className="btn" onClick={() => navigate('/multiplayer')} style={{ flex: 1, padding: '1rem', background: 'transparent', border: '1px solid var(--border-light)' }}>CANCEL</button>
            <button className="btn" onClick={handleCreate} disabled={isSubmitting} style={{ flex: 2, padding: '1rem', background: 'var(--klustor-cyan)', color: 'var(--text-primary)', border: 'none' }}>
              {isSubmitting ? 'CREATING...' : 'CREATE ROOM'}
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
