import * as fs from 'fs';
import * as path from 'path';

// ============================================================
// leaderboardService.ts — Global Leaderboard (server-authoritative)
// Persistence: JSON file (clean abstraction — swap to Postgres later)
// ============================================================

export interface LeaderboardEntry {
  entryId: string;       // Unique run ID
  playerId: string;      // Socket/driver identifier
  displayName: string;   // Now holds Livery Name
  avatar: string;
  bestTime: number;      // ms
  topSpeed: number;      // m/s (raw physics units)
  designScore: number;
  racesCompleted: number;
  liveryThumb: string;   // small dataUrl thumbnail for livery preview
  lastUpdated: number;   // epoch ms
  rank?: number;         // Computed, not stored
}

// ── Persistence Layer ─────────────────────────────────────────

const DATA_DIR = path.join(__dirname, '../../data');
const DATA_FILE = path.join(DATA_DIR, 'leaderboard.json');

function loadFromDisk(): LeaderboardEntry[] {
  try {
    if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
    if (!fs.existsSync(DATA_FILE)) return [];
    const raw = fs.readFileSync(DATA_FILE, 'utf-8');
    return JSON.parse(raw) as LeaderboardEntry[];
  } catch {
    console.warn('[Leaderboard] Could not load from disk, starting fresh');
    return [];
  }
}

function saveToDisk(entries: LeaderboardEntry[]) {
  try {
    if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
    fs.writeFileSync(DATA_FILE, JSON.stringify(entries, null, 2), 'utf-8');
  } catch (err) {
    console.error('[Leaderboard] Failed to save to disk:', err);
  }
}

// ── In-memory store ───────────────────────────────────────────

let _entries: LeaderboardEntry[] = loadFromDisk();

function sortEntries(entries: LeaderboardEntry[]): LeaderboardEntry[] {
  return [...entries].sort((a, b) => {
    if (a.bestTime !== b.bestTime) return a.bestTime - b.bestTime;
    // Tie-breaker 1: higher top speed wins
    if (b.topSpeed !== a.topSpeed) return b.topSpeed - a.topSpeed;
    // Tie-breaker 2: more recent submission wins
    return a.lastUpdated - b.lastUpdated;
  });
}

// ── Validation ────────────────────────────────────────────────

const MIN_RACE_TIME_MS = 30_000;        // 30 seconds minimum
const MAX_RACE_TIME_MS = 10 * 60_000;   // 10 minutes maximum  
const MAX_TOP_SPEED_MS = 120;            // 432 km/h ceiling (physics engine max ~33 * 1.5 boost = ~50 but allow margin)

export function validateRaceResult(raceTime: number, topSpeed: number): { valid: boolean; reason?: string } {
  if (typeof raceTime !== 'number' || isNaN(raceTime)) return { valid: false, reason: 'Invalid race time type' };
  if (raceTime < MIN_RACE_TIME_MS) return { valid: false, reason: `Race time ${raceTime}ms is impossibly fast (min ${MIN_RACE_TIME_MS}ms)` };
  if (raceTime > MAX_RACE_TIME_MS) return { valid: false, reason: 'Race time exceeds maximum allowed' };
  if (typeof topSpeed !== 'number' || isNaN(topSpeed)) return { valid: false, reason: 'Invalid top speed type' };
  if (topSpeed < 0) return { valid: false, reason: 'Negative top speed' };
  if (topSpeed > MAX_TOP_SPEED_MS) return { valid: false, reason: `Top speed ${topSpeed} m/s exceeds physical ceiling` };
  return { valid: true };
}

// ── Public API ────────────────────────────────────────────────

/**
 * Add a new race entry.
 */
export function addEntry(entry: Omit<LeaderboardEntry, 'rank' | 'entryId'>): { isNewBest: boolean; rank: number } {
  // Check if this specific player has a better time already
  const personalBest = _entries.find(e => e.playerId === entry.playerId)?.bestTime ?? Infinity;
  const isNewBest = entry.bestTime < personalBest;

  const newEntry: LeaderboardEntry = {
    ...entry,
    entryId: `${entry.playerId}-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
  };

  _entries.push(newEntry);
  _entries = sortEntries(_entries);
  saveToDisk(_entries);

  const rank = _entries.findIndex(e => e.entryId === newEntry.entryId) + 1;
  return { isNewBest, rank };
}

/**
 * Get top 20 entries with their ranks assigned.
 */
export function getTop20(): (LeaderboardEntry & { rank: number })[] {
  return _entries.slice(0, 20).map((e, i) => ({ ...e, rank: i + 1 }));
}

/**
 * Get a specific player's BEST entry and rank.
 */
export function getPlayerEntry(playerId: string): { entry: LeaderboardEntry; rank: number } | null {
  // Since we don't deduplicate, we find their highest ranked entry
  const idx = _entries.findIndex(e => e.playerId === playerId);
  if (idx < 0) return null;
  return { entry: { ..._entries[idx], rank: idx + 1 }, rank: idx + 1 };
}

/**
 * Get complete leaderboard response for a player.
 */
export function getLeaderboardResponse(playerId?: string) {
  const top20 = getTop20();
  const playerData = playerId ? getPlayerEntry(playerId) : null;
  
  return {
    top20,
    totalPlayers: _entries.length,
    playerEntry: playerData?.entry ?? null,
    playerRank: playerData?.rank ?? null,
  };
}
