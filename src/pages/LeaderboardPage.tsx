import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useGameStore } from '../store/gameStore';
import { CIRCUIT_INFO } from '../game/data/viceCoastCircuit';

function formatTime(ms: number): string {
  const s = Math.floor(ms / 1000);
  const min = Math.floor(s / 60);
  const sec = s % 60;
  const cs = Math.floor((ms % 1000) / 10);
  return `${String(min).padStart(2,'0')}:${String(sec).padStart(2,'0')}.${String(cs).padStart(2,'0')}`;
}

export default function LeaderboardPage() {
  const navigate = useNavigate();
  const { raceRecords, player } = useGameStore();

  // Sort all records by time ascending
  const sorted = [...raceRecords].sort((a, b) => a.time - b.time);
  const bestTime = player.bestTime;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="page"
      style={{ display: 'flex', flexDirection: 'column', height: '100%', minHeight: 0 }}
    >
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.5rem', flexShrink: 0 }}>
        <div>
          <h1 className="font-display" style={{ fontSize: '2.5rem', margin: 0, color: 'var(--text-primary)' }}>
            LEADERBOARD
          </h1>
          <div className="font-mono" style={{ color: 'var(--text-muted)', fontSize: '0.8rem', marginTop: '0.25rem', letterSpacing: '0.1em' }}>
            {CIRCUIT_INFO.name} · {CIRCUIT_INFO.lapLength} · {CIRCUIT_INFO.turns} TURNS
          </div>
        </div>
        <div style={{ display: 'flex', gap: '0.75rem' }}>
          <button
            onClick={() => navigate('/garage')}
            style={{
              padding: '0.6rem 1.25rem', background: 'var(--bg-secondary)',
              border: '1px solid var(--border-light)', borderRadius: '10px',
              fontFamily: 'Consolas,monospace', fontSize: '0.75rem', cursor: 'pointer',
              color: 'var(--text-primary)', fontWeight: 'bold',
            }}
          >
            ← GARAGE
          </button>
          <button
            onClick={() => navigate('/race')}
            style={{
              padding: '0.6rem 1.5rem', background: 'var(--klustor-pink)',
              border: '2px solid rgba(30,41,51,0.12)', borderRadius: '10px',
              fontFamily: 'Trebuchet MS,sans-serif', fontWeight: 'bold', fontSize: '0.85rem',
              letterSpacing: '0.08em', color: 'var(--text-primary)', cursor: 'pointer',
            }}
          >
            🏁 RACE NOW
          </button>
        </div>
      </div>

      {/* Your best */}
      {bestTime && (
        <motion.div
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          className="panel"
          style={{ marginBottom: '1rem', flexShrink: 0, display: 'flex', alignItems: 'center', gap: '1.5rem', background: 'rgba(143,213,209,0.15)', border: '2px solid var(--klustor-cyan)' }}
        >
          <div style={{ fontFamily: 'Consolas,monospace', fontSize: '0.7rem', color: 'var(--klustor-cyan)', fontWeight: 'bold', letterSpacing: '0.1em' }}>
            YOUR BEST TIME
          </div>
          <div style={{ fontFamily: 'Trebuchet MS,sans-serif', fontWeight: 'bold', fontSize: '2rem', color: 'var(--text-primary)' }}>
            {formatTime(bestTime)}
          </div>
          <div style={{ fontFamily: 'Consolas,monospace', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
            DRIVER: {player.driverName}
          </div>
          <div style={{ fontFamily: 'Consolas,monospace', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
            RACES WON: {player.racesWon}
          </div>
        </motion.div>
      )}

      {/* Records table */}
      {sorted.length === 0 ? (
        <div className="panel" style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', textAlign: 'center' }}>
          <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>🏁</div>
          <div className="font-display" style={{ fontSize: '1.8rem', color: 'var(--text-muted)', marginBottom: '0.5rem' }}>
            NO RECORDS YET
          </div>
          <div className="font-mono" style={{ color: 'var(--text-muted)', fontSize: '0.8rem', marginBottom: '1.5rem' }}>
            Complete a race to set your first time.
          </div>
          <button
            onClick={() => navigate('/race')}
            style={{
              padding: '0.75rem 2rem', background: 'var(--klustor-pink)',
              border: '2px solid rgba(30,41,51,0.12)', borderRadius: '12px',
              fontFamily: 'Trebuchet MS,sans-serif', fontWeight: 'bold', fontSize: '0.95rem',
              letterSpacing: '0.08em', color: 'var(--text-primary)', cursor: 'pointer',
            }}
          >
            🏁 RACE NOW
          </button>
        </div>
      ) : (
        <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
          {/* Column headers */}
          <div style={{
            display: 'grid', gridTemplateColumns: '40px 48px 1fr 100px 80px 80px',
            padding: '0.5rem 1rem', gap: '0.75rem',
            fontFamily: 'Consolas,monospace', fontSize: '0.65rem', color: 'var(--text-muted)',
            letterSpacing: '0.1em', fontWeight: 'bold', borderBottom: '2px solid var(--border-light)',
          }}>
            <span>#</span>
            <span>LIVERY</span>
            <span>DRIVER</span>
            <span>TIME</span>
            <span>SPEED</span>
            <span>STYLE</span>
          </div>

          {sorted.map((record, i) => {
            const isMe = record.driverName === player.driverName && !record.isNPC;
            const isBest = record.time === bestTime && isMe;
            return (
              <motion.div
                key={record.id}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.04 }}
                style={{
                  display: 'grid',
                  gridTemplateColumns: '40px 48px 1fr 100px 80px 80px',
                  padding: '0.65rem 1rem', gap: '0.75rem', alignItems: 'center',
                  background: isMe ? 'rgba(143,213,209,0.12)' : 'var(--bg-panel)',
                  border: `1px solid ${isBest ? 'var(--klustor-cyan)' : isMe ? 'rgba(143,213,209,0.3)' : 'var(--border-light)'}`,
                  borderRadius: '12px',
                  boxShadow: isBest ? '0 0 0 2px rgba(143,213,209,0.4)' : '0 2px 6px rgba(30,41,51,0.04)',
                }}
              >
                {/* Rank */}
                <div style={{
                  fontFamily: 'Trebuchet MS,sans-serif', fontWeight: 'bold', fontSize: '1.1rem',
                  color: i === 0 ? '#FFD700' : i === 1 ? '#C0C0C0' : i === 2 ? '#CD7F32' : 'var(--text-muted)',
                }}>
                  {i + 1}
                </div>

                {/* Livery thumbnail */}
                {record.liveryTextures?.left ? (
                  <img
                    src={record.liveryTextures.left}
                    alt="Livery"
                    style={{ width: '48px', height: '32px', objectFit: 'cover', borderRadius: '6px', border: '1px solid var(--border-light)' }}
                  />
                ) : (
                  <div style={{ width: '48px', height: '32px', background: 'var(--bg-secondary)', borderRadius: '6px', border: '1px solid var(--border-light)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <span style={{ fontSize: '0.6rem', color: 'var(--text-muted)' }}>🚗</span>
                  </div>
                )}

                {/* Driver name */}
                <div>
                  <div style={{
                    fontFamily: 'Trebuchet MS,sans-serif', fontWeight: 'bold', fontSize: '0.9rem',
                    color: isMe ? 'var(--text-primary)' : 'var(--text-secondary)',
                    display: 'flex', alignItems: 'center', gap: '0.5rem',
                  }}>
                    {record.driverName}
                    {isBest && (
                      <span style={{
                        padding: '0.1rem 0.4rem', background: 'var(--klustor-cyan)',
                        borderRadius: '4px', fontSize: '0.55rem', fontFamily: 'Consolas,monospace',
                        letterSpacing: '0.05em', color: 'var(--text-primary)',
                      }}>
                        BEST
                      </span>
                    )}
                  </div>
                  <div style={{ fontFamily: 'Consolas,monospace', fontSize: '0.6rem', color: 'var(--text-muted)', marginTop: '1px' }}>
                    {new Date(record.createdAt).toLocaleDateString()}
                  </div>
                </div>

                {/* Time */}
                <div style={{
                  fontFamily: 'Consolas,monospace', fontWeight: 'bold', fontSize: '1rem',
                  color: 'var(--text-primary)', letterSpacing: '0.05em',
                }}>
                  {formatTime(record.time)}
                </div>

                {/* Top speed */}
                <div style={{ fontFamily: 'Consolas,monospace', fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                  {Math.round(record.topSpeed * 3.6)} km/h
                </div>

                {/* Design score */}
                <div style={{
                  fontFamily: 'Trebuchet MS,sans-serif', fontWeight: 'bold', fontSize: '0.85rem',
                  color: 'var(--klustor-pink)',
                }}>
                  {record.designScore.toFixed(1)}
                </div>
              </motion.div>
            );
          })}
        </div>
      )}
    </motion.div>
  );
}
