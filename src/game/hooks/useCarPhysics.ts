import { useRef, useCallback, type RefObject } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { useKeyboardControls } from './useKeyboardControls';
import { WORLD_BOUNDS } from '../data/viceCoastCircuit';
import type { CarStats } from '../../types';

// ============================================================
// Arcade Car Physics — stat-driven, all state in refs (no Zustand)
// Car forward direction: local +Z axis
// ============================================================

// Base physics constants (plain car, no upgrades)
const BASE_MAX_SPEED   = 22;  // m/s ≈ 79 km/h base
const BASE_ACCELERATION = 12;
const BASE_FRICTION     = 5;
const BASE_STEERING     = 1.8;
const REVERSE_SPEED     = 7;
const BRAKING           = 20;

export interface CarPhysicsState {
  speed: number;
  steering: number;
}

export function useCarPhysics(
  carRef: RefObject<THREE.Group>,
  isRacing: boolean,
  stats?: CarStats,
  onUpdate?: (state: CarPhysicsState) => void
) {
  const { isAnyPressed } = useKeyboardControls(isRacing);

  // Scale physics from stats
  // topSpeed 100–140 → speed multiplier 1.0–1.8
  const speedMult = stats ? (stats.topSpeed - 100) / 40 * 0.8 + 1.0 : 1.0;
  // acceleration 3–10 → accel multiplier 0.7–1.6
  const accelMult = stats ? (stats.acceleration - 3) / 7 * 0.9 + 0.7 : 1.0;
  // handling 3–10 → steer multiplier 0.7–1.6
  const steerMult = stats ? (stats.handling - 3) / 7 * 0.9 + 0.7 : 1.0;

  const MAX_SPEED         = BASE_MAX_SPEED * speedMult;
  const ACCELERATION      = BASE_ACCELERATION * accelMult;
  const STEERING_STRENGTH = BASE_STEERING * steerMult;

  // Physics state in refs — NOT state, no re-renders
  const speedRef           = useRef(0);
  const steeringRef        = useRef(0);
  const isOffRoadRef       = useRef(false);
  const lastSafePositionRef = useRef(new THREE.Vector3(0, 0, 10));
  const lastSafeRotationRef = useRef(new THREE.Euler(0, 0, 0));

  const resetToLastSafe = useCallback(() => {
    if (!carRef.current) return;
    carRef.current.position.copy(lastSafePositionRef.current);
    carRef.current.rotation.copy(lastSafeRotationRef.current);
    speedRef.current = 0;
  }, [carRef]);

  const resetToStart = useCallback(() => {
    if (!carRef.current) return;
    carRef.current.position.set(0, 0, 10);
    carRef.current.rotation.set(0, 0, 0);
    speedRef.current = 0;
    steeringRef.current = 0;
    lastSafePositionRef.current.set(0, 0, 10);
    lastSafeRotationRef.current.set(0, 0, 0);
  }, [carRef]);

  useFrame((_, delta) => {
    if (!carRef.current || !isRacing) return;

    const dt = Math.min(delta, 0.05);

    const fwd       = isAnyPressed('KeyW', 'ArrowUp');
    const back      = isAnyPressed('KeyS', 'ArrowDown');
    const left      = isAnyPressed('KeyA', 'ArrowLeft');
    const right     = isAnyPressed('KeyD', 'ArrowRight');
    const handbrake = isAnyPressed('Space');
    const resetKey  = isAnyPressed('KeyR');

    if (resetKey) {
      resetToLastSafe();
      return;
    }

    const offRoadMult = isOffRoadRef.current ? 0.45 : 1.0;
    const effectiveMax = MAX_SPEED * offRoadMult;

    // Acceleration / braking
    if (fwd) {
      speedRef.current = Math.min(effectiveMax, speedRef.current + ACCELERATION * dt);
    } else if (back) {
      if (speedRef.current > 0.5) {
        speedRef.current = Math.max(0, speedRef.current - BRAKING * dt);
      } else {
        speedRef.current = Math.max(-REVERSE_SPEED * offRoadMult, speedRef.current - ACCELERATION * dt);
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
    const steerDir = (right ? 1 : 0) - (left ? 1 : 0);

    if (steerDir !== 0 && Math.abs(speedRef.current) > 0.2) {
      const steerAmount = steerDir * STEERING_STRENGTH * steerFactor * dt * Math.sign(speedRef.current);
      carRef.current.rotation.y -= steerAmount;
    }

    steeringRef.current = steerDir;

    // Move car along +Z local
    const forward = new THREE.Vector3(0, 0, 1).applyEuler(carRef.current.rotation);
    carRef.current.position.addScaledVector(forward, speedRef.current * dt);
    carRef.current.position.y = 0;

    // Bounds check
    const pos = carRef.current.position;
    const inBounds =
      pos.x > WORLD_BOUNDS.minX && pos.x < WORLD_BOUNDS.maxX &&
      pos.z > WORLD_BOUNDS.minZ && pos.z < WORLD_BOUNDS.maxZ;

    if (!inBounds) {
      resetToLastSafe();
      return;
    }

    // Save last safe position while on track and moving
    if (!isOffRoadRef.current && Math.abs(speedRef.current) > 1) {
      lastSafePositionRef.current.copy(pos);
      lastSafeRotationRef.current.copy(carRef.current.rotation);
    }

    onUpdate?.({ speed: speedRef.current, steering: steeringRef.current });
  });

  const setOffRoad = useCallback((offRoad: boolean) => {
    isOffRoadRef.current = offRoad;
  }, []);

  return { speedRef, steeringRef, setOffRoad, resetToStart, resetToLastSafe };
}
