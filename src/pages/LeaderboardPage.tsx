import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useGameStore } from '../store/gameStore';

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

  const sorted = [...raceRecords].sort((a, b) => a.time - b.time);
  const bestTime = player.bestTime;

  return (
    <div className="page" style={{ padding: '2rem', display: 'flex', flexDirection: 'column', height: '100vh' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '2rem', flexShrink: 0 }}>
        <div>
          <div className="font-display" style={{ fontSize: '1.2rem', letterSpacing: '0.1em' }}>VICE COAST CIRCUIT</div>
          <h1 style={{ fontSize: '3rem', lineHeight: 1 }}>LEADERBOARD</h1>
        </div>
        <div style={{ display: 'flex', gap: '1rem' }}>
          <button className="btn-retro" onClick={() => navigate('/design')}>
            DESIGN CAR
          </button>
          <button className="btn-retro btn-retro-primary" onClick={() => navigate('/race')}>
            RACE NOW →
          </button>
        </div>
      </div>

      {sorted.length === 0 ? (
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
          <h2 className="font-display" style={{ fontSize: '2rem', color: 'var(--text-muted)' }}>NO RECORDS YET</h2>
        </div>
      ) : (
        <div style={{ flex: 1, overflowY: 'auto' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', maxWidth: '900px', margin: '0 auto', paddingBottom: '2rem' }}>
            {sorted.map((record, i) => {
              const isMe = record.driverName === player.driverName && !record.isNPC;
              const isBest = record.time === bestTime && isMe;

              return (
                <motion.div
                  key={record.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.05 }}
                  style={{
                    display: 'flex', alignItems: 'center', padding: '1rem 2rem',
                    background: isMe ? 'var(--klustor-yellow)' : 'var(--bg-secondary)',
                    borderRadius: '16px', border: '3px solid var(--text-primary)',
                    boxShadow: isBest ? '6px 6px 0px var(--text-primary)' : '4px 4px 0px rgba(0,0,0,0.05)',
                  }}
                >
                  <div className="font-display" style={{ fontSize: '2rem', fontWeight: 900, width: '60px' }}>
                    {i === 0 ? '🏆' : i + 1}
                  </div>

                  <div className="font-mono" style={{ fontSize: '2rem', fontWeight: 'bold', width: '200px' }}>
                    {formatTime(record.time)}
                  </div>

                  <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: '1rem' }}>
                    {record.liveryTextures?.left ? (
                      <img
                        src={record.liveryTextures.left}
                        alt="Livery"
                        style={{ width: '80px', height: '40px', objectFit: 'cover', borderRadius: '8px', border: '2px solid var(--text-primary)' }}
                      />
                    ) : (
                      <div style={{ width: '80px', height: '40px', background: 'white', borderRadius: '8px', border: '2px solid var(--text-primary)' }} />
                    )}
                    <div className="font-display" style={{ fontSize: '1.25rem', fontWeight: 700 }}>
                      {record.driverName}
                    </div>
                  </div>

                  <div className="font-mono" style={{ fontSize: '1rem', color: 'var(--text-muted)', textAlign: 'right' }}>
                    DESIGN {record.designScore.toFixed(1)}
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
