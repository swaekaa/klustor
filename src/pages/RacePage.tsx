import { useRef, useState, useCallback, useEffect, Component, type ErrorInfo, type ReactNode, type RefObject } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import * as THREE from 'three';

import { useGameStore } from '../store/gameStore';
import { RACE_REWARDS, CIRCUIT_INFO } from '../game/data/viceCoastCircuit';
import { formatRaceTime, useRaceState } from '../game/hooks/useRaceState';
import { useCarPhysics } from '../game/hooks/useCarPhysics';
import PlayerCar from '../game/components/PlayerCar';
import Track from '../game/components/Track';
import MiamiEnvironment from '../game/components/MiamiEnvironment';
import RaceCamera from '../game/components/RaceCamera';
import RaceHUD from '../game/components/RaceHUD';
import type { CarStats, TemplateView } from '../types';

// ── Error boundary for WebGL crashes ────────────────────────
class RaceErrorBoundary extends Component<{ children: ReactNode; onError: () => void }, { hasError: boolean }> {
  constructor(props: { children: ReactNode; onError: () => void }) {
    super(props);
    this.state = { hasError: false };
  }
  static getDerivedStateFromError() { return { hasError: true }; }
  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('[KLUSTOR RACE] 3D error:', error, info);
    this.props.onError();
  }
  render() {
    if (this.state.hasError) return null;
    return this.props.children;
  }
}

// ── Inner 3D Scene (inside Canvas) ───────────────────────────
interface RaceSceneProps {
  textures?: Partial<Record<TemplateView, string>>;
  stats?: CarStats;
  isRacing: boolean;
  carRef: RefObject<THREE.Group>;
  onSpeedUpdate: (s: number) => void;
  onPositionUpdate: (p: THREE.Vector3) => void;
  checkCheckpoint: (pos: THREE.Vector3) => void;
}

function RaceScene({ textures, stats, isRacing, carRef, onSpeedUpdate, onPositionUpdate, checkCheckpoint }: RaceSceneProps) {
  const { speedRef, steeringRef } = useCarPhysics(carRef, isRacing, stats, (state) => {
    onSpeedUpdate(state.speed);
  });

  useFrame(() => {
    if (carRef.current) {
      onPositionUpdate(carRef.current.position.clone());
      checkCheckpoint(carRef.current.position);
    }
  });

  return (
    <>
      <ambientLight intensity={0.7} color="#FFE8CC" />
      <directionalLight position={[-50, 80, -50]} intensity={1.2} color="#FFD4A0" castShadow={false} />
      <hemisphereLight color="#87CEEB" groundColor="#C8B89A" intensity={0.4} />
      <fog attach="fog" args={['#F2D8C0', 80, 300]} />

      <Track />
      <MiamiEnvironment />

      <PlayerCar
        groupRef={carRef}
        textures={textures}
        speed={speedRef.current}
        steering={steeringRef.current}
      />

      <RaceCamera carRef={carRef} isActive={isRacing} />
    </>
  );
}

