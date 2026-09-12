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
  groupRef?: RefObject<THREE.Group>;
  textures?: Partial<Record<TemplateView, string>>;
  speed?: number;
  steering?: number;
  position?: [number, number, number];
  color?: string; // Base color for opponents
}

const WHEEL_POSITIONS: [number, number, number][] = [
  [-1.1, -0.35, 1.5],  // front-right
  [1.1, -0.35, 1.5],   // front-left
  [-1.1, -0.35, -1.5], // rear-right
  [1.1, -0.35, -1.5],  // rear-left
];

export default function PlayerCar({ groupRef, textures, speed = 0, steering = 0, position = [0, 0, 0], color = '#C8D8E8' }: PlayerCarProps) {
  const [loadedTextures, setLoadedTextures] = useState<Partial<Record<TemplateView, THREE.Texture>>>({});
  const wheelRef0 = useRef<THREE.Mesh>(null!);
  const wheelRef1 = useRef<THREE.Mesh>(null!);
  const wheelRef2 = useRef<THREE.Mesh>(null!);
  const wheelRef3 = useRef<THREE.Mesh>(null!);
  const wheelRefs = [wheelRef0, wheelRef1, wheelRef2, wheelRef3];
  const wheelRotationRef = useRef(0);
  const fallbackGroupRef = useRef<THREE.Group>(null!);
  const actualGroupRef = groupRef || fallbackGroupRef;

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
  const bodyMat = useMemo(() => new THREE.MeshPhysicalMaterial({ color, roughness: 0.2, metalness: 0.1, clearcoat: 1.0, clearcoatRoughness: 0.1 }), [color]);
  const darkMat = useMemo(() => new THREE.MeshStandardMaterial({ color: '#1A2530', roughness: 0.8, metalness: 0.2 }), []);
  const glassMat = useMemo(() => new THREE.MeshPhysicalMaterial({ color: '#111111', roughness: 0.1, metalness: 0.9, transparent: true, opacity: 0.85 }), []);
  const wheelMat = useMemo(() => new THREE.MeshStandardMaterial({ color: '#111315', roughness: 0.9, metalness: 0.1 }), []);
  const hubMat = useMemo(() => new THREE.MeshStandardMaterial({ color: '#E0E0E0', roughness: 0.3, metalness: 0.8 }), []);
  const lightMat = useMemo(() => new THREE.MeshStandardMaterial({ color: '#FFFFFF', emissive: new THREE.Color('#FFFFFF'), emissiveIntensity: 2.0 }), []);
  const redLightMat = useMemo(() => new THREE.MeshStandardMaterial({ color: '#FF1100', emissive: new THREE.Color('#FF1100'), emissiveIntensity: 2.0 }), []);
  const orangeLightMat = useMemo(() => new THREE.MeshStandardMaterial({ color: '#FF8800', emissive: new THREE.Color('#FF8800'), emissiveIntensity: 1.5 }), []);
  const whiteMat = useMemo(() => new THREE.MeshStandardMaterial({ color: '#F0F0F0', roughness: 0.8 }), []);
  const chassisMat = useMemo(() => new THREE.MeshStandardMaterial({ color: '#101520', roughness: 0.9 }), []);

  // Memoize dynamic livery materials
  const defaultLiveryMat = useMemo(() => new THREE.MeshStandardMaterial({ color: '#FFFFFF', transparent: true, opacity: 0.0, side: THREE.FrontSide }), []);
  
  const matLeft = useMemo(() => loadedTextures.left ? new THREE.MeshStandardMaterial({ map: loadedTextures.left, transparent: true, side: THREE.FrontSide, roughness: 0.4 }) : defaultLiveryMat, [loadedTextures.left, defaultLiveryMat]);
  const matRight = useMemo(() => loadedTextures.right ? new THREE.MeshStandardMaterial({ map: loadedTextures.right, transparent: true, side: THREE.FrontSide, roughness: 0.4 }) : defaultLiveryMat, [loadedTextures.right, defaultLiveryMat]);
  const matTop = useMemo(() => loadedTextures.top ? new THREE.MeshStandardMaterial({ map: loadedTextures.top, transparent: true, side: THREE.FrontSide, roughness: 0.4 }) : defaultLiveryMat, [loadedTextures.top, defaultLiveryMat]);
  const matFront = useMemo(() => loadedTextures.front ? new THREE.MeshStandardMaterial({ map: loadedTextures.front, transparent: true, side: THREE.FrontSide, roughness: 0.4 }) : defaultLiveryMat, [loadedTextures.front, defaultLiveryMat]);
  const matRear = useMemo(() => loadedTextures.rear ? new THREE.MeshStandardMaterial({ map: loadedTextures.rear, transparent: true, side: THREE.FrontSide, roughness: 0.4 }) : defaultLiveryMat, [loadedTextures.rear, defaultLiveryMat]);

  // Animate wheels each frame
  useFrame((_, delta) => {
    const dt = Math.min(delta, 0.05);
    wheelRotationRef.current += (speed * dt) / 0.35; // adjusted for new tire radius

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

  // Detailed stylized sports sedan geometry
  return (
    <group ref={actualGroupRef} position={position}>
      {/* === LOWER CHASSIS & MAIN BODY === */}
      {/* Center Body block (flat sides at X = ±0.95 for livery mapping) */}
      <mesh castShadow receiveShadow position={[0, 0.25, 0]} material={bodyMat}>
        <boxGeometry args={[1.9, 0.5, 2.2]} />
      </mesh>
      
      {/* Front Hood (sloped slightly) */}
      <mesh castShadow receiveShadow position={[0, 0.22, 1.65]} rotation={[-0.05, 0, 0]} material={bodyMat}>
        <boxGeometry args={[1.9, 0.43, 1.2]} />
      </mesh>

      {/* Rear Trunk (sloped slightly) */}
      <mesh castShadow receiveShadow position={[0, 0.26, -1.55]} rotation={[0.02, 0, 0]} material={bodyMat}>
        <boxGeometry args={[1.9, 0.48, 1.0]} />
      </mesh>
      
      {/* Wheel Wells (dark boxes to hide the internal body where wheels sit) */}
      {[ [0.75, 0.1, 1.5], [-0.75, 0.1, 1.5], [0.75, 0.1, -1.45], [-0.75, 0.1, -1.45] ].map((pos, i) => (
        <mesh castShadow receiveShadow key={`well-${i}`} position={pos as [number,number,number]} material={chassisMat}>
          <boxGeometry args={[0.3, 0.5, 0.9]} />
        </mesh>
      ))}

      {/* === BUMPERS & TRIM === */}
      {/* Front Bumper */}
      <mesh castShadow receiveShadow position={[0, 0.05, 2.26]} material={darkMat}>
        <boxGeometry args={[1.95, 0.15, 0.15]} />
      </mesh>
      {/* Rear Bumper */}
      <mesh castShadow receiveShadow position={[0, 0.08, -2.06]} material={darkMat}>
        <boxGeometry args={[1.95, 0.15, 0.15]} />
      </mesh>
      {/* Side Molding Line */}
      <mesh castShadow receiveShadow position={[0.96, 0.25, 0]} material={darkMat}>
        <boxGeometry args={[0.02, 0.04, 4.2]} />
      </mesh>
      <mesh castShadow receiveShadow position={[-0.96, 0.25, 0]} material={darkMat}>
        <boxGeometry args={[0.02, 0.04, 4.2]} />
      </mesh>
      {/* Side Skirts */}
      <mesh castShadow receiveShadow position={[0.96, 0.0, 0.05]} material={darkMat}>
        <boxGeometry args={[0.04, 0.08, 2.0]} />
      </mesh>
      <mesh castShadow receiveShadow position={[-0.96, 0.0, 0.05]} material={darkMat}>
        <boxGeometry args={[0.04, 0.08, 2.0]} />
      </mesh>

      {/* === FRONT FASCIA DETAILS === */}
      {/* Grille Base */}
      <mesh castShadow receiveShadow position={[0, 0.32, 2.28]} material={darkMat}>
        <boxGeometry args={[1.2, 0.18, 0.05]} />
      </mesh>
      {/* Headlights */}
      <mesh castShadow receiveShadow position={[0.7, 0.32, 2.28]} material={lightMat}>
        <boxGeometry args={[0.25, 0.15, 0.06]} />
      </mesh>
      <mesh castShadow receiveShadow position={[-0.7, 0.32, 2.28]} material={lightMat}>
        <boxGeometry args={[0.25, 0.15, 0.06]} />
      </mesh>
      {/* Front Turn Signals */}
      <mesh castShadow receiveShadow position={[0.9, 0.32, 2.28]} material={orangeLightMat}>
        <boxGeometry args={[0.1, 0.15, 0.06]} />
      </mesh>
      <mesh castShadow receiveShadow position={[-0.9, 0.32, 2.28]} material={orangeLightMat}>
        <boxGeometry args={[0.1, 0.15, 0.06]} />
      </mesh>
      {/* Front License Plate */}
      <mesh castShadow receiveShadow position={[0, 0.05, 2.34]} material={whiteMat}>
        <boxGeometry args={[0.35, 0.1, 0.02]} />
      </mesh>

      {/* === REAR FASCIA DETAILS === */}
      {/* Taillight Assembly Base */}
      <mesh castShadow receiveShadow position={[0, 0.35, -2.07]} material={darkMat}>
        <boxGeometry args={[1.8, 0.18, 0.05]} />
      </mesh>
      {/* Main Red Taillights */}
      <mesh castShadow receiveShadow position={[0.65, 0.35, -2.08]} material={redLightMat}>
        <boxGeometry args={[0.45, 0.14, 0.06]} />
      </mesh>
      <mesh castShadow receiveShadow position={[-0.65, 0.35, -2.08]} material={redLightMat}>
        <boxGeometry args={[0.45, 0.14, 0.06]} />
      </mesh>
      {/* Rear Turn Signals */}
      <mesh castShadow receiveShadow position={[0.3, 0.35, -2.08]} material={orangeLightMat}>
        <boxGeometry args={[0.15, 0.14, 0.06]} />
      </mesh>
      <mesh castShadow receiveShadow position={[-0.3, 0.35, -2.08]} material={orangeLightMat}>
        <boxGeometry args={[0.15, 0.14, 0.06]} />
      </mesh>
      {/* Rear License Plate */}
      <mesh castShadow receiveShadow position={[0, 0.35, -2.08]} material={whiteMat}>
        <boxGeometry args={[0.35, 0.12, 0.06]} />
      </mesh>
      {/* Exhaust Pipe */}
      <mesh castShadow receiveShadow position={[0.65, -0.02, -2.15]} rotation={[Math.PI / 2, 0, 0]} material={hubMat}>
        <cylinderGeometry args={[0.04, 0.04, 0.2, 8]} />
      </mesh>

      {/* === CABIN / GREENHOUSE === */}
      {/* Main Cabin Core (creates inner color for pillars) */}
      <mesh castShadow receiveShadow position={[0, 0.72, -0.2]} material={bodyMat}>
        <boxGeometry args={[1.65, 0.45, 1.8]} />
      </mesh>
      
      {/* Roof */}
      <mesh castShadow receiveShadow position={[0, 0.95, -0.2]} material={bodyMat}>
        <boxGeometry args={[1.65, 0.05, 1.2]} />
      </mesh>

      {/* Windshield */}
      <mesh castShadow receiveShadow position={[0, 0.73, 0.6]} rotation={[0.55, 0, 0]} material={glassMat}>
        <boxGeometry args={[1.6, 0.6, 0.05]} />
      </mesh>

      {/* Rear Window */}
      <mesh castShadow receiveShadow position={[0, 0.73, -0.95]} rotation={[-0.45, 0, 0]} material={glassMat}>
        <boxGeometry args={[1.6, 0.55, 0.05]} />
      </mesh>

      {/* Side Windows (Dark Glass) */}
      <mesh castShadow receiveShadow position={[0.83, 0.72, -0.2]} material={glassMat}>
        <boxGeometry args={[0.02, 0.4, 1.3]} />
      </mesh>
      <mesh castShadow receiveShadow position={[-0.83, 0.72, -0.2]} material={glassMat}>
        <boxGeometry args={[0.02, 0.4, 1.3]} />
      </mesh>

      {/* B-Pillars (Middle) */}
      <mesh castShadow receiveShadow position={[0.84, 0.72, -0.2]} material={bodyMat}>
        <boxGeometry args={[0.02, 0.4, 0.12]} />
      </mesh>
      <mesh castShadow receiveShadow position={[-0.84, 0.72, -0.2]} material={bodyMat}>
        <boxGeometry args={[0.02, 0.4, 0.12]} />
      </mesh>

      {/* Side Mirrors */}
      <mesh castShadow receiveShadow position={[0.95, 0.6, 0.4]} material={bodyMat}>
        <boxGeometry args={[0.25, 0.12, 0.15]} />
      </mesh>
      <mesh position={[-0.95, 0.6, 0.4]} material={bodyMat}>
        <boxGeometry args={[0.25, 0.12, 0.15]} />
      </mesh>

      {/* === LIVERY PANELS === */}
      {/* Panels sit exactly 0.01 units off the main body surfaces to prevent z-fighting */}
      {/* Right side */}
      <mesh position={[0.96, 0.25, 0]} rotation={[0, Math.PI / 2, 0]} material={matRight}>
        <planeGeometry args={[4.2, 0.55]} />
      </mesh>
      {/* Left side (mirrored) */}
      <mesh position={[-0.96, 0.25, 0]} rotation={[0, -Math.PI / 2, 0]} material={matLeft}>
        <planeGeometry args={[4.2, 0.55]} />
      </mesh>
      {/* Front bumper panel */}
      <mesh position={[0, 0.25, 2.26]} rotation={[0, 0, 0]} material={matFront}>
        <planeGeometry args={[1.9, 0.4]} />
      </mesh>
      {/* Rear bumper panel */}
      <mesh position={[0, 0.25, -2.06]} rotation={[0, Math.PI, 0]} material={matRear}>
        <planeGeometry args={[1.9, 0.4]} />
      </mesh>
      {/* Top - Hood */}
      <mesh position={[0, 0.44, 1.6]} rotation={[-Math.PI / 2 - 0.05, 0, 0]} material={matTop}>
        <planeGeometry args={[1.9, 1.2]} />
      </mesh>
      {/* Top - Roof */}
      <mesh position={[0, 0.98, -0.2]} rotation={[-Math.PI / 2, 0, 0]} material={matTop}>
        <planeGeometry args={[1.65, 1.2]} />
      </mesh>
      {/* Top - Trunk */}
      <mesh position={[0, 0.51, -1.5]} rotation={[-Math.PI / 2 + 0.02, 0, 0]} material={matTop}>
        <planeGeometry args={[1.9, 1.0]} />
      </mesh>

      {/* === WHEELS === */}
      {WHEEL_POSITIONS.map((pos, i) => {
        const refs = [wheelRef0, wheelRef1, wheelRef2, wheelRef3];
        // Shift wheel slightly outward to fit perfectly in the well
        const shiftX = pos[0] > 0 ? 0.05 : -0.05;
        // Shift back wheels slightly to match new body length
        const shiftZ = pos[2] < 0 ? 0.05 : 0;
        
        return (
          <group key={i} position={[pos[0] + shiftX, pos[1] + 0.05, pos[2] + shiftZ]}>
            {/* Tire (Rounded cylinder for thicker, realistic look) */}
            <mesh ref={refs[i]} rotation={[0, 0, Math.PI / 2]} material={wheelMat}>
              <cylinderGeometry args={[0.35, 0.35, 0.25, 24]} />
            </mesh>
            {/* Rim Base */}
            <mesh rotation={[0, 0, Math.PI / 2]} material={darkMat} position={[i % 2 === 0 ? -0.1 : 0.1, 0, 0]}>
              <cylinderGeometry args={[0.22, 0.22, 0.06, 16]} />
            </mesh>
            {/* Inner Hub/Alloy */}
            <mesh rotation={[0, 0, Math.PI / 2]} material={hubMat} position={[i % 2 === 0 ? -0.11 : 0.11, 0, 0]}>
              <cylinderGeometry args={[0.20, 0.20, 0.05, 12]} />
            </mesh>
          </group>
        );
      })}

      {/* Chassis Underside (blocks light leak from below) */}
      <mesh position={[0, -0.1, 0]} material={chassisMat}>
        <boxGeometry args={[1.8, 0.1, 4.0]} />
      </mesh>
    </group>
  );
}
