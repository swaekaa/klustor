import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useGameStore } from '../store/gameStore';
import { useMultiplayerStore } from '../store/multiplayerStore';
import { useGlobalLeaderboardStore, type LeaderboardEntry } from '../store/globalLeaderboardStore';

function formatTime(ms: number): string {
  const s = Math.floor(ms / 1000);
  const min = Math.floor(s / 60);
  const sec = s % 60;
  const cs = Math.floor((ms % 1000) / 10);
  return `${String(min).padStart(2,'0')}:${String(sec).padStart(2,'0')}.${String(cs).padStart(2,'0')}`;
}

function formatKmh(ms: number): string {
  return `${Math.round(ms * 3.6)} KM/H`;
}

type Tab = 'global' | 'local';

// ── Entry row ─────────────────────────────────────────────────
function LeaderboardRow({ entry, index, isMe }: { entry: LeaderboardEntry; index: number; isMe: boolean }) {
  const rank = entry.rank ?? index + 1;
  const medals = ['🥇', '🥈', '🥉'];
  const medal = rank <= 3 ? medals[rank - 1] : null;

  return (
    <motion.div
      layout
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: index * 0.03, duration: 0.3 }}
      style={{
        display: 'flex', alignItems: 'center', padding: '1rem 1.5rem',
        background: isMe ? 'var(--klustor-yellow)' : (rank <= 3 ? 'var(--bg-secondary)' : 'var(--bg-primary)'),
        borderRadius: '16px',
        border: isMe ? '2px solid var(--text-primary)' : (rank <= 3 ? '2px solid var(--border-light)' : '1px solid var(--border-light)'),
        boxShadow: isMe ? '4px 4px 0px var(--text-primary)' : (rank <= 3 ? '0 4px 16px rgba(0,0,0,0.06)' : 'none'),
        gap: '1.5rem',
      }}
    >
      {/* Rank */}
      <div className="font-display" style={{ width: '48px', fontSize: rank <= 3 ? '2rem' : '1.5rem', fontWeight: 900, textAlign: 'center', flexShrink: 0 }}>
        {medal || `#${rank}`}
      </div>

      {/* Avatar + name */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flex: 1, minWidth: 0 }}>
        <span style={{ fontSize: '1.5rem' }}>{entry.avatar}</span>
        <div>
          <div className="font-display" style={{ fontSize: '1.1rem', fontWeight: 700, color: isMe ? '#333' : 'var(--text-primary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '160px' }}>
            {entry.displayName} {isMe && <span className="font-mono" style={{ fontSize: '0.7rem', color: '#555' }}>(YOU)</span>}
          </div>
          <div className="font-mono" style={{ fontSize: '0.7rem', color: isMe ? '#555' : 'var(--text-muted)' }}>
            {entry.racesCompleted} RACE{entry.racesCompleted !== 1 ? 'S' : ''}
          </div>
        </div>
      </div>

      {/* Stats */}
      <div style={{ display: 'flex', gap: '2rem', alignItems: 'center', flexShrink: 0 }}>
        <div style={{ textAlign: 'right' }}>
          <div className="font-mono" style={{ fontSize: '0.65rem', color: isMe ? '#555' : 'var(--text-muted)' }}>BEST TIME</div>
          <div className="font-mono" style={{ fontSize: '1.2rem', fontWeight: 'bold', color: isMe ? '#000' : 'var(--text-primary)' }}>
            {formatTime(entry.bestTime)}
          </div>
        </div>
        <div style={{ textAlign: 'right' }}>
          <div className="font-mono" style={{ fontSize: '0.65rem', color: isMe ? '#555' : 'var(--text-muted)' }}>TOP SPEED</div>
          <div className="font-display" style={{ fontSize: '1rem', fontWeight: 'bold', color: isMe ? '#333' : 'var(--klustor-cyan)' }}>
            {formatKmh(entry.topSpeed)}
          </div>
        </div>
        <div style={{ textAlign: 'right' }}>
          <div className="font-mono" style={{ fontSize: '0.65rem', color: isMe ? '#555' : 'var(--text-muted)' }}>DESIGN</div>
          <div className="font-display" style={{ fontSize: '1rem', fontWeight: 'bold', color: isMe ? '#333' : 'var(--text-primary)' }}>
            {(entry.designScore ?? 0).toFixed(1)}
          </div>
        </div>
      </div>
    </motion.div>
  );
}

