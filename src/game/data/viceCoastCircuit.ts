// ============================================================
// VICE COAST CIRCUIT — Track Data
// 1 unit ≈ 1 meter. Car forward direction = local +Z.
// 10 meaningful turns: palm straight, city hairpin, harbor bend,
// ocean sweep, chicane, boulevard, etc.
// ============================================================

export interface TrackPoint {
  x: number;
  z: number;
  name?: string; // section label for minimap
}

export interface CheckpointData {
  id: string;
  label: string;
  position: [number, number, number]; // x, y, z world-space
  radius: number;
  index: number;
}

// ── Waypoints (closed loop, XZ plane) ────────────────────────
// Designed for ~10 turns: straights, hairpin, chicane, sweeps
export const TRACK_WAYPOINTS: TrackPoint[] = [
  { x: 0,    z: 0,    name: 'START / FINISH' },   // 0
  { x: 30,   z: -2,   name: 'PALM STRAIGHT' },     // 1
  { x: 70,   z: -5 },                               // 2
  { x: 110,  z: -2,   name: 'CITY ENTRY' },         // 3
  { x: 130,  z: 20,   name: '90° CITY TURN' },      // 4  turn 1
  { x: 135,  z: 55,   name: 'HARBOR STRAIGHT' },    // 5
  { x: 130,  z: 90,   name: 'HARBOR BEND' },        // 6  turn 2
  { x: 110,  z: 110,  name: 'HARBOR APEX' },        // 7  turn 3
  { x: 70,   z: 120,  name: 'LONG BACK STRAIGHT'},  // 8
  { x: 30,   z: 122 },                              // 9
  { x: 0,    z: 130,  name: 'OCEAN END' },           // 10
  { x: -30,  z: 130 },                              // 11
  { x: -60,  z: 125,  name: 'HAIRPIN ENTRY' },      // 12
  { x: -80,  z: 110,  name: 'HAIRPIN' },            // 13  turn 4–5 (tight)
  { x: -75,  z: 90,   name: 'HAIRPIN EXIT' },       // 14  turn 5
  { x: -60,  z: 80,   name: 'OCEAN DRIVE' },        // 15
  { x: -50,  z: 60 },                               // 16
  { x: -60,  z: 40,   name: 'CHICANE L' },          // 17  turn 6
  { x: -50,  z: 25,   name: 'CHICANE R' },          // 18  turn 7
  { x: -60,  z: 10,   name: 'BOULEVARD TURN' },     // 19  turn 8
  { x: -100, z: 2 },                                // 20
  { x: -120, z: -5,   name: 'LONG LEFT' },          // 21  turn 9
  { x: -110, z: -15,  name: 'FINAL CORNER' },       // 22  turn 10
  { x: -70,  z: -10,  name: 'FINAL STRAIGHT' },     // 23
  { x: -35,  z: -5 },                               // 24
];

export const TRACK_WIDTH = 14; // meters

// ── Start / Finish ────────────────────────────────────────────
export const START_POSITION: [number, number, number] = [0, 0, 8];
export const START_ROTATION_Y = 0; // facing +Z initially

// ── Ordered Checkpoints ───────────────────────────────────────
// Players must pass all 6 before the finish counts.
export const CHECKPOINTS: CheckpointData[] = [
  {
    id: 'cp-0-start',
    label: 'START',
    position: [0, 1, 5],
    radius: 18,
    index: 0,
  },
  {
    id: 'cp-1-city',
    label: 'CITY TURN',
    position: [130, 1, 35],
    radius: 16,
    index: 1,
  },
  {
    id: 'cp-2-harbor',
    label: 'HARBOR BEND',
    position: [115, 1, 110],
    radius: 16,
    index: 2,
  },
  {
    id: 'cp-3-hairpin',
    label: 'HAIRPIN',
    position: [-78, 1, 100],
    radius: 18,
    index: 3,
  },
  {
    id: 'cp-4-chicane',
    label: 'CHICANE',
    position: [-55, 1, 32],
    radius: 16,
    index: 4,
  },
  {
    id: 'cp-5-final',
    label: 'FINAL CORNER',
    position: [-112, 1, -12],
    radius: 16,
    index: 5,
  },
  {
    id: 'cp-finish',
    label: 'FINISH',
    position: [0, 1, -2],
    radius: 20,
    index: 6, // finish — only counts after all 6 CPs
  },
];

// How many non-finish checkpoints must be passed before finish counts
export const REQUIRED_CHECKPOINTS = 6;

// ── World bounds (simple box, for respawn check) ──────────────
export const WORLD_BOUNDS = {
  minX: -160,
  maxX: 170,
  minZ: -40,
  maxZ: 165,
};

// ── Track metadata ────────────────────────────────────────────
export const CIRCUIT_INFO = {
  name: 'VICE COAST CIRCUIT',
  lapLength: '3.2 KM',
  turns: 10,
  location: 'MIAMI COAST, KLUSTOR CITY',
};

// ── Race Rewards ──────────────────────────────────────────────
export const RACE_REWARDS = {
  baseCash: 500,
  personalBestBonus: 250,
  baseRep: 10,
  personalBestRep: 5,
};
