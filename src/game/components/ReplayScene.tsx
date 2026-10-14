import * as THREE from 'three';
import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import Track from './Track';
import ViceCoastEnvironment from './ViceCoastEnvironment';
import PlayerCar from './PlayerCar';
import RacingLineOverlay from './RacingLineOverlay';
import type { ReplayDataset } from '../../KRPO/src/simulation/ReplayTypes';
import type { RunTypeKey } from '../data/krpoReplayStore';
import { sampleReplayState } from '../data/krpoReplayStore';
import type { LiveOptimizerSnapshot, LiveCandidateState } from '../data/krpoLiveLearning';

// ============================================================
// ReplayScene.tsx — 3D Multi-Run Studio & Live Optimizer Viewport
// Features:
//   1. Simultaneous 4-run racing playback (Best, Baseline, Early, Failed Crash)
//   2. Live Real-Time Learning simulation with autonomous candidate swarm
//   3. Robust Camera tracking (Chase, Overhead, Hood) with instant mode snap
//   4. Nitrous Flame thruster effects with Shift boost
// ============================================================

export type CameraViewMode = 'chase' | 'overhead' | 'hood';
export type FocusCarTarget = 'best' | 'baseline' | 'early' | 'failed' | 'live_hero';

export interface VisibleRunsState {
  best: boolean;
  baseline: boolean;
  early: boolean;
  failed: boolean;
}

export interface ReplaySceneProps {
  appMode: 'replay' | 'live';
  activeReplay: ReplayDataset;
  allReplays: Record<RunTypeKey, ReplayDataset>;
  currentTime: number;
  visibleRuns: VisibleRunsState;
  focusTarget: FocusCarTarget;
  showRacingLine?: boolean;
  cameraMode: CameraViewMode;
  isShiftBoosting: boolean;
  liveSnapshot?: LiveOptimizerSnapshot;
}

// ── Nitrous Exhaust Flame Mesh (Tracks Car Position & Rotation) ─
function FollowCarNitroFlame({
  carRef,
  visible,
}: {
  carRef: React.RefObject<THREE.Group>;
  visible: boolean;
}) {
  const flameRef = useRef<THREE.Group>(null!);

  useFrame(() => {
    if (!flameRef.current || !carRef.current) return;
    flameRef.current.position.copy(carRef.current.position);
    flameRef.current.rotation.y = carRef.current.rotation.y;
  });

  if (!visible) return null;

  return (
    <group ref={flameRef}>
      <group position={[0, 0.45, -2.1]}>
        {/* Left Exhaust Flame */}
        <mesh position={[-0.55, 0, 0]} rotation={[Math.PI / 2, 0, 0]}>
          <coneGeometry args={[0.2, 1.1, 8]} />
          <meshBasicMaterial color="#00FFFF" transparent opacity={0.9} />
        </mesh>
        {/* Right Exhaust Flame */}
        <mesh position={[0.55, 0, 0]} rotation={[Math.PI / 2, 0, 0]}>
          <coneGeometry args={[0.2, 1.1, 8]} />
          <meshBasicMaterial color="#00FFFF" transparent opacity={0.9} />
        </mesh>
        {/* Central Nitrous Core Glow */}
        <pointLight color="#00FFFF" intensity={3.5} distance={8} />
      </group>
    </group>
  );
}

