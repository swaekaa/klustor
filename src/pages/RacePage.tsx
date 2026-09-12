import { useRef, useState, useCallback, useEffect, Component, type ErrorInfo, type ReactNode, type RefObject } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import * as THREE from 'three';

import { useGameStore } from '../store/gameStore';
import { RACE_REWARDS } from '../game/data/viceCoastCircuit';
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

// ── Inner 3D Scene ───────────────────────────
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
  const { speedRef, steeringRef, resetToStart } = useCarPhysics(carRef, isRacing, stats, (state) => {
    onSpeedUpdate(state.speed);
  });

  useEffect(() => {
    resetToStart();
  }, [resetToStart]);

  useFrame(() => {
    if (carRef.current) {
      onPositionUpdate(carRef.current.position.clone());
      checkCheckpoint(carRef.current.position);
    }
  });

  return (
    <>
      <ambientLight intensity={1.0} color="#FFFFFF" />
      <directionalLight position={[-50, 80, -50]} intensity={1.2} color="#FFFFFF" castShadow={false} />
      <hemisphereLight color="#FFFFFF" groundColor="#EAF2B6" intensity={0.6} />
      <fog attach="fog" args={['#EAF2B6', 80, 300]} />

      <Track />
      <MiamiEnvironment />

      {/* Starting Grid: Opponents */}
      <PlayerCar position={[-3.5, 0, 10]} color="#FF9999" />
      <PlayerCar position={[3.5, 0, 6]} color="#9999FF" />
      <PlayerCar position={[-3.5, 0, 2]} color="#99FF99" />

      {/* Player Car */}
      <PlayerCar
        groupRef={carRef}
        textures={textures}
        speed={speedRef.current}
        steering={steeringRef.current}
        position={[0, 0, 10]} // Start at front of grid
      />

      <RaceCamera carRef={carRef} isActive={isRacing} />
    </>
  );
}

// ── Results Screen ────────────────────────────────────────────
function ResultsScreen({
  lapTimeMs, topSpeed, designScore, onRaceAgain, onRedesign, isPersonalBest,
}: {
  lapTimeMs: number; topSpeed: number; designScore: number;
  onRaceAgain: () => void; onRedesign: () => void; isPersonalBest: boolean;
}) {
  const { recordRaceResult } = useGameStore();
  const claimed = useRef(false);

  useEffect(() => {
    if (!claimed.current) {
      claimed.current = true;
      recordRaceResult(lapTimeMs, topSpeed);
    }
  }, [lapTimeMs, topSpeed, recordRaceResult]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 50 }}
      animate={{ opacity: 1, y: 0 }}
      style={{
        position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center',
        background: 'rgba(234, 242, 182, 0.85)', backdropFilter: 'blur(8px)', zIndex: 100
      }}
    >
      <div style={{ textAlign: 'center', minWidth: '400px', background: 'var(--bg-secondary)', padding: '3rem', borderRadius: '24px', boxShadow: '0 8px 32px rgba(0,0,0,0.05)', border: '1px solid var(--border-light)' }}>
        <h1 className="font-display" style={{ fontSize: '3rem', marginBottom: '1rem', lineHeight: 1 }}>
          FINISHED!
        </h1>
        <div className="font-mono" style={{ fontSize: '3.5rem', fontWeight: 'bold', marginBottom: '0.5rem' }}>
          {formatRaceTime(lapTimeMs)}
        </div>
        
        {isPersonalBest && (
          <div className="font-display" style={{ fontSize: '1.2rem', color: 'var(--klustor-pink)', marginBottom: '1rem', fontWeight: 900 }}>
            ★ NEW BEST TIME! ★
          </div>
        )}

        <div style={{ display: 'flex', justifyContent: 'space-around', margin: '2rem 0', padding: '1rem 0' }}>
          <div>
            <div className="font-mono" style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>DESIGN SCORE</div>
            <div className="font-display" style={{ fontSize: '1.5rem', fontWeight: 'bold' }}>{designScore.toFixed(1)}</div>
          </div>
          <div>
            <div className="font-mono" style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>TOP SPEED</div>
            <div className="font-display" style={{ fontSize: '1.5rem', fontWeight: 'bold' }}>{Math.round(topSpeed * 3.6)} KM/H</div>
          </div>
          <div>
            <div className="font-mono" style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>CASH EARNED</div>
            <div className="font-display" style={{ fontSize: '1.5rem', fontWeight: 'bold', color: 'var(--klustor-green)' }}>
              +${isPersonalBest ? RACE_REWARDS.baseCash + RACE_REWARDS.personalBestBonus : RACE_REWARDS.baseCash}
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center', marginTop: '1rem' }}>
          <button className="btn" onClick={onRedesign} style={{ padding: '1rem 2rem', background: 'transparent', border: '1px solid var(--border-light)', boxShadow: 'none' }}>
            REDESIGN
          </button>
          <button className="btn" onClick={onRaceAgain} style={{ padding: '1rem 2rem', background: 'var(--klustor-pink)', border: 'none', boxShadow: 'none' }}>
            RACE AGAIN →
          </button>
        </div>
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
    startCountdown, restartRace, checkCheckpoint,
  } = useRaceState();

  const isRacing = phase === 'racing';
  const prevBestTime = player.bestTime;

  // Start race on mount
  useEffect(() => {
    if (!raceStarted && phase === 'prerace') {
      setRaceStarted(true);
      setMaxSpeedSeen(0);
      startCountdown();
    }
  }, [raceStarted, phase, startCountdown]);

  // Track max speed
  useEffect(() => {
    if (isRacing) setMaxSpeedSeen(prev => Math.max(prev, Math.abs(speed)));
  }, [speed, isRacing]);

  const handleRestart = useCallback(() => {
    restartRace();
    setSpeed(0);
    setMaxSpeedSeen(0);
    startCountdown();
  }, [restartRace, startCountdown]);

  const handleRedesign = useCallback(() => navigate('/design'), [navigate]);

  const isNewBest = phase === 'finished' && (prevBestTime === null || lapTimeMs < prevBestTime);

  if (webglError) {
    return (
      <div className="page" style={{ alignItems: 'center', justifyContent: 'center' }}>
        <div className="panel" style={{ textAlign: 'center', maxWidth: '420px' }}>
          <h2 className="font-display" style={{ fontSize: '2rem', color: 'var(--klustor-pink)', marginBottom: '1rem' }}>
            RACE COULD NOT LOAD
          </h2>
          <p className="font-body" style={{ color: 'var(--text-secondary)', marginBottom: '2rem' }}>
            There was an error initializing the 3D engine or loading your textures.
          </p>
          <button className="btn-retro" onClick={handleRedesign}>
            RETURN TO DESIGN
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="klustor-race">
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

      {/* Results screen */}
      {phase === 'finished' && (
        <ResultsScreen
          lapTimeMs={lapTimeMs}
          topSpeed={maxSpeedSeen}
          designScore={stats?.designScore ?? 0}
          onRaceAgain={handleRestart}
          onRedesign={handleRedesign}
          isPersonalBest={isNewBest}
        />
      )}
    </div>
  );
}