// ── Pre-Race Screen ───────────────────────────────────────────
function PreRaceScreen({
  textures, liveryName, stats, onStart, onBack, onCustomize,
}: {
  textures?: Partial<Record<TemplateView, string>>; liveryName?: string; stats?: CarStats;
  onStart: () => void; onBack: () => void; onCustomize: () => void;
}) {
  const hasLivery = !!textures && Object.keys(textures).length > 0;
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0 }}
      className="klustor-race-prerace"
    >
      <div className="klustor-race-prerace-card">
        <div className="font-mono" style={{ color: 'var(--text-muted)', letterSpacing: '0.2em', fontSize: '0.85rem', marginBottom: '0.5rem' }}>
          {CIRCUIT_INFO.name}
        </div>
        <h1 className="font-display" style={{ fontSize: '3rem', color: 'var(--text-primary)', margin: '0 0 0.5rem 0' }}>
          READY TO RACE
        </h1>

        {/* Livery preview */}
        {hasLivery ? (
          <div style={{ marginBottom: '1.5rem', textAlign: 'center' }}>
            <div className="font-mono" style={{ fontSize: '0.7rem', color: 'var(--text-muted)', letterSpacing: '0.1em', marginBottom: '0.5rem' }}>
              YOUR LIVERY — {liveryName?.toUpperCase()}
            </div>
            <img
              src={textures?.left}
              alt="Car Livery Left Side"
              style={{ maxWidth: '320px', width: '100%', height: 'auto', borderRadius: '8px', border: '2px solid var(--border-light)', boxShadow: '0 4px 20px rgba(30,40,50,0.1)' }}
            />
          </div>
        ) : (
          <div style={{ marginBottom: '1.5rem', padding: '1rem', background: 'rgba(233,181,141,0.15)', border: '1px solid var(--klustor-peach)', borderRadius: '10px', textAlign: 'center' }}>
            <div className="font-mono" style={{ fontSize: '0.75rem', color: 'var(--klustor-peach)', marginBottom: '0.5rem' }}>⚠ NO LIVERY SAVED</div>
            <div className="font-body" style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '0.75rem' }}>Racing with default skin. Customize to boost your stats.</div>
            <button onClick={onCustomize} style={{ padding: '0.4rem 1rem', background: 'var(--klustor-cyan)', border: 'none', borderRadius: '8px', fontFamily: 'Trebuchet MS,sans-serif', fontWeight: 'bold', fontSize: '0.8rem', cursor: 'pointer', color: 'var(--text-primary)' }}>
              CUSTOMIZE FIRST
            </button>
          </div>
        )}

        {/* Car stats */}
        {stats && (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem', marginBottom: '1.5rem', width: '100%' }}>
            {[
              { label: 'TOP SPEED', value: `${stats.topSpeed} km/h`, color: 'var(--klustor-green)' },
              { label: 'ACCELERATION', value: stats.acceleration.toFixed(1), color: 'var(--klustor-cyan)' },
              { label: 'HANDLING', value: stats.handling.toFixed(1), color: 'var(--klustor-yellow)' },
              { label: 'DESIGN SCORE', value: stats.designScore.toFixed(1), color: 'var(--klustor-pink)' },
            ].map(s => (
              <div key={s.label} style={{ padding: '0.5rem 0.75rem', background: 'var(--bg-secondary)', borderRadius: '8px', border: '1px solid var(--border-light)' }}>
                <div className="font-mono" style={{ fontSize: '0.6rem', color: 'var(--text-muted)', letterSpacing: '0.1em' }}>{s.label}</div>
                <div style={{ fontFamily: 'Trebuchet MS,sans-serif', fontWeight: 'bold', fontSize: '1rem', color: s.color }}>{s.value}</div>
              </div>
            ))}
          </div>
        )}

        {/* Circuit info */}
        <div className="klustor-race-info-grid" style={{ marginBottom: '1.5rem' }}>
          <span>CIRCUIT</span><span>VICE COAST</span>
          <span>LAPS</span><span>1</span>
          <span>CHECKPOINTS</span><span>6</span>
          <span>REWARD</span><span>+${RACE_REWARDS.baseCash}</span>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', width: '100%' }}>
          <button className="klustor-race-btn klustor-race-btn-primary" onClick={onStart}>
            <span>●</span> START RACE
          </button>
          <button className="klustor-race-btn klustor-race-btn-ghost" onClick={onBack}>
            <span>▲</span> BACK TO GARAGE
          </button>
        </div>
      </div>
    </motion.div>
  );
}

// ── Pause Screen ─────────────────────────────────────────────
function PauseScreen({ onResume, onRestart, onGarage }: { onResume: () => void; onRestart: () => void; onGarage: () => void }) {
  return (
    <div className="klustor-race-pause">
      <div className="klustor-race-pause-card">
        <div className="font-display" style={{ fontSize: '3rem', color: 'var(--text-primary)', marginBottom: '2rem' }}>PAUSED</div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          <button className="klustor-race-btn klustor-race-btn-primary" onClick={onResume}><span>●</span> RESUME</button>
          <button className="klustor-race-btn klustor-race-btn-ghost" onClick={onRestart}><span>■</span> RESTART</button>
          <button className="klustor-race-btn klustor-race-btn-ghost" onClick={onGarage}><span>▲</span> EXIT TO GARAGE</button>
        </div>
      </div>
    </div>
  );
}

