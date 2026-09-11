import { useState, useCallback, useEffect, Suspense } from 'react';
import { useNavigate } from 'react-router-dom';
import { Canvas, useFrame } from '@react-three/fiber';
import { useGameStore } from '../store/gameStore';
import { analyzeAllFaces, defaultStats } from '../game/utils/designAnalysis';
import { getCarTemplateUrl } from '../game/utils/carTemplateUrl';
import LiveryEditor from '../components/editor/LiveryEditor';
import PlayerCar from '../game/components/PlayerCar';
import type { CarStats, TemplateView } from '../types';

// Camera for the reveal screen
function AutoRotateCamera() {
  useFrame(({ camera, clock }) => {
    const t = clock.getElapsedTime() * 0.4;
    const radius = 6.5;
    camera.position.x = Math.sin(t) * radius;
    camera.position.z = Math.cos(t) * radius;
    camera.position.y = 2.0;
    camera.lookAt(0, 0.3, 0);
  });
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
    <div className="page" style={{ display: 'flex', flexDirection: 'column', height: '100vh', overflow: 'hidden' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1.5rem 2rem', background: 'var(--bg-secondary)', borderBottom: '3px solid var(--text-primary)', flexShrink: 0 }}>
        <div>
          <div className="font-display" style={{ fontSize: '1.2rem', letterSpacing: '0.1em' }}>KLUSTOR</div>
          <h1 style={{ fontSize: '2.5rem', lineHeight: 1 }}>LIVERY STUDIO</h1>
        </div>
        <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
          <div style={{ textAlign: 'right', marginRight: '1rem' }}>
             <div className="font-mono" style={{ fontSize: '1rem' }}>Design Score: <strong>{stats.designScore.toFixed(1)}</strong></div>
             <div className="font-mono" style={{ fontSize: '1rem' }}>Top Speed: <strong>{stats.topSpeed} km/h</strong></div>
          </div>
          <button className="btn-retro" onClick={() => navigate('/garage')} style={{ padding: '0.75rem 1.5rem', fontSize: '1rem' }}>
            ← GARAGE
          </button>
          <button className="btn-retro btn-retro-primary" onClick={() => navigate('/race')} style={{ padding: '0.75rem 1.5rem', fontSize: '1rem' }}>
            DONE (RACE) →
          </button>
        </div>
      </div>

      <div style={{ flex: 1, display: 'grid', gridTemplateColumns: '1fr 450px', minHeight: 0 }}>
        {/* Left Side: Unlayer Editor */}
        <div className="klustor-editor-wrapper" style={{ display: 'flex', flexDirection: 'column', borderRight: '3px solid var(--text-primary)', background: 'white' }}>
          <div style={{ display: 'flex', background: 'var(--bg-secondary)', borderBottom: '3px solid var(--text-primary)', flexShrink: 0 }}>
            {VIEWS.map((v, i) => (
              <button
                key={v.id}
                onClick={() => setSelectedView(v.id)}
                style={{
                  flex: 1, padding: '1rem 0', cursor: 'pointer',
                  background: selectedView === v.id ? 'var(--klustor-yellow)' : 'transparent',
                  border: 'none', borderRight: i === VIEWS.length - 1 ? 'none' : '3px solid var(--text-primary)',
                  fontFamily: 'var(--font-display)', fontWeight: 900, fontSize: '1.25rem',
                  color: 'var(--text-primary)', transition: 'background 0.2s',
                }}
              >
                {v.label}
              </button>
            ))}
          </div>
          
          <div style={{ flex: 1, position: 'relative' }}>
            <div style={{ position: 'absolute', top: '1rem', left: '1rem', zIndex: 10, pointerEvents: 'none', background: 'rgba(255,255,255,0.9)', padding: '0.5rem 1rem', border: '2px solid var(--text-primary)', borderRadius: '8px' }}>
              <strong className="font-display" style={{ fontSize: '1.2rem' }}>{VIEWS.find(v => v.id === selectedView)?.label}</strong>
              <div className="font-mono" style={{ fontSize: '0.8rem' }}>Draw over the car outline below.</div>
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
                position: 'absolute', inset: 0, background: 'rgba(255,255,255,0.8)',
                display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 20,
                fontFamily: 'var(--font-mono)', fontSize: '1.5rem', fontWeight: 'bold'
              }}>
                SAVING TO 3D CAR...
              </div>
            )}
          </div>
        </div>

        {/* Right Side: 3D Preview */}
        <div style={{ display: 'flex', flexDirection: 'column', background: 'var(--bg-primary)', position: 'relative' }}>
          <div style={{ position: 'absolute', top: '1rem', right: '1rem', zIndex: 10 }}>
            <div className="font-display" style={{ background: 'var(--text-primary)', color: 'white', padding: '0.5rem 1rem', borderRadius: '8px', fontSize: '0.9rem', letterSpacing: '0.1em' }}>
              LIVE 3D PREVIEW
            </div>
          </div>
          
          <div style={{ flex: 1, position: 'relative' }}>
            <Canvas camera={{ position: [0, 2, 5], fov: 45 }} gl={{ antialias: true }}>
              <ambientLight intensity={1.2} color="#FFFFFF" />
              <directionalLight position={[5, 8, 5]} intensity={1.5} color="#FFFFFF" />
              <hemisphereLight color="#FFFFFF" groundColor="#EAF2B6" intensity={0.6} />
              <Suspense fallback={null}>
                <PlayerCar groupRef={{ current: null } as any} textures={textures} speed={0} steering={0} />
              </Suspense>
              <AutoRotateCamera />
            </Canvas>
          </div>
          
          {/* Stats Panel */}
          <div style={{ padding: '2rem', borderTop: '3px solid var(--text-primary)', background: 'var(--bg-secondary)', flexShrink: 0 }}>
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
              <div style={{ display: 'flex', justifyContent: 'space-between', fontFamily: 'var(--font-mono)', color: 'var(--klustor-pink)' }}>
                <span>DESIGN SCORE</span>
                <strong>{stats.designScore.toFixed(1)} / 10</strong>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
