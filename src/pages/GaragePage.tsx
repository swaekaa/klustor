import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Suspense, useRef, useState } from 'react';
import { Canvas } from '@react-three/fiber';
import * as THREE from 'three';
import { useGameStore } from '../store/gameStore';
import { CIRCUIT_INFO } from '../game/data/viceCoastCircuit';
import type { CarStats } from '../types';
import PlayerCar from '../game/components/PlayerCar';
import { useFrame, useThree } from '@react-three/fiber';

// ── Template view options ────────────────────────────────────
const TEMPLATE_VIEWS = [
  { id: 'left', label: 'LEFT SIDE' },
  { id: 'right', label: 'RIGHT SIDE' },
  { id: 'front', label: 'FRONT' },
  { id: 'rear', label: 'REAR' },
  { id: 'top', label: 'TOP' },
] as const;

// ── Stat bar ─────────────────────────────────────────────────
function StatBar({ label, value, max, color }: { label: string; value: number; max: number; color: string }) {
  const pct = Math.min(100, (value / max) * 100);
  return (
    <div style={{ marginBottom: '0.75rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px', alignItems: 'baseline' }}>
        <span style={{ fontFamily: 'Consolas,monospace', fontSize: '0.68rem', color: 'var(--text-muted)', fontWeight: 'bold', letterSpacing: '0.1em' }}>
          {label}
        </span>
        <span style={{ fontFamily: 'Trebuchet MS,sans-serif', fontWeight: 'bold', fontSize: '0.9rem', color: 'var(--text-primary)' }}>
          {typeof value === 'number' ? (label === 'TOP SPEED' ? `${value} KM/H` : value.toFixed(1)) : value}
        </span>
      </div>
      <div style={{ height: '8px', background: 'rgba(30,41,51,0.08)', borderRadius: '4px', overflow: 'hidden' }}>
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${pct}%` }}
          transition={{ duration: 0.8, ease: 'easeOut' }}
          style={{ height: '100%', background: color, borderRadius: '4px' }}
        />
      </div>
    </div>
  );
}

// ── Interactive camera for 3D preview ─────────────────────────
function InteractiveCamera() {
  const { camera } = useThree();
  const currentAngle = useRef(Math.PI / 4);
  
  useFrame(({ pointer }) => {
    const targetAngle = pointer.x * Math.PI;
    currentAngle.current += (targetAngle - currentAngle.current) * 0.1;
    
    const tx = Math.sin(currentAngle.current) * 7;
    const tz = Math.cos(currentAngle.current) * 7;
    const ty = 2 + ((pointer.y + 1) / 2) * 2.5;

    camera.position.x += (tx - camera.position.x) * 0.1;
    camera.position.y += (ty - camera.position.y) * 0.1;
    camera.position.z += (tz - camera.position.z) * 0.1;
    camera.lookAt(0, 0.5, 0);
  });
  return null;
}

// ── Garage 3D preview scene ─────────────────────────────────
function GarageScene({ textures }: { textures?: Partial<Record<TemplateView, string>> }) {
  const groupRef = useRef<THREE.Group>(null!);
  return (
    <>
      <ambientLight intensity={1.0} color="#FFF5EE" />
      <directionalLight position={[4, 8, 4]} intensity={1.5} color="#FFE8CC" />
      <hemisphereLight color="#87CEEB" groundColor="#F2EFE4" intensity={0.5} />
      {/* Ground disc */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.01, 0]}>
        <circleGeometry args={[6, 32]} />
        <meshLambertMaterial color="#D0C8B8" transparent opacity={0.5} />
      </mesh>
      {/* Subtle shadow disc */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, 0]}>
        <circleGeometry args={[2.4, 24]} />
        <meshLambertMaterial color="#D0C8B8" transparent opacity={0.5} />
      </mesh>
      <PlayerCar groupRef={groupRef} textures={textures} speed={0} steering={0} />
      <InteractiveCamera />
    </>
  );
}

// ── Main GaragePage ──────────────────────────────────────────
export default function GaragePage() {
  const navigate = useNavigate();
  const { player, currentLivery, raceRecords } = useGameStore();
  const [selectedView, setSelectedView] = useState<typeof TEMPLATE_VIEWS[number]['id']>('left');

  const stats: CarStats = currentLivery?.stats ?? {
    topSpeed: 100,
    acceleration: 3,
    handling: 3,
    designScore: 0,
    overallRating: 3,
  };

  const bestTime = player.bestTime;
  const formatTime = (ms: number) => {
    const s = Math.floor(ms / 1000);
    const min = Math.floor(s / 60);
    const sec = s % 60;
    const cs = Math.floor((ms % 1000) / 10);
    return `${String(min).padStart(2,'0')}:${String(sec).padStart(2,'0')}.${String(cs).padStart(2,'0')}`;
  };

  // Top 3 race records sorted by time
  const topRecords = [...raceRecords].sort((a, b) => a.time - b.time).slice(0, 3);

  return (
    <div className="page" style={{ display: 'flex', flexDirection: 'column', height: '100vh', padding: '1rem', background: 'var(--bg-primary)', overflow: 'hidden' }}>
      
      {/* Top Header Floating Bar */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', padding: '1rem 2rem', background: 'var(--bg-secondary)', border: '3px solid var(--text-primary)', borderRadius: '16px', boxShadow: '4px 4px 0px rgba(0,0,0,0.05)', flexShrink: 0 }}>
        <div>
          <div className="font-display" style={{ fontSize: '1rem', letterSpacing: '0.1em', color: 'var(--klustor-pink)' }}>KLUSTOR</div>
          <h1 style={{ fontSize: '2rem', lineHeight: 1, margin: 0 }}>GARAGE</h1>
        </div>
        <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
          <button className="btn-retro" onClick={() => navigate('/design')} style={{ padding: '0.5rem 1rem' }}>
            LIVERY STUDIO
          </button>
          <button className="btn-retro" onClick={() => navigate('/leaderboard')} style={{ padding: '0.5rem 1rem' }}>
            LEADERBOARD
          </button>
          <button className="btn-retro btn-retro-primary" onClick={() => navigate('/race')} style={{ padding: '0.5rem 1rem' }}>
            RACE NOW →
          </button>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr 1fr', flex: 1, gap: '1rem', minHeight: 0 }}>

      {/* ── LEFT PANEL: Livery tool shortcuts ───────────────── */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', minHeight: 0 }}>
        <div style={{ padding: '1.5rem', background: 'var(--bg-secondary)', border: '3px solid var(--text-primary)', borderRadius: '16px', boxShadow: '4px 4px 0px rgba(0,0,0,0.05)' }}>
          <div className="font-display" style={{ fontSize: '1.2rem', marginBottom: '0.75rem' }}>
            EDIT YOUR LIVERY
          </div>
          <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '1rem' }}>
            Design your ride.<br/>More style = more speed.
          </div>
          {[
            { icon: '🚗', label: 'TEMPLATE' },
            { icon: '🎨', label: 'COLOURS' },
            { icon: '✦', label: 'DECALS' },
            { icon: '//', label: 'STRIPES' },
            { icon: 'T', label: 'TEXT' },
            { icon: '⬡', label: 'SHAPES' },
            { icon: '★', label: 'STICKERS' },
          ].map(tool => (
            <button
              key={tool.label}
              onClick={() => navigate('/customize')}
              style={{
                display: 'flex', alignItems: 'center', gap: '0.75rem',
                width: '100%', padding: '0.6rem 0.75rem', marginBottom: '0.3rem',
                background: 'var(--bg-secondary)', border: '1px solid var(--border-light)',
                borderRadius: '10px', cursor: 'pointer', fontFamily: 'Trebuchet MS,sans-serif',
                fontWeight: 'bold', fontSize: '0.85rem', color: 'var(--text-primary)',
                letterSpacing: '0.05em', transition: 'all 0.15s ease',
              }}
              onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = 'var(--klustor-cyan)'; }}
              onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = 'var(--bg-secondary)'; }}
            >
              <span style={{ width: '20px', textAlign: 'center', fontSize: '1rem' }}>{tool.icon}</span>
              {tool.label}
            </button>
          ))}
        </div>

        {/* SAVE LIVERY button */}
        <motion.button
          whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
          onClick={() => navigate('/customize')}
          style={{
            width: '100%', padding: '1rem', background: 'var(--klustor-cyan)',
            border: '2px solid rgba(30,41,51,0.15)', borderRadius: '14px',
            fontFamily: 'Trebuchet MS,sans-serif', fontWeight: 'bold', fontSize: '1rem',
            letterSpacing: '0.1em', color: 'var(--text-primary)', cursor: 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem',
            boxShadow: '0 4px 16px rgba(143,213,209,0.4), inset 0 2px 4px rgba(255,255,255,0.5)',
          }}
        >
          💾 SAVE LIVERY
        </motion.button>
      </div>

      {/* ── CENTER: 3D Preview + Stats ────────────────────────── */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', minHeight: 0 }}>
        {/* 3D Car Preview */}
        <div className="panel" style={{ flex: '1', minHeight: 0, position: 'relative', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem', flex: '0 0 auto' }}>
            <div>
              <div style={{ fontFamily: 'Trebuchet MS,sans-serif', fontWeight: 'bold', fontSize: '0.95rem', color: 'var(--text-primary)', letterSpacing: '0.08em' }}>
                CAR PREVIEW — MOVE MOUSE TO ROTATE
              </div>
              <div style={{ fontFamily: 'Consolas,monospace', fontSize: '0.65rem', color: 'var(--text-muted)', marginTop: '2px' }}>
                {currentLivery ? `LIVERY: ${currentLivery.name.toUpperCase()}` : 'NO LIVERY — DEFAULT SKIN'}
              </div>
            </div>
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <span style={{ padding: '0.25rem 0.75rem', background: 'var(--klustor-cyan)', borderRadius: '999px', fontFamily: 'Consolas,monospace', fontSize: '0.65rem', fontWeight: 'bold', color: 'var(--text-primary)' }}>3D VIEW</span>
            </div>
          </div>

          <div style={{ flex: 1, minHeight: '200px', position: 'relative', overflow: 'hidden' }}>
            <Canvas camera={{ position: [0, 2.5, 7], fov: 50 }} gl={{ antialias: true }}>
              <Suspense fallback={null}>
                <GarageScene textures={currentLivery?.textures} />
              </Suspense>
            </Canvas>
          </div>
        </div>

        {/* Stats panel */}
        <div className="panel" style={{ flex: '0 0 auto' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr auto', gap: '1rem', alignItems: 'start' }}>
            <div>
              <div style={{ fontFamily: 'Consolas,monospace', fontSize: '0.7rem', color: 'var(--text-muted)', letterSpacing: '0.1em', marginBottom: '0.75rem' }}>
                CAR STATS (BASED ON YOUR DESIGN)
              </div>
              <StatBar label="TOP SPEED" value={stats.topSpeed} max={140} color="var(--klustor-green)" />
              <StatBar label="ACCELERATION" value={stats.acceleration} max={10} color="var(--klustor-cyan)" />
              <StatBar label="HANDLING" value={stats.handling} max={10} color="var(--klustor-yellow)" />
              <StatBar label="STYLE BONUS" value={stats.designScore} max={10} color="var(--klustor-pink)" />
            </div>
            <div style={{ textAlign: 'center', padding: '0.5rem' }}>
              <div style={{ fontFamily: 'Consolas,monospace', fontSize: '0.65rem', color: 'var(--text-muted)', letterSpacing: '0.1em', marginBottom: '0.25rem' }}>OVERALL</div>
              <div style={{ fontFamily: 'Trebuchet MS,sans-serif', fontWeight: 'bold', fontSize: '3rem', color: 'var(--text-primary)', lineHeight: 1 }}>
                {stats.overallRating.toFixed(1)}
              </div>
              <div style={{ color: 'var(--klustor-yellow)', fontSize: '1.2rem', marginTop: '0.25rem' }}>
                {'★'.repeat(Math.round(stats.overallRating / 2))}{'☆'.repeat(5 - Math.round(stats.overallRating / 2))}
              </div>
            </div>
          </div>
        </div>

        {/* Template view selector */}
        <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'center' }}>
          {TEMPLATE_VIEWS.map(view => (
            <button
              key={view.id}
              onClick={() => { setSelectedView(view.id); navigate('/customize'); }}
              style={{
                padding: '0.5rem 0.75rem', background: selectedView === view.id ? 'var(--klustor-cyan)' : 'var(--bg-secondary)',
                border: `2px solid ${selectedView === view.id ? 'var(--klustor-cyan)' : 'var(--border-light)'}`,
                borderRadius: '10px', cursor: 'pointer', fontFamily: 'Consolas,monospace',
                fontSize: '0.65rem', fontWeight: 'bold', letterSpacing: '0.05em',
                color: selectedView === view.id ? 'var(--text-primary)' : 'var(--text-muted)',
                transition: 'all 0.15s ease', minWidth: '68px', textAlign: 'center',
              }}
            >
              {view.label}
            </button>
          ))}
        </div>
      </div>

      {/* ── RIGHT PANEL: Track info + actions ────────────────── */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', minHeight: 0 }}>
        {/* Track info */}
        <div className="panel" style={{ flex: '0 0 auto' }}>
          <div style={{ fontFamily: 'Trebuchet MS,sans-serif', fontWeight: 'bold', fontSize: '0.95rem', letterSpacing: '0.08em', color: 'var(--text-primary)', marginBottom: '0.5rem' }}>
            TRACK: {CIRCUIT_INFO.name}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.75rem' }}>
            <span style={{ width: '10px', height: '10px', borderRadius: '50%', background: '#FFD700', display: 'inline-block' }} />
            <span style={{ fontFamily: 'Consolas,monospace', fontSize: '0.7rem', color: 'var(--text-muted)' }}>DAY</span>
          </div>
          {[
            ['LAP LENGTH', CIRCUIT_INFO.lapLength],
            ['TURNS', String(CIRCUIT_INFO.turns)],
            ['BEST TIME (YOU)', bestTime ? formatTime(bestTime) : '--:--.--'],
          ].map(([k, v]) => (
            <div key={k} style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.35rem' }}>
              <span style={{ fontFamily: 'Consolas,monospace', fontSize: '0.68rem', color: 'var(--text-muted)' }}>⊙ {k}</span>
              <span style={{ fontFamily: 'Trebuchet MS,sans-serif', fontWeight: 'bold', fontSize: '0.8rem', color: 'var(--text-primary)' }}>{v}</span>
            </div>
          ))}
        </div>

        {/* Mini leaderboard */}
        <div className="panel" style={{ flex: '1', minHeight: 0, overflow: 'hidden' }}>
          <div style={{ fontFamily: 'Trebuchet MS,sans-serif', fontWeight: 'bold', fontSize: '0.9rem', letterSpacing: '0.08em', color: 'var(--text-primary)', marginBottom: '0.75rem' }}>
            LEADERBOARD
          </div>
          {topRecords.length === 0 ? (
            <div style={{ fontFamily: 'Consolas,monospace', fontSize: '0.75rem', color: 'var(--text-muted)', textAlign: 'center', padding: '1rem' }}>
              NO RECORDS YET.<br/>BE THE FIRST.
            </div>
          ) : (
            topRecords.map((r, i) => (
              <div key={r.id} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem', padding: '0.4rem 0.5rem', background: !r.isNPC ? 'rgba(143,213,209,0.15)' : 'transparent', borderRadius: '8px' }}>
                <span style={{ fontFamily: 'Trebuchet MS,sans-serif', fontWeight: 'bold', fontSize: '0.8rem', color: i === 0 ? '#FFD700' : 'var(--text-muted)', minWidth: '16px' }}>{i + 1}</span>
                {r.liveryTextures?.left ? (
                  <img src={r.liveryTextures.left} alt="" style={{ width: '32px', height: '20px', objectFit: 'cover', borderRadius: '4px', border: '1px solid var(--border-light)' }} />
                ) : (
                  <div style={{ width: '32px', height: '20px', background: 'var(--bg-secondary)', borderRadius: '4px', border: '1px solid var(--border-light)' }} />
                )}
                <div style={{ flex: 1 }}>
                  <div style={{ fontFamily: 'Trebuchet MS,sans-serif', fontWeight: 'bold', fontSize: '0.72rem', color: 'var(--text-primary)' }}>{r.driverName}</div>
                </div>
                <span style={{ fontFamily: 'Consolas,monospace', fontSize: '0.72rem', color: 'var(--text-secondary)', fontWeight: 'bold' }}>{formatTime(r.time)}</span>
              </div>
            ))
          )}
          <button
            onClick={() => navigate('/leaderboard')}
            style={{ width: '100%', marginTop: '0.5rem', padding: '0.5rem', background: 'transparent', border: '1px solid var(--border-light)', borderRadius: '8px', fontFamily: 'Consolas,monospace', fontSize: '0.7rem', color: 'var(--text-muted)', cursor: 'pointer', letterSpacing: '0.05em' }}
          >
            VIEW FULL LEADERBOARD →
          </button>
        </div>

        {/* Action buttons */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
          <motion.button
            whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
            onClick={() => navigate('/race')}
            style={{
              width: '100%', padding: '1.1rem', background: 'var(--klustor-pink)',
              border: '2px solid rgba(30,41,51,0.15)', borderRadius: '14px',
              fontFamily: 'Trebuchet MS,sans-serif', fontWeight: 'bold', fontSize: '1.1rem',
              letterSpacing: '0.1em', color: 'var(--text-primary)', cursor: 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.75rem',
              boxShadow: '0 4px 16px rgba(220,168,184,0.4), inset 0 2px 4px rgba(255,255,255,0.5)',
            }}
          >
            🏁 RACE NOW
            <span style={{ fontFamily: 'Consolas,monospace', fontSize: '0.7rem', opacity: 0.7 }}>
              Take on Vice Coast Circuit
            </span>
          </motion.button>
          <motion.button
            whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
            onClick={() => navigate('/customize')}
            style={{
              width: '100%', padding: '0.85rem', background: 'var(--klustor-yellow)',
              border: '2px solid rgba(30,41,51,0.15)', borderRadius: '14px',
              fontFamily: 'Trebuchet MS,sans-serif', fontWeight: 'bold', fontSize: '0.95rem',
              letterSpacing: '0.1em', color: 'var(--text-primary)', cursor: 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem',
              boxShadow: '0 4px 12px rgba(231,212,139,0.35), inset 0 2px 4px rgba(255,255,255,0.5)',
            }}
          >
            🎨 CUSTOMIZE LIVERY
          </motion.button>
        </div>
      </div>
    </div>
  );
}
