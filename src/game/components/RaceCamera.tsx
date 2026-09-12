import { useRef, useEffect, useState, type RefObject } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import { getTrackData } from '../data/viceCoastCircuit';

// ============================================================
// RaceCamera — Smooth lerp chase camera with multiple angles
// ============================================================

interface RaceCameraProps {
  carRef: RefObject<THREE.Group>;
  isActive: boolean;
}

const CAMERA_VIEWS = [
  { name: 'chase', distance: 12, height: 6, lookAhead: 8, smoothing: 5 },
  { name: 'bonnet', distance: -0.5, height: 1.5, lookAhead: 10, smoothing: 15 },
  { name: 'far_chase', distance: 20, height: 10, lookAhead: 6, smoothing: 4 }
];

export default function RaceCamera({ carRef, isActive }: RaceCameraProps) {
  const { camera } = useThree();
  const [viewIdx, setViewIdx] = useState(0);
  
  const targetPosition = useRef(new THREE.Vector3());
  const lookTarget = useRef(new THREE.Vector3());
  const idealLookTarget = useRef(new THREE.Vector3());

  // Listen for 'V' key to cycle camera views
  useEffect(() => {
    if (!isActive) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable) return;
      
      if (e.key.toLowerCase() === 'v') {
        setViewIdx(prev => (prev + 1) % CAMERA_VIEWS.length);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isActive]);

  // Initialize camera position on mount
  useEffect(() => {
    const { startTransform } = getTrackData();
    const backward = new THREE.Vector3(0, 0, -1).applyAxisAngle(new THREE.Vector3(0, 1, 0), startTransform.rotation);
    const forward = new THREE.Vector3(0, 0, 1).applyAxisAngle(new THREE.Vector3(0, 1, 0), startTransform.rotation);
    
    const view = CAMERA_VIEWS[0];
    
    // Snap exactly to where the car will spawn
    camera.position.set(
      startTransform.position.x + backward.x * view.distance,
      startTransform.position.y + view.height,
      startTransform.position.z + backward.z * view.distance,
    );
    
    const initialLook = startTransform.position.clone().addScaledVector(forward, view.lookAhead);
    initialLook.y += 1;
    
    lookTarget.current.copy(initialLook);
    camera.lookAt(lookTarget.current);
  }, [camera]);

  useFrame((_, delta) => {
    if (!carRef.current || !isActive) return;

    const dt = Math.min(delta, 0.05);
    const carPos = carRef.current.position;
    const carRot = carRef.current.rotation;

    const view = CAMERA_VIEWS[viewIdx];

    // Car's backward direction
    const backward = new THREE.Vector3(0, 0, -1).applyEuler(carRot);
    const forward = new THREE.Vector3(0, 0, 1).applyEuler(carRot);

    // Ideal camera position: behind car + up
    targetPosition.current.set(
      carPos.x + backward.x * view.distance,
      carPos.y + view.height,
      carPos.z + backward.z * view.distance,
    );

    // Smoothly move camera toward target
    camera.position.lerp(targetPosition.current, dt * view.smoothing);

    // Ideal look target: car + slightly ahead
    idealLookTarget.current.set(
      carPos.x + forward.x * view.lookAhead,
      carPos.y + (view.name === 'bonnet' ? 0.5 : 1),
      carPos.z + forward.z * view.lookAhead,
    );

    // Smoothly move the look target as well to prevent snapping
    lookTarget.current.lerp(idealLookTarget.current, dt * (view.smoothing * 1.5));
    
    camera.lookAt(lookTarget.current);
  });

  return null; // This component only drives the camera
}
