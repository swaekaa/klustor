// ============================================================
// KLUSTOR // VICE COAST RACING — Core Type Definitions
// ============================================================

// ── Car Performance Stats ───────────────────────────────────
export interface CarStats {
  topSpeed: number;       // 100–140 (km/h scale)
  acceleration: number;  // 1–10
  handling: number;      // 1–10
  designScore: number;   // 0–10
  overallRating: number; // computed weighted average
}

// ── Livery / Design ─────────────────────────────────────────
export type TemplateView = 'left' | 'right' | 'front' | 'rear' | 'top';

export interface LiveryData {
  name: string;
  textures: Partial<Record<TemplateView, string>>; // base64 images per face
  stats: CarStats;
  createdAt: string;      // ISO string
}

// ── Race Records ─────────────────────────────────────────────
export interface RaceRecord {
  id: string;             // uuid-ish, trackId + timestamp
  trackId: string;        // e.g. 'vice-coast'
  time: number;           // lap time in ms
  topSpeed: number;       // km/h achieved during race
  designScore: number;
  liveryTextures: Partial<Record<TemplateView, string>>;
  liveryName: string;
  driverName: string;     // player name or NPC name
  isNPC: boolean;
  createdAt: string;
}

// ── Player ───────────────────────────────────────────────────
export interface PlayerState {
  cash: number;
  rep: number;
  racesWon: number;
  bestTime: number | null;  // ms
  bestSplits?: number[];    // ms elapsed at each checkpoint during the best lap
  driverName: string;
}

// ── Game State ───────────────────────────────────────────────
export interface GameState {
  player: PlayerState;
  currentLivery: LiveryData | null;
  bestLivery: LiveryData | null;    // livery that set the best time
  raceRecords: RaceRecord[];        // all race records (player + NPCs)

  // Actions
  saveLiveryFace: (dataUrl: string, view: TemplateView, newStats: CarStats, liveryName?: string) => void;
  recordRaceResult: (time: number, topSpeed: number, splits: number[]) => void;
  resetGame: () => void;
}
