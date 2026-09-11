import { useRef, useEffect, type RefObject } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';

// ============================================================
// RaceCamera — Smooth lerp chase camera
// Stays behind car, looks toward car + forward offset
// ============================================================

interface RaceCameraProps {
  carRef: RefObject<THREE.Group>;
  isActive: boolean;
}

const CAMERA_DISTANCE = 9;
const CAMERA_HEIGHT = 5;
const CAMERA_SMOOTHING = 4.5; // higher = snappier
const LOOK_AHEAD = 6; // how far ahead of car camera looks

export default function RaceCamera({ carRef, isActive }: RaceCameraProps) {
  const { camera } = useThree();
  const targetPosition = useRef(new THREE.Vector3(0, CAMERA_HEIGHT, -CAMERA_DISTANCE));
  const lookTarget = useRef(new THREE.Vector3(0, 1, 0));

  // Initialize camera position on mount
  useEffect(() => {
    camera.position.set(0, CAMERA_HEIGHT, -CAMERA_DISTANCE);
    camera.lookAt(0, 0, 0);
  }, [camera]);

  useFrame((_, delta) => {
    if (!carRef.current || !isActive) return;

    const dt = Math.min(delta, 0.05);
    const carPos = carRef.current.position;
    const carRot = carRef.current.rotation;

    // Car's backward direction
    const backward = new THREE.Vector3(0, 0, -1).applyEuler(carRot);
    const forward = new THREE.Vector3(0, 0, 1).applyEuler(carRot);

    // Ideal camera position: behind car + up
    targetPosition.current.set(
      carPos.x + backward.x * CAMERA_DISTANCE,
      carPos.y + CAMERA_HEIGHT,
      carPos.z + backward.z * CAMERA_DISTANCE,
    );

    // Smoothly move camera toward target
    camera.position.lerp(targetPosition.current, dt * CAMERA_SMOOTHING);

    // Look toward car + slightly ahead
    lookTarget.current.set(
      carPos.x + forward.x * LOOK_AHEAD,
      carPos.y + 1,
      carPos.z + forward.z * LOOK_AHEAD,
    );
    camera.lookAt(lookTarget.current);
  });

  return null; // This component only drives the camera
}
