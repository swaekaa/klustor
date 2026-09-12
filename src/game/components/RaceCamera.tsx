import { useRef, useEffect, type RefObject } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import { getTrackData } from '../data/viceCoastCircuit';

// ============================================================
// RaceCamera — Smooth lerp chase camera
// Stays behind car, looks toward car + forward offset
// ============================================================

interface RaceCameraProps {
  carRef: RefObject<THREE.Group>;
  isActive: boolean;
}

const CAMERA_DISTANCE  = 12;   // further back to show more environment
const CAMERA_HEIGHT    = 6;    // slightly higher — shows road ahead
const CAMERA_SMOOTHING = 5;    // snappier following
const LOOK_AHEAD       = 8;    // look further ahead for readability

export default function RaceCamera({ carRef, isActive }: RaceCameraProps) {
  const { camera } = useThree();
  const targetPosition = useRef(new THREE.Vector3(0, CAMERA_HEIGHT, -CAMERA_DISTANCE));
  const lookTarget = useRef(new THREE.Vector3(0, 1, 0));

  // Initialize camera position on mount
  useEffect(() => {
    const { startTransform } = getTrackData();
    const backward = new THREE.Vector3(0, 0, -1).applyAxisAngle(new THREE.Vector3(0, 1, 0), startTransform.rotation);
    const forward = new THREE.Vector3(0, 0, 1).applyAxisAngle(new THREE.Vector3(0, 1, 0), startTransform.rotation);
    
    // Snap exactly to where the car will spawn
    camera.position.set(
      startTransform.position.x + backward.x * CAMERA_DISTANCE,
      startTransform.position.y + CAMERA_HEIGHT,
      startTransform.position.z + backward.z * CAMERA_DISTANCE,
    );
    
    const initialLook = startTransform.position.clone().addScaledVector(forward, LOOK_AHEAD);
    initialLook.y += 1;
    
    lookTarget.current.copy(initialLook);
    camera.lookAt(lookTarget.current);
  }, [camera]);

  const idealLookTarget = useRef(new THREE.Vector3());

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

    // Ideal look target: car + slightly ahead
    idealLookTarget.current.set(
      carPos.x + forward.x * LOOK_AHEAD,
      carPos.y + 1,
      carPos.z + forward.z * LOOK_AHEAD,
    );

    // Smoothly move the look target as well to prevent snapping
    lookTarget.current.lerp(idealLookTarget.current, dt * (CAMERA_SMOOTHING * 1.5));
    
    camera.lookAt(lookTarget.current);
  });

  return null; // This component only drives the camera
}
