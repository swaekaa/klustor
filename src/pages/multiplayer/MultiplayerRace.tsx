import { useRef, useState, useCallback, useEffect, Component, type ErrorInfo, type ReactNode, type RefObject } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { useNavigate, useParams } from 'react-router-dom';
import { motion } from 'framer-motion';

import { useMultiplayerStore } from '../../store/multiplayerStore';
import { useGameStore } from '../../store/gameStore';
import { useTelemetryStore } from '../../store/telemetryStore';
import { useRaceState, formatRaceTime } from '../../game/hooks/useRaceState';
import { useCarPhysics } from '../../game/hooks/useCarPhysics';
import { useEngineSound } from '../../game/hooks/useEngineSound';
import { useRadio } from '../../game/hooks/useRadio';
import PlayerCar from '../../game/components/PlayerCar';
import Track from '../../game/components/Track';
import ViceCoastEnvironment from '../../game/components/ViceCoastEnvironment';
import { getTrackData } from '../../game/data/viceCoastCircuit';
import RaceCamera from '../../game/components/RaceCamera';
import RaceHUD from '../../game/components/RaceHUD';
import type { CarStats, TemplateView } from '../../types';

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

function FollowSun({ carRef }: { carRef: RefObject<THREE.Group> }) {
  const lightRef = useRef<THREE.DirectionalLight>(null);
  
  useFrame(() => {
    if (carRef.current && lightRef.current) {
      const carPos = carRef.current.position;
      lightRef.current.position.set(carPos.x + 100, 120, carPos.z - 60);
      lightRef.current.target.position.copy(carPos);
      lightRef.current.target.updateMatrixWorld();
    }
  });

  return (
    <directionalLight 
      ref={lightRef} intensity={1.6} color="#FFE8B8" 
      castShadow shadow-mapSize={[1024, 1024]}
      shadow-camera-left={-100} shadow-camera-right={100}
      shadow-camera-top={100} shadow-camera-bottom={-100}
      shadow-camera-near={10} shadow-camera-far={250} shadow-bias={-0.002}
    />
  );
}

function RaceScene({ textures, stats, phase, carRef, checkCheckpoint }: any) {
  const isRacing = phase === 'racing';
  const { speedRef, steeringRef, resetToStart } = useCarPhysics(carRef, isRacing, stats);

  useEffect(() => {
    if (phase === 'countdown' || phase === 'prerace') resetToStart();
  }, [phase, resetToStart]);

  useFrame(() => {
    if (carRef.current) checkCheckpoint(carRef.current.position);
  });

  const { startTransform } = getTrackData();

  return (
    <>
      <ambientLight intensity={0.75} color="#FFF0D8" />
      <FollowSun carRef={carRef} />
      <directionalLight position={[-60, 30, 40]} intensity={0.4} color="#B8D8FF" castShadow={false} />
      <hemisphereLight color="#E8F4FF" groundColor="#C8B880" intensity={0.55} />
      <fog attach="fog" args={['#D5E8C0', 120, 380]} />
      <Track />
      <ViceCoastEnvironment />
      <PlayerCar groupRef={carRef} textures={textures} speed={speedRef.current} steering={steeringRef.current} position={[startTransform.position.x, 0, startTransform.position.z]} />
      <RaceCamera carRef={carRef} isActive={isRacing} />
    </>
  );
}

function MultiplayerResultsScreen({ lapTimeMs, topSpeed, designScore, onGoToLeaderboard }: any) {
  const { submitRaceResult } = useMultiplayerStore();
  const claimed = useRef(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (!claimed.current) {
      claimed.current = true;
      setIsSubmitting(true);
      
      // Calculate a rough "race score" (1-100 based on time). 
      // Shorter time = higher score. Say par time is 2:30 (150000ms) = 50 score.
      const parMs = 150000;
      let rScore = Math.max(0, Math.min(100, 100 - ((lapTimeMs - parMs) / 1000)));
      const topSpeed = useTelemetryStore.getState().maxSpeedSeen;
      
      submitRaceResult(lapTimeMs, rScore, topSpeed)
        .then(() => setIsSubmitting(false))
        .catch(console.error);
    }
  }, [lapTimeMs, submitRaceResult]);

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
        
        {isSubmitting ? (
          <div className="font-display" style={{ fontSize: '1.2rem', color: 'var(--text-muted)' }}>SUBMITTING RESULT TO ROOM...</div>
        ) : (
          <div className="font-display" style={{ fontSize: '1.2rem', color: 'var(--klustor-green)' }}>RESULT SUBMITTED!</div>
        )}

        <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center', marginTop: '2rem' }}>
          <button className="btn" onClick={onGoToLeaderboard} disabled={isSubmitting} style={{ padding: '1.5rem 3rem', background: 'var(--klustor-pink)', border: 'none', color: '#FFF' }}>
            VIEW FINAL LEADERBOARD →
          </button>
        </div>
      </div>
    </motion.div>
  );
}

