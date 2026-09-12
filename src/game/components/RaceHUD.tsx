import { getTrackData } from '../data/viceCoastCircuit';
import { formatRaceTime } from '../hooks/useRaceState';
import type { RacePhase } from '../hooks/useRaceState';
import * as THREE from 'three';
import { useMemo } from 'react';

interface RaceHUDProps {
  phase: RacePhase;
  countdown: number;
  lapTimeMs: number;
  speed: number;
  currentCheckpoint: number;
  carPosition?: THREE.Vector3;
}

function Minimap({ currentCheckpoint, carPosition }: { currentCheckpoint: number; carPosition?: THREE.Vector3 }) {
  const trackData = useMemo(() => getTrackData(), []);
  
  const W = 150, H = 150;
  const pad = 10;

  // Calculate bounds
  const minX = Math.min(...trackData.samples.map(p => p.position.x));
  const maxX = Math.max(...trackData.samples.map(p => p.position.x));
  const minZ = Math.min(...trackData.samples.map(p => p.position.z));
  const maxZ = Math.max(...trackData.samples.map(p => p.position.z));

  const scale = Math.min((W - pad * 2) / (maxX - minX || 1), (H - pad * 2) / (maxZ - minZ || 1));

  const toSVG = (x: number, z: number) => ({
    svgX: (x - minX) * scale + pad,
    svgY: (z - minZ) * scale + pad,
  });

  const path = trackData.samples.map((p, i) => {
    const { svgX, svgY } = toSVG(p.position.x, p.position.z);
    return `${i === 0 ? 'M' : 'L'} ${svgX.toFixed(1)} ${svgY.toFixed(1)}`;
  }).join(' ') + ' Z';

  const carSVGX = carPosition ? toSVG(carPosition.x, carPosition.z).svgX : W / 2;
  const carSVGY = carPosition ? toSVG(carPosition.x, carPosition.z).svgY : H / 2;

  const startPt = toSVG(trackData.samples[0].position.x, trackData.samples[0].position.z);

  return (
    <div style={{ position: 'absolute', bottom: '2rem', right: '2rem', background: 'var(--bg-secondary)', padding: '1rem', borderRadius: '24px', border: '1px solid var(--border-light)', boxShadow: '0 8px 24px rgba(0,0,0,0.05)' }}>
      <svg width={W} height={H} style={{ display: 'block' }}>
        <path d={path} fill="none" stroke="rgba(18,22,25,0.1)" strokeWidth="6" strokeLinejoin="round" />
        <path d={path} fill="none" stroke="var(--klustor-cyan)" strokeWidth="3" strokeLinejoin="round" />
        
        {trackData.checkpoints.map((cp) => {
          if (cp.index === trackData.totalCheckpoints) return null; // Skip finish line for normal dots
          const { svgX, svgY } = toSVG(cp.position.x, cp.position.z);
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

        {/* Start/Finish Line Indicator */}
        <circle cx={startPt.svgX} cy={startPt.svgY} r={6}
          fill="var(--klustor-pink)" stroke="var(--text-primary)" strokeWidth={2} />

        {/* Player Car Indicator */}
        <circle cx={carSVGX} cy={carSVGY} r={6} fill="var(--klustor-yellow)" stroke="var(--text-primary)" strokeWidth={2} />
      </svg>
    </div>
  );
}

export default function RaceHUD({ phase, countdown, lapTimeMs, speed, currentCheckpoint, carPosition }: RaceHUDProps) {
  const speedKmh = Math.round(Math.abs(speed) * 3.6);
  const trackData = useMemo(() => getTrackData(), []);

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
          CHECKPOINT {Math.min(currentCheckpoint, trackData.totalCheckpoints)} / {trackData.totalCheckpoints}
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