// ── Ghost Candidate Car for Simultaneous Playback ─────────────
function SimultaneousGhostCar({
  dataset,
  currentTime,
  color,
  badgeText,
  isCrashCandidate = false,
  groupRef,
}: {
  dataset: ReplayDataset;
  currentTime: number;
  color: string;
  badgeText: string;
  isCrashCandidate?: boolean;
  groupRef?: React.RefObject<THREE.Group>;
}) {
  const localRef = useRef<THREE.Group>(null!);
  const actualRef = groupRef || localRef;
  const isCollidingRef = useRef(false);

  useFrame(() => {
    if (!actualRef.current) return;
    const state = sampleReplayState(dataset, currentTime);
    if (!isNaN(state.position.x) && !isNaN(state.position.z)) {
      actualRef.current.position.copy(state.position);
    }
    if (!isNaN(state.rotationY)) {
      actualRef.current.rotation.y = state.rotationY;
    }
    isCollidingRef.current = state.isCollision;
  });

  return (
    <group ref={actualRef}>
      {/* Translucent Ghost Body */}
      <mesh position={[0, 0.45, 0]}>
        <boxGeometry args={[1.9, 0.55, 4.2]} />
        <meshStandardMaterial
          color={color}
          transparent
          opacity={0.42}
          emissive={color}
          emissiveIntensity={0.65}
        />
      </mesh>
      {/* Cabin */}
      <mesh position={[0, 0.9, -0.2]}>
        <boxGeometry args={[1.6, 0.45, 1.8]} />
        <meshStandardMaterial
          color={color}
          transparent
          opacity={0.28}
          emissive={color}
          emissiveIntensity={0.45}
        />
      </mesh>
      {/* Ghost Wheels */}
      {[-1.0, 1.0].map((x) =>
        [-1.4, 1.4].map((z) => (
          <mesh key={`${x}-${z}`} position={[x, 0.35, z]} rotation={[0, 0, Math.PI / 2]}>
            <cylinderGeometry args={[0.35, 0.35, 0.25, 12]} />
            <meshStandardMaterial color={color} transparent opacity={0.4} />
          </mesh>
        ))
      )}

      {/* Barrier Collision Sparks & Warning Halo (for Failed Run) */}
      {isCrashCandidate && (
        <mesh position={[0, 0.6, 0]}>
          <sphereGeometry args={[1.3, 8, 8]} />
          <meshBasicMaterial
            color="#FF0044"
            wireframe
            transparent
            opacity={0.5}
          />
        </mesh>
      )}

      {/* 3D Floating Nameplate Badge */}
      <group position={[0, 2.2, 0]}>
        <mesh rotation={[-Math.PI / 6, 0, 0]}>
          <planeGeometry args={[2.6, 0.5]} />
          <meshBasicMaterial color="#0A0E17" transparent opacity={0.88} side={THREE.DoubleSide} />
        </mesh>
        <mesh position={[0, 0, 0.02]} rotation={[-Math.PI / 6, 0, 0]}>
          <planeGeometry args={[2.5, 0.42]} />
          <meshBasicMaterial color={color} transparent opacity={0.92} side={THREE.DoubleSide} />
        </mesh>
      </group>
    </group>
  );
}

// ── Live Candidate Swarm Car ──────────────────────────────────
function LiveSwarmRacer({ candidate }: { candidate: LiveCandidateState }) {
  const groupRef = useRef<THREE.Group>(null!);

  useFrame(() => {
    if (!groupRef.current) return;
    groupRef.current.position.copy(candidate.position);
    groupRef.current.rotation.y = candidate.rotationY;
  });

  return (
    <group ref={groupRef}>
      <mesh position={[0, 0.45, 0]}>
        <boxGeometry args={[1.85, 0.52, 4.1]} />
        <meshStandardMaterial
          color={candidate.color}
          transparent
          opacity={0.4}
          emissive={candidate.color}
          emissiveIntensity={0.6}
        />
      </mesh>
      <mesh position={[0, 0.85, -0.2]}>
        <boxGeometry args={[1.5, 0.42, 1.7]} />
        <meshStandardMaterial
          color={candidate.color}
          transparent
          opacity={0.25}
          emissive={candidate.color}
          emissiveIntensity={0.4}
        />
      </mesh>
      <mesh position={[0, 2.0, 0]} rotation={[0, 0, Math.PI / 4]}>
        <octahedronGeometry args={[0.35]} />
        <meshBasicMaterial color={candidate.color} />
      </mesh>
    </group>
  );
}

// ── Dynamic Follow Sun ─────────────────────────────────────────
function FollowSun({ targetRef }: { targetRef: React.RefObject<THREE.Group> }) {
  const lightRef = useRef<THREE.DirectionalLight>(null);

  useFrame(() => {
    if (targetRef.current && lightRef.current) {
      const pos = targetRef.current.position;
      if (!isNaN(pos.x) && !isNaN(pos.z)) {
        lightRef.current.position.set(pos.x + 100, 120, pos.z - 60);
        lightRef.current.target.position.copy(pos);
        lightRef.current.target.updateMatrixWorld();
      }
    }
  });

  return (
    <directionalLight
      ref={lightRef}
      intensity={1.6}
      color="#FFE8B8"
      castShadow
      shadow-mapSize={[2048, 2048]}
      shadow-camera-left={-150}
      shadow-camera-right={150}
      shadow-camera-top={150}
      shadow-camera-bottom={-150}
      shadow-camera-near={0.1}
      shadow-camera-far={500}
      shadow-bias={-0.002}
    />
  );
}

