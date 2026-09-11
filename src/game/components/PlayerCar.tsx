import { useRef, useEffect, useState, useMemo, type RefObject } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { buildLiveryTexture, createFallbackTexture } from '../utils/liveryTexture';

// ============================================================
// PlayerCar — Stylized low-poly sports car with livery panels
// Car forward direction: local +Z axis
// Materials are memoized to avoid recreation each render
// ============================================================

import type { TemplateView } from '../../types';

interface PlayerCarProps {
  groupRef: RefObject<THREE.Group>;
  textures?: Partial<Record<TemplateView, string>>;
  speed?: number;
  steering?: number;
}

const WHEEL_POSITIONS: [number, number, number][] = [
  [-1.1, -0.35, 1.5],  // front-right
  [1.1, -0.35, 1.5],   // front-left
  [-1.1, -0.35, -1.5], // rear-right
  [1.1, -0.35, -1.5],  // rear-left
];

export default function PlayerCar({ groupRef, textures, speed = 0, steering = 0 }: PlayerCarProps) {
  const [loadedTextures, setLoadedTextures] = useState<Partial<Record<TemplateView, THREE.Texture>>>({});
  const wheelRef0 = useRef<THREE.Mesh>(null!);
  const wheelRef1 = useRef<THREE.Mesh>(null!);
  const wheelRef2 = useRef<THREE.Mesh>(null!);
  const wheelRef3 = useRef<THREE.Mesh>(null!);
  const wheelRefs = [wheelRef0, wheelRef1, wheelRef2, wheelRef3];
  const wheelRotationRef = useRef(0);

  // Load livery textures
  useEffect(() => {
    let disposed = false;
    const loaded: Partial<Record<TemplateView, THREE.Texture>> = {};
    
    async function loadAll() {
      if (!textures) {
        if (!disposed) setLoadedTextures({});
        return;
      }
      
      const views = ['left', 'right', 'top', 'front', 'rear'] as TemplateView[];
      for (const view of views) {
        if (textures[view]) {
          try {
             // We no longer need to pass the mask template
             const tex = await buildLiveryTexture(textures[view]!);
             loaded[view] = tex;
          } catch {
             loaded[view] = createFallbackTexture();
          }
        }
      }
      if (!disposed) setLoadedTextures({ ...loaded });
    }
    loadAll();

    return () => {
      disposed = true;
      Object.values(loaded).forEach(t => t?.dispose());
    };
  }, [textures]);

  // Memoize static materials
  const bodyMat = useMemo(() => new THREE.MeshLambertMaterial({ color: '#C8D8E8' }), []);
  const darkMat = useMemo(() => new THREE.MeshLambertMaterial({ color: '#2A3540' }), []);
  const glassMat = useMemo(() => new THREE.MeshLambertMaterial({ color: '#A8D0E6', transparent: true, opacity: 0.5 }), []);
  const wheelMat = useMemo(() => new THREE.MeshLambertMaterial({ color: '#1A2030' }), []);
  const hubMat = useMemo(() => new THREE.MeshLambertMaterial({ color: '#C8C8C8' }), []);
  const lightMat = useMemo(() => new THREE.MeshLambertMaterial({ color: '#FFEEAA', emissive: new THREE.Color('#FFDD88'), emissiveIntensity: 0.5 }), []);
  const redLightMat = useMemo(() => new THREE.MeshLambertMaterial({ color: '#FF4444', emissive: new THREE.Color('#FF2222'), emissiveIntensity: 0.4 }), []);
  const chassisMat = useMemo(() => new THREE.MeshLambertMaterial({ color: '#1A2030' }), []);

  // Memoize dynamic livery materials
  const defaultLiveryMat = useMemo(() => new THREE.MeshLambertMaterial({ color: '#FAF9F3', transparent: true, opacity: 0.9, side: THREE.FrontSide }), []);
  
  const matLeft = useMemo(() => loadedTextures.left ? new THREE.MeshLambertMaterial({ map: loadedTextures.left, transparent: true, side: THREE.FrontSide }) : defaultLiveryMat, [loadedTextures.left, defaultLiveryMat]);
  const matRight = useMemo(() => loadedTextures.right ? new THREE.MeshLambertMaterial({ map: loadedTextures.right, transparent: true, side: THREE.FrontSide }) : defaultLiveryMat, [loadedTextures.right, defaultLiveryMat]);
  const matTop = useMemo(() => loadedTextures.top ? new THREE.MeshLambertMaterial({ map: loadedTextures.top, transparent: true, side: THREE.FrontSide }) : defaultLiveryMat, [loadedTextures.top, defaultLiveryMat]);
  const matFront = useMemo(() => loadedTextures.front ? new THREE.MeshLambertMaterial({ map: loadedTextures.front, transparent: true, side: THREE.FrontSide }) : defaultLiveryMat, [loadedTextures.front, defaultLiveryMat]);
  const matRear = useMemo(() => loadedTextures.rear ? new THREE.MeshLambertMaterial({ map: loadedTextures.rear, transparent: true, side: THREE.FrontSide }) : defaultLiveryMat, [loadedTextures.rear, defaultLiveryMat]);

  // Animate wheels each frame
  useFrame((_, delta) => {
    const dt = Math.min(delta, 0.05);
    wheelRotationRef.current += (speed * dt) / 0.4; // wheel radius

    wheelRefs.forEach((ref, i) => {
      if (ref.current) {
        ref.current.rotation.x = wheelRotationRef.current;
        if (i < 2) {
          // Front wheels steer
          ref.current.rotation.y = -steering * 0.4;
        }
      }
    });
  });

  return (
    <group ref={groupRef} position={[0, 0, 10]}>
      {/* === MAIN BODY === */}
      <mesh position={[0, 0.15, 0]} material={bodyMat}>
        <boxGeometry args={[2.1, 0.55, 4.2]} />
      </mesh>

      {/* Cabin */}
      <mesh position={[0, 0.72, -0.2]} material={bodyMat}>
        <boxGeometry args={[1.7, 0.5, 2.2]} />
      </mesh>

      {/* Windshield front */}
      <mesh position={[0, 0.68, 0.95]} rotation={[0.5, 0, 0]} material={glassMat}>
        <boxGeometry args={[1.58, 0.5, 0.05]} />
      </mesh>

      {/* Rear window */}
      <mesh position={[0, 0.68, -1.35]} rotation={[-0.5, 0, 0]} material={glassMat}>
        <boxGeometry args={[1.58, 0.5, 0.05]} />
      </mesh>

      {/* Side windows */}
      <mesh position={[0.87, 0.72, -0.2]} material={glassMat}>
        <boxGeometry args={[0.05, 0.38, 1.6]} />
      </mesh>
      <mesh position={[-0.87, 0.72, -0.2]} material={glassMat}>
        <boxGeometry args={[0.05, 0.38, 1.6]} />
      </mesh>

      {/* Front bumper */}
      <mesh position={[0, 0.05, 2.2]} material={darkMat}>
        <boxGeometry args={[2.0, 0.28, 0.2]} />
      </mesh>

      {/* Rear bumper */}
      <mesh position={[0, 0.05, -2.2]} material={darkMat}>
        <boxGeometry args={[2.0, 0.28, 0.2]} />
      </mesh>

      {/* Front grill */}
      <mesh position={[0, 0.1, 2.31]} material={darkMat}>
        <boxGeometry args={[1.4, 0.18, 0.05]} />
      </mesh>

      {/* Headlights */}
      <mesh position={[0.7, 0.2, 2.12]} material={lightMat}>
        <boxGeometry args={[0.4, 0.15, 0.08]} />
      </mesh>
      <mesh position={[-0.7, 0.2, 2.12]} material={lightMat}>
        <boxGeometry args={[0.4, 0.15, 0.08]} />
      </mesh>

      {/* Rear lights */}
      <mesh position={[0.7, 0.2, -2.12]} material={redLightMat}>
        <boxGeometry args={[0.4, 0.15, 0.08]} />
      </mesh>
      <mesh position={[-0.7, 0.2, -2.12]} material={redLightMat}>
        <boxGeometry args={[0.4, 0.15, 0.08]} />
      </mesh>

      {/* === LIVERY PANELS === */}
      {/* Right side */}
      <mesh position={[1.06, 0.15, 0]} rotation={[0, Math.PI / 2, 0]} material={matRight}>
        <planeGeometry args={[4.2, 0.55]} />
      </mesh>
      {/* Left side (mirrored) */}
      <mesh position={[-1.06, 0.15, 0]} rotation={[0, -Math.PI / 2, 0]} material={matLeft}>
        <planeGeometry args={[4.2, 0.55]} />
      </mesh>
      {/* Front bumper panel */}
      <mesh position={[0, 0.05, 2.31]} rotation={[0, 0, 0]} material={matFront}>
        <planeGeometry args={[2.0, 0.28]} />
      </mesh>
      {/* Rear bumper panel */}
      <mesh position={[0, 0.05, -2.31]} rotation={[0, Math.PI, 0]} material={matRear}>
        <planeGeometry args={[2.0, 0.28]} />
      </mesh>
      {/* Top - Hood */}
      <mesh position={[0, 0.43, 1.4]} rotation={[-Math.PI / 2, 0, 0]} material={matTop}>
        <planeGeometry args={[2.0, 1.4]} />
      </mesh>
      {/* Top - Roof */}
      <mesh position={[0, 0.98, -0.2]} rotation={[-Math.PI / 2, 0, 0]} material={matTop}>
        <planeGeometry args={[1.6, 2.1]} />
      </mesh>
      {/* Top - Trunk */}
      <mesh position={[0, 0.43, -1.8]} rotation={[-Math.PI / 2, 0, 0]} material={matTop}>
        <planeGeometry args={[2.0, 1.0]} />
      </mesh>

      {/* === WHEELS === */}
      {WHEEL_POSITIONS.map((pos, i) => {
        const refs = [wheelRef0, wheelRef1, wheelRef2, wheelRef3];
        return (
          <group key={i} position={pos}>
            <mesh ref={refs[i]} rotation={[0, 0, Math.PI / 2]} material={wheelMat}>
              <cylinderGeometry args={[0.38, 0.38, 0.22, 12]} />
            </mesh>
            <mesh rotation={[0, 0, Math.PI / 2]} material={hubMat} position={[i % 2 === 0 ? -0.12 : 0.12, 0, 0]}>
              <cylinderGeometry args={[0.18, 0.18, 0.04, 8]} />
            </mesh>
          </group>
        );
      })}

      {/* Chassis underside */}
      <mesh position={[0, -0.4, 0]} material={chassisMat}>
        <boxGeometry args={[1.8, 0.05, 3.8]} />
      </mesh>
    </group>
  );
}
