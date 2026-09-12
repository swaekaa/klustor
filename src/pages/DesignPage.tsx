import { useState, useCallback, useEffect, Suspense } from 'react';
import { useNavigate } from 'react-router-dom';
import { Canvas, useFrame } from '@react-three/fiber';
import { useGameStore } from '../store/gameStore';
import { analyzeAllFaces, defaultStats } from '../game/utils/designAnalysis';
import { getCarTemplateUrl } from '../game/utils/carTemplateUrl';
import LiveryEditor from '../components/editor/LiveryEditor';
import PlayerCar from '../game/components/PlayerCar';
import type { CarStats, TemplateView } from '../types';

import { useThree } from '@react-three/fiber';

// Custom lightweight drag controls for the showcase
function StylizedTree({ position, scale = 1 }: { position: [number, number, number], scale?: number }) {
  return (
    <group position={position} scale={scale}>
      <mesh position={[0, 1, 0]}>
        <cylinderGeometry args={[0.2, 0.3, 2]} />
        <meshStandardMaterial color="#6B4E31" roughness={0.9} />
      </mesh>
      <mesh position={[0, 2.5, 0]}>
        <coneGeometry args={[1.2, 2, 5]} />
        <meshStandardMaterial color="#4A7C59" roughness={0.8} />
      </mesh>
      <mesh position={[0, 3.5, 0]}>
        <coneGeometry args={[1.0, 1.8, 5]} />
        <meshStandardMaterial color="#558C66" roughness={0.8} />
      </mesh>
    </group>
  );
}

function StylizedMountain({ position, scale = 1, color = "#5A7A60" }: { position: [number, number, number], scale?: number, color?: string }) {
  return (
    <mesh position={position} scale={scale}>
      <coneGeometry args={[10, 20, 5]} />
      <meshStandardMaterial color={color} roughness={1.0} flatShading />
    </mesh>
  );
}

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

