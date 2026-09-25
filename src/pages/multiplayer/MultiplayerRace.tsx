import { useRef, useState, useEffect, Component, type ErrorInfo, type ReactNode } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { useNavigate, useParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';

import { useMultiplayerStore } from '../../store/multiplayerStore';
import { useGameStore, generateThumbnail } from '../../store/gameStore';
import { useTelemetryStore } from '../../store/telemetryStore';
import { useGlobalLeaderboardStore } from '../../store/globalLeaderboardStore';
import { useRaceState, formatRaceTime } from '../../game/hooks/useRaceState';
import { useCarPhysics } from '../../game/hooks/useCarPhysics';
import { useRaceProgress } from '../../game/hooks/useRaceProgress';
import { useEngineSound } from '../../game/hooks/useEngineSound';
import { useRadio } from '../../game/hooks/useRadio';
import PlayerCar from '../../game/components/PlayerCar';
import LeaderGhost from '../../game/components/LeaderGhost';
import Track from '../../game/components/Track';
import ViceCoastEnvironment from '../../game/components/ViceCoastEnvironment';
import { getTrackData } from '../../game/data/viceCoastCircuit';
import RaceCamera from '../../game/components/RaceCamera';
import RaceHUD from '../../game/components/RaceHUD';
import type { CarStats } from '../../types';
import * as THREE from 'three';

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

function RaceScene({ textures, stats, phase, carRef, checkCheckpoint, currentCheckpoint, lapTimeMs, isFinished, localPlayerId }: any) {
  const isRacing = phase === 'racing';
  const { speedRef, steeringRef, resetToStart } = useCarPhysics(carRef, isRacing, stats);

  useEffect(() => {
    if (phase === 'countdown' || phase === 'prerace') resetToStart();
  }, [phase, resetToStart]);

  useFrame(() => {
    if (carRef.current) checkCheckpoint(carRef.current.position);
  });

  // Emit race progress to server (throttled at 10Hz internally)
  useRaceProgress({
    carRef,
    phase,
    checkpointIndex: currentCheckpoint,
    lapTimeMs,
    isFinished,
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
      {/* Ghost car — represents current 1st place player */}
      <LeaderGhost localPlayerId={localPlayerId} />
      <RaceCamera carRef={carRef} isActive={isRacing} />
    </>
  );
}

// ── Position HUD Overlay ──────────────────────────────────────
function RacePositionHUD({ localPlayerId }: { localPlayerId: string | null }) {
  const { racePositions, liveLeader } = useGlobalLeaderboardStore();
  
  if (racePositions.length === 0) return null;

  const myPosition = racePositions.find(p => p.playerId === localPlayerId);
  const myRank = myPosition?.rank ?? null;
  const total = racePositions.length;
  const isLeading = myRank === 1;

  return (
    <div style={{
      position: 'absolute', bottom: '2rem', left: '2rem',
      display: 'flex', flexDirection: 'column', gap: '0.5rem',
      zIndex: 20,
    }}>
      {/* Position badge */}
      <div style={{
        background: isLeading ? 'var(--klustor-yellow)' : 'var(--bg-secondary)',
        backdropFilter: 'blur(8px)',
        padding: '0.75rem 1.5rem',
        borderRadius: '16px',
        border: `2px solid ${isLeading ? 'var(--klustor-yellow)' : 'var(--border-light)'}`,
        boxShadow: isLeading ? '0 4px 16px rgba(255,220,50,0.4)' : '0 4px 16px rgba(0,0,0,0.05)',
        textAlign: 'center',
      }}>
        <div className="font-display" style={{ fontSize: '0.75rem', color: isLeading ? '#333' : 'var(--text-muted)', letterSpacing: '0.1em' }}>
          POSITION
        </div>
        <div className="font-display" style={{ fontSize: '2rem', fontWeight: 900, color: isLeading ? '#333' : 'var(--text-primary)', lineHeight: 1 }}>
          {myRank ?? '–'}<span style={{ fontSize: '1rem', color: isLeading ? '#555' : 'var(--text-muted)' }}>/{total}</span>
        </div>
        {isLeading && (
          <div className="font-display" style={{ fontSize: '0.7rem', color: '#333', fontWeight: 900, marginTop: '0.25rem' }}>
            🏆 YOU'RE LEADING
          </div>
        )}
      </div>

      {/* Mini rankings */}
      <div style={{
        background: 'var(--bg-secondary)', backdropFilter: 'blur(8px)',
        padding: '0.75rem 1rem', borderRadius: '16px',
        border: '1px solid var(--border-light)',
        display: 'flex', flexDirection: 'column', gap: '0.3rem',
      }}>
        {racePositions.slice(0, 5).map(p => (
          <div key={p.playerId} style={{
            display: 'flex', alignItems: 'center', gap: '0.5rem',
            padding: '0.2rem 0.4rem', borderRadius: '8px',
            background: p.playerId === localPlayerId ? 'var(--klustor-cyan)' : 'transparent',
          }}>
            <span className="font-display" style={{ fontSize: '0.75rem', color: p.playerId === localPlayerId ? '#000' : 'var(--text-muted)', width: '1.2rem' }}>
              {p.rank}
            </span>
            <span className="font-mono" style={{ fontSize: '0.75rem', color: p.playerId === localPlayerId ? '#000' : 'var(--text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '80px' }}>
              {p.displayName}
            </span>
            {p.isFinished && <span style={{ fontSize: '0.6rem' }}>✓</span>}
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Multiplayer Results Screen ────────────────────────────────
function MultiplayerResultsScreen({ lapTimeMs, topSpeed, designScore, onGoToLeaderboard, localPlayerId, displayName, avatar }: any) {
  const { submitRaceResult, submitGlobalResult } = useMultiplayerStore();
  const { currentLivery } = useGameStore();
  const claimed = useRef(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [globalRank, setGlobalRank] = useState<number | null>(null);
  const [isNewBest, setIsNewBest] = useState(false);

  useEffect(() => {
    if (!claimed.current) {
      claimed.current = true;
      setIsSubmitting(true);
      
      const parMs = 150000;
      const rScore = Math.max(0, Math.min(100, 100 - ((lapTimeMs - parMs) / 1000)));
      const topSpeedMs = useTelemetryStore.getState().maxSpeedSeen;
      
      // 1. Submit to room leaderboard
      submitRaceResult(lapTimeMs, rScore, topSpeedMs).catch(console.error);

      // 2. Submit to global leaderboard
      const liveryThumbFull = currentLivery?.textures?.top || currentLivery?.textures?.left || '';
      
      generateThumbnail(liveryThumbFull).then((thumb) => {
        submitGlobalResult({
          playerId: useGameStore.getState().player.deviceId,
          displayName: currentLivery?.name || displayName || 'UNKNOWN',
          avatar: avatar || '🚗',
          raceTime: lapTimeMs,
          topSpeed: topSpeedMs,
          designScore: designScore ?? 0,
          liveryThumb: thumb,
        }).then((result) => {
          setGlobalRank(result.rank);
          setIsNewBest(result.isNewBest);
          setIsSubmitting(false);
        }).catch((err) => {
          console.warn('[Global LB] Submit failed:', err);
          setIsSubmitting(false);
        });
      });
    }
  }, [lapTimeMs, submitRaceResult, submitGlobalResult, displayName, avatar, designScore, currentLivery]);

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
        <h1 className="font-display" style={{ fontSize: '3rem', marginBottom: '1rem', lineHeight: 1 }}>FINISHED!</h1>
        <div className="font-mono" style={{ fontSize: '3.5rem', fontWeight: 'bold', marginBottom: '0.5rem' }}>
          {formatRaceTime(lapTimeMs)}
        </div>
        
        {isSubmitting ? (
          <div className="font-display" style={{ fontSize: '1.2rem', color: 'var(--text-muted)' }}>SUBMITTING RESULT...</div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            <div className="font-display" style={{ fontSize: '1.2rem', color: 'var(--klustor-green)' }}>RESULT SUBMITTED!</div>
            {globalRank && (
              <div className="font-display" style={{
                fontSize: isNewBest ? '1.5rem' : '1.2rem',
                color: isNewBest ? 'var(--klustor-pink)' : 'var(--text-muted)',
                fontWeight: 900,
              }}>
                {isNewBest ? '★ NEW PERSONAL BEST! ' : ''}GLOBAL RANK #{globalRank}
              </div>
            )}
          </div>
        )}

        <div style={{ display: 'flex', justifyContent: 'space-around', margin: '2rem 0' }}>
          <div>
            <div className="font-mono" style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>TOP SPEED</div>
            <div className="font-display" style={{ fontSize: '1.5rem', fontWeight: 'bold' }}>{Math.round(topSpeed * 3.6)} KM/H</div>
          </div>
          <div>
            <div className="font-mono" style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>DESIGN SCORE</div>
            <div className="font-display" style={{ fontSize: '1.5rem', fontWeight: 'bold' }}>{designScore?.toFixed(1) ?? '0.0'}</div>
          </div>
        </div>

        <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center', marginTop: '2rem' }}>
          <button className="btn" onClick={onGoToLeaderboard} disabled={isSubmitting} style={{ padding: '1.5rem 3rem', background: 'var(--klustor-pink)', border: 'none', color: '#FFF' }}>
            VIEW FINAL LEADERBOARD →
          </button>
        </div>
      </div>
    </motion.div>
  );
}

// ── Main MultiplayerRace ──────────────────────────────────────
export default function MultiplayerRace() {
  const navigate = useNavigate();
  const { roomCode } = useParams<{ roomCode: string }>();
  const { currentLivery } = useGameStore();
  const { room, socket } = useMultiplayerStore();
  const { resetRaceState } = useGlobalLeaderboardStore();

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
  useEngineSound(phase);
  const { isPlaying: isRadioPlaying } = useRadio(phase === 'racing');

  const localPlayerId = socket?.id ?? null;
  const playerData = room?.players.find(p => p.id === localPlayerId);
  const displayName = playerData?.displayName ?? 'UNKNOWN';
  const avatar = playerData?.avatar ?? '🚗';

  useEffect(() => {
    if (!raceStarted && phase === 'prerace') {
      setRaceStarted(true);
      resetRaceState();
      useTelemetryStore.getState().setTelemetry({ speed: 0, boost: 1.0, isBoosting: false, maxSpeedSeen: 0 });
      startCountdown();
    }
  }, [raceStarted, phase, startCountdown, resetRaceState]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setShowQuitPrompt(prev => !prev);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Cleanup race state on unmount
  useEffect(() => {
    return () => { resetRaceState(); };
  }, [resetRaceState]);

  const isFinished = phase === 'finished';

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
          <RaceScene
            textures={textures}
            stats={stats}
            phase={phase}
            carRef={carRef}
            checkCheckpoint={checkCheckpoint}
            currentCheckpoint={currentCheckpoint}
            lapTimeMs={lapTimeMs}
            isFinished={isFinished}
            localPlayerId={localPlayerId}
          />
        </Canvas>
      </RaceErrorBoundary>

      {(phase === 'racing' || phase === 'countdown') && (
        <>
          <RaceHUD
            phase={phase} countdown={countdown} lapTimeMs={lapTimeMs}
            currentCheckpoint={currentCheckpoint} latestSplitDiff={latestSplitDiff}
            lapSplits={lapSplits} isRadioPlaying={isRadioPlaying}
          />
          {/* Position HUD — only shows when racing (not countdown) */}
          {phase === 'racing' && (
            <RacePositionHUD localPlayerId={localPlayerId} />
          )}
        </>
      )}

      {phase === 'finished' && (
        <MultiplayerResultsScreen
          lapTimeMs={lapTimeMs}
          topSpeed={useTelemetryStore.getState().maxSpeedSeen}
          designScore={stats?.designScore ?? 0}
          displayName={displayName}
          avatar={avatar}
          localPlayerId={localPlayerId}
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
