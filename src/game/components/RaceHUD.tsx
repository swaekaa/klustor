import { TRACK_WAYPOINTS, CHECKPOINTS, REQUIRED_CHECKPOINTS } from '../data/viceCoastCircuit';
import { formatRaceTime } from '../hooks/useRaceState';
import type { RacePhase } from '../hooks/useRaceState';
import * as THREE from 'three';

interface RaceHUDProps {
  phase: RacePhase;
  countdown: number;
  lapTimeMs: number;
  speed: number;
  currentCheckpoint: number;
  carPosition?: THREE.Vector3;
}

function buildMinimapPath(waypoints: typeof TRACK_WAYPOINTS, width: number, height: number): string {
  const xs = waypoints.map(p => p.x);
  const zs = waypoints.map(p => p.z);
  const minX = Math.min(...xs), maxX = Math.max(...xs);
  const minZ = Math.min(...zs), maxZ = Math.max(...zs);
  const pad = 10;

  const scaleX = (width - pad * 2) / (maxX - minX || 1);
  const scaleZ = (height - pad * 2) / (maxZ - minZ || 1);
  const scale = Math.min(scaleX, scaleZ);

  const toSVG = (x: number, z: number) => ({
    svgX: (x - minX) * scale + pad,
    svgY: (z - minZ) * scale + pad,
  });

  const pts = [...waypoints, waypoints[0]];
  return pts.map((p, i) => {
    const { svgX, svgY } = toSVG(p.x, p.z);
    return `${i === 0 ? 'M' : 'L'} ${svgX.toFixed(1)} ${svgY.toFixed(1)}`;
  }).join(' ') + ' Z';
}

function Minimap({ currentCheckpoint, carPosition }: { currentCheckpoint: number; carPosition?: THREE.Vector3 }) {
  const W = 150, H = 150;
  const path = buildMinimapPath(TRACK_WAYPOINTS, W, H);

  const xs = TRACK_WAYPOINTS.map(p => p.x);
  const zs = TRACK_WAYPOINTS.map(p => p.z);
  const minX = Math.min(...xs), maxX = Math.max(...xs);
  const minZ = Math.min(...zs), maxZ = Math.max(...zs);
  const pad = 10;
  const scale = Math.min((W - pad * 2) / (maxX - minX || 1), (H - pad * 2) / (maxZ - minZ || 1));

  const carSVGX = carPosition ? (carPosition.x - minX) * scale + pad : W / 2;
  const carSVGY = carPosition ? (carPosition.z - minZ) * scale + pad : H / 2;

  return (
    <div style={{ position: 'absolute', bottom: '2rem', right: '2rem', background: 'var(--bg-secondary)', padding: '1rem', borderRadius: '16px', border: '3px solid var(--text-primary)', boxShadow: '4px 4px 0px rgba(0,0,0,0.1)' }}>
      <svg width={W} height={H} style={{ display: 'block' }}>
        <path d={path} fill="none" stroke="rgba(18,22,25,0.1)" strokeWidth="6" strokeLinejoin="round" />
        <path d={path} fill="none" stroke="var(--klustor-cyan)" strokeWidth="3" strokeLinejoin="round" />
        
        {CHECKPOINTS.filter(cp => cp.index < REQUIRED_CHECKPOINTS).map((cp) => {
          const svgX = (cp.position[0] - minX) * scale + pad;
          const svgY = (cp.position[2] - minZ) * scale + pad;
          const done = currentCheckpoint > cp.index;
          return (
            <circle
              key={cp.id}
              cx={svgX}
              cy={svgY}
              r={4}
              fill={done ? 'var(--klustor-green)' : 'var(--bg-secondary)'}
              stroke="var(--text-primary)"
              strokeWidth={2}
            />
          );
        })}

        <circle cx={(0 - minX) * scale + pad} cy={(0 - minZ) * scale + pad} r={6}
          fill="var(--klustor-pink)" stroke="var(--text-primary)" strokeWidth={2} />

        <circle cx={carSVGX} cy={carSVGY} r={6} fill="var(--klustor-yellow)" stroke="var(--text-primary)" strokeWidth={2} />
      </svg>
    </div>
  );
}

export default function RaceHUD({ phase, countdown, lapTimeMs, speed, currentCheckpoint, carPosition }: RaceHUDProps) {
  const speedKmh = Math.round(Math.abs(speed) * 3.6);

  return (
    <div className="klustor-race-hud">
      {/* Top Left — Main Info */}
      <div style={{ position: 'absolute', top: '2rem', left: '2rem' }}>
        <div className="font-display" style={{ fontSize: '1.5rem', letterSpacing: '0.1em', marginBottom: '0.5rem', WebkitTextStroke: '1px white' }}>
          VICE COAST
        </div>
        <div className="font-mono" style={{ fontSize: '3rem', fontWeight: 'bold', lineHeight: 1, WebkitTextStroke: '2px white' }}>
          {formatRaceTime(lapTimeMs)}
        </div>
        <div className="font-mono" style={{ fontSize: '1.5rem', marginTop: '0.5rem', color: 'var(--text-muted)', WebkitTextStroke: '1px white' }}>
          {String(speedKmh).padStart(3, '0')} KM/H
        </div>
        <div className="font-mono" style={{ fontSize: '1.2rem', marginTop: '0.25rem', color: 'var(--text-muted)', WebkitTextStroke: '1px white' }}>
          CHECKPOINT {Math.min(currentCheckpoint, REQUIRED_CHECKPOINTS)} / {REQUIRED_CHECKPOINTS}
        </div>
      </div>

      <Minimap currentCheckpoint={currentCheckpoint} carPosition={carPosition} />

      {/* Countdown overlay */}
      {phase === 'countdown' && (
        <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div className="font-display" style={{ fontSize: '15rem', color: 'var(--klustor-pink)', WebkitTextStroke: '6px var(--text-primary)', textShadow: '8px 8px 0px var(--text-primary)' }}>
            {countdown > 0 ? countdown : 'GO!'}
          </div>
        </div>
      )}
    </div>
  );
}
