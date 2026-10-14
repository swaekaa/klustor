import { useState, useEffect, useRef, useCallback } from 'react';
import { Canvas } from '@react-three/fiber';
import { useNavigate } from 'react-router-dom';
import ReplayScene, {
  type CameraViewMode,
  type FocusCarTarget,
  type VisibleRunsState,
} from '../game/components/ReplayScene';
import ReplayHUD from '../game/components/ReplayHUD';
import { getAllReplays, type RunTypeKey } from '../game/data/krpoReplayStore';
import { liveOptimizer, type LiveOptimizerSnapshot } from '../game/data/krpoLiveLearning';

// ============================================================
// ReplayPage.tsx — KRPO Autonomous Real-Time Learning & Multi-Run Studio
// ============================================================

export default function ReplayPage() {
  const navigate = useNavigate();
  const replays = getAllReplays();

  const [appMode, setAppMode] = useState<'replay' | 'live'>('live'); // Default to real-time learning!
  const [selectedRunKey, setSelectedRunKey] = useState<RunTypeKey>('best');
  const [currentTime, setCurrentTime] = useState(0);
  const [isPlaying, setIsPlaying] = useState(true);
  const [playbackSpeed, setPlaybackSpeed] = useState(1.0);

  // Multi-Run Simultaneous Visibility (All 4 cars active by default)
  const [visibleRuns, setVisibleRuns] = useState<VisibleRunsState>({
    best: true,
    baseline: true,
    early: true,
    failed: true,
  });

  const [focusTarget, setFocusTarget] = useState<FocusCarTarget>('best');
  const [cameraMode, setCameraMode] = useState<CameraViewMode>('chase');
  const [showRacingLine, setShowRacingLine] = useState(true);
  const [cleanMode, setCleanMode] = useState(false);

  // Boost mechanics (Hold Shift)
  const [isShiftBoosting, setIsShiftBoosting] = useState(false);
  const [boostReserve, setBoostReserve] = useState(1.0);

  // Real-Time Live Learning Snapshot
  const [liveSnapshot, setLiveSnapshot] = useState<LiveOptimizerSnapshot>(() => liveOptimizer.getSnapshot());

  const activeReplay = replays[selectedRunKey];
  const lastFrameTimeRef = useRef<number | null>(null);

  // ── Unified 60 FPS Animation & Simulation Loop ───────────────
  useEffect(() => {
    let animId: number;
    lastFrameTimeRef.current = null;

    const tick = (timestamp: number) => {
      if (lastFrameTimeRef.current === null) {
        lastFrameTimeRef.current = timestamp;
      }
      const rawDelta = (timestamp - lastFrameTimeRef.current) / 1000;
      const deltaSec = Math.max(0, Math.min(0.08, isNaN(rawDelta) ? 0 : rawDelta));
      lastFrameTimeRef.current = timestamp;

      // 1. Shift Boost Reserve management
      setBoostReserve((prev) => {
        if (isShiftBoosting) {
          return Math.max(0, prev - 0.25 * deltaSec);
        } else {
          return Math.min(1.0, prev + 0.1 * deltaSec);
        }
      });

      // 2. Real-Time Live Optimizer Stepping
      if (appMode === 'live') {
        liveOptimizer.setManualBoost(isShiftBoosting && boostReserve > 0.02);
        const snapshot = liveOptimizer.step(deltaSec);
        setLiveSnapshot(snapshot);
      } else if (appMode === 'replay' && isPlaying) {
        // Replay Studio Scrubber Advance
        setCurrentTime((prev) => {
          const safePrev = isNaN(prev) ? 0 : prev;
          const safeSpeed = (isNaN(playbackSpeed) || playbackSpeed <= 0) ? 1.0 : playbackSpeed;
          const boostBonus = (isShiftBoosting && boostReserve > 0.02) ? 1.45 : 1.0;
          const next = safePrev + deltaSec * safeSpeed * boostBonus;
          const lapTime = (isNaN(activeReplay.lapTime) || activeReplay.lapTime <= 0) ? 180 : activeReplay.lapTime;
          if (next >= lapTime) {
            return 0; // loop replay
          }
          return next;
        });
      }

      animId = requestAnimationFrame(tick);
    };

    animId = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(animId);
  }, [appMode, isPlaying, playbackSpeed, activeReplay.lapTime, isShiftBoosting, boostReserve]);

  // ── Handlers ──────────────────────────────────────────────────
  const handleToggleRun = useCallback((key: RunTypeKey) => {
    setVisibleRuns((prev) => ({
      ...prev,
      [key]: !prev[key],
    }));
  }, []);

  const handleShowAllRuns = useCallback(() => {
    setVisibleRuns({
      best: true,
      baseline: true,
      early: true,
      failed: true,
    });
  }, []);

  const handleSelectRun = useCallback((key: RunTypeKey) => {
    setSelectedRunKey(key);
    setFocusTarget(key as FocusCarTarget);
    setCurrentTime(0);
  }, []);

  const handleCycleCamera = useCallback(() => {
    setCameraMode((prev) => {
      if (prev === 'chase') return 'overhead';
      if (prev === 'overhead') return 'hood';
      return 'chase';
    });
  }, []);

  // ── Shift Boost & Global Keyboard Listeners ───────────────────
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Shift') {
        setIsShiftBoosting(true);
      } else if (e.code === 'Space') {
        e.preventDefault();
        if (appMode === 'live') {
          liveOptimizer.toggleRunning();
        } else {
          setIsPlaying((p) => !p);
        }
      } else if (e.key.toLowerCase() === 'v') {
        handleCycleCamera();
      } else if (e.key.toLowerCase() === 'h') {
        setCleanMode((p) => !p);
      } else if (e.key.toLowerCase() === 'l') {
        setShowRacingLine((p) => !p);
      } else if (e.key === '1') {
        setFocusTarget('best');
        setSelectedRunKey('best');
      } else if (e.key === '2') {
        setFocusTarget('baseline');
        setSelectedRunKey('baseline');
      } else if (e.key === '3') {
        setFocusTarget('early');
        setSelectedRunKey('early');
      } else if (e.key === '4') {
        setFocusTarget('failed');
        setSelectedRunKey('failed');
      } else if (e.key === 'Escape') {
        navigate('/race');
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.key === 'Shift') {
        setIsShiftBoosting(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [appMode, handleCycleCamera, navigate]);

  return (
    <div className="klustor-replay-page" style={{ position: 'relative', width: '100vw', height: '100vh', overflow: 'hidden' }}>
      <Canvas
        camera={{ position: [0, 5, -9], fov: 65, near: 0.1, far: 1000 }}
        gl={{ antialias: true, powerPreference: 'high-performance' }}
        shadows
      >
        <ReplayScene
          appMode={appMode}
          activeReplay={activeReplay}
          allReplays={replays}
          currentTime={currentTime}
          visibleRuns={visibleRuns}
          focusTarget={focusTarget}
          showRacingLine={showRacingLine}
          cameraMode={cameraMode}
          isShiftBoosting={isShiftBoosting}
          liveSnapshot={liveSnapshot}
        />
      </Canvas>

      <ReplayHUD
        appMode={appMode}
        activeReplay={activeReplay}
        allReplays={replays}
        selectedRunKey={selectedRunKey}
        currentTime={currentTime}
        isPlaying={isPlaying}
        playbackSpeed={playbackSpeed}
        visibleRuns={visibleRuns}
        focusTarget={focusTarget}
        showRacingLine={showRacingLine}
        cameraMode={cameraMode}
        cleanMode={cleanMode}
        isShiftBoosting={isShiftBoosting}
        boostReserve={boostReserve}
        liveSnapshot={liveSnapshot}
        onChangeAppMode={setAppMode}
        onSelectRun={handleSelectRun}
        onToggleRun={handleToggleRun}
        onShowAllRuns={handleShowAllRuns}
        onSelectFocusTarget={setFocusTarget}
        onTogglePlay={() => setIsPlaying((p) => !p)}
        onSeek={(t) => setCurrentTime(t)}
        onSetSpeed={setPlaybackSpeed}
        onToggleRacingLine={() => setShowRacingLine((p) => !p)}
        onSetCameraMode={setCameraMode}
        onCycleCamera={handleCycleCamera}
        onToggleCleanMode={() => setCleanMode((p) => !p)}
        onExitReplay={() => navigate('/leaderboard')}
        // Live learning actions
        onLiveTogglePlay={() => liveOptimizer.toggleRunning()}
        onLiveSetSpeed={(spd) => liveOptimizer.setSpeedMultiplier(spd)}
        onLiveResetEpisode={() => liveOptimizer.resetEpisode()}
        onLiveTriggerCrash={() => liveOptimizer.triggerCrashTest()}
      />
    </div>
  );
}
