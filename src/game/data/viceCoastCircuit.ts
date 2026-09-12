import * as THREE from 'three';

// ============================================================
// VICE COAST CIRCUIT — Authoritative Track Data (v2)
// ONE SOURCE OF TRUTH for the entire circuit.
// Every road, curb, barrier, checkpoint, spawn, and minimap
// element derives from the centerline curve generated here.
//
// Scale: 1 unit ≈ 1 meter. Car forward = local +Z.
// ============================================================

export const ROAD_WIDTH     = 12;    // Consistent width, full circuit
export const TRACK_SAMPLES  = 500;   // Dense sampling for smooth geometry

// ── Interfaces ───────────────────────────────────────────────

export interface TrackPointData {
  position:  THREE.Vector3;
  tangent:   THREE.Vector3;
  normal:    THREE.Vector3;    // Right-pointing normal on XZ plane
  leftEdge:  THREE.Vector3;   // Left boundary (negative normal direction)
  rightEdge: THREE.Vector3;   // Right boundary (positive normal direction)
}

export interface CheckpointData {
  id:        string;
  index:     number;           // 1-based; index === totalCheckpoints means FINISH
  position:  THREE.Vector3;
  tangent:   THREE.Vector3;
  normal:    THREE.Vector3;
  leftEdge:  THREE.Vector3;
  rightEdge: THREE.Vector3;
}

export interface TrackData {
  curve:             THREE.CatmullRomCurve3;
  samples:           TrackPointData[];
  checkpoints:       CheckpointData[];
  startTransform:    { position: THREE.Vector3; rotation: number; tangent: THREE.Vector3 };
  totalCheckpoints:  number;
}

// ── Deliberate Circuit Waypoints ─────────────────────────────
//
// Layout (approximate):
//   START/FINISH STRAIGHT  →  90° RIGHT (Turn 1)
//   SHORT STRAIGHT         →  SWEEPING LEFT (Turn 2)
//   HARBOR STRAIGHT        →  HARBOR HAIRPIN (Turns 3-4)
//   ACCELERATION EXIT      →  LEFT-RIGHT CHICANE (Turns 5-6)
//   OCEAN SWEEP (Turn 7)   →  90° RIGHT (Turn 8)
//   FINAL STRAIGHT         →  START/FINISH
//
// The track has rhythm, variety, and consistent width.
// It does NOT self-intersect.

const WAYPOINTS: THREE.Vector3[] = [
  // START / FINISH STRAIGHT
  new THREE.Vector3(  0,  0,   0),   // P0  — Start/Finish line
  new THREE.Vector3( 30,  0,   0),   // P1  — Palm Straight
  new THREE.Vector3( 65,  0,   0),   // P2
  new THREE.Vector3(100,  0,   0),   // P3

  // TURN 1 — 90° Right (City Entry)
  new THREE.Vector3(120,  0,   8),   // P4  — Apex of Turn 1
  new THREE.Vector3(128,  0,  30),   // P5  — Exit of Turn 1

  // SHORT STRAIGHT + SWEEPING LEFT (Turn 2 — Harbor Bend)
  new THREE.Vector3(125,  0,  60),   // P6
  new THREE.Vector3(118,  0,  88),   // P7  — Sweeping apex

  // HARBOR STRAIGHT
  new THREE.Vector3(105,  0, 112),   // P8
  new THREE.Vector3( 80,  0, 125),   // P9

  // HARBOR HAIRPIN ENTRY (Turn 3)
  new THREE.Vector3( 45,  0, 132),   // P10

  // OCEAN DRIVE HAIRPIN — tightest point (Turns 4)
  new THREE.Vector3(  5,  0, 140),   // P11
  new THREE.Vector3(-30,  0, 138),   // P12 — Hairpin apex
  new THREE.Vector3(-55,  0, 125),   // P13 — Hairpin exit

  // ACCELERATION SECTION
  new THREE.Vector3(-68,  0, 100),   // P14
  new THREE.Vector3(-72,  0,  75),   // P15

  // LEFT-RIGHT CHICANE (Turns 5-6)
  new THREE.Vector3(-65,  0,  55),   // P16 — Chicane LEFT
  new THREE.Vector3(-52,  0,  42),   // P17 — Chicane apex
  new THREE.Vector3(-65,  0,  28),   // P18 — Chicane RIGHT
  new THREE.Vector3(-72,  0,  15),   // P19

  // OCEAN SWEEP (Turn 7 — long sweeper)
  new THREE.Vector3(-85,  0,   5),   // P20
  new THREE.Vector3(-90,  0,  -8),   // P21 — Turn 8 entry

  // FINAL CORNER — 90° Right (Turn 8)
  new THREE.Vector3(-80,  0, -20),   // P22 — Final apex
  new THREE.Vector3(-55,  0, -22),   // P23 — Final exit

  // FINAL STRAIGHT back to Start
  new THREE.Vector3(-30,  0, -18),   // P24
  new THREE.Vector3(-10,  0,  -8),   // P25 — final kink
];