// ── Results Screen ────────────────────────────────────────────
function ResultsScreen({
  lapTimeMs, topSpeed, designScore, onContinue, isPersonalBest,
}: {
  lapTimeMs: number; topSpeed: number; designScore: number;
  onContinue: () => void; isPersonalBest: boolean;
}) {
  const { recordRaceResult } = useGameStore();
  const claimed = useRef(false);

  useEffect(() => {
    if (!claimed.current) {
      claimed.current = true;
      recordRaceResult(lapTimeMs, topSpeed);
    }
  }, []);

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      className="klustor-race-results"
    >
      <div className="klustor-race-results-card">
        <div className="font-mono" style={{ color: 'var(--color-nav)', letterSpacing: '0.2em', fontSize: '0.9rem', marginBottom: '0.5rem' }}>
          VICE COAST CIRCUIT
        </div>
        <h1 className="font-display" style={{ fontSize: '3rem', color: 'var(--color-success)', margin: '0 0 0.5rem 0' }}>
          RACE COMPLETE
        </h1>
        {isPersonalBest && (
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.3 }}
            style={{ padding: '0.3rem 1rem', background: 'var(--klustor-yellow)', borderRadius: '999px', display: 'inline-block', marginBottom: '1rem', fontFamily: 'Trebuchet MS,sans-serif', fontWeight: 'bold', fontSize: '0.8rem', letterSpacing: '0.1em', color: 'var(--text-primary)' }}
          >
            🏆 NEW PERSONAL BEST!
          </motion.div>
        )}

        <div className="klustor-race-results-stats">
          <div className="klustor-race-results-row">
            <span className="klustor-race-results-label">LAP TIME</span>
            <span className="klustor-race-results-value" style={{ fontSize: '2rem' }}>{formatRaceTime(lapTimeMs)}</span>
          </div>
          <div className="klustor-race-results-row">
            <span className="klustor-race-results-label">TOP SPEED</span>
            <span className="klustor-race-results-value">{Math.round(topSpeed * 3.6)} km/h</span>
          </div>
          <div className="klustor-race-results-row">
            <span className="klustor-race-results-label">DESIGN SCORE</span>
            <span className="klustor-race-results-value klustor-race-results-cyan">{designScore.toFixed(1)}</span>
          </div>
          <div className="klustor-race-results-divider" />
          <div className="klustor-race-results-row">
            <span className="klustor-race-results-label">RACE REWARD</span>
            <span className="klustor-race-results-value klustor-race-results-green">
              +${isPersonalBest ? RACE_REWARDS.baseCash + RACE_REWARDS.personalBestBonus : RACE_REWARDS.baseCash}
            </span>
          </div>
          <div className="klustor-race-results-row">
            <span className="klustor-race-results-label">REP</span>
            <span className="klustor-race-results-value klustor-race-results-cyan">
              +{isPersonalBest ? RACE_REWARDS.baseRep + RACE_REWARDS.personalBestRep : RACE_REWARDS.baseRep}
            </span>
          </div>
        </div>

        <button
          className="klustor-race-btn klustor-race-btn-primary"
          style={{ marginTop: '1.5rem', width: '100%' }}
          onClick={onContinue}
        >
          <span>●</span> CONTINUE TO GARAGE
        </button>
      </div>
    </motion.div>
  );
}