// ── Personal best card ────────────────────────────────────────
function PersonalBestCard({ entry, rank }: { entry: LeaderboardEntry | null; rank: number | null }) {
  if (!entry) return (
    <div style={{ background: 'var(--bg-secondary)', padding: '2rem', borderRadius: '24px', border: '2px dashed var(--border-light)', textAlign: 'center' }}>
      <div className="font-display" style={{ fontSize: '1.2rem', color: 'var(--text-muted)' }}>NO GLOBAL RACES YET</div>
      <div className="font-mono" style={{ fontSize: '0.9rem', color: 'var(--text-muted)', marginTop: '0.5rem' }}>Complete a multiplayer race to appear on the global leaderboard</div>
    </div>
  );

  return (
    <div style={{
      background: 'linear-gradient(135deg, var(--klustor-yellow) 0%, #FFE57A 100%)',
      padding: '2rem 2.5rem', borderRadius: '24px',
      border: '3px solid var(--text-primary)',
      boxShadow: '6px 6px 0px var(--text-primary)',
      display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '2rem',
    }}>
      <div>
        <div className="font-display" style={{ fontSize: '1rem', color: '#555', letterSpacing: '0.1em', marginBottom: '0.25rem' }}>YOUR GLOBAL RANK</div>
        <div className="font-display" style={{ fontSize: '5rem', fontWeight: 900, color: '#111', lineHeight: 1 }}>#{rank}</div>
        <div className="font-display" style={{ fontSize: '1.2rem', color: '#333', marginTop: '0.25rem' }}>{entry.displayName}</div>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', textAlign: 'right' }}>
        <div>
          <div className="font-mono" style={{ fontSize: '0.7rem', color: '#555' }}>BEST TIME</div>
          <div className="font-mono" style={{ fontSize: '2rem', fontWeight: 'bold', color: '#111' }}>{formatTime(entry.bestTime)}</div>
        </div>
        <div>
          <div className="font-mono" style={{ fontSize: '0.7rem', color: '#555' }}>TOP SPEED</div>
          <div className="font-display" style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#111' }}>{formatKmh(entry.topSpeed)}</div>
        </div>
        <div>
          <div className="font-mono" style={{ fontSize: '0.7rem', color: '#555' }}>RACES COMPLETED</div>
          <div className="font-display" style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#111' }}>{entry.racesCompleted}</div>
        </div>
      </div>
    </div>
  );
}

// ── Local records ─────────────────────────────────────────────
function LocalLeaderboard() {
  const { raceRecords, player } = useGameStore();
  const sorted = [...raceRecords].sort((a, b) => a.time - b.time);

  if (sorted.length === 0) {
    return (
      <div style={{ textAlign: 'center', padding: '4rem', color: 'var(--text-muted)' }}>
        <div className="font-display" style={{ fontSize: '2rem' }}>NO LOCAL RECORDS</div>
        <div className="font-mono" style={{ marginTop: '0.5rem' }}>Race the Vice Coast Circuit to set a time</div>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
      {sorted.map((record, i) => {
        const isMe = record.driverName === player.driverName && !record.isNPC;
        return (
          <motion.div
            key={record.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.04 }}
            style={{
              display: 'flex', alignItems: 'center', padding: '1rem 2rem',
              background: isMe ? 'var(--klustor-yellow)' : 'var(--bg-secondary)',
              borderRadius: '16px', border: '2px solid var(--border-light)',
              boxShadow: i === 0 ? '4px 4px 0px var(--text-primary)' : '0 2px 8px rgba(0,0,0,0.04)',
              gap: '1.5rem',
            }}
          >
            <div className="font-display" style={{ fontSize: '2rem', fontWeight: 900, width: '50px' }}>
              {i === 0 ? '🏆' : i + 1}
            </div>
            <div className="font-mono" style={{ fontSize: '1.8rem', fontWeight: 'bold', width: '180px' }}>
              {formatTime(record.time)}
            </div>
            <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: '1rem' }}>
              {record.liveryTextures?.left && (
                <img src={record.liveryTextures.left} alt="Livery" style={{ width: '80px', height: '40px', objectFit: 'cover', borderRadius: '8px', border: '2px solid var(--text-primary)' }} />
              )}
              <div className="font-display" style={{ fontSize: '1.2rem', fontWeight: 700 }}>
                {record.liveryName || 'MY RIDE'}
              </div>
            </div>
            <div className="font-mono" style={{ fontSize: '1rem', color: 'var(--text-muted)' }}>
              DESIGN {(record.designScore ?? 0).toFixed(1)}
            </div>
          </motion.div>
        );
      })}
      <div style={{ display: 'flex', justifyContent: 'center', marginTop: '1rem' }}>
        <button className="btn" style={{ background: 'transparent', color: '#FF4444', border: '2px solid #FF4444', fontSize: '0.8rem', padding: '0.5rem 1rem' }}
          onClick={() => { if (window.confirm('Clear all local records?')) useGameStore.getState().clearLeaderboard(); }}>
          CLEAR LOCAL RECORDS
        </button>
      </div>
    </div>
  );
}

