import { useState, useCallback, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useMultiplayerStore } from '../../store/multiplayerStore';
import { useGameStore } from '../../store/gameStore';
import { analyzeAllFaces, defaultStats } from '../../game/utils/designAnalysis';
import { getCarTemplateUrl } from '../../game/utils/carTemplateUrl';
import LiveryEditor from '../../components/editor/LiveryEditor';
import type { CarStats, TemplateView } from '../../types';
import { Suspense } from 'react';
import { Canvas, useThree } from '@react-three/fiber';
import PlayerCar from '../../game/components/PlayerCar';

function DragToRotate() {
  const { gl, camera } = useThree();
  
  useEffect(() => {
    let isDragging = false;
    let prevX = 0;
    let prevY = 0;
    
    camera.lookAt(0, 0.3, 0);

    const onDown = (e: PointerEvent) => {
      isDragging = true;
      prevX = e.clientX;
      prevY = e.clientY;
    };
    
    const onUp = () => {
      isDragging = false;
    };
    
    const onMove = (e: PointerEvent) => {
      if (!isDragging) return;
      const deltaX = (e.clientX - prevX) * 0.01;
      const deltaY = (e.clientY - prevY) * 0.01;
      
      const x = camera.position.x;
      const y = camera.position.y;
      const z = camera.position.z;
      
      // Horizontal rotation
      camera.position.x = x * Math.cos(deltaX) - z * Math.sin(deltaX);
      camera.position.z = x * Math.sin(deltaX) + z * Math.cos(deltaX);
      
      // Very limited vertical rotation
      const newY = Math.max(0.5, Math.min(4.0, y + deltaY));
      camera.position.y = newY;
      
      camera.lookAt(0, 0.3, 0);
      
      prevX = e.clientX;
      prevY = e.clientY;
    };
    
    gl.domElement.addEventListener('pointerdown', onDown);
    window.addEventListener('pointerup', onUp);
    window.addEventListener('pointermove', onMove);
    
    return () => {
      gl.domElement.removeEventListener('pointerdown', onDown);
      window.removeEventListener('pointerup', onUp);
      window.removeEventListener('pointermove', onMove);
    };
  }, [gl, camera]);
  
  return null;
}

function MiamiPalmTree({ position, scale = 1 }: { position: [number, number, number], scale?: number }) {
  return (
    <group position={position} scale={scale}>
      {/* Trunk */}
      <mesh position={[0, 3, 0]}>
        <cylinderGeometry args={[0.2, 0.3, 6, 6]} />
        <meshStandardMaterial color="#3D2A1D" roughness={0.9} />
      </mesh>
      {/* Crown */}
      <mesh position={[0, 6.5, 0]}>
        <sphereGeometry args={[1.8, 6, 4]} />
        <meshStandardMaterial color="#1E5C4A" roughness={0.8} />
      </mesh>
      <mesh position={[1.2, 6.2, 0.4]} rotation={[0.3, 0, 0.6]}>
        <sphereGeometry args={[1.0, 5, 3]} />
        <meshStandardMaterial color="#144A3A" roughness={0.8} />
      </mesh>
      <mesh position={[-1.0, 6.0, 0.6]} rotation={[-0.2, 0, -0.5]}>
        <sphereGeometry args={[0.9, 5, 3]} />
        <meshStandardMaterial color="#267359" roughness={0.8} />
      </mesh>
    </group>
  );
}

function SynthwaveSun() {
  return (
    <mesh position={[0, 12, -80]}>
      <circleGeometry args={[20, 64]} />
      <meshBasicMaterial color="#FF3366" fog={false} />
    </mesh>
  );
}

function SynthwaveGrid() {
  return (
    <group position={[0, -0.4, 0]}>
      {/* Solid dark floor */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, 0]}>
        <planeGeometry args={[200, 200]} />
        <meshStandardMaterial color="#050510" roughness={1} metalness={0} />
      </mesh>
      {/* Glowing neon grid on top */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.01, 0]}>
        <planeGeometry args={[200, 200, 100, 100]} />
        <meshBasicMaterial color="#00FFFF" wireframe={true} transparent opacity={0.3} />
      </mesh>
    </group>
  );
}

