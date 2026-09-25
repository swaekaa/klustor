import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useMultiplayerStore } from '../../store/multiplayerStore';
import { formatRaceTime } from '../../game/hooks/useRaceState';

export default function Results() {
  const navigate = useNavigate();
  const { room, socket, leaveRoom } = useMultiplayerStore();
  const { roomCode } = useParams<{ roomCode: string }>();

  if (!room) {
    return <div className="page" style={{ padding: '2rem' }}>LOADING RESULTS...</div>;
  }



  const handleLeave = () => {
    leaveRoom();
    navigate('/multiplayer');
  };

  const handleRestart = async () => {
    try {
      if (room?.leaderId === socket?.id) {
        await useMultiplayerStore.getState().restartRoom();
      }
    } catch (err) {
      console.error(err);
    }
  };

  // If room resets to lobby, go there
  useEffect(() => {
    if (room?.status === 'lobby') {
      navigate(`/multiplayer/room/${room.code}`);
    }
  }, [room?.status, navigate, room?.code]);

  const sortedPlayers = [...room.players].filter(p => p.hasSubmitted).sort((a, b) => {
    if (room.racingEnabled) {
      const aTime = a.raceTime || Infinity;
      const bTime = b.raceTime || Infinity;
      if (aTime !== bTime) return aTime - bTime;
    } else {
      const aTime = a.submittedAt || Infinity;
      const bTime = b.submittedAt || Infinity;
      if (aTime !== bTime) return aTime - bTime;
    }
    return a.id.localeCompare(b.id);
  });

  const winner = sortedPlayers[0];
  const isLeader = room.leaderId === socket?.id;

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

      <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%', maxWidth: '1000px', marginBottom: '2rem' }}>
        <div>
          <h1 className="font-display" style={{ fontSize: '2rem', color: 'var(--text-primary)', margin: 0 }}>FINAL RESULTS</h1>
          <div className="font-mono" style={{ fontSize: '1rem', color: 'var(--text-muted)' }}>{room.title} • {room.code}</div>
        </div>
        <div style={{ display: 'flex', gap: '1rem' }}>
          {isLeader && (
            <button className="btn" onClick={handleRestart} style={{ background: 'var(--klustor-cyan)', color: 'var(--text-primary)', border: 'none' }}>PLAY AGAIN</button>
          )}
          <button className="btn" onClick={handleLeave} style={{ background: 'transparent', border: '1px solid var(--border-light)' }}>RETURN TO MENU</button>
        </div>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem', width: '100%', maxWidth: '1000px' }}>
        
        {winner && (
          <div style={{ background: 'var(--bg-secondary)', padding: '3rem', borderRadius: '24px', textAlign: 'center', border: '2px solid var(--klustor-pink)', boxShadow: '0 8px 32px rgba(255,107,152,0.15)' }}>
            <h2 className="font-display" style={{ fontSize: '1.2rem', color: 'var(--klustor-pink)', letterSpacing: '0.2em', marginBottom: '1rem' }}>OVERALL WINNER</h2>
            <div className="font-display" style={{ fontSize: '3rem', margin: '1rem 0', color: 'var(--text-primary)', textShadow: '2px 2px 0px rgba(0,0,0,0.5)' }}>
              {winner.avatar || '🚗'} {winner.displayName} {winner.wins > 0 && Array(winner.wins).fill('👑').join('')}
            </div>
            
            <div style={{ display: 'flex', justifyContent: 'center', gap: '4rem' }}>
              <div>
                <div className="font-mono" style={{ fontSize: '0.9rem', color: 'var(--text-muted)', marginBottom: '0.5rem' }}>RACE TIME</div>
                <div className="font-display" style={{ fontSize: '2.5rem' }}>{winner.raceTime ? formatRaceTime(winner.raceTime) : 'N/A'}</div>
              </div>
              <div>
                <div className="font-mono" style={{ fontSize: '0.9rem', color: 'var(--text-muted)', marginBottom: '0.5rem' }}>TOP SPEED</div>
                <div className="font-display" style={{ fontSize: '2.5rem', color: 'var(--klustor-cyan)' }}>{winner.topSpeed ? Math.round(winner.topSpeed * 3.6) : '0'} KM/H</div>
              </div>
              <div>
                <div className="font-mono" style={{ fontSize: '0.9rem', color: 'var(--text-muted)', marginBottom: '0.5rem' }}>DESIGN SCORE</div>
                <div className="font-display" style={{ fontSize: '2.5rem', color: 'var(--text-primary)' }}>{winner.designScore?.toFixed(1) || '0.0'}</div>
              </div>
            </div>
          </div>
        )}

        <div style={{ background: 'var(--bg-secondary)', padding: '2rem', borderRadius: '24px', border: '1px solid var(--border-light)' }}>
          <h2 className="font-display" style={{ fontSize: '1.5rem', marginBottom: '1.5rem' }}>FULL LEADERBOARD</h2>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            {sortedPlayers.map((p, index) => (
              <div key={p.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '1rem', background: 'var(--bg-primary)', borderRadius: '12px', border: '1px solid var(--border-light)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '2rem' }}>
                  <div className="font-display" style={{ fontSize: '2rem', width: '40px', color: index === 0 ? 'var(--klustor-yellow)' : 'var(--text-muted)' }}>
                    {index + 1}
                  </div>
                  <div>
                    <div className="font-display" style={{ fontSize: '1.5rem', color: p.id === socket?.id ? 'var(--klustor-pink)' : 'var(--text-primary)' }}>
                      {p.avatar || '🚗'} {p.displayName} {p.id === socket?.id && <span className="font-mono" style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>(YOU)</span>}
                      {p.wins > 0 && <span style={{ marginLeft: '0.5rem' }}>{Array(p.wins).fill('👑').join('')}</span>}
                    </div>
                    <div className="font-mono" style={{ fontSize: '0.8rem', color: 'var(--klustor-green)' }}>
                      {p.status === 'finished' ? 'FINISHED' : 'SUBMITTED'}
                    </div>
                  </div>
                </div>
                
                <div style={{ display: 'flex', gap: '3rem', textAlign: 'right' }}>
                  <div>
                    <div className="font-mono" style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>DESIGN</div>
                    <div className="font-display" style={{ fontSize: '1.2rem' }}>{p.designScore?.toFixed(1) || '-'}</div>
                  </div>
                  <div>
                    <div className="font-mono" style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>TOP SPEED (KM/H)</div>
                    <div className="font-display" style={{ fontSize: '1.2rem', color: 'var(--klustor-cyan)' }}>{p.topSpeed ? Math.round(p.topSpeed * 3.6) : '0'}</div>
                  </div>
                  <div>
                    <div className="font-mono" style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>RACE TIME</div>
                    <div className="font-display" style={{ fontSize: '1.2rem' }}>{p.raceTime ? formatRaceTime(p.raceTime) : 'N/A'}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

      </div>
    </div>
  );
}