// ── Main LeaderboardPage ──────────────────────────────────────
export default function LeaderboardPage() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<Tab>('global');
  const { top20, playerEntry, playerRank, totalPlayers, isLoading } = useGlobalLeaderboardStore();
  const { socket, getGlobalLeaderboard, isConnected, connect } = useMultiplayerStore();
  const localPlayerId = socket?.id ?? null;

  // Connect and fetch on mount
  useEffect(() => {
    if (!isConnected) connect();
  }, []);

  useEffect(() => {
    if (isConnected) {
      getGlobalLeaderboard().catch(console.error);
    }
  }, [isConnected, getGlobalLeaderboard]);

  const isPlayerOutsideTop20 = playerRank !== null && playerRank > 20;

  return (
    <div className="page" style={{ padding: '2rem', display: 'flex', flexDirection: 'column', height: '100vh' }}>
      {/* Header + Nav */}
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginBottom: '2.5rem', flexShrink: 0 }}>
        <h1 className="font-display" style={{ fontSize: '2.5rem', letterSpacing: '0.15em', color: 'var(--text-primary)', marginBottom: '1.5rem' }}>
          KLUSTOR
        </h1>
        <div style={{ display: 'flex', gap: '1rem', background: 'var(--bg-secondary)', padding: '0.5rem', borderRadius: '999px', boxShadow: '0 4px 12px rgba(0,0,0,0.05)' }}>
          <button className="btn" onClick={() => navigate('/')} style={{ background: 'transparent', border: 'none', boxShadow: 'none' }}>GARAGE</button>
          <button className="btn" onClick={() => navigate('/leaderboard')} style={{ background: 'var(--klustor-pink)', border: 'none', boxShadow: 'none' }}>LEADERBOARD</button>
          <button className="btn" onClick={() => navigate('/multiplayer')} style={{ background: 'transparent', border: 'none', boxShadow: 'none' }}>MULTIPLAYER</button>
        </div>
      </div>

      {/* Tab switcher */}
      <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '2rem', flexShrink: 0 }}>
        <div style={{ display: 'flex', background: 'var(--bg-secondary)', borderRadius: '999px', padding: '0.4rem', gap: '0.4rem', border: '2px solid var(--border-light)' }}>
          {(['global', 'local'] as Tab[]).map(tab => (
            <button key={tab} onClick={() => setActiveTab(tab)} className="font-display"
              style={{
                padding: '0.6rem 2rem', borderRadius: '999px', border: 'none', cursor: 'pointer',
                fontSize: '1rem', letterSpacing: '0.1em', fontWeight: 700,
                background: activeTab === tab ? 'var(--text-primary)' : 'transparent',
                color: activeTab === tab ? 'var(--bg-primary)' : 'var(--text-muted)',
                transition: 'all 0.2s',
              }}>
              {tab === 'global' ? '🌐 GLOBAL' : '🏠 LOCAL'}
            </button>
          ))}
        </div>
      </div>

      <AnimatePresence mode="wait">
        {activeTab === 'global' && (
          <motion.div key="global" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '2rem', maxWidth: '900px', margin: '0 auto', width: '100%', paddingBottom: '2rem' }}>

            {/* Your rank card */}
            <div>
              <div className="font-display" style={{ fontSize: '1rem', color: 'var(--text-muted)', letterSpacing: '0.15em', marginBottom: '1rem' }}>YOUR BEST</div>
              <PersonalBestCard entry={playerEntry} rank={playerRank} />
            </div>

            {/* Global top 20 */}
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                <div className="font-display" style={{ fontSize: '1rem', color: 'var(--text-muted)', letterSpacing: '0.15em' }}>
                  GLOBAL TOP 20 {totalPlayers > 0 && <span className="font-mono" style={{ fontSize: '0.8rem' }}>({totalPlayers} TOTAL)</span>}
                </div>
                <button className="btn" onClick={() => getGlobalLeaderboard().catch(console.error)}
                  style={{ background: 'transparent', border: '1px solid var(--border-light)', padding: '0.4rem 1rem', fontSize: '0.8rem' }}>
                  ↻ REFRESH
                </button>
              </div>

              {isLoading ? (
                <div style={{ textAlign: 'center', padding: '4rem', color: 'var(--text-muted)' }}>
                  <div className="font-display" style={{ fontSize: '1.5rem' }}>LOADING...</div>
                </div>
              ) : top20.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '4rem', color: 'var(--text-muted)' }}>
                  <div className="font-display" style={{ fontSize: '2rem' }}>NO GLOBAL RECORDS</div>
                  <div className="font-mono" style={{ marginTop: '0.5rem' }}>Be the first to complete a multiplayer race!</div>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
                  {top20.map((entry, i) => (
                    <LeaderboardRow key={entry.playerId} entry={entry} index={i} isMe={entry.playerId === localPlayerId} />
                  ))}

                  {/* Show player entry if outside top 20 */}
                  {isPlayerOutsideTop20 && playerEntry && (
                    <>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', padding: '0.5rem 0' }}>
                        <div style={{ flex: 1, height: '1px', background: 'var(--border-light)' }} />
                        <div className="font-mono" style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>• • •</div>
                        <div style={{ flex: 1, height: '1px', background: 'var(--border-light)' }} />
                      </div>
                      <LeaderboardRow entry={playerEntry} index={playerRank! - 1} isMe={true} />
                    </>
                  )}
                </div>
              )}
            </div>
          </motion.div>
        )}

        {activeTab === 'local' && (
          <motion.div key="local" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            style={{ flex: 1, overflowY: 'auto', maxWidth: '900px', margin: '0 auto', width: '100%', paddingBottom: '2rem' }}>
            <div className="font-display" style={{ fontSize: '1rem', color: 'var(--text-muted)', letterSpacing: '0.15em', marginBottom: '1rem' }}>LOCAL RECORDS — VICE COAST</div>
            <LocalLeaderboard />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
