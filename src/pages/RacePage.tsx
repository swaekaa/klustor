import { useRef, useState, useCallback, useEffect, Component, type ErrorInfo, type ReactNode, type RefObject } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';

import { useGameStore } from '../store/gameStore';
import { useTelemetryStore } from '../store/telemetryStore';
import { RACE_REWARDS } from '../game/data/viceCoastCircuit';
import { formatRaceTime, useRaceState } from '../game/hooks/useRaceState';
import { useCarPhysics, type CarPhysicsState } from '../game/hooks/useCarPhysics';
import { useEngineSound } from '../game/hooks/useEngineSound';
import PlayerCar from '../game/components/PlayerCar';
import Track from '../game/components/Track';
import ViceCoastEnvironment from '../game/components/ViceCoastEnvironment';
import { getTrackData } from '../game/data/viceCoastCircuit';
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
  phase: RacePhase;
  carRef: RefObject<THREE.Group>;
  checkCheckpoint: (pos: THREE.Vector3) => void;
}

function FollowSun({ carRef }: { carRef: RefObject<THREE.Group> }) {
  const lightRef = useRef<THREE.DirectionalLight>(null);
  
  useFrame(() => {
    if (carRef.current && lightRef.current) {
      const carPos = carRef.current.position;
      // Position sun relative to the car to maintain the lighting angle
      lightRef.current.position.set(carPos.x + 100, 120, carPos.z - 60);
      // Ensure the shadow camera stays centered precisely on the player
      lightRef.current.target.position.copy(carPos);
      lightRef.current.target.updateMatrixWorld();
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

function RaceScene({ textures, stats, phase, carRef, checkCheckpoint }: RaceSceneProps) {
  const isRacing = phase === 'racing';
  const { speedRef, steeringRef, resetToStart } = useCarPhysics(carRef, isRacing, stats);

  useEffect(() => {
    if (phase === 'countdown' || phase === 'prerace') {
      resetToStart();
    }
  }, [phase, resetToStart]);

  useFrame(() => {
    if (carRef.current) {
      checkCheckpoint(carRef.current.position);
    }
  });

  // Player start position derived from authoritative track data
  const { startTransform } = getTrackData();
  const { position: sPos } = startTransform;

  return (
    <>
      {/* Warm golden-hour ambient */}
      <ambientLight intensity={0.75} color="#FFF0D8" />
      {/* Dynamic Main Sun — follows the car to ensure shadows map the entire world */}
      <FollowSun carRef={carRef} />
      {/* Fill from opposite side — cooler */}
      <directionalLight position={[-60, 30, 40]} intensity={0.4} color="#B8D8FF" castShadow={false} />
      {/* Hemisphere sky/ground */}
      <hemisphereLight color="#E8F4FF" groundColor="#C8B880" intensity={0.55} />
      {/* Warm fog matching beach grass color */}
      <fog attach="fog" args={['#D5E8C0', 120, 380]} />

      <Track />
      <ViceCoastEnvironment />

      {/* Player Car — initial position matches resetToStart() */}
      <PlayerCar
        groupRef={carRef}
        textures={textures}
        speed={speedRef.current}
        steering={steeringRef.current}
        position={[sPos.x, 0, sPos.z]}
      />

      <RaceCamera carRef={carRef} isActive={isRacing} />
    </>
  );
}

// ── Results Screen ────────────────────────────────────────────
function ResultsScreen({
  lapTimeMs, topSpeed, designScore, lapSplits, onRaceAgain, onRedesign, isPersonalBest,
}: {
  lapTimeMs: number; topSpeed: number; designScore: number; lapSplits: number[];
  onRaceAgain: () => void; onRedesign: () => void; isPersonalBest: boolean;
}) {
  const { recordRaceResult } = useGameStore();
  const claimed = useRef(false);

  useEffect(() => {
    if (!claimed.current) {
      claimed.current = true;
      recordRaceResult(lapTimeMs, topSpeed, lapSplits);
    }
  }, [lapTimeMs, topSpeed, lapSplits, recordRaceResult]);

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
  const [raceStarted, setRaceStarted] = useState(false);

  const {
    phase, countdown, lapTimeMs, currentCheckpoint, lapSplits, latestSplitDiff,
    startCountdown, restartRace, checkCheckpoint, pauseRace, resumeRace
  } = useRaceState(player.bestSplits);

  const isRacing = phase === 'racing';
  const prevBestTime = player.bestTime;
  const maxSpeedSeen = useTelemetryStore(s => s.maxSpeedSeen);

  // Start engine audio
  useEngineSound(phase);

  // Start race on mount
  useEffect(() => {
    if (!raceStarted && phase === 'prerace') {
      setRaceStarted(true);
      useTelemetryStore.getState().setTelemetry({ speed: 0, boost: 1.0, isBoosting: false, maxSpeedSeen: 0 });
      startCountdown();
    }
  }, [raceStarted, phase, startCountdown]);

  const handleRestart = useCallback(() => {
    restartRace();
    useTelemetryStore.getState().setTelemetry({ speed: 0, isBoosting: false, maxSpeedSeen: 0 });
    startCountdown();
  }, [restartRace, startCountdown]);

  // Handle Escape key to pause
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (phase === 'racing' || phase === 'countdown') pauseRace();
        else if (phase === 'paused') resumeRace();
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [phase, pauseRace, resumeRace]);

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
          shadows
        >
          <RaceScene
            textures={textures}
            stats={stats}
            phase={phase}
            carRef={carRef}
            checkCheckpoint={checkCheckpoint}
          />
        </Canvas>

        {phase === 'paused' && (
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            style={{ 
              position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center',
              background: 'rgba(0,0,0,0.4)', backdropFilter: 'blur(4px)', zIndex: 50 
            }}
          >
            <div className="panel" style={{ width: '400px', textAlign: 'center', background: 'var(--bg-secondary)', padding: '3rem', borderRadius: '24px', boxShadow: '0 8px 32px rgba(0,0,0,0.1)' }}>
              <h2 className="font-display" style={{ fontSize: '2.5rem', marginBottom: '2rem' }}>PAUSED</h2>
              
              <button 
                className="btn-retro" 
                onClick={resumeRace}
                style={{ width: '100%', marginBottom: '1rem' }}
              >
                RESUME
              </button>
              
              <button 
                className="btn-retro" 
                onClick={handleRestart}
                style={{ width: '100%', marginBottom: '1rem' }}
              >
                RESTART RACE
              </button>
              
              <button 
                className="btn-retro" 
                onClick={() => navigate('/')}
                style={{ width: '100%', background: 'transparent', color: 'var(--text-primary)', border: '3px solid var(--text-primary)' }}
              >
                QUIT TO GARAGE
              </button>
            </div>
          </motion.div>
        )}
      </RaceErrorBoundary>

      {(phase === 'racing' || phase === 'countdown') && (
        <RaceHUD
          phase={phase}
          countdown={countdown}
          lapTimeMs={lapTimeMs}
          currentCheckpoint={currentCheckpoint}
          latestSplitDiff={latestSplitDiff}
          lapSplits={lapSplits}
        />
      )}

      {/* Results screen */}
      {phase === 'finished' && (
        <ResultsScreen
          lapTimeMs={lapTimeMs}
          topSpeed={maxSpeedSeen}
          designScore={stats?.designScore ?? 0}
          lapSplits={lapSplits}
          isPersonalBest={prevBestTime === null || lapTimeMs < prevBestTime}
          onRaceAgain={handleRestart}
          onRedesign={() => navigate('/case')}
        />
      )}
    </div>
  );
}
