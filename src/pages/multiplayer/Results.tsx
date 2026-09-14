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

  // Sort players deterministically as per instructions
  // 1. Higher total score
  // 2. Higher design score
  // 3. Earlier valid submission time
  // 4. Stable player ID
  const sortedPlayers = [...room.players].sort((a, b) => {
    const aTotal = a.totalScore ?? 0;
    const bTotal = b.totalScore ?? 0;
    if (aTotal !== bTotal) return bTotal - aTotal;

    const aDesign = a.designScore ?? 0;
    const bDesign = b.designScore ?? 0;
    if (aDesign !== bDesign) return bDesign - aDesign;

    const aTime = a.submittedAt ?? Infinity;
    const bTime = b.submittedAt ?? Infinity;
    if (aTime !== bTime) return aTime - bTime;

    return a.id.localeCompare(b.id);
  });

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
        
        {/* WINNER CARD */}
        {winner && winner.hasSubmitted && (
          <div style={{ background: 'var(--bg-secondary)', padding: '3rem', borderRadius: '24px', border: '2px solid var(--klustor-pink)', boxShadow: '0 8px 32px rgba(255, 105, 180, 0.2)', textAlign: 'center' }}>
            <h2 className="font-display" style={{ fontSize: '1.5rem', color: 'var(--klustor-pink)', letterSpacing: '0.2em', marginBottom: '0.5rem' }}>OVERALL WINNER</h2>
            <div className="font-display" style={{ fontSize: '4rem', marginBottom: '1rem' }}>{winner.displayName}</div>
            
            <div style={{ display: 'flex', justifyContent: 'center', gap: '3rem', marginTop: '1rem' }}>
              <div>
                <div className="font-mono" style={{ fontSize: '0.9rem', color: 'var(--text-muted)' }}>DESIGN SCORE</div>
                <div className="font-display" style={{ fontSize: '2rem' }}>{winner.designScore?.toFixed(1) || '0.0'}</div>
              </div>
              {room.racingEnabled && (
                <>
                  <div>
                    <div className="font-mono" style={{ fontSize: '0.9rem', color: 'var(--text-muted)' }}>RACE TIME</div>
                    <div className="font-display" style={{ fontSize: '2rem' }}>{winner.raceTime ? formatRaceTime(winner.raceTime) : '--'}</div>
                  </div>
                </>
              )}
              <div>
                <div className="font-mono" style={{ fontSize: '0.9rem', color: 'var(--klustor-pink)' }}>TOTAL SCORE</div>
                <div className="font-display" style={{ fontSize: '2rem', color: 'var(--klustor-pink)' }}>{winner.totalScore?.toFixed(1) || '0.0'}</div>
              </div>
            </div>
          </div>
        )}

        {/* FULL LEADERBOARD */}
        <div style={{ background: 'var(--bg-secondary)', padding: '2rem', borderRadius: '24px', border: '1px solid var(--border-light)' }}>
          <h3 className="font-display" style={{ fontSize: '1.5rem', marginBottom: '1.5rem' }}>FULL LEADERBOARD</h3>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            {sortedPlayers.map((p, index) => (
              <div key={p.id} style={{ display: 'flex', alignItems: 'center', padding: '1rem', background: p.id === socket?.id ? 'rgba(0, 255, 255, 0.1)' : 'var(--bg-primary)', borderRadius: '12px', border: '1px solid var(--border-light)' }}>
                <div className="font-display" style={{ fontSize: '1.5rem', width: '40px', color: index === 0 ? 'var(--klustor-yellow)' : 'var(--text-muted)' }}>
                  {index + 1}
                </div>
                
                <div style={{ flex: 1 }}>
                  <div className="font-display" style={{ fontSize: '1.2rem' }}>{p.displayName} {p.id === socket?.id && '(YOU)'}</div>
                  <div className="font-mono" style={{ fontSize: '0.8rem', color: p.hasSubmitted ? 'var(--klustor-green)' : '#FF4D4D' }}>
                    {p.hasSubmitted ? 'SUBMITTED' : 'INCOMPLETE'}
                  </div>
                </div>

                <div style={{ display: 'flex', gap: '2rem', textAlign: 'right' }}>
                  <div>
                    <div className="font-mono" style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>DESIGN</div>
                    <div className="font-mono" style={{ fontWeight: 'bold' }}>{p.designScore?.toFixed(1) ?? '--'}</div>
                  </div>
                  
                  {room.racingEnabled && (
                    <div>
                      <div className="font-mono" style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>RACE</div>
                      <div className="font-mono" style={{ fontWeight: 'bold' }}>{p.raceTime ? formatRaceTime(p.raceTime) : '--'}</div>
                    </div>
                  )}

                  <div>
                    <div className="font-mono" style={{ fontSize: '0.7rem', color: 'var(--text-primary)' }}>TOTAL</div>
                    <div className="font-display" style={{ fontSize: '1.2rem', color: 'var(--klustor-cyan)' }}>{p.totalScore?.toFixed(1) ?? '--'}</div>
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
