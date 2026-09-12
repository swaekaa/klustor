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
  // Start / City Straight
  new THREE.Vector3(   0, 0,    0),
  new THREE.Vector3( 150, 0,    0),
  
  // Twist 1: Chicane right after start
  new THREE.Vector3( 250, 0,   40),
  new THREE.Vector3( 300, 0,  -20),
  new THREE.Vector3( 400, 0,   20),
  
  // Hairpin 1 (Outer Coast)
  new THREE.Vector3( 550, 0,   50),
  new THREE.Vector3( 650, 0,  150), // swing out
  new THREE.Vector3( 450, 0,  200), // cut back hard
  new THREE.Vector3( 550, 0,  300), // swing out again
  
  // Sweep
  new THREE.Vector3( 650, 0,  450),
  new THREE.Vector3( 600, 0,  600),
  
  // Hairpin 2 (Deep Corner)
  new THREE.Vector3( 450, 0,  750),
  new THREE.Vector3( 350, 0,  850),
  new THREE.Vector3( 250, 0,  750), // cut back inward
  new THREE.Vector3( 150, 0,  850),
  new THREE.Vector3(   0, 0,  800),
  
  // Technical section (Serpentine)
  new THREE.Vector3(-100, 0,  750),
  new THREE.Vector3(-150, 0,  600),
  new THREE.Vector3(-250, 0,  650),
  new THREE.Vector3(-300, 0,  500),
  new THREE.Vector3(-200, 0,  450),
  new THREE.Vector3(-250, 0,  300),
  
  // Hairpin 3 (Return)
  new THREE.Vector3(-450, 0,  350),
  new THREE.Vector3(-550, 0,  250),
  new THREE.Vector3(-400, 0,  150),
  new THREE.Vector3(-500, 0,   50),
  
  // Final Kinks
  new THREE.Vector3(-300, 0,  -50),
  new THREE.Vector3(-150, 0,   30),
  new THREE.Vector3( -50, 0,    0),
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