export default function DesignPage() {
  const navigate = useNavigate();
  const { saveLiveryFace, currentLivery, player, raceRecords } = useGameStore();
  const topRecords = [...raceRecords].sort((a, b) => a.time - b.time).slice(0, 5);
  const [selectedView, setSelectedView] = useState<TemplateView>('left');
  const [templateUrl, setTemplateUrl] = useState<string>('');
  
  const [textures, setTextures] = useState<Partial<Record<TemplateView, string>>>(currentLivery?.textures ?? {});
  const [stats, setStats] = useState<CarStats>(currentLivery?.stats ?? defaultStats());
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    getCarTemplateUrl(selectedView).then(setTemplateUrl);
  }, [selectedView]);

  const handleEditorSave = useCallback(async (dataUrl: string) => {
    setIsSaving(true);
    try {
      const newTextures = { ...textures, [selectedView]: dataUrl };
      setTextures(newTextures);
      
      const computed = await analyzeAllFaces(newTextures, getCarTemplateUrl);
      setStats(computed);
      saveLiveryFace(dataUrl, selectedView, computed, 'MY RIDE');
    } catch (err) {
      console.error('Save failed:', err);
    } finally {
      setIsSaving(false);
    }
  }, [selectedView, textures, saveLiveryFace]);

  const VIEWS: { id: TemplateView; label: string }[] = [
    { id: 'left', label: 'LEFT SIDE' },
    { id: 'right', label: 'RIGHT SIDE' },
    { id: 'top', label: 'TOP' },
    { id: 'front', label: 'FRONT' },
    { id: 'rear', label: 'REAR' },
  ];

  // Format times
  const bestTimeStr = player.bestTime 
    ? `${String(Math.floor(player.bestTime/60000)).padStart(2,'0')}:${String(Math.floor(player.bestTime/1000)%60).padStart(2,'0')}.${String(Math.floor((player.bestTime%1000)/10)).padStart(2,'0')}`
    : '--:--.--';

  return (
    <div className="page" style={{ padding: '2rem 4rem', background: 'var(--bg-primary)', minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
      
      {/* 1. MINIMAL HEADER & NAV */}
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginBottom: '3rem', width: '100%' }}>
        <h1 className="font-display" style={{ fontSize: '2.5rem', letterSpacing: '0.15em', color: 'var(--text-primary)', marginBottom: '1.5rem' }}>
          KLUSTOR
        </h1>
        
        <div style={{ display: 'flex', gap: '1rem', background: 'var(--bg-secondary)', padding: '0.5rem', borderRadius: '999px', boxShadow: '0 4px 12px rgba(0,0,0,0.05)' }}>
          <button className="btn" onClick={() => navigate('/garage')} style={{ background: 'transparent', border: 'none', boxShadow: 'none' }}>
             ◉ GARAGE
          </button>
          <button className="btn" onClick={() => navigate('/race')} style={{ background: 'var(--klustor-pink)', border: 'none', boxShadow: 'none' }}>
             ● RACE
          </button>
          <button className="btn" onClick={() => navigate('/leaderboard')} style={{ background: 'transparent', border: 'none', boxShadow: 'none' }}>
             ◉ LEADERBOARD
          </button>
        </div>
      </div>

      {/* 2. MAIN GRID (EDITOR & 3D CAR) */}
      <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '3rem', width: '100%', maxWidth: '1400px', marginBottom: '4rem' }}>
        
        {/* LEFT: LIVERY STUDIO */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div>
            <h2 className="font-display" style={{ fontSize: '2rem', marginBottom: '0.2rem' }}>LIVERY STUDIO</h2>
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.9rem', color: 'var(--text-muted)' }}>Design your ride. More style = more speed.</div>
          </div>
          
          <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', marginBottom: '1rem' }}>
            {VIEWS.map(v => (
              <button 
                key={v.id} 
                onClick={() => setSelectedView(v.id)} 
                className="btn" 
                style={{ 
                  padding: '0.5rem 1.25rem', borderRadius: '999px', fontSize: '0.9rem',
                  background: selectedView === v.id ? 'var(--klustor-cyan)' : 'var(--bg-secondary)',
                  border: '1px solid var(--border-light)', boxShadow: '0 2px 4px rgba(0,0,0,0.05)'
                }}
              >
                {v.label}
              </button>
            ))}
          </div>
          
          <div style={{ flex: 1, background: 'white', borderRadius: '24px', overflow: 'hidden', position: 'relative', boxShadow: '0 8px 24px rgba(0,0,0,0.05)', minHeight: '500px', border: '1px solid var(--border-light)' }}>
            {templateUrl && (
              <LiveryEditor
                key={selectedView}
                templateSrc={textures[selectedView] || templateUrl}
                onSave={handleEditorSave}
                editorId={`editor-${selectedView}`}
              />
            )}
            {isSaving && (
              <div style={{
                position: 'absolute', inset: 0, background: 'rgba(255,255,255,0.85)', backdropFilter: 'blur(8px)',
                display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 20
              }}>
                <div className="font-display" style={{ fontSize: '2rem', color: 'var(--text-primary)' }}>
                  SAVING...
                </div>
              </div>
            )}
          </div>
        </div>

        {/* RIGHT: LIVE 3D PREVIEW */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div>
            <h2 className="font-display" style={{ fontSize: '2rem', marginBottom: '0.2rem' }}>LIVE 3D PREVIEW</h2>
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.9rem', color: 'var(--text-muted)' }}>Your design in real time.</div>
          </div>
          
          <div style={{ flex: 1, background: 'var(--bg-secondary)', borderRadius: '24px', overflow: 'hidden', position: 'relative', boxShadow: '0 8px 24px rgba(0,0,0,0.05)', minHeight: '500px', border: '1px solid var(--border-light)' }}>
            <Canvas camera={{ position: [0, 1.8, 5], fov: 45 }} gl={{ antialias: true, toneMapping: 1, toneMappingExposure: 1.2 }}>
              <fog attach="fog" args={['#87CEEB', 10, 80]} />
              <ambientLight intensity={1.2} color="#FFFFFF" />
              <directionalLight position={[10, 15, 10]} intensity={1.8} color="#FFFFEE" castShadow />
              <hemisphereLight color="#87CEEB" groundColor="#6B8E23" intensity={0.6} />
              
              {/* Soft Grass Floor */}
              <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.4, 0]}>
                <planeGeometry args={[300, 300]} />
                <meshStandardMaterial color="#88AA66" roughness={1.0} metalness={0.0} />
              </mesh>

              {/* Background Mountains */}
              <StylizedMountain position={[-30, -5, -40]} scale={1.5} color="#4A6A50" />
              <StylizedMountain position={[15, -2, -50]} scale={2.2} color="#55755A" />
              <StylizedMountain position={[40, -10, -35]} scale={1.8} color="#65856A" />
              <StylizedMountain position={[-50, -5, 20]} scale={1.2} color="#4A6A50" />

              {/* Decorative Trees */}
              <StylizedTree position={[-4, -0.4, -4]} scale={1.2} />
              <StylizedTree position={[5, -0.4, -3]} scale={1.5} />
              <StylizedTree position={[4, -0.4, 4]} scale={1.0} />
              <StylizedTree position={[-5, -0.4, 3]} scale={1.3} />

              {/* Subtle dirt/gravel display pad */}
              <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.39, 0]}>
                <circleGeometry args={[4.2, 32]} />
                <meshStandardMaterial color="#A99B85" roughness={1.0} metalness={0.0} />
              </mesh>
              
              <Suspense fallback={null}>
                <PlayerCar groupRef={{ current: null } as any} textures={textures} speed={0} steering={0} />
              </Suspense>
              <DragToRotate />
            </Canvas>
            <div style={{ position: 'absolute', bottom: '1.5rem', left: 0, right: 0, textAlign: 'center', pointerEvents: 'none' }}>
               <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.8rem', color: 'var(--text-muted)', background: 'rgba(255,255,255,0.8)', padding: '0.25rem 1rem', borderRadius: '999px' }}>MOVE MOUSE TO ROTATE</span>
            </div>
          </div>
        </div>
      </div>

      {/* 3. BOTTOM SECTION (STATS & LEADERBOARD) */}
      <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '3rem', width: '100%', maxWidth: '1400px', marginBottom: '4rem' }}>
        
        {/* STATS */}
        <div style={{ background: 'var(--bg-secondary)', padding: '2rem', borderRadius: '24px', boxShadow: '0 8px 24px rgba(0,0,0,0.05)', border: '1px solid var(--border-light)' }}>
          <h3 className="font-display" style={{ fontSize: '1.5rem', marginBottom: '1.5rem' }}>CAR STATS</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontFamily: 'var(--font-mono)', fontSize: '0.9rem', marginBottom: '0.25rem' }}>
                <span>TOP SPEED</span><span>{stats.topSpeed} KM/H</span>
              </div>
              <div style={{ height: '4px', background: 'var(--border-light)', borderRadius: '999px' }}>
                <div style={{ height: '100%', width: `${Math.min(100, (stats.topSpeed/150)*100)}%`, background: 'var(--klustor-green)', borderRadius: '999px' }} />
              </div>
            </div>
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontFamily: 'var(--font-mono)', fontSize: '0.9rem', marginBottom: '0.25rem' }}>
                <span>ACCELERATION</span><span>{stats.acceleration.toFixed(1)}</span>
              </div>
              <div style={{ height: '4px', background: 'var(--border-light)', borderRadius: '999px' }}>
                <div style={{ height: '100%', width: `${(stats.acceleration/10)*100}%`, background: 'var(--klustor-cyan)', borderRadius: '999px' }} />
              </div>
            </div>
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontFamily: 'var(--font-mono)', fontSize: '0.9rem', marginBottom: '0.25rem' }}>
                <span>HANDLING</span><span>{stats.handling.toFixed(1)}</span>
              </div>
              <div style={{ height: '4px', background: 'var(--border-light)', borderRadius: '999px' }}>
                <div style={{ height: '100%', width: `${(stats.handling/10)*100}%`, background: 'var(--klustor-yellow)', borderRadius: '999px' }} />
              </div>
            </div>
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontFamily: 'var(--font-mono)', fontSize: '0.9rem', marginBottom: '0.25rem' }}>
                <span>STYLE BONUS</span><span>{stats.designScore.toFixed(1)}</span>
              </div>
              <div style={{ height: '4px', background: 'var(--border-light)', borderRadius: '999px' }}>
                <div style={{ height: '100%', width: `${(stats.designScore/10)*100}%`, background: 'var(--klustor-pink)', borderRadius: '999px' }} />
              </div>
            </div>
          </div>
          
          <div style={{ marginTop: '2rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
             <span className="font-mono" style={{ fontSize: '1rem', color: 'var(--text-muted)' }}>Design Score</span>
             <span className="font-display" style={{ fontSize: '2rem' }}>{stats.designScore.toFixed(1)}</span>
          </div>
        </div>

        {/* LEADERBOARD */}
        <div style={{ background: 'var(--bg-secondary)', padding: '2rem', borderRadius: '24px', boxShadow: '0 8px 24px rgba(0,0,0,0.05)', border: '1px solid var(--border-light)', display: 'flex', flexDirection: 'column' }}>
          <h3 className="font-display" style={{ fontSize: '1.5rem', marginBottom: '1.5rem' }}>LEADERBOARD</h3>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', flex: 1 }}>
            {topRecords.length === 0 ? (
              <div style={{ fontFamily: 'var(--font-mono)', color: 'var(--text-muted)' }}>No records yet.</div>
            ) : (
              topRecords.slice(0,3).map((r, i) => (
                <div key={r.id} style={{ display: 'flex', alignItems: 'center', gap: '1rem', padding: '0.75rem', background: (r.driverName === player.driverName && !r.isNPC) ? 'var(--klustor-yellow)' : 'transparent', borderRadius: '12px' }}>
                  <div className="font-display" style={{ fontSize: '1.2rem', width: '24px' }}>{i === 0 ? '🏆' : i + 1}</div>
                  {r.liveryTextures?.left ? (
                    <img src={r.liveryTextures.left} alt="Livery" style={{ width: '64px', height: '32px', objectFit: 'cover', borderRadius: '4px', border: '1px solid var(--border-light)' }} />
                  ) : (
                    <div style={{ width: '64px', height: '32px', background: 'var(--bg-primary)', borderRadius: '4px', border: '1px solid var(--border-light)' }} />
                  )}
                  <div className="font-display" style={{ flex: 1, fontSize: '1.1rem' }}>{r.driverName}</div>
                  <div className="font-mono" style={{ fontWeight: 'bold' }}>{String(Math.floor(r.time/60000)).padStart(2,'0')}:{String(Math.floor(r.time/1000)%60).padStart(2,'0')}.{String(Math.floor((r.time%1000)/10)).padStart(2,'0')}</div>
                </div>
              ))
            )}
          </div>
          
          <button className="btn" style={{ background: 'transparent', border: 'none', boxShadow: 'none', color: 'var(--text-muted)', marginTop: '1rem', alignSelf: 'flex-start' }} onClick={() => navigate('/leaderboard')}>
            [ VIEW FULL → ]
          </button>
        </div>
      </div>

      {/* 4. BIG RACE BUTTON */}
      <button 
        className="btn" 
        style={{ 
          padding: '1.5rem 4rem', fontSize: '2rem', borderRadius: '999px', 
          background: 'var(--klustor-pink)', color: 'var(--text-primary)', 
          border: 'none', boxShadow: '0 8px 24px rgba(255, 160, 214, 0.4)' 
        }} 
        onClick={() => navigate('/race')}
      >
        RACE NOW
      </button>

    </div>
  );
}
