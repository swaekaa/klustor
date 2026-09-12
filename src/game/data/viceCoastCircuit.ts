import * as THREE from 'three';

// ============================================================
// VICE COAST CIRCUIT — Authoritative Track Data
// 1 unit ≈ 1 meter. Car forward direction = local +Z.
// ONE SOURCE OF TRUTH: The track curve.
// ============================================================

export const ROAD_WIDTH = 12;
export const TRACK_SAMPLES = 400; // Dense sampling for smooth geometry and collisions

export interface TrackPointData {
  position: THREE.Vector3;
  tangent: THREE.Vector3;
  normal: THREE.Vector3;     // Right-pointing normal on XZ plane
  leftEdge: THREE.Vector3;
  rightEdge: THREE.Vector3;
}

export interface CheckpointData {
  id: string;
  index: number;
  position: THREE.Vector3;
  tangent: THREE.Vector3;
  normal: THREE.Vector3;
  leftEdge: THREE.Vector3;
  rightEdge: THREE.Vector3;
}

export interface TrackData {
  curve: THREE.CatmullRomCurve3;
  samples: TrackPointData[];
  checkpoints: CheckpointData[];
  startTransform: {
    position: THREE.Vector3;
    rotation: number; // Y-axis rotation in radians
    tangent: THREE.Vector3;
  };
  totalCheckpoints: number;
}

// Raw Waypoints for Vice Coast
const WAYPOINTS = [
  new THREE.Vector3(0, 0, 0),       // START / FINISH
  new THREE.Vector3(30, 0, -2),     // PALM STRAIGHT
  new THREE.Vector3(70, 0, -5),
  new THREE.Vector3(110, 0, -2),    // CITY ENTRY
  new THREE.Vector3(130, 0, 20),    // 90° CITY TURN (Turn 1)
  new THREE.Vector3(135, 0, 55),    // HARBOR STRAIGHT
  new THREE.Vector3(130, 0, 90),    // HARBOR BEND (Turn 2)
  new THREE.Vector3(110, 0, 110),   // HARBOR APEX (Turn 3)
  new THREE.Vector3(70, 0, 120),    // LONG BACK STRAIGHT
  new THREE.Vector3(30, 0, 122),
  new THREE.Vector3(0, 0, 130),     // OCEAN END
  new THREE.Vector3(-30, 0, 130),
  new THREE.Vector3(-60, 0, 125),   // HAIRPIN ENTRY
  new THREE.Vector3(-80, 0, 110),   // HAIRPIN (Turn 4-5)
  new THREE.Vector3(-75, 0, 90),    // HAIRPIN EXIT
  new THREE.Vector3(-60, 0, 80),    // OCEAN DRIVE
  new THREE.Vector3(-50, 0, 60),
  new THREE.Vector3(-60, 0, 40),    // CHICANE L (Turn 6)
  new THREE.Vector3(-50, 0, 25),    // CHICANE R (Turn 7)
  new THREE.Vector3(-60, 0, 10),    // BOULEVARD TURN (Turn 8)
  new THREE.Vector3(-100, 0, 2),
  new THREE.Vector3(-120, 0, -5),   // LONG LEFT (Turn 9)
  new THREE.Vector3(-110, 0, -15),  // FINAL CORNER (Turn 10)
  new THREE.Vector3(-70, 0, -10),   // FINAL STRAIGHT
  new THREE.Vector3(-35, 0, -5),
];

// Lazy-loaded singleton
let trackDataInstance: TrackData | null = null;

export function getTrackData(): TrackData {
  if (trackDataInstance) return trackDataInstance;

  // 1. Build authoritative curve
  const curve = new THREE.CatmullRomCurve3(WAYPOINTS, true, 'catmullrom', 0.5);

  // 2. Sample densely
  const samples: TrackPointData[] = [];
  const points = curve.getPoints(TRACK_SAMPLES);
  
  for (let i = 0; i < points.length; i++) {
    // Note: getPoints returns TRACK_SAMPLES + 1 points, but it's a closed loop so the last equals the first.
    // We will drop the duplicate last point to have exactly TRACK_SAMPLES.
    if (i === points.length - 1) break;
    
    const p = points[i];
    // Calculate tangent using finite difference for exact alignment
    const nextP = points[(i + 1) % (points.length - 1)];
    const tangent = new THREE.Vector3().subVectors(nextP, p).normalize();
    
    // Normal perpendicular to tangent on XZ plane (pointing Right relative to tangent)
    const normal = new THREE.Vector3(-tangent.z, 0, tangent.x).normalize();
    
    // Left and Right Boundaries
    const rightEdge = p.clone().addScaledVector(normal, ROAD_WIDTH / 2);
    const leftEdge = p.clone().addScaledVector(normal, -ROAD_WIDTH / 2);

    samples.push({
      position: p.clone(),
      tangent,
      normal,
      leftEdge,
      rightEdge
    });
  }

  // 3. Generate Checkpoints at intervals
  // Vice Coast should have ~10 checkpoints. Let's place them at 10 intervals.
  const checkpoints: CheckpointData[] = [];
  const numCheckpoints = 10;
  
  for (let i = 1; i <= numCheckpoints; i++) {
    // We skip 0 because 0 is the start line.
    // We place checkpoints at 10%, 20%, ..., 100% (Finish).
    const u = i / numCheckpoints;
    const isFinish = i === numCheckpoints;
    
    // Fractional index in our samples
    const sampleIndex = Math.floor(u * samples.length) % samples.length;
    const s = samples[sampleIndex];

    checkpoints.push({
      id: isFinish ? 'cp-finish' : `cp-${i}`,
      index: i,
      position: s.position.clone(),
      tangent: s.tangent.clone(),
      normal: s.normal.clone(),
      leftEdge: s.leftEdge.clone(),
      rightEdge: s.rightEdge.clone(),
    });
  }

  // 4. Generate Start/Finish Transform
  // Spawn player slightly BEFORE the start line.
  // Start line is at u=0 (sample[0]).
  const startSample = samples[0];
  const spawnDistance = 6; // slightly behind start line
  const spawnPos = startSample.position.clone().addScaledVector(startSample.tangent, -spawnDistance);
  
  const startTransform = {
    position: spawnPos,
    rotation: Math.atan2(startSample.tangent.x, startSample.tangent.z),
    tangent: startSample.tangent.clone()
  };

  trackDataInstance = {
    curve,
    samples,
    checkpoints,
    startTransform,
    totalCheckpoints: numCheckpoints
  };

  return trackDataInstance;
}

export const CIRCUIT_INFO = {
  name: 'VICE COAST CIRCUIT',
  lapLength: '3.2 KM',
  turns: 10,
  location: 'MIAMI COAST, KLUSTOR CITY',
};

export const RACE_REWARDS = {
  baseCash: 500,
  personalBestBonus: 250,
  baseRep: 10,
  personalBestRep: 5,
};
