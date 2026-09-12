import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useState, useCallback, useRef, Suspense, useEffect } from 'react';
import { Canvas } from '@react-three/fiber';
import * as THREE from 'three';
import { useGameStore } from '../store/gameStore';
import { analyzeAllFaces, defaultStats } from '../game/utils/designAnalysis';
import { getCarTemplateUrl } from '../game/utils/carTemplateUrl';
import LiveryEditor from '../components/editor/LiveryEditor';
import PlayerCar from '../game/components/PlayerCar';
import { useFrame, useThree } from '@react-three/fiber';
import type { CarStats, TemplateView } from '../types';

// ── Car template URL (served from /public) ───────────────────
// The generated car outline image
const CAR_TEMPLATE_URL = '/car-template.png';

// ── Interactive camera for 3D preview ─────────────────────────
function TargetCamera({ view }: { view: TemplateView }) {
  const { camera } = useThree();
  const currentAngle = useRef(0);
  
  useFrame(({ pointer }) => {
    let baseAngle = 0;
    let baseY = 2.5;
    let dist = 6.5;
    
    switch (view) {
      case 'left': baseAngle = Math.PI / 2; break;
      case 'right': baseAngle = -Math.PI / 2; break;
      case 'front': baseAngle = 0; break;
      case 'rear': baseAngle = Math.PI; break;
      case 'top': baseAngle = Math.PI / 4; baseY = 6; dist = 3; break;
    }
    
    const targetAngle = baseAngle + pointer.x * 0.5;
    currentAngle.current += (targetAngle - currentAngle.current) * 0.1;
    
    const tx = Math.sin(currentAngle.current) * dist;
    const tz = Math.cos(currentAngle.current) * dist;
    const ty = baseY + pointer.y * 1.5;

    camera.position.x += (tx - camera.position.x) * 0.1;
    camera.position.y += (ty - camera.position.y) * 0.1;
    camera.position.z += (tz - camera.position.z) * 0.1;
    camera.lookAt(0, 0.5, 0);
  });
  return null;
}

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

// ── 3D preview scene ─────────────────────────────────────────
function PreviewScene({ textures, view }: { textures: Partial<Record<TemplateView, string>>; view: TemplateView }) {
  const groupRef = useRef<THREE.Group>(null!);
  return (
    <>
      <fog attach="fog" args={['#87CEEB', 10, 80]} />
      <ambientLight intensity={1.2} color="#FFFFFF" />
      <directionalLight position={[10, 15, 10]} intensity={1.8} color="#FFFFEE" castShadow />
      <hemisphereLight color="#87CEEB" groundColor="#6B8E23" intensity={0.6} />
      
      {/* Soft Grass Floor */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.01, 0]}>
        <planeGeometry args={[300, 300]} />
        <meshStandardMaterial color="#88AA66" roughness={1.0} metalness={0.0} />
      </mesh>

      {/* Background Mountains */}
      <StylizedMountain position={[-30, -5, -40]} scale={1.5} color="#4A6A50" />
      <StylizedMountain position={[15, -2, -50]} scale={2.2} color="#55755A" />
      <StylizedMountain position={[40, -10, -35]} scale={1.8} color="#65856A" />
      <StylizedMountain position={[-50, -5, 20]} scale={1.2} color="#4A6A50" />
      
      {/* Decorative Trees */}
      <StylizedTree position={[-4, 0, -4]} scale={1.2} />
      <StylizedTree position={[5, 0, -3]} scale={1.5} />
      <StylizedTree position={[4, 0, 4]} scale={1.0} />
      <StylizedTree position={[-5, 0, 3]} scale={1.3} />

      {/* Subtle dirt/gravel display pad */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.0, 0]}>
        <circleGeometry args={[4.0, 32]} />
        <meshStandardMaterial color="#A99B85" roughness={1.0} metalness={0.0} />
      </mesh>

      <PlayerCar groupRef={groupRef} textures={textures} speed={0} steering={0} />
      <TargetCamera view={view} />
    </>
  );
}

// ── Stat badge ────────────────────────────────────────────────
function StatBadge({ label, value, color }: { label: string; value: string | number; color: string }) {
  return (
    <div style={{
      display: 'flex', flexDirection: 'column', alignItems: 'center',
      padding: '0.5rem 0.75rem', background: 'rgba(250,249,243,0.9)',
      borderRadius: '10px', border: `2px solid ${color}`, minWidth: '70px',
    }}>
      <div style={{ fontFamily: 'Consolas,monospace', fontSize: '0.6rem', color: 'var(--text-muted)', letterSpacing: '0.08em', marginBottom: '2px' }}>{label}</div>
      <div style={{ fontFamily: 'Trebuchet MS,sans-serif', fontWeight: 'bold', fontSize: '1rem', color: 'var(--text-primary)' }}>{value}</div>
    </div>
  );
}