// ── Main RacePage ─────────────────────────────────────────────
export default function RacePage() {
  const navigate = useNavigate();
  const { currentLivery, player } = useGameStore();

  const textures = currentLivery?.textures;
  const stats = currentLivery?.stats;

  const carRef = useRef<THREE.Group>(null!);
  const [webglError, setWebglError] = useState(false);
  const [speed, setSpeed] = useState(0);
  const [maxSpeedSeen, setMaxSpeedSeen] = useState(0);
  const [carPosition, setCarPosition] = useState<THREE.Vector3 | undefined>();
  const [raceStarted, setRaceStarted] = useState(false);

  const {
    phase, countdown, lapTimeMs, currentCheckpoint,
    startCountdown, pauseRace, resumeRace, restartRace, checkCheckpoint,
  } = useRaceState();

  const isRacing = phase === 'racing';
  const prevBestTime = player.bestTime;

  // Track max speed
  useEffect(() => {
    if (isRacing) setMaxSpeedSeen(prev => Math.max(prev, Math.abs(speed)));
  }, [speed, isRacing]);

  // ESC to pause
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.code === 'Escape') {
        if (phase === 'racing') pauseRace();
        else if (phase === 'paused') resumeRace();
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [phase, pauseRace, resumeRace]);

  const handleStartRace = useCallback(() => {
    setRaceStarted(true);
    setMaxSpeedSeen(0);
    startCountdown();
  }, [startCountdown]);

  const handleRestart = useCallback(() => {
    restartRace();
    setRaceStarted(false);
    setSpeed(0);
    setMaxSpeedSeen(0);
  }, [restartRace]);

  const handleGoToGarage = useCallback(() => navigate('/garage'), [navigate]);
  const handleGoToCustomize = useCallback(() => navigate('/customize'), [navigate]);

  // Is this a personal best (check before recordRaceResult is called)?
  const isNewBest = phase === 'finished' && (prevBestTime === null || lapTimeMs < prevBestTime);

  if (webglError) {
    return (
      <div className="klustor-race" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%' }}>
        <div className="panel" style={{ textAlign: 'center', padding: '3rem', border: '2px solid var(--color-warning)', maxWidth: '420px' }}>
          <div className="font-display" style={{ fontSize: '1.8rem', color: 'var(--color-warning)', marginBottom: '1rem' }}>
            RACE INITIALIZATION FAILED
          </div>
          <p className="font-body" style={{ color: 'var(--text-secondary)', marginBottom: '1.5rem' }}>
            Your browser could not start the 3D engine. Try a different browser (Chrome recommended).
          </p>
          <button className="klustor-race-btn klustor-race-btn-ghost" onClick={handleGoToGarage}>
            ▲ RETURN TO GARAGE
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="klustor-race">
      <AnimatePresence mode="wait">
        {!raceStarted && phase === 'prerace' && (
          <PreRaceScreen
            key="prerace"
            textures={textures}
            liveryName={currentLivery?.name}
            stats={stats}
            onStart={handleStartRace}
            onBack={handleGoToGarage}
            onCustomize={handleGoToCustomize}
          />
        )}
      </AnimatePresence>

      {/* 3D Canvas — mounted as soon as race starts */}
      {raceStarted && (
        <div className="klustor-race-canvas">
          <RaceErrorBoundary onError={() => setWebglError(true)}>
            <Canvas
              camera={{ position: [0, 5, -9], fov: 65 }}
              gl={{ antialias: true, powerPreference: 'high-performance' }}
              shadows={false}
            >
              <RaceScene
                textures={textures}
                stats={stats}
                isRacing={isRacing}
                carRef={carRef}
                onSpeedUpdate={setSpeed}
                onPositionUpdate={setCarPosition}
                checkCheckpoint={checkCheckpoint}
              />
            </Canvas>
          </RaceErrorBoundary>

          {(phase === 'racing' || phase === 'countdown') && (
            <RaceHUD
              phase={phase}
              countdown={countdown}
              lapTimeMs={lapTimeMs}
              speed={speed}
              currentCheckpoint={currentCheckpoint}
              carPosition={carPosition}
            />
          )}

          {phase === 'paused' && (
            <PauseScreen
              onResume={resumeRace}
              onRestart={handleRestart}
              onGarage={handleGoToGarage}
            />
          )}
        </div>
      )}

      {/* Results screen */}
      {phase === 'finished' && (
        <div className="klustor-race-canvas" style={{ zIndex: 200 }}>
          <ResultsScreen
            lapTimeMs={lapTimeMs}
            topSpeed={maxSpeedSeen}
            designScore={stats?.designScore ?? 0}
            onContinue={handleGoToGarage}
            isPersonalBest={isNewBest}
          />
        </div>
      )}
    </div>
  );
}
