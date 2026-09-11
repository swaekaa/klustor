import { useRef, useEffect } from 'react';
import { TRACK_WAYPOINTS, CHECKPOINTS, REQUIRED_CHECKPOINTS } from '../data/viceCoastCircuit';
import { formatRaceTime } from '../hooks/useRaceState';
import type { RacePhase } from '../hooks/useRaceState';
import * as THREE from 'three';

// ============================================================
// RaceHUD — HTML overlay for race information
// Styled with KLUSTOR retro-console aesthetic
// ============================================================

interface RaceHUDProps {
  phase: RacePhase;
  countdown: number;
  lapTimeMs: number;
  speed: number;
  currentCheckpoint: number;
  carPosition?: THREE.Vector3;
}

// Minimap SVG path from track waypoints
function buildMinimapPath(waypoints: typeof TRACK_WAYPOINTS, width: number, height: number): string {
  // Find bounds
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

  const pts = [...waypoints, waypoints[0]]; // close loop
  return pts.map((p, i) => {
    const { svgX, svgY } = toSVG(p.x, p.z);
    return `${i === 0 ? 'M' : 'L'} ${svgX.toFixed(1)} ${svgY.toFixed(1)}`;
  }).join(' ') + ' Z';
}

function Minimap({ currentCheckpoint, carPosition }: { currentCheckpoint: number; carPosition?: THREE.Vector3 }) {
  const W = 120, H = 90;
  const path = buildMinimapPath(TRACK_WAYPOINTS, W, H);

  // Map car position to minimap coords
  const xs = TRACK_WAYPOINTS.map(p => p.x);
  const zs = TRACK_WAYPOINTS.map(p => p.z);
  const minX = Math.min(...xs), maxX = Math.max(...xs);
  const minZ = Math.min(...zs), maxZ = Math.max(...zs);
  const pad = 10;
  const scale = Math.min((W - pad * 2) / (maxX - minX || 1), (H - pad * 2) / (maxZ - minZ || 1));

  const carSVGX = carPosition ? (carPosition.x - minX) * scale + pad : W / 2;
  const carSVGY = carPosition ? (carPosition.z - minZ) * scale + pad : H / 2;

  return (
    <div className="klustor-race-minimap">
      <div style={{ fontSize: '0.6rem', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)', fontWeight: 'bold', letterSpacing: '0.1em', marginBottom: '4px' }}>
        VICE COAST CIRCUIT
      </div>
      <svg width={W} height={H} style={{ display: 'block' }}>
        {/* Track outline */}
        <path d={path} fill="none" stroke="rgba(30,41,51,0.3)" strokeWidth="6" strokeLinejoin="round" />
        <path d={path} fill="none" stroke="#8FD5D1" strokeWidth="3" strokeLinejoin="round" />
        
        {/* Checkpoints */}
        {CHECKPOINTS.filter(cp => cp.index < REQUIRED_CHECKPOINTS).map((cp, i) => {
          const svgX = (cp.position[0] - minX) * scale + pad;
          const svgY = (cp.position[2] - minZ) * scale + pad;
          const done = currentCheckpoint > cp.index;
          return (
            <circle
              key={cp.id}
              cx={svgX}
              cy={svgY}
              r={4}
              fill={done ? '#A8C99B' : '#E9B58D'}
              stroke="#1E2933"
              strokeWidth={1}
            />
          );
        })}

        {/* Finish line */}
        <circle cx={(0 - minX) * scale + pad} cy={(0 - minZ) * scale + pad} r={5}
          fill="#DCA8B8" stroke="#1E2933" strokeWidth={1} />

        {/* Car position */}
        <circle cx={carSVGX} cy={carSVGY} r={5} fill="#1E2933" stroke="#8FD5D1" strokeWidth={2} />
      </svg>
    </div>
  );
}

export default function RaceHUD({ phase, countdown, lapTimeMs, speed, currentCheckpoint, carPosition }: RaceHUDProps) {
  const speedKmh = Math.round(Math.abs(speed) * 3.6);
  const nextCP = currentCheckpoint < REQUIRED_CHECKPOINTS
    ? `CP ${currentCheckpoint + 1}`
    : 'FINISH';

  return (
    <div className="klustor-race-hud">
      {/* Top Left — Circuit + Lap */}
      <div className="klustor-race-hud-panel klustor-race-hud-tl">
        <div className="klustor-race-hud-label">VICE COAST CIRCUIT</div>
        <div className="klustor-race-hud-value">LAP 1 / 1</div>
        <div className="klustor-race-hud-sub">
          {nextCP !== 'FINISH'
            ? `NEXT: ${nextCP}`
            : currentCheckpoint >= REQUIRED_CHECKPOINTS
            ? 'HIT FINISH!'
            : `CP ${currentCheckpoint} / ${REQUIRED_CHECKPOINTS}`}
        </div>
      </div>

      {/* Top Right — Timer + Speed */}
      <div className="klustor-race-hud-panel klustor-race-hud-tr">
        <div className="klustor-race-hud-label">TIME</div>
        <div className="klustor-race-hud-value" style={{ fontVariantNumeric: 'tabular-nums' }}>
          {formatRaceTime(lapTimeMs)}
        </div>
        <div className="klustor-race-hud-label" style={{ marginTop: '0.5rem' }}>SPEED</div>
        <div className="klustor-race-hud-value">{String(speedKmh).padStart(3, '0')} km/h</div>
      </div>

      {/* Bottom Left — Controls legend */}
      <div className="klustor-race-hud-panel klustor-race-hud-bl">
        <div className="klustor-race-controls-grid">
          <span>W / ↑</span><span>ACCELERATE</span>
          <span>S / ↓</span><span>BRAKE</span>
          <span>A / ←</span><span>LEFT</span>
          <span>D / →</span><span>RIGHT</span>
          <span>R</span><span>RESET</span>
          <span>ESC</span><span>PAUSE</span>
        </div>
      </div>

      {/* Bottom Right — Minimap */}
      <Minimap currentCheckpoint={currentCheckpoint} carPosition={carPosition} />

      {/* Countdown overlay */}
      {phase === 'countdown' && (
        <div className="klustor-race-countdown">
          <div className="klustor-race-countdown-number">
            {countdown > 0 ? countdown : 'GO!'}
          </div>
        </div>
      )}

      {/* Checkpoint flash */}
      {/* This would be driven by parent event — see RacePage for notification */}
    </div>
  );
}
