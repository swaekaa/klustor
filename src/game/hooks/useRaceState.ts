import { useState, useRef, useCallback, useEffect } from 'react';
import * as THREE from 'three';
import { getTrackData } from '../data/viceCoastCircuit';

// ============================================================
// useRaceState — Manages timer, checkpoints, lap, countdown
// IMPORTANT: This hook must NOT use useFrame — it is called
// outside of <Canvas> in RacePage. All timing uses setInterval.
// ============================================================

export type RacePhase = 'prerace' | 'countdown' | 'racing' | 'paused' | 'finished';

export function useRaceState() {
  const [phase, setPhase] = useState<RacePhase>('prerace');
  const [countdown, setCountdown] = useState(3);
  const [lapTimeMs, setLapTimeMs] = useState(0);
  const [currentCheckpoint, setCurrentCheckpoint] = useState(0);
  const [lapComplete, setLapComplete] = useState(false);

  // Refs for mutable game state (avoids stale closures in callbacks)
  const phaseRef = useRef<RacePhase>('prerace');
  const currentCheckpointRef = useRef(0);
  const lapCompletedRef = useRef(false);

  const startTimeRef = useRef<number | null>(null);
  const pauseStartRef = useRef<number | null>(null);
  const totalPausedRef = useRef(0);
  const countdownStartRef = useRef<number | null>(null);
  const prevPosRef = useRef<THREE.Vector3 | null>(null);

  // Keep phaseRef in sync when phase state changes
  const setPhaseSync = useCallback((p: RacePhase) => {
    phaseRef.current = p;
    setPhase(p);
  }, []);

  // ── Countdown interval ──────────────────────────────────────
  useEffect(() => {
    if (phase !== 'countdown') return;

    const interval = setInterval(() => {
      if (countdownStartRef.current === null) return;
      const elapsed = (Date.now() - countdownStartRef.current) / 1000;
      const remaining = Math.max(0, 3 - Math.floor(elapsed));
      setCountdown(remaining);

      if (elapsed >= 4) {
        clearInterval(interval);
        const now = Date.now();
        startTimeRef.current = now;
        totalPausedRef.current = 0;
        setPhaseSync('racing');
      }
    }, 100);

    return () => clearInterval(interval);
  }, [phase, setPhaseSync]);

  // ── Race timer interval ─────────────────────────────────────
  useEffect(() => {
    if (phase !== 'racing') return;

    const interval = setInterval(() => {
      if (startTimeRef.current !== null) {
        setLapTimeMs(Date.now() - startTimeRef.current - totalPausedRef.current);
      }
    }, 50);

    return () => clearInterval(interval);
  }, [phase]);

  // ── Actions ─────────────────────────────────────────────────
  const startCountdown = useCallback(() => {
    countdownStartRef.current = Date.now();
    setCountdown(3);
    setPhaseSync('countdown');
  }, [setPhaseSync]);

  const pauseRace = useCallback(() => {
    if (phaseRef.current === 'racing') {
      pauseStartRef.current = Date.now();
      setPhaseSync('paused');
    }
  }, [setPhaseSync]);

  const resumeRace = useCallback(() => {
    if (phaseRef.current === 'paused') {
      if (pauseStartRef.current) {
        totalPausedRef.current += Date.now() - pauseStartRef.current;
        pauseStartRef.current = null;
      }
      setPhaseSync('racing');
    }
  }, [setPhaseSync]);

  const restartRace = useCallback(() => {
    setPhaseSync('prerace');
    setCountdown(3);
    setLapTimeMs(0);
    currentCheckpointRef.current = 0;
    setCurrentCheckpoint(0);
    lapCompletedRef.current = false;
    setLapComplete(false);
    startTimeRef.current = null;
    pauseStartRef.current = null;
    totalPausedRef.current = 0;
    countdownStartRef.current = null;
    prevPosRef.current = null;
  }, [setPhaseSync]);

  // ── Checkpoint logic — called each frame from inside Canvas ──
  const checkCheckpoint = useCallback((carPosition: THREE.Vector3) => {
    if (phaseRef.current !== 'racing' || lapCompletedRef.current) return;

    const prevPos = prevPosRef.current;
    prevPosRef.current = carPosition.clone();
    
    if (!prevPos) return;

    const { checkpoints, totalCheckpoints } = getTrackData();
    const nextIdx = currentCheckpointRef.current;
    
    if (nextIdx >= totalCheckpoints) return;

    const cp = checkpoints[nextIdx];
    
    // Vector from CP to prev and CP to curr
    const vPrev = prevPos.clone().sub(cp.position);
    const vCurr = carPosition.clone().sub(cp.position);
    
    // Dot product with tangent (Z-axis forward)
    const dotPrev = vPrev.dot(cp.tangent);
    const dotCurr = vCurr.dot(cp.tangent);
    
    // Did we cross the plane in the correct direction? (from negative to positive)
    if (dotPrev < 0 && dotCurr >= 0) {
      // Check if within road width horizontally along the normal vector
      const cpNormal = new THREE.Vector3(-cp.tangent.z, 0, cp.tangent.x).normalize();
      const distFromCenter = Math.abs(vCurr.dot(cpNormal));
      const cpWidth = cp.leftEdge.distanceTo(cp.rightEdge);
      
      // Give a little leeway (+ 2 meters) to prevent missing checkpoints due to physics stepping
      if (distFromCenter <= (cpWidth / 2) + 2) {
        if (nextIdx < totalCheckpoints - 1) {
          // Normal checkpoint cleared
          currentCheckpointRef.current = nextIdx + 1;
          setCurrentCheckpoint(nextIdx + 1);
        } else {
          // Finish line cleared
          lapCompletedRef.current = true;
          setLapComplete(true);
          setPhaseSync('finished');
        }
      }
    }
  }, [setPhaseSync]);

  return {
    phase,
    countdown,
    lapTimeMs,
    currentCheckpoint,
    lapComplete,
    startCountdown,
    pauseRace,
    resumeRace,
    restartRace,
    checkCheckpoint,
  };
}

export function formatRaceTime(ms: number): string {
  const totalSeconds = Math.floor(ms / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  const centiseconds = Math.floor((ms % 1000) / 10);
  return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}.${String(centiseconds).padStart(2, '0')}`;
}
