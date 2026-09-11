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
  
  const [phase, setPhase] = useState<'design' | 'reveal'>('design');
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
      
      // Give a slight delay before revealing
      setTimeout(() => {
         setPhase('reveal');
         setIsSaving(false);
      }, 600);
    } catch (err) {
      console.error('Save failed:', err);
      setIsSaving(false);
    }
  }, [selectedView, textures, saveLiveryFace]);

  const VIEWS: { id: TemplateView; label: string }[] = [
    { id: 'left', label: 'LEFT' },
    { id: 'right', label: 'RIGHT' },
    { id: 'top', label: 'TOP' },
    { id: 'front', label: 'FRONT' },
    { id: 'rear', label: 'REAR' },
  ];

  if (phase === 'reveal') {
    return (
      <div className="page" style={{ alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ position: 'absolute', top: '3rem', textAlign: 'center', zIndex: 10 }}>
          <h2 className="font-display" style={{ fontSize: '2rem', letterSpacing: '0.1em' }}>YOUR CAR</h2>
        </div>

        <div style={{ width: '100vw', height: '55vh', position: 'relative' }}>
          <Canvas camera={{ position: [0, 2.5, 6], fov: 50 }} gl={{ antialias: true }}>
            <ambientLight intensity={1.2} color="#FFFFFF" />
            <directionalLight position={[5, 8, 5]} intensity={1.5} color="#FFFFFF" />
            <hemisphereLight color="#FFFFFF" groundColor="#EAF2B6" intensity={0.6} />
            <Suspense fallback={null}>
              <PlayerCar groupRef={{ current: null } as any} textures={textures} speed={0} steering={0} />
            </Suspense>
            <AutoRotateCamera />
          </Canvas>
        </div>

        <div style={{ textAlign: 'center', zIndex: 10, marginTop: '1rem' }}>
          <h1 style={{ fontSize: 'min(10vw, 5rem)', marginBottom: '0.5rem', lineHeight: 1 }}>LOOKS FAST.</h1>
          <div style={{ fontSize: '1.5rem', fontFamily: 'var(--font-mono)', marginBottom: '0.25rem' }}>
            {stats.topSpeed} KM/H
          </div>
          <div style={{ fontSize: '1.25rem', fontFamily: 'var(--font-mono)', marginBottom: '2rem', color: 'var(--text-muted)' }}>
            DESIGN {stats.designScore.toFixed(1)}
          </div>
          
          <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center' }}>
            <button className="btn-retro" onClick={() => setPhase('design')}>
              EDIT CAR
            </button>
            <button className="btn-retro btn-retro-primary" onClick={() => navigate('/race')}>
              DRIVE →
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="page" style={{ padding: '2rem', display: 'flex', flexDirection: 'column', height: '100vh' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexShrink: 0 }}>
        <div>
          <div className="font-display" style={{ fontSize: '1.2rem', letterSpacing: '0.1em' }}>KLUSTOR</div>
          <h1 style={{ fontSize: '3rem', lineHeight: 1 }}>DESIGN YOUR RIDE</h1>
        </div>
        <div style={{ textAlign: 'right', background: 'var(--bg-secondary)', padding: '1rem 1.5rem', borderRadius: '16px', border: '3px solid var(--text-primary)', boxShadow: '4px 4px 0px rgba(0,0,0,0.1)' }}>
           <div className="font-mono" style={{ fontSize: '1.1rem', marginBottom: '0.25rem' }}>Design: <strong>{stats.designScore.toFixed(1)}</strong></div>
           <div className="font-mono" style={{ fontSize: '1.1rem' }}>Speed: <strong>{stats.topSpeed} km/h</strong></div>
        </div>
      </div>

      <div className="klustor-editor-wrapper" style={{ flex: 1, display: 'flex', flexDirection: 'column', minHeight: 0 }}>
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
        
        <div style={{ flex: 1, position: 'relative', background: 'white' }}>
          {templateUrl && (
            <LiveryEditor
              key={selectedView}
              templateSrc={templateUrl}
              onSave={handleEditorSave}
              editorId={`editor-${selectedView}`}
            />
          )}
          {isSaving && (
            <div style={{
              position: 'absolute', inset: 0, background: 'rgba(255,255,255,0.8)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontFamily: 'var(--font-mono)', fontSize: '1.5rem', fontWeight: 'bold'
            }}>
              ANALYZING...
            </div>
          )}
        </div>
      </div>
      
      <div style={{ marginTop: '1rem', textAlign: 'center', color: 'var(--text-muted)', flexShrink: 0 }}>
        <p className="font-mono" style={{ fontSize: '0.9rem' }}>More style = more speed. Click "Save" inside the editor when done.</p>
      </div>
    </div>
  );
}