// ── Authoritative Multi-Angle Camera Controller ───────────────
function ReplayCamera({
  targetRef,
  mode,
}: {
  targetRef: React.RefObject<THREE.Group>;
  mode: CameraViewMode;
}) {
  const currentPos = useRef(new THREE.Vector3());
  const currentLookAt = useRef(new THREE.Vector3());
  const initialized = useRef(false);
  const prevMode = useRef(mode);

  useFrame(({ camera }, delta) => {
    if (!targetRef.current) return;

    const dt = Math.min(delta, 0.05);
    const carPos = targetRef.current.position;
    if (isNaN(carPos.x) || isNaN(carPos.z)) return;

    const carRot = targetRef.current.rotation;

    // Backward and forward directions matching KLUSTOR's RaceCamera
    const backward = new THREE.Vector3(0, 0, -1).applyEuler(carRot);
    const forward = new THREE.Vector3(0, 0, 1).applyEuler(carRot);

    let distance = 12.0;
    let height = 5.8;
    let lookAhead = 8.0;
    let lookHeight = 1.2;
    let smoothing = 6.0;

    if (mode === 'hood') {
      distance = -0.5;
      height = 1.45;
      lookAhead = 12.0;
      lookHeight = 0.9;
      smoothing = 14.0;
    } else if (mode === 'overhead') {
      distance = 16.0;
      height = 28.0;
      lookAhead = 4.0;
      lookHeight = 0.0;
      smoothing = 4.5;
    } else {
      // chase view
      distance = 12.0;
      height = 5.8;
      lookAhead = 8.0;
      lookHeight = 1.2;
      smoothing = 6.0;
    }

    const targetPos = new THREE.Vector3(
      carPos.x + backward.x * distance,
      carPos.y + height,
      carPos.z + backward.z * distance
    );

    const targetLook = new THREE.Vector3(
      carPos.x + forward.x * lookAhead,
      carPos.y + lookHeight,
      carPos.z + forward.z * lookAhead
    );

    if (!initialized.current || prevMode.current !== mode) {
      currentPos.current.copy(targetPos);
      currentLookAt.current.copy(targetLook);
      initialized.current = true;
      prevMode.current = mode;
    } else {
      currentPos.current.lerp(targetPos, dt * smoothing);
      currentLookAt.current.lerp(targetLook, dt * (smoothing * 1.5));
    }

    camera.position.copy(currentPos.current);
    camera.lookAt(currentLookAt.current);
  });

  return null;
}

