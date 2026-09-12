import { useRef, useCallback, type RefObject } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { useKeyboardControls } from './useKeyboardControls';
import { getTrackData, ROAD_WIDTH } from '../data/viceCoastCircuit';
import type { CarStats } from '../../types';

// ============================================================
// Arcade Car Physics — stat-driven, strictly bounded by track
//
// Collision model:
//   - Find nearest track sample (centerline)
//   - Compute signed lateral offset using sample.normal
//   - Clamp to ±(ROAD_WIDTH/2 - CAR_RADIUS)
//   - This uses the ACTUAL left/right edges, not just distance
//
// Car forward direction: local +Z axis
// Positive Y rotation → car turns from +Z toward +X (Right)
// ============================================================

const BASE_MAX_SPEED      = 22;
const BASE_ACCELERATION   = 12;
const BASE_FRICTION       = 5;
const BASE_STEERING       = 2.0;
const REVERSE_SPEED       = 6;
const BRAKING             = 22;
const CAR_HALF_WIDTH      = 1.1;   // half car width for boundary clamping

export interface CarPhysicsState {
  speed:    number;
  steering: number;
}

// ── Nearest Track Point ───────────────────────────────────────

function findNearest(pos: THREE.Vector3) {
  const { samples } = getTrackData();
  let minDistSq = Infinity;
  let nearest   = samples[0];
  let nearestIdx = 0;

  for (let i = 0; i < samples.length; i++) {
    const dx = pos.x - samples[i].position.x;
    const dz = pos.z - samples[i].position.z;
    const d2 = dx * dx + dz * dz;
    if (d2 < minDistSq) {
      minDistSq = d2;
      nearest   = samples[i];
      nearestIdx = i;
    }
  }

  return { nearest, nearestIdx, distance: Math.sqrt(minDistSq) };
}

// ── Hook ─────────────────────────────────────────────────────

export function useCarPhysics(
  carRef:    RefObject<THREE.Group>,
  isRacing:  boolean,
  stats?:    CarStats,
  onUpdate?: (state: CarPhysicsState) => void,
) {
  const { isAnyPressed } = useKeyboardControls(isRacing);

  // Stat scaling
  const speedMult = stats ? (stats.topSpeed      - 100) / 40 * 0.8  + 1.0 : 1.0;
  const accelMult = stats ? (stats.acceleration  - 3)   / 7  * 0.9  + 0.7 : 1.0;
  const steerMult = stats ? (stats.handling      - 3)   / 7  * 0.9  + 0.7 : 1.0;

  const MAX_SPEED         = BASE_MAX_SPEED    * speedMult;
  const ACCELERATION      = BASE_ACCELERATION * accelMult;
  const STEERING_STRENGTH = BASE_STEERING     * steerMult;

  const speedRef    = useRef(0);
  const steeringRef = useRef(0);

  // ── Reset to start position ───────────────────────────────
  const resetToStart = useCallback(() => {
    if (!carRef.current) return;
    const { startTransform } = getTrackData();
    carRef.current.position.copy(startTransform.position);
    carRef.current.rotation.set(0, startTransform.rotation, 0);
    speedRef.current    = 0;
    steeringRef.current = 0;
  }, [carRef]);

  // ── Reset to nearest valid track point ────────────────────
  const resetToNearestTrackPoint = useCallback(() => {
    if (!carRef.current) return;
    const { nearest } = findNearest(carRef.current.position);
    const safePos = nearest.position.clone();
    safePos.y     = 0;
    carRef.current.position.copy(safePos);
    carRef.current.rotation.set(0, Math.atan2(nearest.tangent.x, nearest.tangent.z), 0);
    speedRef.current = 0;
  }, [carRef]);

  // ── Frame update ──────────────────────────────────────────
  useFrame((_, delta) => {
    if (!carRef.current || !isRacing) {
      speedRef.current = 0;
      return;
    }

    const dt = Math.min(delta, 0.05);

    const fwd       = isAnyPressed('KeyW',  'ArrowUp');
    const back      = isAnyPressed('KeyS',  'ArrowDown');
    const left      = isAnyPressed('KeyA',  'ArrowLeft');
    const right     = isAnyPressed('KeyD',  'ArrowRight');
    const handbrake = isAnyPressed('Space');
    const resetKey  = isAnyPressed('KeyR');

    if (resetKey) { resetToNearestTrackPoint(); return; }

    // ── Speed ──────────────────────────────────────────────
    if (fwd) {
      speedRef.current = Math.min(MAX_SPEED, speedRef.current + ACCELERATION * dt);
    } else if (back) {
      if (speedRef.current > 0.5) {
        speedRef.current = Math.max(0, speedRef.current - BRAKING * dt);
      } else {
        speedRef.current = Math.max(-REVERSE_SPEED, speedRef.current - ACCELERATION * dt);
      }
    } else {
      const friction = BASE_FRICTION * dt * (handbrake ? 3 : 1);
      if (Math.abs(speedRef.current) < friction) {
        speedRef.current = 0;
      } else {
        speedRef.current -= Math.sign(speedRef.current) * friction;
      }
    }

    // ── Steering ───────────────────────────────────────────
    // In Three.js: positive Y rotation goes from +Z toward +X = RIGHT
    // So A (left) → POSITIVE rotation change
    //    D (right) → NEGATIVE rotation change
    const steerFactor = Math.min(1, Math.abs(speedRef.current) / 5);
    // steeringInput: LEFT = +1, RIGHT = -1
    const steeringInput = (left ? 1 : 0) - (right ? 1 : 0);

    if (steeringInput !== 0 && Math.abs(speedRef.current) > 0.2) {
      // LEFT(+1) → add positive Y rotation → car turns left ✓
      // RIGHT(-1) → add negative Y rotation → car turns right ✓
      const steerDelta = steeringInput * STEERING_STRENGTH * steerFactor * dt * Math.sign(speedRef.current);
      carRef.current.rotation.y += steerDelta;
    }
    steeringRef.current = steeringInput;

    // ── Movement ──────────────────────────────────────────
    const forward = new THREE.Vector3(0, 0, 1).applyEuler(carRef.current.rotation);
    const proposed = carRef.current.position.clone().addScaledVector(forward, speedRef.current * dt);
    proposed.y = 0;

    // ── Boundary clamping ─────────────────────────────────
    // Use the nearest sample's left/right edges and the car's
    // lateral offset along the sample normal.
    const { nearest } = findNearest(proposed);
    const toProposed  = proposed.clone().sub(nearest.position);
    const lateralOffset = toProposed.dot(nearest.normal); // positive = right of center

    const maxOffset = (ROAD_WIDTH / 2) - CAR_HALF_WIDTH;

    if (Math.abs(lateralOffset) > maxOffset) {
      // Project the car back onto the legal corridor
      const clampedLateral = Math.sign(lateralOffset) * maxOffset;
      const clampedPos     = nearest.position.clone()
        .addScaledVector(nearest.normal, clampedLateral);
      clampedPos.y         = 0;
      carRef.current.position.copy(clampedPos);

      // Reduce speed on wall hit (arcade collision response)
      speedRef.current *= 0.75;
    } else {
      carRef.current.position.copy(proposed);
    }

    carRef.current.position.y = 0;
    onUpdate?.({ speed: speedRef.current, steering: steeringRef.current });
  });

  const setOffRoad = useCallback(() => {}, []);
  return { speedRef, steeringRef, setOffRoad, resetToStart, resetToLastSafe: resetToNearestTrackPoint };
}
