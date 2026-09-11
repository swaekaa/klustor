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
  const { saveLiveryFace, currentLivery } = useGameStore();
  
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

  return (
    <div className="page" style={{ display: 'flex', flexDirection: 'column', height: '100vh', padding: '1rem', background: 'var(--bg-primary)', overflow: 'hidden' }}>
      
      {/* Top Header Floating Bar */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', padding: '1rem 2rem', background: 'var(--bg-secondary)', border: '3px solid var(--text-primary)', borderRadius: '16px', boxShadow: '4px 4px 0px rgba(0,0,0,0.05)' }}>
        <div>
          <div className="font-display" style={{ fontSize: '1rem', letterSpacing: '0.1em', color: 'var(--klustor-pink)' }}>KLUSTOR</div>
          <h1 style={{ fontSize: '2rem', lineHeight: 1, margin: 0 }}>LIVERY STUDIO</h1>
        </div>
        <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
          <button className="btn-retro" onClick={() => navigate('/garage')} style={{ padding: '0.5rem 1rem' }}>
            ← GARAGE
          </button>
          <button className="btn-retro btn-retro-primary" onClick={() => navigate('/race')} style={{ padding: '0.5rem 1rem' }}>
            DONE (RACE) →
          </button>
        </div>
      </div>

      <div style={{ flex: 1, display: 'flex', gap: '1rem', minHeight: 0 }}>
        
        {/* Left Side: Unlayer & View Controls */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          
          {/* View Selector Panel */}
          <div style={{ display: 'flex', gap: '0.5rem', padding: '1rem', background: 'var(--bg-secondary)', border: '3px solid var(--text-primary)', borderRadius: '16px', boxShadow: '4px 4px 0px rgba(0,0,0,0.05)' }}>
            <div style={{ marginRight: '1rem', display: 'flex', alignItems: 'center' }}>
               <strong className="font-display" style={{ fontSize: '1.2rem' }}>EDIT VIEW:</strong>
            </div>
            {VIEWS.map((v) => (
              <button
                key={v.id}
                onClick={() => setSelectedView(v.id)}
                className={selectedView === v.id ? "btn-retro btn-retro-primary" : "btn-retro"}
                style={{ flex: 1, padding: '0.5rem', fontSize: '1rem' }}
              >
                {v.label}
              </button>
            ))}
          </div>
          
          {/* Unlayer Canvas Panel */}
          <div style={{ flex: 1, position: 'relative', background: 'white', border: '3px solid var(--text-primary)', borderRadius: '16px', overflow: 'hidden', boxShadow: '4px 4px 0px rgba(0,0,0,0.05)' }}>
            <div style={{ position: 'absolute', top: '1rem', left: '1rem', zIndex: 10, pointerEvents: 'none', background: 'var(--klustor-yellow)', padding: '0.5rem 1rem', border: '3px solid var(--text-primary)', borderRadius: '12px' }}>
              <strong className="font-display" style={{ fontSize: '1.2rem' }}>{VIEWS.find(v => v.id === selectedView)?.label} TEMPLATE</strong>
            </div>

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
                position: 'absolute', inset: 0, background: 'rgba(255,255,255,0.85)', backdropFilter: 'blur(4px)',
                display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 20
              }}>
                <div className="font-display" style={{ fontSize: '2rem', color: 'var(--klustor-pink)' }}>
                  APPLYING LIVERY...
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Right Side: 3D Preview & Stats */}
        <div style={{ width: '450px', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          
          {/* 3D Canvas Panel */}
          <div style={{ flex: 1, position: 'relative', background: 'var(--bg-secondary)', border: '3px solid var(--text-primary)', borderRadius: '16px', overflow: 'hidden', boxShadow: '4px 4px 0px rgba(0,0,0,0.05)' }}>
            <div style={{ position: 'absolute', top: '1rem', right: '1rem', zIndex: 10 }}>
              <div className="font-display" style={{ background: 'var(--text-primary)', color: 'white', padding: '0.5rem 1rem', borderRadius: '12px', fontSize: '0.9rem', letterSpacing: '0.1em' }}>
                LIVE 3D PREVIEW
              </div>
            </div>
            
            <Canvas camera={{ position: [0, 1.5, 4.5], fov: 45 }} gl={{ antialias: true, toneMapping: 1, toneMappingExposure: 1.2 }}>
              <ambientLight intensity={1.5} color="#FFFFFF" />
              <directionalLight position={[5, 8, 5]} intensity={2.0} color="#FFF5E6" castShadow />
              <directionalLight position={[-5, 5, -5]} intensity={1.0} color="#E6F0FF" />
              <hemisphereLight color="#FFFFFF" groundColor="#EAF2B6" intensity={0.8} />
              
              {/* Studio Backdrop Ring */}
              <mesh position={[0, -0.4, 0]} rotation={[-Math.PI/2, 0, 0]}>
                <ringGeometry args={[2, 6, 32]} />
                <meshBasicMaterial color="#E0E8E8" transparent opacity={0.5} />
              </mesh>

              <Suspense fallback={null}>
                <PlayerCar groupRef={{ current: null } as any} textures={textures} speed={0} steering={0} />
              </Suspense>
              <DragToRotate />
            </Canvas>
          </div>
          
          {/* Stats Panel */}
          <div style={{ padding: '1.5rem', background: 'var(--bg-secondary)', border: '3px solid var(--text-primary)', borderRadius: '16px', boxShadow: '4px 4px 0px rgba(0,0,0,0.05)' }}>
            <h3 className="font-display" style={{ fontSize: '1.2rem', marginBottom: '1rem' }}>CAR STATS</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontFamily: 'var(--font-mono)' }}>
                <span>TOP SPEED</span>
                <strong>{stats.topSpeed} KM/H</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontFamily: 'var(--font-mono)' }}>
                <span>ACCELERATION</span>
                <strong>{stats.acceleration.toFixed(1)}</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontFamily: 'var(--font-mono)' }}>
                <span>HANDLING</span>
                <strong>{stats.handling.toFixed(1)}</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontFamily: 'var(--font-mono)', color: 'var(--klustor-pink)', marginTop: '0.5rem', paddingTop: '0.5rem', borderTop: '2px dashed var(--text-primary)' }}>
                <span>DESIGN SCORE</span>
                <strong style={{ fontSize: '1.2rem' }}>{stats.designScore.toFixed(1)} / 10</strong>
              </div>
            </div>
          </div>
          
        </div>
      </div>
    </div>
  );
}
