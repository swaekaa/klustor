import { useState, useRef, useCallback, useEffect } from 'react';
import * as THREE from 'three';
import { CHECKPOINTS, REQUIRED_CHECKPOINTS } from '../data/viceCoastCircuit';

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
    }, 100); // 10 fps is plenty for a countdown

    return () => clearInterval(interval);
  }, [phase, setPhaseSync]);

  // ── Race timer interval ─────────────────────────────────────
  useEffect(() => {
    if (phase !== 'racing') return;

    const interval = setInterval(() => {
      if (startTimeRef.current !== null) {
        setLapTimeMs(Date.now() - startTimeRef.current - totalPausedRef.current);
      }
    }, 50); // ~20 fps for timer

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
  }, [setPhaseSync]);

  // ── Checkpoint logic — called each frame from inside Canvas ──
  // Safe: only reads phaseRef and refs, calls setPhaseSync which is stable.
  const checkCheckpoint = useCallback((carPosition: THREE.Vector3) => {
    if (phaseRef.current !== 'racing' || lapCompletedRef.current) return;

    const nextIdx = currentCheckpointRef.current;
    if (nextIdx >= CHECKPOINTS.length) return;

    const cp = CHECKPOINTS[nextIdx];
    const cpPos = new THREE.Vector3(...cp.position);
    const dist = carPosition.distanceTo(cpPos);

    if (dist < cp.radius) {
      if (nextIdx < REQUIRED_CHECKPOINTS) {
        // Normal checkpoint
        currentCheckpointRef.current = nextIdx + 1;
        setCurrentCheckpoint(nextIdx + 1);
      } else if (nextIdx === REQUIRED_CHECKPOINTS) {
        // Finish line — only counts if all checkpoints passed
        lapCompletedRef.current = true;
        setLapComplete(true);
        setPhaseSync('finished');
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