// ── Main CustomizePage ────────────────────────────────────────
export default function CustomizePage() {
  const navigate = useNavigate();
  const { saveLiveryFace, currentLivery } = useGameStore();
  const [selectedView, setSelectedView] = useState<TemplateView>('left');
  const [templateUrl, setTemplateUrl] = useState<string>('');
  
  const [textures, setTextures] = useState<Partial<Record<TemplateView, string>>>(currentLivery?.textures ?? {});
  const [stats, setStats] = useState<CarStats>(currentLivery?.stats ?? defaultStats());
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [liveryName, setLiveryName] = useState(currentLivery?.name ?? 'MY LIVERY');

  // Load template for selected view
  useEffect(() => {
    getCarTemplateUrl(selectedView).then(setTemplateUrl);
  }, [selectedView]);

  const handleEditorSave = useCallback(async (dataUrl: string) => {
    setIsSaving(true);
    try {
      const newTextures = { ...textures, [selectedView]: dataUrl };
      setTextures(newTextures);
      
      // Run design analysis on all faces
      const computed = await analyzeAllFaces(newTextures, getCarTemplateUrl);
      setStats(computed);
      
      saveLiveryFace(dataUrl, selectedView, computed, liveryName);
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (err) {
      console.error('[KLUSTOR] Save/analyze failed:', err);
      const fallback = defaultStats();
      setStats(fallback);
      saveLiveryFace(dataUrl, selectedView, fallback, liveryName);
    } finally {
      setIsSaving(false);
    }
  }, [liveryName, saveLiveryFace, selectedView, textures]);

  const VIEWS: { id: TemplateView; label: string }[] = [
    { id: 'left', label: 'LEFT' },
    { id: 'right', label: 'RIGHT' },
    { id: 'top', label: 'TOP' },
    { id: 'front', label: 'FRONT' },
    { id: 'rear', label: 'REAR' },
  ];

  return (
    <div style={{
      position: 'fixed', inset: 0, display: 'flex', flexDirection: 'column',
      background: 'var(--bg-primary)', zIndex: 100,
    }}>
      {/* Top bar */}
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '0.75rem 1.5rem',
        background: 'var(--bg-panel-solid)',
        borderBottom: '2px solid var(--border-light)',
        flexShrink: 0,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <button
            onClick={() => navigate('/garage')}
            style={{
              padding: '0.4rem 1rem', background: 'var(--bg-secondary)',
              border: '1px solid var(--border-light)', borderRadius: '8px',
              fontFamily: 'Consolas,monospace', fontSize: '0.75rem', cursor: 'pointer',
              color: 'var(--text-primary)', fontWeight: 'bold',
            }}
          >
            ← GARAGE
          </button>
          <div>
            <div style={{ fontFamily: 'Trebuchet MS,sans-serif', fontWeight: 'bold', fontSize: '1rem', letterSpacing: '0.08em', color: 'var(--text-primary)' }}>
              LIVERY STUDIO
            </div>
            <div style={{ fontFamily: 'Consolas,monospace', fontSize: '0.65rem', color: 'var(--text-muted)' }}>
              Design your livery. Save to update your car.
            </div>
          </div>
        </div>

        {/* Livery name input */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <input
            value={liveryName}
            onChange={e => setLiveryName(e.target.value.toUpperCase().slice(0, 20))}
            placeholder="LIVERY NAME"
            style={{
              padding: '0.4rem 0.75rem', fontFamily: 'Consolas,monospace', fontSize: '0.8rem',
              border: '1px solid var(--border-light)', borderRadius: '8px',
              background: 'var(--bg-secondary)', color: 'var(--text-primary)',
              letterSpacing: '0.05em', outline: 'none', width: '160px',
            }}
          />
          <AnimatePresence>
            {saveSuccess && (
              <motion.div
                initial={{ opacity: 0, x: 10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 10 }}
                style={{
                  padding: '0.4rem 0.75rem', background: 'var(--klustor-green)',
                  borderRadius: '8px', fontFamily: 'Consolas,monospace', fontSize: '0.75rem',
                  fontWeight: 'bold', color: 'var(--text-primary)',
                }}
              >
                ✓ CAR UPDATED
              </motion.div>
            )}
          </AnimatePresence>
          {isSaving && (
            <div style={{ fontFamily: 'Consolas,monospace', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
              Analyzing...
            </div>
          )}
        </div>

        <div style={{ display: 'flex', gap: '1rem' }}>
          <button
            onClick={() => {
              useGameStore.getState().resetLivery();
              setTextures({});
              setStats(defaultStats());
            }}
            style={{
              padding: '0.6rem 1.5rem', background: '#FF4D4D',
              border: '2px solid rgba(30,41,51,0.15)', borderRadius: '10px',
              fontFamily: 'Trebuchet MS,sans-serif', fontWeight: 'bold', fontSize: '0.9rem',
              letterSpacing: '0.08em', color: '#FFFFFF', cursor: 'pointer',
            }}
          >
            RESET ALL
          </button>
          <button
            onClick={() => navigate('/race')}
            style={{
              padding: '0.6rem 1.5rem', background: 'var(--klustor-pink)',
              border: '2px solid rgba(30,41,51,0.15)', borderRadius: '10px',
              fontFamily: 'Trebuchet MS,sans-serif', fontWeight: 'bold', fontSize: '0.9rem',
              letterSpacing: '0.08em', color: 'var(--text-primary)', cursor: 'pointer',
            }}
          >
            🏁 RACE NOW
          </button>
        </div>
      </div>

      {/* Main split: Unlayer left, 3D preview right */}
      <div style={{ flex: 1, display: 'grid', gridTemplateColumns: '1fr 380px', minHeight: 0 }}>
        {/* Left Side: Unlayer Editor + Tabs */}
        <div style={{ display: 'flex', flexDirection: 'column', borderRight: '2px solid var(--border-light)' }}>
          {/* Tabs */}
          <div style={{ display: 'flex', background: 'var(--bg-panel-solid)', borderBottom: '1px solid var(--border-light)' }}>
            {VIEWS.map(v => (
              <button
                key={v.id}
                onClick={() => setSelectedView(v.id)}
                style={{
                  flex: 1, padding: '0.6rem 0', cursor: 'pointer',
                  background: selectedView === v.id ? 'var(--bg-primary)' : 'transparent',
                  border: 'none', borderBottom: selectedView === v.id ? '3px solid var(--klustor-cyan)' : '3px solid transparent',
                  fontFamily: 'Consolas,monospace', fontWeight: 'bold', fontSize: '0.8rem',
                  color: selectedView === v.id ? 'var(--text-primary)' : 'var(--text-muted)',
                  transition: 'all 0.2s',
                }}
              >
                {v.label}
              </button>
            ))}
          </div>

          <div style={{ flex: 1, position: 'relative', overflow: 'hidden' }}>
            {templateUrl && (
              <div style={{ width: '100%', height: '100%', transform: 'scale(1.2)', transformOrigin: 'center center' }}>
                <LiveryEditor
                  key={selectedView} // force remount to load correct aspect ratio/template
                  templateSrc={templateUrl}
                  onSave={handleEditorSave}
                  editorId="livery-editor-main"
                />
              </div>
            )}
          </div>
        </div>

        {/* Right: 3D preview + stats */}
        <div style={{ display: 'flex', flexDirection: 'column', background: 'var(--bg-secondary)', overflow: 'hidden' }}>
          {/* 3D preview */}
          <div style={{ flex: 1, position: 'relative', minHeight: '200px' }}>
            <div style={{
              position: 'absolute', top: '0.75rem', left: '0.75rem', zIndex: 10,
              fontFamily: 'Consolas,monospace', fontSize: '0.65rem', color: 'var(--text-muted)',
              letterSpacing: '0.1em',
            }}>
              LIVE 3D PREVIEW — MOVE MOUSE TO ROTATE
            </div>
            <Canvas camera={{ position: [0, 2, 6], fov: 55 }} gl={{ antialias: true }}>
              <Suspense fallback={null}>
                <PreviewScene textures={textures} view={selectedView} />
              </Suspense>
            </Canvas>
            {Object.keys(textures).length === 0 && (
              <div style={{
                position: 'absolute', inset: 0, display: 'flex', alignItems: 'center',
                justifyContent: 'center', pointerEvents: 'none',
              }}>
                <div style={{ fontFamily: 'Consolas,monospace', fontSize: '0.75rem', color: 'var(--text-muted)', textAlign: 'center' }}>
                  Design a face<br/>then click Save
                </div>
              </div>
            )}
          </div>

          {/* Stats grid */}
          <div style={{ padding: '1rem', borderTop: '1px solid var(--border-light)', flexShrink: 0 }}>
            <div style={{ fontFamily: 'Consolas,monospace', fontSize: '0.65rem', color: 'var(--text-muted)', marginBottom: '0.75rem', letterSpacing: '0.1em' }}>
              DESIGN → PERFORMANCE
            </div>
            <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', justifyContent: 'center' }}>
              <StatBadge label="TOP SPEED" value={`${stats.topSpeed}`} color="var(--klustor-green)" />
              <StatBadge label="ACCEL" value={stats.acceleration.toFixed(1)} color="var(--klustor-cyan)" />
              <StatBadge label="HANDLING" value={stats.handling.toFixed(1)} color="var(--klustor-yellow)" />
              <StatBadge label="STYLE" value={stats.designScore.toFixed(1)} color="var(--klustor-pink)" />
            </div>
            <div style={{
              marginTop: '0.75rem', textAlign: 'center',
              fontFamily: 'Trebuchet MS,sans-serif', fontWeight: 'bold',
              fontSize: '1.4rem', color: 'var(--text-primary)',
            }}>
              {stats.overallRating.toFixed(1)}
              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginLeft: '0.25rem' }}>/ 10 OVERALL</span>
            </div>
            <div style={{ marginTop: '0.5rem', fontFamily: 'Consolas,monospace', fontSize: '0.65rem', color: 'var(--text-muted)', textAlign: 'center' }}>
              More colours + stripes = faster car
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
