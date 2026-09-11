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
  const redLightMat = useMemo(() => new THREE.MeshStandardMaterial({ color: '#FF0000', emissive: new THREE.Color('#FF0000'), emissiveIntensity: 2.0 }), []);
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

  // Detailed sports car geometry
  return (
    <group ref={actualGroupRef} position={position}>
      {/* === LOWER BODY === */}
      {/* Main Chassis */}
      <mesh position={[0, 0.25, 0]} material={bodyMat}>
        <boxGeometry args={[1.9, 0.4, 4.2]} />
      </mesh>
      
      {/* Front Nose/Hood */}
      <mesh position={[0, 0.35, 1.6]} rotation={[-0.15, 0, 0]} material={bodyMat}>
        <boxGeometry args={[1.85, 0.3, 1.2]} />
      </mesh>
      
      {/* Rear Trunk */}
      <mesh position={[0, 0.38, -1.7]} rotation={[0.05, 0, 0]} material={bodyMat}>
        <boxGeometry args={[1.85, 0.35, 0.9]} />
      </mesh>

      {/* === CABIN / GREENHOUSE === */}
      <mesh position={[0, 0.75, -0.2]} material={bodyMat}>
        <boxGeometry args={[1.6, 0.45, 2.0]} />
      </mesh>

      {/* Windshield */}
      <mesh position={[0, 0.73, 0.9]} rotation={[0.45, 0, 0]} material={glassMat}>
        <boxGeometry args={[1.45, 0.55, 0.05]} />
      </mesh>

      {/* Rear Window */}
      <mesh position={[0, 0.73, -1.25]} rotation={[-0.35, 0, 0]} material={glassMat}>
        <boxGeometry args={[1.45, 0.55, 0.05]} />
      </mesh>

      {/* Side Windows */}
      <mesh position={[0.81, 0.75, -0.2]} material={glassMat}>
        <boxGeometry args={[0.05, 0.4, 1.5]} />
      </mesh>
      <mesh position={[-0.81, 0.75, -0.2]} material={glassMat}>
        <boxGeometry args={[0.05, 0.4, 1.5]} />
      </mesh>

      {/* === DETAILS === */}
      {/* Front Grille */}
      <mesh position={[0, 0.2, 2.11]} material={darkMat}>
        <boxGeometry args={[1.2, 0.2, 0.05]} />
      </mesh>
      <mesh position={[0, 0.05, 2.11]} material={darkMat}>
        <boxGeometry args={[1.4, 0.1, 0.05]} />
      </mesh>

      {/* Headlights */}
      <mesh position={[0.7, 0.32, 2.1]} rotation={[-0.1, 0.1, 0]} material={lightMat}>
        <boxGeometry args={[0.35, 0.12, 0.05]} />
      </mesh>
      <mesh position={[-0.7, 0.32, 2.1]} rotation={[-0.1, -0.1, 0]} material={lightMat}>
        <boxGeometry args={[0.35, 0.12, 0.05]} />
      </mesh>

      {/* Taillights */}
      <mesh position={[0.65, 0.4, -2.11]} material={redLightMat}>
        <boxGeometry args={[0.4, 0.12, 0.05]} />
      </mesh>
      <mesh position={[-0.65, 0.4, -2.11]} material={redLightMat}>
        <boxGeometry args={[0.4, 0.12, 0.05]} />
      </mesh>
      {/* Light bar */}
      <mesh position={[0, 0.4, -2.11]} material={redLightMat}>
        <boxGeometry args={[0.9, 0.05, 0.05]} />
      </mesh>

      {/* Rear Diffuser & Exhausts */}
      <mesh position={[0, 0.1, -2.05]} material={darkMat}>
        <boxGeometry args={[1.6, 0.15, 0.2]} />
      </mesh>
      <mesh position={[0.5, 0.05, -2.16]} material={hubMat}>
        <cylinderGeometry args={[0.06, 0.06, 0.1]} />
      </mesh>
      <mesh position={[-0.5, 0.05, -2.16]} material={hubMat}>
        <cylinderGeometry args={[0.06, 0.06, 0.1]} />
      </mesh>

      {/* Rear Spoiler */}
      <mesh position={[0, 0.65, -1.95]} material={bodyMat}>
        <boxGeometry args={[1.7, 0.05, 0.3]} />
      </mesh>
      <mesh position={[0.6, 0.58, -1.9]} material={darkMat}>
        <boxGeometry args={[0.05, 0.15, 0.15]} />
      </mesh>
      <mesh position={[-0.6, 0.58, -1.9]} material={darkMat}>
        <boxGeometry args={[0.05, 0.15, 0.15]} />
      </mesh>

      {/* Mirrors */}
      <mesh position={[0.9, 0.6, 0.4]} material={bodyMat}>
        <boxGeometry args={[0.2, 0.1, 0.15]} />
      </mesh>
      <mesh position={[-0.9, 0.6, 0.4]} material={bodyMat}>
        <boxGeometry args={[0.2, 0.1, 0.15]} />
      </mesh>

      {/* Side Skirts */}
      <mesh position={[0.96, 0.05, 0]} material={darkMat}>
        <boxGeometry args={[0.05, 0.1, 2.2]} />
      </mesh>
      <mesh position={[-0.96, 0.05, 0]} material={darkMat}>
        <boxGeometry args={[0.05, 0.1, 2.2]} />
      </mesh>

      {/* === LIVERY PANELS === */}
      {/* Right side */}
      <mesh position={[0.96, 0.25, 0]} rotation={[0, Math.PI / 2, 0]} material={matRight}>
        <planeGeometry args={[4.2, 0.55]} />
      </mesh>
      {/* Left side (mirrored) */}
      <mesh position={[-0.96, 0.25, 0]} rotation={[0, -Math.PI / 2, 0]} material={matLeft}>
        <planeGeometry args={[4.2, 0.55]} />
      </mesh>
      {/* Front bumper panel */}
      <mesh position={[0, 0.25, 2.12]} rotation={[0, 0, 0]} material={matFront}>
        <planeGeometry args={[1.9, 0.4]} />
      </mesh>
      {/* Rear bumper panel */}
      <mesh position={[0, 0.25, -2.12]} rotation={[0, Math.PI, 0]} material={matRear}>
        <planeGeometry args={[1.9, 0.4]} />
      </mesh>
      {/* Top - Hood */}
      <mesh position={[0, 0.51, 1.6]} rotation={[-Math.PI / 2 - 0.15, 0, 0]} material={matTop}>
        <planeGeometry args={[1.85, 1.2]} />
      </mesh>
      {/* Top - Roof */}
      <mesh position={[0, 0.98, -0.2]} rotation={[-Math.PI / 2, 0, 0]} material={matTop}>
        <planeGeometry args={[1.6, 2.0]} />
      </mesh>
      {/* Top - Trunk */}
      <mesh position={[0, 0.56, -1.7]} rotation={[-Math.PI / 2 + 0.05, 0, 0]} material={matTop}>
        <planeGeometry args={[1.85, 0.9]} />
      </mesh>

      {/* === WHEELS === */}
      {WHEEL_POSITIONS.map((pos, i) => {
        const refs = [wheelRef0, wheelRef1, wheelRef2, wheelRef3];
        return (
          <group key={i} position={pos}>
            {/* Tire */}
            <mesh ref={refs[i]} rotation={[0, 0, Math.PI / 2]} material={wheelMat}>
              <cylinderGeometry args={[0.38, 0.38, 0.25, 16]} />
            </mesh>
            {/* Rim */}
            <mesh rotation={[0, 0, Math.PI / 2]} material={hubMat} position={[i % 2 === 0 ? -0.13 : 0.13, 0, 0]}>
              <cylinderGeometry args={[0.22, 0.22, 0.05, 12]} />
            </mesh>
          </group>
        );
      })}

      {/* Chassis underside */}
      <mesh position={[0, -0.35, 0]} material={chassisMat}>
        <boxGeometry args={[1.8, 0.05, 3.8]} />
      </mesh>
    </group>
  );
}