export default function ChallengePage() {
  const { roomCode } = useParams<{ roomCode: string }>();
  const navigate = useNavigate();
  const { room, socket, submitLivery, updateLiveScore } = useMultiplayerStore();
  const { saveLiveryFace } = useGameStore();
  
  const [selectedView, setSelectedView] = useState<TemplateView>('left');
  const [templateUrl, setTemplateUrl] = useState<string>('');
  
  // Always start a multiplayer challenge with a fresh blank canvas
  const [textures, setTextures] = useState<Partial<Record<TemplateView, string>>>({});
  const [stats, setStats] = useState<CarStats>(defaultStats());
  const [isSaving, setIsSaving] = useState(false);
  const [timeLeft, setTimeLeft] = useState(0);
  
  const myId = socket?.id;
  const me = room?.players.find(p => p.id === myId);

  // Transition out if room changes state
  useEffect(() => {
    if (room?.status === 'racing') navigate(`/multiplayer/race/${room.code}`);
    else if (room?.status === 'results') navigate(`/multiplayer/results/${room.code}`);
  }, [room?.status, navigate, room?.code]);

  useEffect(() => {
    getCarTemplateUrl(selectedView).then(setTemplateUrl);
  }, [selectedView]);

  // Handle Server Timer
  useEffect(() => {
    if (!room?.endsAt) return;
    
    const interval = setInterval(() => {
      const remaining = Math.max(0, Math.ceil((room.endsAt! - Date.now()) / 1000));
      setTimeLeft(remaining);
      
      // Auto-submit if time runs out and haven't submitted yet
      if (remaining === 0 && !me?.hasSubmitted) {
        submitLivery(textures, stats.designScore).catch(console.error);
      }
    }, 1000);
    
    return () => clearInterval(interval);
  }, [room?.endsAt, me?.hasSubmitted, textures, stats.designScore, submitLivery]);

  const handleEditorSave = useCallback(async (dataUrl: string) => {
    setIsSaving(true);
    try {
      const newTextures = { ...textures, [selectedView]: dataUrl };
      setTextures(newTextures);
      
      const computed = await analyzeAllFaces(newTextures, getCarTemplateUrl);
      setStats(computed);
      saveLiveryFace(dataUrl, selectedView, computed, 'MULTIPLAYER RIDE');
      updateLiveScore(computed.designScore).catch(console.error);
      
    } catch (err) {
      console.error('Save failed:', err);
    } finally {
      setIsSaving(false);
    }
  }, [selectedView, textures, saveLiveryFace]);

  const handleFinalSubmit = async () => {
    if (me?.hasSubmitted) return;
    try {
      await submitLivery(textures, stats.designScore);
    } catch (err) {
      console.error(err);
    }
  };

  if (!room) {
    return <div className="page" style={{ padding: '2rem' }}>LOADING...</div>;
  }

  const mins = String(Math.floor(timeLeft / 60)).padStart(2, '0');
  const secs = String(timeLeft % 60).padStart(2, '0');

  const VIEWS: { id: TemplateView; label: string }[] = [
    { id: 'left', label: 'LEFT SIDE' },
    { id: 'right', label: 'RIGHT SIDE' },
    { id: 'top', label: 'TOP' },
    { id: 'front', label: 'FRONT' },
    { id: 'rear', label: 'REAR' },
  ];

  if (me?.hasSubmitted) {
    return (
      <div className="page" style={{ padding: '2rem', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '100vh' }}>
        <h2 className="font-display" style={{ fontSize: '3rem', color: 'var(--klustor-green)' }}>SUBMITTED!</h2>
        <p className="font-mono" style={{ color: 'var(--text-muted)', marginBottom: '2rem' }}>Waiting for other players or time to expire...</p>
        
        <div style={{ background: 'var(--bg-secondary)', padding: '2rem', borderRadius: '24px', border: '1px solid var(--border-light)', display: 'flex', gap: '2rem' }}>
          <div>
            <div className="font-mono" style={{ color: 'var(--text-muted)' }}>TIME LEFT</div>
            <div className="font-display" style={{ fontSize: '2rem' }}>{mins}:{secs}</div>
          </div>
          <div>
            <div className="font-mono" style={{ color: 'var(--text-muted)' }}>DESIGN SCORE</div>
            <div className="font-display" style={{ fontSize: '2rem' }}>{stats.designScore.toFixed(1)}</div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="page" style={{ padding: '1rem', display: 'flex', flexDirection: 'column', height: '100vh' }}>
      
      {/* HEADER */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', background: 'var(--bg-secondary)', padding: '1rem 2rem', borderRadius: '16px', border: '1px solid var(--border-light)' }}>
        <div>
          <h2 className="font-display" style={{ fontSize: '1.5rem', margin: 0 }}>{room.title}</h2>
          <div className="font-mono" style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{room.code}</div>
        </div>
        
        <div style={{ textAlign: 'center' }}>
          <div className="font-mono" style={{ fontSize: '0.8rem', color: timeLeft <= 60 ? '#FF4D4D' : 'var(--text-muted)' }}>TIME REMAINING</div>
          <div className="font-display" style={{ fontSize: '2.5rem', color: timeLeft <= 60 ? '#FF4D4D' : 'var(--text-primary)', lineHeight: 1 }}>
            {mins}:{secs}
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <div style={{ textAlign: 'right', marginRight: '1rem' }}>
             <div className="font-mono" style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>SCORE</div>
             <div className="font-display" style={{ fontSize: '1.5rem' }}>{stats.designScore.toFixed(1)}</div>
          </div>
          <button 
            className="btn" 
            onClick={handleFinalSubmit}
            style={{ padding: '1rem 2rem', background: 'var(--klustor-green)', color: '#FFF', border: 'none' }}
          >
            SUBMIT LIVERY
          </button>
        </div>
      </div>

      {/* EDITOR */}
      <div style={{ display: 'flex', gap: '1rem', flex: 1, minHeight: 0 }}>
        
        {/* VIEW SELECTOR */}
        <div style={{ width: '150px', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
          {VIEWS.map(v => (
            <button 
              key={v.id} 
              onClick={() => setSelectedView(v.id)} 
              className="btn" 
              style={{ 
                padding: '1rem 0.5rem', borderRadius: '12px', fontSize: '0.9rem',
                background: selectedView === v.id ? 'var(--klustor-cyan)' : 'var(--bg-secondary)',
                border: '1px solid var(--border-light)'
              }}
            >
              {v.label}
            </button>
          ))}
          <div style={{ marginTop: 'auto', padding: '1rem', background: 'var(--bg-secondary)', borderRadius: '12px', border: '1px solid var(--border-light)' }}>
             <p className="font-mono" style={{ fontSize: '0.8rem', color: 'var(--text-muted)', margin: 0 }}>
               Click SAVE in the editor to update your stats before final submission.
             </p>
          </div>
        </div>
        
        {/* UNLAYER CANVAS */}
        <div style={{ flex: 1, background: 'white', borderRadius: '16px', overflow: 'hidden', position: 'relative', border: '1px solid var(--border-light)' }}>
          {templateUrl && (
            <LiveryEditor
              key={selectedView}
              templateSrc={textures[selectedView] || templateUrl}
              onSave={handleEditorSave}
              editorId={`multiplayer-${selectedView}`}
            />
          )}
          {isSaving && (
            <div style={{
              position: 'absolute', inset: 0, background: 'rgba(255,255,255,0.85)', backdropFilter: 'blur(8px)',
              display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 20
            }}>
              <div className="font-display" style={{ fontSize: '2rem', color: 'var(--text-primary)' }}>
                SAVING DRAFT...
              </div>
            </div>
          )}
        </div>
        
        {/* LOCAL 3D PREVIEW */}
        <div style={{ flex: 1, background: 'var(--bg-secondary)', borderRadius: '16px', overflow: 'hidden', position: 'relative', border: '1px solid var(--border-light)' }}>
          <Canvas camera={{ position: [0, 2, 6], fov: 45 }} gl={{ antialias: true, toneMapping: 1, toneMappingExposure: 1.2 }}>
            <color attach="background" args={['#1A0B2E']} />
            <fog attach="fog" args={['#1A0B2E', 10, 60]} />
            
            <ambientLight intensity={1.0} color="#FFFFFF" />
            <directionalLight position={[5, 10, 5]} intensity={1.5} color="#FFFFFF" castShadow />
            <hemisphereLight color="#87CEEB" groundColor="#222222" intensity={0.6} />
            
            {/* Neon rim lights for aesthetic without breaking car colors */}
            <pointLight position={[-5, 2, -5]} color="#FF007F" intensity={50} distance={20} />
            <pointLight position={[5, 2, 5]} color="#00FFFF" intensity={50} distance={20} />

            <SynthwaveGrid />
            <SynthwaveSun />

            <MiamiPalmTree position={[-8, -0.4, -12]} scale={1.2} />
            <MiamiPalmTree position={[8, -0.4, -15]} scale={1.5} />
            <MiamiPalmTree position={[10, -0.4, 2]} scale={1.0} />
            <MiamiPalmTree position={[-12, -0.4, 0]} scale={1.4} />
            <Suspense fallback={null}>
              <PlayerCar groupRef={{ current: null } as any} textures={textures} speed={0} steering={0} />
            </Suspense>
            <DragToRotate />
          </Canvas>
          <div style={{ position: 'absolute', bottom: '1rem', left: 0, right: 0, textAlign: 'center', pointerEvents: 'none' }}>
             <span className="font-mono" style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>MOVE MOUSE TO ROTATE</span>
          </div>
        </div>

        {/* LIVE STATS SIDEBAR */}
        <div style={{ width: '250px', display: 'flex', flexDirection: 'column', gap: '1rem', background: 'var(--bg-secondary)', padding: '1rem', borderRadius: '16px', border: '1px solid var(--border-light)', overflowY: 'auto' }}>
          <h3 className="font-mono" style={{ fontSize: '0.9rem', color: 'var(--text-muted)', margin: '0 0 1rem 0', textAlign: 'center' }}>LIVE SCORES</h3>
          {room.players.filter(p => p.id !== socket?.id).map(p => (
            <div key={p.id} style={{ background: 'var(--bg-primary)', borderRadius: '12px', padding: '1rem', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1rem', border: '1px solid var(--border-light)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <span style={{ fontSize: '1.2rem' }}>{(p as any).avatar || '🚗'}</span>
                <span className="font-display" style={{ fontSize: '1rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '120px' }}>{p.displayName}</span>
              </div>
              <div style={{ textAlign: 'center' }}>
                <div className="font-mono" style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>DESIGN SCORE</div>
                <div className="font-display" style={{ fontSize: '2rem', color: p.hasSubmitted ? 'var(--klustor-green)' : 'var(--text-primary)' }}>
                  {(p as any).liveScore !== undefined ? (p as any).liveScore.toFixed(1) : '0.0'}
                </div>
                {p.hasSubmitted && (
                  <div className="font-mono" style={{ fontSize: '0.7rem', color: 'var(--klustor-green)', marginTop: '0.25rem' }}>SUBMITTED</div>
                )}
              </div>
            </div>
          ))}
          {room.players.length <= 1 && (
            <div className="font-mono" style={{ fontSize: '0.8rem', color: 'var(--text-muted)', textAlign: 'center', marginTop: '2rem' }}>Waiting for others...</div>
          )}
        </div>

      </div>
    </div>
  );
}
