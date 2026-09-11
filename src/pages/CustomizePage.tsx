import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useState, useCallback, useRef, Suspense, useEffect } from 'react';
import { Canvas } from '@react-three/fiber';
import * as THREE from 'three';
import { useGameStore } from '../store/gameStore';
import { analyzeDesign, defaultStats } from '../game/utils/designAnalysis';
import { getCarTemplateUrl } from '../game/utils/carTemplateUrl';
import LiveryEditor from '../components/editor/LiveryEditor';
import PlayerCar from '../game/components/PlayerCar';
import { useFrame, useThree } from '@react-three/fiber';
import type { CarStats, TemplateView } from '../types';

// ── Car template URL (served from /public) ───────────────────
// The generated car outline image
const CAR_TEMPLATE_URL = '/car-template.png';

// ── Interactive camera for 3D preview ─────────────────────────
function InteractiveCamera() {
  const { camera } = useThree();
  const currentAngle = useRef(Math.PI / 4);
  
  useFrame(({ pointer }) => {
    // Map pointer X (-1 to 1) to a full rotation (-PI to PI)
    const targetAngle = pointer.x * Math.PI;
    currentAngle.current += (targetAngle - currentAngle.current) * 0.1;
    
    const tx = Math.sin(currentAngle.current) * 6.5;
    const tz = Math.cos(currentAngle.current) * 6.5;
    const ty = 1.5 + ((pointer.y + 1) / 2) * 2.5; // pointer Y maps to height

    camera.position.x += (tx - camera.position.x) * 0.1;
    camera.position.y += (ty - camera.position.y) * 0.1;
    camera.position.z += (tz - camera.position.z) * 0.1;
    camera.lookAt(0, 0.5, 0);
  });
  return null;
}

// ── 3D preview scene ─────────────────────────────────────────
function PreviewScene({ liveryDataUrl }: { liveryDataUrl?: string }) {
  const groupRef = useRef<THREE.Group>(null!);
  return (
    <>
      <ambientLight intensity={1.0} color="#FFF5EE" />
      <directionalLight position={[4, 8, 4]} intensity={1.5} color="#FFE8CC" />
      <hemisphereLight color="#87CEEB" groundColor="#F2EFE4" intensity={0.5} />
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.01, 0]}>
        <circleGeometry args={[5, 32]} />
        <meshLambertMaterial color="#E8E4D8" />
      </mesh>
      <PlayerCar groupRef={groupRef} liveryDataUrl={liveryDataUrl} speed={0} steering={0} />
      <InteractiveCamera />
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
  const { saveLivery, currentLivery } = useGameStore();
  const [templateUrl, setTemplateUrl] = useState<string>('/car-template.png');
  const [savedDataUrl, setSavedDataUrl] = useState<string | undefined>(currentLivery?.dataUrl);
  const [stats, setStats] = useState<CarStats>(currentLivery?.stats ?? defaultStats());
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [selectedView] = useState<TemplateView>('left');
  const [liveryName, setLiveryName] = useState(currentLivery?.name ?? 'MY LIVERY');

  // Resolve the template URL (tries public file, falls back to generated canvas)
  useEffect(() => {
    getCarTemplateUrl().then(setTemplateUrl);
  }, []);

  const handleEditorSave = useCallback(async (dataUrl: string) => {
    setIsSaving(true);
    try {
      // Run design analysis using the resolved template URL
      const computed = await analyzeDesign(templateUrl, dataUrl);
      setStats(computed);
      setSavedDataUrl(dataUrl);
      saveLivery(dataUrl, liveryName, selectedView, computed);
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (err) {
      console.error('[KLUSTOR] Save/analyze failed:', err);
      const fallback = defaultStats();
      setStats(fallback);
      setSavedDataUrl(dataUrl);
      saveLivery(dataUrl, liveryName, selectedView, fallback);
    } finally {
      setIsSaving(false);
    }
  }, [liveryName, saveLivery, selectedView, templateUrl]);

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

      {/* Main split: Unlayer left, 3D preview right */}
      <div style={{ flex: 1, display: 'grid', gridTemplateColumns: '1fr 380px', minHeight: 0 }}>
        {/* Unlayer editor */}
        <div style={{ position: 'relative', borderRight: '2px solid var(--border-light)' }}>
          <LiveryEditor
            templateSrc={templateUrl}
            onSave={handleEditorSave}
            editorId="livery-editor-main"
          />
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
                <PreviewScene liveryDataUrl={savedDataUrl} />
              </Suspense>
            </Canvas>
            {!savedDataUrl && (
              <div style={{
                position: 'absolute', inset: 0, display: 'flex', alignItems: 'center',
                justifyContent: 'center', pointerEvents: 'none',
              }}>
                <div style={{ fontFamily: 'Consolas,monospace', fontSize: '0.75rem', color: 'var(--text-muted)', textAlign: 'center' }}>
                  Design your livery<br/>then click Save
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