// ── Lazy singleton ────────────────────────────────────────────
let _instance: TrackData | null = null;

export function getTrackData(): TrackData {
  if (_instance) return _instance;

  // 1. Build the authoritative closed curve
  const curve = new THREE.CatmullRomCurve3(WAYPOINTS, true, 'catmullrom', 0.5);

  // 2. Sample densely; drop duplicate last point (closed loop)
  const rawPoints = curve.getPoints(TRACK_SAMPLES);
  const samples: TrackPointData[] = [];

  for (let i = 0; i < rawPoints.length - 1; i++) {
    const p     = rawPoints[i];
    const nextP = rawPoints[i + 1];

    const tangent = new THREE.Vector3().subVectors(nextP, p).normalize();

    // Normal = perpendicular to tangent on XZ (points RIGHT relative to travel direction)
    const normal = new THREE.Vector3(-tangent.z, 0, tangent.x).normalize();

    const rightEdge = p.clone().addScaledVector(normal,  ROAD_WIDTH / 2);
    const leftEdge  = p.clone().addScaledVector(normal, -ROAD_WIDTH / 2);

    samples.push({ position: p.clone(), tangent, normal, leftEdge, rightEdge });
  }

  // 3. Generate 10 checkpoints (evenly spaced across the full loop)
  //    CP index goes from 1 to totalCheckpoints.
  //    Index === totalCheckpoints is the finish line.
  const NUM_CP = 10;
  const checkpoints: CheckpointData[] = [];

  for (let i = 1; i <= NUM_CP; i++) {
    const u           = i / NUM_CP;
    const sampleIdx   = Math.floor(u * samples.length) % samples.length;
    const s           = samples[sampleIdx];
    const isFinish    = i === NUM_CP;

    checkpoints.push({
      id:        isFinish ? 'cp-finish' : `cp-${i}`,
      index:     i,
      position:  s.position.clone(),
      tangent:   s.tangent.clone(),
      normal:    s.normal.clone(),
      leftEdge:  s.leftEdge.clone(),
      rightEdge: s.rightEdge.clone(),
    });
  }

  // 4. Starting transform — place car slightly BEFORE sample[0]
  const startSample   = samples[0];
  const spawnDistance = 8; // metres behind start line
  const spawnPos      = startSample.position.clone().addScaledVector(startSample.tangent, -spawnDistance);
  spawnPos.y          = 0;

  const startTransform = {
    position: spawnPos,
    rotation: Math.atan2(startSample.tangent.x, startSample.tangent.z),
    tangent:  startSample.tangent.clone(),
  };

  _instance = { curve, samples, checkpoints, startTransform, totalCheckpoints: NUM_CP };
  return _instance;
}

// ── Circuit Meta ──────────────────────────────────────────────
export const CIRCUIT_INFO = {
  name:      'VICE COAST CIRCUIT',
  lapLength: '3.4 KM',
  turns:     8,
  location:  'MIAMI COAST, KLUSTOR CITY',
};

export const RACE_REWARDS = {
  baseCash:          500,
  personalBestBonus: 250,
  baseRep:           10,
  personalBestRep:   5,
};
