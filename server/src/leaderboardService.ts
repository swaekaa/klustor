import { Pool } from 'pg';
import * as fs from 'fs';
import * as path from 'path';

// ============================================================
// leaderboardService.ts — Global Leaderboard (server-authoritative)
// Persistence: PostgreSQL (Neon) with fallback to Memory/Disk
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

// ── Database Setup ───────────────────────────────────────────

const hasDb = !!process.env.DATABASE_URL;
let pool: Pool | null = null;

if (hasDb) {
  pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
  });
  console.log('[Leaderboard] Connected to PostgreSQL (Neon)');
} else {
  console.log('[Leaderboard] No DATABASE_URL found. Falling back to local disk storage.');
}

// ── Fallback Disk Storage ─────────────────────────────────────

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

let _entries: LeaderboardEntry[] = hasDb ? [] : loadFromDisk();

function sortEntries(entries: LeaderboardEntry[]): LeaderboardEntry[] {
  return [...entries].sort((a, b) => {
    if (a.bestTime !== b.bestTime) return a.bestTime - b.bestTime;
    if (b.topSpeed !== a.topSpeed) return b.topSpeed - a.topSpeed;
    return a.lastUpdated - b.lastUpdated;
  });
}

// ── Validation ────────────────────────────────────────────────

const MIN_RACE_TIME_MS = 30_000;
const MAX_RACE_TIME_MS = 10 * 60_000;  
const MAX_TOP_SPEED_MS = 120;

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

export async function addEntry(entry: Omit<LeaderboardEntry, 'rank' | 'entryId'>): Promise<{ isNewBest: boolean; rank: number }> {
  const newEntryId = `${entry.playerId}-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
  
  if (pool) {
    // 1. Check if it's a new personal best
    const pbResult = await pool.query('SELECT best_time FROM leaderboard_entries WHERE player_id = $1 ORDER BY best_time ASC LIMIT 1', [entry.playerId]);
    const personalBest = pbResult.rows.length > 0 ? pbResult.rows[0].best_time : Infinity;
    const isNewBest = entry.bestTime < personalBest;

    // 2. Insert into Postgres
    await pool.query(
      `INSERT INTO leaderboard_entries 
      (entry_id, player_id, display_name, avatar, best_time, top_speed, design_score, races_completed, livery_thumb, last_updated)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)`,
      [newEntryId, entry.playerId, entry.displayName, entry.avatar, entry.bestTime, entry.topSpeed, entry.designScore, 1, entry.liveryThumb, entry.lastUpdated]
    );

    // 3. Calculate rank
    const rankResult = await pool.query(
      `SELECT COUNT(*) + 1 AS rank FROM leaderboard_entries 
       WHERE best_time < $1 OR (best_time = $1 AND top_speed > $2) OR (best_time = $1 AND top_speed = $2 AND last_updated < $3)`,
      [entry.bestTime, entry.topSpeed, entry.lastUpdated]
    );
    const rank = parseInt(rankResult.rows[0].rank);
    return { isNewBest, rank };
  } else {
    // Fallback logic
    const personalBest = _entries.find(e => e.playerId === entry.playerId)?.bestTime ?? Infinity;
    const isNewBest = entry.bestTime < personalBest;

    const newEntry: LeaderboardEntry = {
      ...entry,
      entryId: newEntryId,
    };

    _entries.push(newEntry);
    _entries = sortEntries(_entries);
    saveToDisk(_entries);

    const rank = _entries.findIndex(e => e.entryId === newEntry.entryId) + 1;
    return { isNewBest, rank };
  }
}

export async function getLeaderboardResponse(playerId?: string) {
  if (pool) {
    // 1. Get Top 20
    const top20Result = await pool.query(
      `SELECT * FROM leaderboard_entries 
       ORDER BY best_time ASC, top_speed DESC, last_updated ASC 
       LIMIT 20`
    );
    const top20 = top20Result.rows.map((r: any, i: number) => ({
      entryId: r.entry_id,
      playerId: r.player_id,
      displayName: r.display_name,
      avatar: r.avatar,
      bestTime: r.best_time,
      topSpeed: r.top_speed,
      designScore: r.design_score,
      racesCompleted: r.races_completed,
      liveryThumb: r.livery_thumb,
      lastUpdated: Number(r.last_updated),
      rank: i + 1
    }));

    // 2. Get total players
    const countResult = await pool.query('SELECT COUNT(*) FROM leaderboard_entries');
    const totalPlayers = parseInt(countResult.rows[0].count);

    // 3. Get specific player
    let playerEntry = null;
    let playerRank = null;
    
    if (playerId) {
      const pResult = await pool.query(
        `SELECT * FROM leaderboard_entries 
         WHERE player_id = $1 
         ORDER BY best_time ASC, top_speed DESC 
         LIMIT 1`,
        [playerId]
      );
      if (pResult.rows.length > 0) {
        const r = pResult.rows[0];
        
        // Calculate exact rank for this player
        const rkResult = await pool.query(
          `SELECT COUNT(*) + 1 AS rank FROM leaderboard_entries 
           WHERE best_time < $1 OR (best_time = $1 AND top_speed > $2) OR (best_time = $1 AND top_speed = $2 AND last_updated < $3)`,
          [r.best_time, r.top_speed, r.last_updated]
        );
        playerRank = parseInt(rkResult.rows[0].rank);
        
        playerEntry = {
          entryId: r.entry_id,
          playerId: r.player_id,
          displayName: r.display_name,
          avatar: r.avatar,
          bestTime: r.best_time,
          topSpeed: r.top_speed,
          designScore: r.design_score,
          racesCompleted: r.races_completed,
          liveryThumb: r.livery_thumb,
          lastUpdated: Number(r.last_updated),
          rank: playerRank
        };
      }
    }

    return { top20, totalPlayers, playerEntry, playerRank };
  } else {
    // Fallback logic
    const top20 = _entries.slice(0, 20).map((e, i) => ({ ...e, rank: i + 1 }));
    let playerData = null;
    if (playerId) {
      const idx = _entries.findIndex(e => e.playerId === playerId);
      if (idx >= 0) playerData = { entry: { ..._entries[idx], rank: idx + 1 }, rank: idx + 1 };
    }
    return {
      top20,
      totalPlayers: _entries.length,
      playerEntry: playerData?.entry ?? null,
      playerRank: playerData?.rank ?? null,
    };
  }
}
