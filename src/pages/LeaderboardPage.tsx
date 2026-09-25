import { useEffect, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useGameStore } from '../store/gameStore';

// ── Helpers ───────────────────────────────────────────────────
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

const SERVER_URL = import.meta.env.VITE_SERVER_URL || `${window.location.protocol}//${window.location.hostname}:4000`;

async function fetchGlobalLeaderboard(playerId?: string) {
  const url = playerId
    ? `${SERVER_URL}/leaderboard?playerId=${encodeURIComponent(playerId)}`
    : `${SERVER_URL}/leaderboard`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Server returned ${res.status}`);
  return res.json();
}

// ── Types ─────────────────────────────────────────────────────
interface LeaderboardEntry {
  playerId: string;
  displayName: string;
  avatar: string;
  bestTime: number;
  topSpeed: number;
  designScore: number;
  rank: number;
  liveryThumb?: string;
}

type Tab = 'global' | 'local';

// ── Entry Row ─────────────────────────────────────────────────
function LeaderboardRow({ entry, index, isMe }: { entry: LeaderboardEntry; index: number; isMe: boolean }) {
  const rank = entry.rank ?? index + 1;
  const medals = ['🥇', '🥈', '🥉'];
  const medal = rank <= 3 ? medals[rank - 1] : null;

  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: index * 0.03 }}
      style={{
        display: 'flex', alignItems: 'center', padding: '1rem 1.5rem',
        background: isMe ? 'var(--klustor-yellow)' : rank <= 3 ? 'var(--bg-secondary)' : 'var(--bg-primary)',
        borderRadius: '16px',
        border: '2px solid var(--text-primary)',
        boxShadow: '4px 4px 0px var(--text-primary)',
        gap: '1.5rem',
      }}
    >
      <div className="font-display" style={{ width: '48px', fontSize: rank <= 3 ? '2rem' : '1.5rem', fontWeight: 900, textAlign: 'center', flexShrink: 0 }}>
        {medal || `#${rank}`}
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', flex: 1, minWidth: 0 }}>
        {entry.liveryThumb ? (
          <img src={entry.liveryThumb} alt="Livery" style={{ width: '80px', height: '40px', objectFit: 'cover', borderRadius: '8px', border: '2px solid var(--text-primary)' }} />
        ) : (
          <span style={{ fontSize: '1.5rem', width: '80px', textAlign: 'center' }}>{entry.avatar}</span>
        )}
        <div>
          <div className="font-display" style={{ fontSize: '1.1rem', fontWeight: 700, color: isMe ? '#333' : 'var(--text-primary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '160px' }}>
            {entry.displayName} {isMe && <span className="font-mono" style={{ fontSize: '0.7rem', color: '#555' }}>(YOU)</span>}
          </div>
        </div>
      </div>
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
          <div className="font-display" style={{ fontSize: '1rem', fontWeight: 'bold' }}>{(entry.designScore ?? 0).toFixed(1)}</div>
        </div>
      </div>
    </motion.div>
  );
}

// ── Global Leaderboard Tab ────────────────────────────────────
function GlobalLeaderboard({ playerId }: { playerId: string }) {
  const [top20, setTop20] = useState<LeaderboardEntry[]>([]);
  const [playerEntry, setPlayerEntry] = useState<LeaderboardEntry | null>(null);
  const [playerRank, setPlayerRank] = useState<number | null>(null);
  const [totalPlayers, setTotalPlayers] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await fetchGlobalLeaderboard(playerId);
      setTop20(data.top20 ?? []);
      setPlayerEntry(data.playerEntry ?? null);
      setPlayerRank(data.playerRank ?? null);
      setTotalPlayers(data.totalPlayers ?? 0);
    } catch {
      setError('Could not reach server. Make sure the KLUSTOR server is running on port 4000.');
    } finally {
      setIsLoading(false);
    }
  }, [playerId]);

  useEffect(() => { load(); }, [load]);

  const isPlayerOutsideTop20 = playerRank !== null && playerRank > 20;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>

      {/* Personal best card */}
      <div>
        <div className="font-display" style={{ fontSize: '1rem', color: 'var(--text-muted)', letterSpacing: '0.15em', marginBottom: '1rem' }}>YOUR BEST</div>
        {!playerEntry ? (
          <div style={{ background: 'var(--bg-secondary)', padding: '2rem', borderRadius: '24px', border: '2px dashed var(--border-light)', textAlign: 'center' }}>
            <div className="font-display" style={{ fontSize: '1.2rem', color: 'var(--text-muted)' }}>NO GLOBAL RACES YET</div>
            <div className="font-mono" style={{ fontSize: '0.9rem', color: 'var(--text-muted)', marginTop: '0.5rem' }}>Complete a race to appear on the global leaderboard</div>
          </div>
        ) : (
          <div style={{
            background: 'linear-gradient(135deg, var(--klustor-yellow) 0%, #FFE57A 100%)',
            padding: '2rem 2.5rem', borderRadius: '24px',
            border: '3px solid var(--text-primary)', boxShadow: '6px 6px 0px var(--text-primary)',
            display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '2rem',
          }}>
            <div>
              <div className="font-display" style={{ fontSize: '1rem', color: '#555', letterSpacing: '0.1em', marginBottom: '0.25rem' }}>YOUR GLOBAL RANK</div>
              <div className="font-display" style={{ fontSize: '5rem', fontWeight: 900, color: '#111', lineHeight: 1 }}>#{playerRank}</div>
              <div className="font-display" style={{ fontSize: '1.2rem', color: '#333', marginTop: '0.25rem' }}>{playerEntry.displayName}</div>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', textAlign: 'right' }}>
              <div>
                <div className="font-mono" style={{ fontSize: '0.7rem', color: '#555' }}>BEST TIME</div>
                <div className="font-mono" style={{ fontSize: '2rem', fontWeight: 'bold', color: '#111' }}>{formatTime(playerEntry.bestTime)}</div>
              </div>
              <div>
                <div className="font-mono" style={{ fontSize: '0.7rem', color: '#555' }}>TOP SPEED</div>
                <div className="font-display" style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#111' }}>{formatKmh(playerEntry.topSpeed)}</div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Top 20 */}
      <div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
          <div className="font-display" style={{ fontSize: '1rem', color: 'var(--text-muted)', letterSpacing: '0.15em' }}>
            GLOBAL TOP 20 {totalPlayers > 0 && <span className="font-mono" style={{ fontSize: '0.8rem' }}>({totalPlayers} total)</span>}
          </div>
          <button className="btn" onClick={load} style={{ background: 'transparent', border: '1px solid var(--border-light)', padding: '0.4rem 1rem', fontSize: '0.8rem' }}>
            ↻ REFRESH
          </button>
        </div>

        {isLoading ? (
          <div style={{ textAlign: 'center', padding: '4rem', color: 'var(--text-muted)' }}>
            <div className="font-display" style={{ fontSize: '1.5rem' }}>LOADING...</div>
          </div>
        ) : error ? (
          <div style={{ textAlign: 'center', padding: '4rem', background: 'var(--bg-secondary)', borderRadius: '24px', border: '1px solid var(--border-light)' }}>
            <div className="font-display" style={{ fontSize: '1.5rem', color: 'var(--klustor-pink)', marginBottom: '1rem' }}>⚠ SERVER OFFLINE</div>
            <div className="font-mono" style={{ fontSize: '0.85rem', color: 'var(--text-muted)', maxWidth: '400px', margin: '0 auto' }}>{error}</div>
            <button className="btn" onClick={load} style={{ marginTop: '1.5rem', background: 'var(--klustor-pink)', border: 'none', color: '#fff' }}>TRY AGAIN</button>
          </div>
        ) : top20.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '4rem', color: 'var(--text-muted)' }}>
            <div className="font-display" style={{ fontSize: '2rem' }}>NO GLOBAL RECORDS YET</div>
            <div className="font-mono" style={{ marginTop: '0.5rem' }}>Be the first to complete a race!</div>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
            {top20.map((entry, i) => (
              <LeaderboardRow key={entry.playerId} entry={entry} index={i} isMe={entry.playerId === playerId} />
            ))}
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
    </div>
  );
}

// ── Local Records Tab ─────────────────────────────────────────
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
              borderRadius: '16px', border: '2px solid var(--text-primary)',
              boxShadow: '4px 4px 0px var(--text-primary)',
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
  const { player } = useGameStore();

  // Use a stable playerId from the player's stored name (single-player identity)
  const playerId = player.driverName || 'anonymous';

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
            style={{ flex: 1, overflowY: 'auto', maxWidth: '900px', margin: '0 auto', width: '100%', paddingBottom: '2rem' }}>
            <GlobalLeaderboard playerId={playerId} />
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