export default function MultiplayerRace() {
  const navigate = useNavigate();
  const { roomCode } = useParams<{ roomCode: string }>();
  const { currentLivery } = useGameStore();
  const { room } = useMultiplayerStore();

  const textures = currentLivery?.textures;
  const stats = currentLivery?.stats;
  const carRef = useRef<THREE.Group>(null!);
  const [webglError, setWebglError] = useState(false);
  const [raceStarted, setRaceStarted] = useState(false);
  const [showQuitPrompt, setShowQuitPrompt] = useState(false);

  const {
    phase, countdown, lapTimeMs, currentCheckpoint, lapSplits, latestSplitDiff,
    startCountdown, checkCheckpoint
  } = useRaceState();

  const maxSpeedSeen = useTelemetryStore(s => s.maxSpeedSeen);
  useEngineSound(phase);
  const { isPlaying: isRadioPlaying } = useRadio(phase === 'racing');

  useEffect(() => {
    if (!raceStarted && phase === 'prerace') {
      setRaceStarted(true);
      useTelemetryStore.getState().setTelemetry({ speed: 0, boost: 1.0, isBoosting: false, maxSpeedSeen: 0 });
      startCountdown();
    }
  }, [raceStarted, phase, startCountdown]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setShowQuitPrompt(prev => !prev);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  if (webglError) {
    return (
      <div className="page" style={{ alignItems: 'center', justifyContent: 'center' }}>
        <h2>RACE COULD NOT LOAD</h2>
      </div>
    );
  }

  return (
    <div className="klustor-race">
      <RaceErrorBoundary onError={() => setWebglError(true)}>
        <Canvas dpr={[1, 1]} camera={{ position: [0, 5, -9], fov: 65 }} gl={{ antialias: false, powerPreference: 'high-performance' }} shadows>
          <RaceScene textures={textures} stats={stats} phase={phase} carRef={carRef} checkCheckpoint={checkCheckpoint} />
        </Canvas>
      </RaceErrorBoundary>

      {(phase === 'racing' || phase === 'countdown') && (
        <RaceHUD
          phase={phase} countdown={countdown} lapTimeMs={lapTimeMs}
          currentCheckpoint={currentCheckpoint} latestSplitDiff={latestSplitDiff}
          lapSplits={lapSplits} isRadioPlaying={isRadioPlaying}
        />
      )}

      {phase === 'finished' && (
        <MultiplayerResultsScreen
          lapTimeMs={lapTimeMs} topSpeed={maxSpeedSeen} designScore={stats?.designScore ?? 0}
          onGoToLeaderboard={() => navigate(`/multiplayer/results/${roomCode}`)}
        />
      )}

      {showQuitPrompt && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          style={{
            position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center',
            background: 'rgba(0, 0, 0, 0.75)', backdropFilter: 'blur(4px)', zIndex: 200
          }}
        >
          <div style={{ textAlign: 'center', minWidth: '400px', background: 'var(--bg-secondary)', padding: '3rem', borderRadius: '24px', border: '1px solid var(--border-light)', boxShadow: '0 8px 32px rgba(0,0,0,0.5)' }}>
            <h2 className="font-display" style={{ fontSize: '2.5rem', marginBottom: '1rem', color: 'var(--text-primary)' }}>QUIT RACE?</h2>
            <p className="font-mono" style={{ fontSize: '1rem', color: 'var(--text-muted)', marginBottom: '2.5rem' }}>
              Your current progress will be lost.
            </p>
            <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center' }}>
              <button className="btn" onClick={() => setShowQuitPrompt(false)} style={{ padding: '1rem 2rem', background: 'transparent', border: '1px solid var(--border-light)', color: 'var(--text-primary)' }}>
                RESUME
              </button>
              <button className="btn" onClick={() => navigate('/multiplayer')} style={{ padding: '1rem 2rem', background: '#FF4D4D', border: 'none', color: '#FFF' }}>
                QUIT RACE
              </button>
            </div>
          </div>
        </motion.div>
      )}
    </div>
  );
}