// ── Main Replay & Live Learning Scene ─────────────────────────
export default function ReplayScene({
  appMode,
  activeReplay,
  allReplays,
  currentTime,
  visibleRuns,
  focusTarget,
  showRacingLine = true,
  cameraMode = 'chase',
  isShiftBoosting = false,
  liveSnapshot,
}: ReplaySceneProps) {
  const bestCarRef = useRef<THREE.Group>(null!);
  const baselineCarRef = useRef<THREE.Group>(null!);
  const earlyCarRef = useRef<THREE.Group>(null!);
  const failedCarRef = useRef<THREE.Group>(null!);
  const liveHeroCarRef = useRef<THREE.Group>(null!);

  const speedRef = useRef(0);
  const steerRef = useRef(0);

  // Update Replay Studio Hero Car
  useFrame(() => {
    if (appMode === 'replay') {
      if (!bestCarRef.current) return;
      const state = sampleReplayState(activeReplay, currentTime);

      if (!isNaN(state.position.x) && !isNaN(state.position.z)) {
        bestCarRef.current.position.copy(state.position);
      }
      if (!isNaN(state.rotationY)) {
        bestCarRef.current.rotation.y = state.rotationY;
      }

      speedRef.current = isNaN(state.speedKmh) ? 0 : state.speedKmh / 3.6;
      steerRef.current = isNaN(state.steering) ? 0 : state.steering;
    } else if (appMode === 'live' && liveSnapshot) {
      if (!liveHeroCarRef.current) return;
      const hero = liveSnapshot.heroCar;

      if (!isNaN(hero.position.x) && !isNaN(hero.position.z)) {
        liveHeroCarRef.current.position.copy(hero.position);
      }
      if (!isNaN(hero.rotationY)) {
        liveHeroCarRef.current.rotation.y = hero.rotationY;
      }

      speedRef.current = hero.speedMs;
      steerRef.current = hero.steering;
    }
  });

  // Resolve camera focus target ref
  let cameraFocusRef = bestCarRef;
  if (appMode === 'live') {
    cameraFocusRef = liveHeroCarRef;
  } else {
    if (focusTarget === 'baseline') cameraFocusRef = baselineCarRef;
    else if (focusTarget === 'early') cameraFocusRef = earlyCarRef;
    else if (focusTarget === 'failed') cameraFocusRef = failedCarRef;
    else cameraFocusRef = bestCarRef;
  }

  const isHeroBoosting = appMode === 'live' ? !!liveSnapshot?.heroCar.isBoosting : isShiftBoosting;

  return (
    <>
      <ambientLight intensity={0.75} color="#FFF0D8" />
      <FollowSun targetRef={cameraFocusRef} />
      <directionalLight position={[-60, 30, 40]} intensity={0.4} color="#B8D8FF" castShadow={false} />
      <hemisphereLight color="#E8F4FF" groundColor="#C8B880" intensity={0.55} />
      <fog attach="fog" args={['#D5E8C0', 120, 380]} />

      <Track />
      <ViceCoastEnvironment />
      <RacingLineOverlay visible={showRacingLine} />

      {/* ── Mode 1: Multi-Run Simultaneous Replay Studio ── */}
      {appMode === 'replay' && (
        <>
          {/* 1. Best Known Run (Hero Car) */}
          {visibleRuns.best && (
            <group>
              <PlayerCar
                groupRef={bestCarRef}
                speed={speedRef.current}
                steering={steerRef.current}
                position={[activeReplay.frames[0]?.position[0] ?? 0, 0, activeReplay.frames[0]?.position[2] ?? 0]}
                color="#00FFFF"
              />
              <FollowCarNitroFlame carRef={bestCarRef} visible={isHeroBoosting} />
            </group>
          )}

          {/* 2. Baseline Centerline Run (White Ghost) */}
          {visibleRuns.baseline && allReplays.baseline && (
            <SimultaneousGhostCar
              dataset={allReplays.baseline}
              currentTime={currentTime}
              color="#E0F4FF"
              badgeText="⚪ BASELINE"
              groupRef={baselineCarRef}
            />
          )}

          {/* 3. Early Gen 1 Candidate (Amber Ghost) */}
          {visibleRuns.early && allReplays.early && (
            <SimultaneousGhostCar
              dataset={allReplays.early}
              currentTime={currentTime}
              color="#FFD700"
              badgeText="🟡 EARLY GEN 1"
              groupRef={earlyCarRef}
            />
          )}

          {/* 4. Failed Collision Run (Crimson Ghost with crash alerts) */}
          {visibleRuns.failed && allReplays.failed && (
            <SimultaneousGhostCar
              dataset={allReplays.failed}
              currentTime={currentTime}
              color="#FF2A6D"
              badgeText="🔴 FAILED CRASH"
              isCrashCandidate={true}
              groupRef={failedCarRef}
            />
          )}
        </>
      )}

      {/* ── Mode 2: Live Real-Time Learning Engine ── */}
      {appMode === 'live' && liveSnapshot && (
        <>
          {/* Real-time Hero Candidate */}
          <group>
            <PlayerCar
              groupRef={liveHeroCarRef}
              speed={speedRef.current}
              steering={steerRef.current}
              position={[liveSnapshot.heroCar.position.x, 0, liveSnapshot.heroCar.position.z]}
              color="#00FFFF"
            />
            <FollowCarNitroFlame carRef={liveHeroCarRef} visible={isHeroBoosting} />
          </group>

          {/* Live Swarm Candidates competing concurrently */}
          {liveSnapshot.swarmCandidates.map((cand) => (
            <LiveSwarmRacer key={cand.id} candidate={cand} />
          ))}
        </>
      )}

      {/* Smooth Multi-Angle Camera Tracker */}
      <ReplayCamera targetRef={cameraFocusRef} mode={cameraMode} />
    </>
  );
}
