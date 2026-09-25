// ============================================================
// raceLeaderService.ts — Tracks live race progress per room
// Determines current first-place player server-authoritatively
// ============================================================

export interface RaceProgressSnapshot {
  playerId: string;
  displayName: string;
  checkpointIndex: number;   // 0-based, how many checkpoints cleared
  progress: number;          // 0.0-1.0, interpolated position along track
  position: { x: number; y: number; z: number };
  rotation: { x: number; y: number; z: number };
  speed: number;             // m/s
  finishTimeMs: number | null; // null while still racing
  isFinished: boolean;
  lastUpdate: number;        // epoch ms
}

export interface RoomRaceState {
  roomId: string;
  leaderId: string | null;
  players: Map<string, RaceProgressSnapshot>;
  leaderLivery: Record<string, string> | null; // dataUrl per view
  raceStartedAt: number;
}

// ── In-memory store per room ──────────────────────────────────

const _rooms = new Map<string, RoomRaceState>();

const STALE_THRESHOLD_MS = 5_000; // mark disconnected if no update for 5s

// ── Validation ────────────────────────────────────────────────

const MAX_SPEED_MS = 80; // Physics engine ceiling with boost ~50 m/s, allow generous margin
const TOTAL_CHECKPOINTS = 10;

export function validateProgressUpdate(
  update: Partial<RaceProgressSnapshot>
): { valid: boolean; reason?: string } {
  if (update.checkpointIndex !== undefined) {
    if (update.checkpointIndex < 0 || update.checkpointIndex > TOTAL_CHECKPOINTS) {
      return { valid: false, reason: 'Invalid checkpoint index' };
    }
  }
  if (update.progress !== undefined) {
    if (update.progress < 0 || update.progress > 1.001) {
      return { valid: false, reason: 'Invalid progress value' };
    }
  }
  if (update.speed !== undefined) {
    if (Math.abs(update.speed) > MAX_SPEED_MS) {
      return { valid: false, reason: 'Impossible speed detected' };
    }
  }
  return { valid: true };
}

// ── Room management ───────────────────────────────────────────

export function initRoom(roomId: string) {
  _rooms.set(roomId, {
    roomId,
    leaderId: null,
    players: new Map(),
    leaderLivery: null,
    raceStartedAt: Date.now(),
  });
}

export function removeRoom(roomId: string) {
  _rooms.delete(roomId);
}

export function getRoom(roomId: string): RoomRaceState | undefined {
  return _rooms.get(roomId);
}

// ── Progress update ───────────────────────────────────────────

export function updatePlayerProgress(
  roomId: string,
  playerId: string,
  displayName: string,
  update: Pick<RaceProgressSnapshot, 'checkpointIndex' | 'progress' | 'position' | 'rotation' | 'speed' | 'finishTimeMs'>
): { leaderChanged: boolean; newLeaderId: string | null; previousLeaderId: string | null } {
  let room = _rooms.get(roomId);
  if (!room) {
    // Auto-init room on first update
    initRoom(roomId);
    room = _rooms.get(roomId)!;
  }

  const existing = room.players.get(playerId);
  
  // Prevent checkpoint regression (anti-cheat)
  const safeCheckpoint = existing 
    ? Math.max(existing.checkpointIndex, update.checkpointIndex)
    : update.checkpointIndex;

  room.players.set(playerId, {
    playerId,
    displayName,
    checkpointIndex: safeCheckpoint,
    progress: update.progress,
    position: update.position,
    rotation: update.rotation,
    speed: update.speed,
    finishTimeMs: update.finishTimeMs,
    isFinished: update.finishTimeMs !== null,
    lastUpdate: Date.now(),
  });

  return recalculateLeader(room);
}

export function markPlayerFinished(
  roomId: string,
  playerId: string,
  finishTimeMs: number
): { leaderChanged: boolean; newLeaderId: string | null; previousLeaderId: string | null } {
  const room = _rooms.get(roomId);
  if (!room) return { leaderChanged: false, newLeaderId: null, previousLeaderId: null };
  
  const player = room.players.get(playerId);
  if (player) {
    player.isFinished = true;
    player.finishTimeMs = finishTimeMs;
    player.checkpointIndex = TOTAL_CHECKPOINTS;
    player.progress = 1.0;
  }
  
  return recalculateLeader(room);
}

export function removePlayer(
  roomId: string,
  playerId: string
): { leaderChanged: boolean; newLeaderId: string | null; previousLeaderId: string | null } {
  const room = _rooms.get(roomId);
  if (!room) return { leaderChanged: false, newLeaderId: null, previousLeaderId: null };
  
  room.players.delete(playerId);
  
  if (room.players.size === 0) {
    removeRoom(roomId);
    return { leaderChanged: true, newLeaderId: null, previousLeaderId: playerId };
  }
  
  return recalculateLeader(room);
}

export function setLeaderLivery(roomId: string, livery: Record<string, string> | null) {
  const room = _rooms.get(roomId);
  if (room) room.leaderLivery = livery;
}

// ── Leader determination ──────────────────────────────────────

function getPlayerScore(p: RaceProgressSnapshot): number {
  // Finished players rank by finish time (lower = better)
  if (p.isFinished && p.finishTimeMs !== null) {
    // Score finished players at 2.0 + (negated finish time normalized)
    // This guarantees any finisher beats any non-finisher
    return 2.0 - (p.finishTimeMs / (10 * 60_000)); // 10min is max
  }
  // Not finished: score by checkpoint + fractional progress [0, 1)
  return (p.checkpointIndex / TOTAL_CHECKPOINTS) + (p.progress / (TOTAL_CHECKPOINTS + 1));
}

function recalculateLeader(room: RoomRaceState): {
  leaderChanged: boolean;
  newLeaderId: string | null;
  previousLeaderId: string | null;
} {
  const previousLeaderId = room.leaderId;
  const now = Date.now();
  
  // Only consider active (non-stale) players
  const active = Array.from(room.players.values()).filter(
    p => now - p.lastUpdate < STALE_THRESHOLD_MS || p.isFinished
  );
  
  if (active.length === 0) {
    room.leaderId = null;
    return { leaderChanged: previousLeaderId !== null, newLeaderId: null, previousLeaderId };
  }

  // Sort: higher score = further ahead
  active.sort((a, b) => getPlayerScore(b) - getPlayerScore(a));
  const newLeaderId = active[0].playerId;
  
  room.leaderId = newLeaderId;
  const leaderChanged = newLeaderId !== previousLeaderId;
  
  return { leaderChanged, newLeaderId, previousLeaderId };
}

// ── Snapshot for broadcasting ─────────────────────────────────

export function getLeaderSnapshot(roomId: string): (RaceProgressSnapshot & { livery: Record<string, string> | null }) | null {
  const room = _rooms.get(roomId);
  if (!room || !room.leaderId) return null;
  
  const leader = room.players.get(room.leaderId);
  if (!leader) return null;
  
  return { ...leader, livery: room.leaderLivery };
}

export function getAllPlayerProgress(roomId: string): (RaceProgressSnapshot & { rank: number })[] {
  const room = _rooms.get(roomId);
  if (!room) return [];
  
  const players = Array.from(room.players.values());
  players.sort((a, b) => getPlayerScore(b) - getPlayerScore(a));
  return players.map((p, i) => ({ ...p, rank: i + 1 }));
}
