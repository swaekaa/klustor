import { useRef, useEffect, useState, useMemo, type RefObject } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { useGlobalLeaderboardStore } from '../../store/globalLeaderboardStore';
import { buildLiveryTexture, createFallbackTexture } from '../utils/liveryTexture';
import type { TemplateView } from '../../types';

// ============================================================
// LeaderGhost.tsx — Real-time 3D ghost car for current leader
//
// Lives inside <Canvas>. Smoothly interpolates between network
// position packets at 10Hz using lerp/slerp. Uses the existing
// PlayerCar geometry with transparency + cyan glow.
// If local player is leader, ghost is hidden entirely.
// ============================================================

interface LeaderGhostProps {
  localPlayerId: string | null;
}

// ── Ghost Car geometry (same structure as PlayerCar, ghost materials) ─────────

function GhostCar({ ghostRef, textures, visibleRef }: {
  ghostRef: RefObject<THREE.Group>;
  textures: Partial<Record<TemplateView, THREE.Texture>>;
  visibleRef: RefObject<boolean>;
}) {
  const opacityRef = useRef(0);

  const ghostMat = useMemo(() => new THREE.MeshPhysicalMaterial({
    color: '#C8D8E8', roughness: 0.2, metalness: 0.1, clearcoat: 1.0,
    transparent: true, opacity: 0.72,
  }), []);
  const darkMat = useMemo(() => new THREE.MeshStandardMaterial({ color: '#1A2530', roughness: 0.8, transparent: true, opacity: 0.72 }), []);
  const glassMat = useMemo(() => new THREE.MeshPhysicalMaterial({ color: '#111', roughness: 0.1, metalness: 0.9, transparent: true, opacity: 0.4 }), []);
  const wheelMat = useMemo(() => new THREE.MeshStandardMaterial({ color: '#111315', roughness: 0.9, transparent: true, opacity: 0.72 }), []);
  const glowMat = useMemo(() => new THREE.MeshStandardMaterial({
    color: '#00FFFF', emissive: new THREE.Color('#00FFFF'), emissiveIntensity: 2.0,
    transparent: true, opacity: 0.35, side: THREE.DoubleSide, wireframe: false,
  }), []);
  
  const defaultLivery = useMemo(() => new THREE.MeshStandardMaterial({ color: '#FFFFFF', transparent: true, opacity: 0, side: THREE.FrontSide }), []);
  const matLeft = useMemo(() => textures.left ? new THREE.MeshStandardMaterial({ map: textures.left, transparent: true, side: THREE.FrontSide, roughness: 0.4, opacity: 0.85 }) : defaultLivery, [textures.left, defaultLivery]);
  const matRight = useMemo(() => textures.right ? new THREE.MeshStandardMaterial({ map: textures.right, transparent: true, side: THREE.FrontSide, roughness: 0.4, opacity: 0.85 }) : defaultLivery, [textures.right, defaultLivery]);
  const matTop = useMemo(() => textures.top ? new THREE.MeshStandardMaterial({ map: textures.top, transparent: true, side: THREE.FrontSide, roughness: 0.4, opacity: 0.85 }) : defaultLivery, [textures.top, defaultLivery]);
  const matFront = useMemo(() => textures.front ? new THREE.MeshStandardMaterial({ map: textures.front, transparent: true, side: THREE.FrontSide, roughness: 0.4, opacity: 0.85 }) : defaultLivery, [textures.front, defaultLivery]);
  const matRear = useMemo(() => textures.rear ? new THREE.MeshStandardMaterial({ map: textures.rear, transparent: true, side: THREE.FrontSide, roughness: 0.4, opacity: 0.85 }) : defaultLivery, [textures.rear, defaultLivery]);

  const WHEEL_POSITIONS: [number, number, number][] = [
    [-1.1, -0.35, 1.5], [1.1, -0.35, 1.5], [-1.1, -0.35, -1.5], [1.1, -0.35, -1.5],
  ];

  // Fade group opacity via ref — no React re-renders
  useFrame((_, delta) => {
    if (!ghostRef.current) return;
    const target = (visibleRef.current ?? false) ? 1.0 : 0.0;
    opacityRef.current = THREE.MathUtils.lerp(opacityRef.current, target, delta * 4);
    ghostRef.current.visible = opacityRef.current > 0.01;
  });

  return (
    <group ref={ghostRef}>
      {/* Main body */}
      <mesh position={[0, 0.25, 0]} material={ghostMat}><boxGeometry args={[1.9, 0.5, 2.2]} /></mesh>
      <mesh position={[0, 0.22, 1.65]} material={ghostMat}><boxGeometry args={[1.9, 0.43, 1.2]} /></mesh>
      <mesh position={[0, 0.26, -1.55]} material={ghostMat}><boxGeometry args={[1.9, 0.48, 1.0]} /></mesh>
      {/* Cabin */}
      <mesh position={[0, 0.72, -0.2]} material={ghostMat}><boxGeometry args={[1.65, 0.45, 1.8]} /></mesh>
      <mesh position={[0, 0.95, -0.2]} material={ghostMat}><boxGeometry args={[1.65, 0.05, 1.2]} /></mesh>
      {/* Windshield */}
      <mesh position={[0, 0.73, 0.6]} rotation={[0.55, 0, 0]} material={glassMat}><boxGeometry args={[1.6, 0.6, 0.05]} /></mesh>
      {/* Bumpers */}
      <mesh position={[0, 0.05, 2.26]} material={darkMat}><boxGeometry args={[1.95, 0.15, 0.15]} /></mesh>
      <mesh position={[0, 0.08, -2.06]} material={darkMat}><boxGeometry args={[1.95, 0.15, 0.15]} /></mesh>
      {/* Livery panels */}
      <mesh position={[0.96, 0.25, 0]} rotation={[0, Math.PI / 2, 0]} material={matRight}><planeGeometry args={[4.2, 0.55]} /></mesh>
      <mesh position={[-0.96, 0.25, 0]} rotation={[0, -Math.PI / 2, 0]} material={matLeft}><planeGeometry args={[4.2, 0.55]} /></mesh>
      <mesh position={[0, 0.25, 2.26]} rotation={[0, 0, 0]} material={matFront}><planeGeometry args={[1.9, 0.4]} /></mesh>
      <mesh position={[0, 0.25, -2.06]} rotation={[0, Math.PI, 0]} material={matRear}><planeGeometry args={[1.9, 0.4]} /></mesh>
      <mesh position={[0, 0.44, 1.6]} rotation={[-Math.PI / 2 - 0.05, 0, 0]} material={matTop}><planeGeometry args={[1.9, 1.2]} /></mesh>
      {/* Wheels */}
      {WHEEL_POSITIONS.map((pos, i) => (
        <group key={i} position={[pos[0] + (pos[0] > 0 ? 0.05 : -0.05), pos[1] + 0.05, pos[2] + (pos[2] < 0 ? 0.05 : 0)]}>
          <mesh rotation={[0, 0, Math.PI / 2]} material={wheelMat}><cylinderGeometry args={[0.35, 0.35, 0.25, 16]} /></mesh>
        </group>
      ))}
      {/* Cyan outline glow — makes ghost visually distinct from regular cars */}
      <mesh position={[0, 0.4, 0]} material={glowMat}><boxGeometry args={[2.1, 1.0, 2.45]} /></mesh>
      {/* Point light — subtle blue-cyan tint around ghost */}
      <pointLight position={[0, 0.5, 0]} color="#00CCFF" intensity={1.5} distance={6} />
    </group>
  );
}

