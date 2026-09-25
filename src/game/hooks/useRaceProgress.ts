import { useRef, useEffect, type RefObject } from 'react';
import { useFrame } from '@react-three/fiber';
import { useMultiplayerStore } from '../../store/multiplayerStore';
import { useGlobalLeaderboardStore } from '../../store/globalLeaderboardStore';
import { getTrackData } from '../data/viceCoastCircuit';
import type { RacePhase } from '../hooks/useRaceState';
import * as THREE from 'three';

// ============================================================
// useRaceProgress.ts
// Emits player position/checkpoint progress to server at 10Hz.
// Also registers socket listeners for leader_update, 
// leader_changed, and race_positions_updated.
// ============================================================

interface RaceProgressOptions {
  carRef: RefObject<THREE.Group>;
  phase: RacePhase;
  checkpointIndex: number;
  lapTimeMs: number;
  isFinished: boolean;
}

export function useRaceProgress({ carRef, phase, checkpointIndex, lapTimeMs, isFinished }: RaceProgressOptions) {
  const { socket } = useMultiplayerStore();
  const { setLiveLeader, setRacePositions } = useGlobalLeaderboardStore();

  const lastEmitRef = useRef(0);
  const EMIT_INTERVAL_MS = 100; // 10Hz

  // ── Calculate track progress (0-1) from position ──────────
  const trackData = getTrackData();
  const totalCheckpoints = trackData.totalCheckpoints;

  // Register socket listeners for leader updates
  useEffect(() => {
    if (!socket) return;

    const onLeaderUpdate = (data: any) => {
      setLiveLeader({
        leaderId: data.leaderId,
        displayName: data.displayName,
        position: data.position,
        rotation: data.rotation,
        progress: data.progress,
        speed: data.speed,
        livery: data.livery,
        timestamp: data.timestamp,
      });
    };

    const onLeaderChanged = (data: any) => {
      // The livery will come in via next leader_update
      setLiveLeader({
        leaderId: data.newLeaderId,
        displayName: data.newLeaderDisplayName || '',
        position: null, // Will be updated by next leader_update
        rotation: null,
      });
    };

    const onRacePositions = (positions: any[]) => {
      setRacePositions(positions);
    };

    socket.on('leader_update', onLeaderUpdate);
    socket.on('leader_changed', onLeaderChanged);
    socket.on('race_positions_updated', onRacePositions);

    return () => {
      socket.off('leader_update', onLeaderUpdate);
      socket.off('leader_changed', onLeaderChanged);
      socket.off('race_positions_updated', onRacePositions);
    };
  }, [socket, setLiveLeader, setRacePositions]);

  // ── Emit progress each frame (throttled to 10Hz) ──────────
  useFrame(() => {
    if (phase !== 'racing' && phase !== 'finished') return;
    if (!carRef.current || !socket?.connected) return;

    const now = Date.now();
    if (now - lastEmitRef.current < EMIT_INTERVAL_MS) return;
    lastEmitRef.current = now;

    const pos = carRef.current.position;
    const rot = carRef.current.rotation;

    // Compute fractional track progress from current checkpoint
    // This gives the server enough info to rank players
    const fractionalProgress = checkpointIndex / totalCheckpoints;

    // Find nearest sample to compute sub-checkpoint progress
    const { samples } = trackData;
    let minDist = Infinity;
    let nearestSampleFraction = 0;
    // Sample sparsely (every 5th) for performance — close enough for ranking
    for (let i = 0; i < samples.length; i += 5) {
      const dx = pos.x - samples[i].position.x;
      const dz = pos.z - samples[i].position.z;
      const d2 = dx * dx + dz * dz;
      if (d2 < minDist) {
        minDist = d2;
        nearestSampleFraction = i / samples.length;
      }
    }

    socket.emit('update_race_progress', {
      checkpointIndex,
      progress: fractionalProgress + nearestSampleFraction / (totalCheckpoints + 1),
      position: { x: pos.x, y: pos.y, z: pos.z },
      rotation: { x: rot.x, y: rot.y, z: rot.z },
      speed: 0, // Speed comes from telemetry store, not needed for ranking
      finishTimeMs: isFinished ? lapTimeMs : null,
    });
  });
}
