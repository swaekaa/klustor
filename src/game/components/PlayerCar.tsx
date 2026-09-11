import { useRef, useEffect, useState, useMemo, type RefObject } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { buildLiveryTexture, createFallbackTexture } from '../utils/liveryTexture';

// ============================================================
// PlayerCar — Stylized low-poly sports car with livery panels
// Car forward direction: local +Z axis
// Materials are memoized to avoid recreation each render
// ============================================================

interface PlayerCarProps {
  groupRef: RefObject<THREE.Group>;
  liveryDataUrl?: string;
  speed?: number;
  steering?: number;
}

const WHEEL_POSITIONS: [number, number, number][] = [
  [-1.1, -0.35, 1.5],  // front-right
  [1.1, -0.35, 1.5],   // front-left
  [-1.1, -0.35, -1.5], // rear-right
  [1.1, -0.35, -1.5],  // rear-left
];

export default function PlayerCar({ groupRef, liveryDataUrl, speed = 0, steering = 0 }: PlayerCarProps) {
  const [liveryTexture, setLiveryTexture] = useState<THREE.Texture | null>(null);
  const wheelRef0 = useRef<THREE.Mesh>(null!);
  const wheelRef1 = useRef<THREE.Mesh>(null!);
  const wheelRef2 = useRef<THREE.Mesh>(null!);
  const wheelRef3 = useRef<THREE.Mesh>(null!);
  const wheelRefs = [wheelRef0, wheelRef1, wheelRef2, wheelRef3];
  const wheelRotationRef = useRef(0);

  // Load livery texture
  useEffect(() => {
    let disposed = false;
    let tex: THREE.Texture | null = null;

    async function load() {
      if (liveryDataUrl) {
        try {
          tex = await buildLiveryTexture(liveryDataUrl, '/car-template.svg');
          if (!disposed) setLiveryTexture(tex);
        } catch {
          if (!disposed) setLiveryTexture(createFallbackTexture());
        }
      } else {
        if (!disposed) setLiveryTexture(createFallbackTexture());
      }
    }
    load();

    return () => {
      disposed = true;
      tex?.dispose();
    };
  }, [liveryDataUrl]);

  // Memoize materials — recreated only when texture changes
  const bodyMat = useMemo(() => new THREE.MeshLambertMaterial({ color: '#C8D8E8' }), []);
  const darkMat = useMemo(() => new THREE.MeshLambertMaterial({ color: '#2A3540' }), []);
  const glassMat = useMemo(() => new THREE.MeshLambertMaterial({ color: '#A8D0E6', transparent: true, opacity: 0.5 }), []);
  const wheelMat = useMemo(() => new THREE.MeshLambertMaterial({ color: '#1A2030' }), []);
  const hubMat = useMemo(() => new THREE.MeshLambertMaterial({ color: '#C8C8C8' }), []);
  const lightMat = useMemo(() => new THREE.MeshLambertMaterial({ color: '#FFEEAA', emissive: new THREE.Color('#FFDD88'), emissiveIntensity: 0.5 }), []);
  const redLightMat = useMemo(() => new THREE.MeshLambertMaterial({ color: '#FF4444', emissive: new THREE.Color('#FF2222'), emissiveIntensity: 0.4 }), []);
  const chassisMat = useMemo(() => new THREE.MeshLambertMaterial({ color: '#1A2030' }), []);

  const liveryMat = useMemo(() => liveryTexture
    ? new THREE.MeshLambertMaterial({ map: liveryTexture, transparent: true, side: THREE.FrontSide })
    : new THREE.MeshLambertMaterial({ color: '#FAF9F3', transparent: true, opacity: 0.9 }),
    [liveryTexture]
  );

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

      {/* === LIVERY SIDE PANELS === */}
      {/* Right side */}
      <mesh position={[1.06, 0.2, -0.15]} material={liveryMat}>
        <planeGeometry args={[3.6, 0.48]} />
      </mesh>
      {/* Left side (mirrored) */}
      <mesh position={[-1.06, 0.2, -0.15]} rotation={[0, Math.PI, 0]} material={liveryMat}>
        <planeGeometry args={[3.6, 0.48]} />
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
