import { useRef, useCallback, type RefObject } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { useKeyboardControls } from './useKeyboardControls';
import { getTrackData, ROAD_WIDTH } from '../data/viceCoastCircuit';
import type { CarStats } from '../../types';

// ============================================================
// Arcade Car Physics — stat-driven, strictly bounded by track
// Car forward direction: local +Z axis
// ============================================================

const BASE_MAX_SPEED   = 22;
const BASE_ACCELERATION = 12;
const BASE_FRICTION     = 5;
const BASE_STEERING     = 1.8;
const REVERSE_SPEED     = 7;
const BRAKING           = 20;
const CAR_RADIUS        = 1.2;

export interface CarPhysicsState {
  speed: number;
  steering: number;
}

function findNearestTrackPoint(pos: THREE.Vector3) {
  const data = getTrackData();
  let minDist = Infinity;
  let nearest = data.samples[0];

  for (const sample of data.samples) {
    const dist = pos.distanceToSquared(sample.position);
    if (dist < minDist) {
      minDist = dist;
      nearest = sample;
    }
  }
  return { nearest, distance: Math.sqrt(minDist) };
}

export function useCarPhysics(
  carRef: RefObject<THREE.Group>,
  isRacing: boolean,
  stats?: CarStats,
  onUpdate?: (state: CarPhysicsState) => void
) {
  const { isAnyPressed } = useKeyboardControls(isRacing);

  const speedMult = stats ? (stats.topSpeed - 100) / 40 * 0.8 + 1.0 : 1.0;
  const accelMult = stats ? (stats.acceleration - 3) / 7 * 0.9 + 0.7 : 1.0;
  const steerMult = stats ? (stats.handling - 3) / 7 * 0.9 + 0.7 : 1.0;

  const MAX_SPEED         = BASE_MAX_SPEED * speedMult;
  const ACCELERATION      = BASE_ACCELERATION * accelMult;
  const STEERING_STRENGTH = BASE_STEERING * steerMult;

  const speedRef           = useRef(0);
  const steeringRef        = useRef(0);

  const resetToStart = useCallback(() => {
    if (!carRef.current) return;
    const { startTransform } = getTrackData();
    carRef.current.position.copy(startTransform.position);
    carRef.current.rotation.set(0, startTransform.rotation, 0);
    speedRef.current = 0;
    steeringRef.current = 0;
  }, [carRef]);

  const resetToNearestTrackPoint = useCallback(() => {
    if (!carRef.current) return;
    const { nearest } = findNearestTrackPoint(carRef.current.position);
    carRef.current.position.copy(nearest.position);
    carRef.current.rotation.set(0, Math.atan2(nearest.tangent.x, nearest.tangent.z), 0);
    speedRef.current = 0;
  }, [carRef]);

  useFrame((_, delta) => {
    if (!carRef.current || !isRacing) {
      // Force speed to zero during countdown / disabled
      speedRef.current = 0; 
      return;
    }

    const dt = Math.min(delta, 0.05);

    const fwd       = isAnyPressed('KeyW', 'ArrowUp');
    const back      = isAnyPressed('KeyS', 'ArrowDown');
    const left      = isAnyPressed('KeyA', 'ArrowLeft');
    const right     = isAnyPressed('KeyD', 'ArrowRight');
    const handbrake = isAnyPressed('Space');
    const resetKey  = isAnyPressed('KeyR');

    if (resetKey) {
      resetToNearestTrackPoint();
      return;
    }

    // Acceleration / braking
    if (fwd) {
      speedRef.current = Math.min(MAX_SPEED, speedRef.current + ACCELERATION * dt);
    } else if (back) {
      if (speedRef.current > 0.5) {
        speedRef.current = Math.max(0, speedRef.current - BRAKING * dt);
      } else {
        speedRef.current = Math.max(-REVERSE_SPEED, speedRef.current - ACCELERATION * dt);
      }
    } else {
      const frictionForce = BASE_FRICTION * dt * (handbrake ? 2.5 : 1);
      if (Math.abs(speedRef.current) < frictionForce) {
        speedRef.current = 0;
      } else {
        speedRef.current -= Math.sign(speedRef.current) * frictionForce;
      }
    }

    // Steering
    const steerFactor = Math.min(1, Math.abs(speedRef.current) / 5);
    // Left = +1, Right = -1
    const steeringInput = (left ? 1 : 0) - (right ? 1 : 0);

    if (steeringInput !== 0 && Math.abs(speedRef.current) > 0.2) {
      // In Three.js, positive Y rotation turns from +Z to +X (Right).
      // Therefore, if turning RIGHT (steeringInput = -1), we want a NEGATIVE steer amount.
      // If turning LEFT (steeringInput = 1), we want a POSITIVE steer amount.
      const steerAmount = steeringInput * STEERING_STRENGTH * steerFactor * dt * Math.sign(speedRef.current);
      carRef.current.rotation.y += steerAmount;
    }

    steeringRef.current = steeringInput;

    // Proposed new position
    const forward = new THREE.Vector3(0, 0, 1).applyEuler(carRef.current.rotation);
    const nextPos = carRef.current.position.clone().addScaledVector(forward, speedRef.current * dt);

    // Track Boundary Collision Logic
    const { nearest, distance } = findNearestTrackPoint(nextPos);
    const maxAllowedDist = (ROAD_WIDTH / 2) - CAR_RADIUS;

    if (distance > maxAllowedDist) {
      // Car is hitting the wall.
      // Vector from nearest point on centerline TO car
      const outwardDir = new THREE.Vector3().subVectors(nextPos, nearest.position).normalize();
      
      // Clamp position perfectly to the edge
      const clampedPos = nearest.position.clone().addScaledVector(outwardDir, maxAllowedDist);
      carRef.current.position.copy(clampedPos);
      
      // Reduce velocity (wall friction/impact)
      speedRef.current *= 0.8; // Hard deceleration from hitting wall
    } else {
      // Safe to move
      carRef.current.position.copy(nextPos);
    }

    carRef.current.position.y = 0; // Lock to ground

    onUpdate?.({ speed: speedRef.current, steering: steeringRef.current });
  });

  // isOffRoad logic removed because we now physically bound the car to the track
  const setOffRoad = useCallback(() => {}, []);

  return { speedRef, steeringRef, setOffRoad, resetToStart, resetToLastSafe: resetToNearestTrackPoint };
}