// ── Main LeaderGhost component ────────────────────────────────

export default function LeaderGhost({ localPlayerId }: LeaderGhostProps) {
  const { liveLeader } = useGlobalLeaderboardStore();

  const ghostGroupRef = useRef<THREE.Group>(null!);
  const currentPos = useRef(new THREE.Vector3(0, -100, 0));
  const targetPos = useRef(new THREE.Vector3(0, -100, 0));
  const currentQuat = useRef(new THREE.Quaternion());
  const targetQuat = useRef(new THREE.Quaternion());
  const visibleRef = useRef(false);
  
  // Loaded livery textures
  const [loadedTextures, setLoadedTextures] = useState<Partial<Record<TemplateView, THREE.Texture>>>({});
  const prevLiveryKeyRef = useRef<string | null>(null);

  // Determine visibility
  const isLocalPlayerLeader = !!localPlayerId && liveLeader.leaderId === localPlayerId;
  const shouldShow = liveLeader.leaderId !== null && !isLocalPlayerLeader && liveLeader.position !== null;
  visibleRef.current = shouldShow;

  // ── Interpolate position/rotation each frame ───────────────
  useFrame(() => {
    if (!ghostGroupRef.current) return;

    if (liveLeader.position && shouldShow) {
      targetPos.current.set(liveLeader.position.x, liveLeader.position.y, liveLeader.position.z);
    }
    if (liveLeader.rotation && shouldShow) {
      targetQuat.current.setFromEuler(
        new THREE.Euler(liveLeader.rotation.x, liveLeader.rotation.y, liveLeader.rotation.z)
      );
    }

    currentPos.current.lerp(targetPos.current, 0.15);
    currentQuat.current.slerp(targetQuat.current, 0.15);

    ghostGroupRef.current.position.copy(currentPos.current);
    ghostGroupRef.current.quaternion.copy(currentQuat.current);
  });

  // ── Load livery when leader changes ───────────────────────
  useEffect(() => {
    const livery = liveLeader.livery;
    const liveryKey = livery ? Object.keys(livery).sort().join('|') : null;
    
    if (liveryKey === prevLiveryKeyRef.current) return;
    prevLiveryKeyRef.current = liveryKey;

    if (!livery || Object.keys(livery).length === 0) {
      setLoadedTextures({});
      return;
    }

    let disposed = false;
    const views = ['left', 'right', 'top', 'front', 'rear'] as TemplateView[];

    async function load() {
      const newTextures: Partial<Record<TemplateView, THREE.Texture>> = {};
      for (const view of views) {
        const url = (livery as Record<string, string>)[view];
        if (!url) continue;
        try {
          const tex = await buildLiveryTexture(url);
          if (!disposed) newTextures[view] = tex;
        } catch {
          if (!disposed) newTextures[view] = createFallbackTexture();
        }
      }
      if (!disposed) {
        setLoadedTextures(prev => {
          // Dispose old textures
          Object.values(prev).forEach(t => t?.dispose());
          return { ...newTextures };
        });
      }
    }

    load();
    return () => { disposed = true; };
  }, [liveLeader.livery]);

  // Cleanup textures on unmount
  useEffect(() => {
    return () => {
      setLoadedTextures(prev => {
        Object.values(prev).forEach(t => t?.dispose());
        return {};
      });
    };
  }, []);

  return (
    <GhostCar
      ghostRef={ghostGroupRef}
      textures={loadedTextures}
      visibleRef={visibleRef}
    />
  );
}
