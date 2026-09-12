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
  latestSplitDiff?: number | null;
  carPosition?: THREE.Vector3;
  boost?: number;
  maxBoost?: number;
  isBoosting?: boolean;
}

function BoostGauge({ boost = 1, maxBoost = 1, isBoosting = false }: { boost?: number, maxBoost?: number, isBoosting?: boolean }) {
  // Boost is scaled relative to maxBoost capacity.
  // We'll show the actual fill compared to the total bar size (which represents 1.0 = perfect score).
  const pct = Math.min(100, Math.max(0, boost * 100));
  const maxPct = Math.min(100, Math.max(0, maxBoost * 100));
  
  const isEmpty = boost < 0.05;

  return (
    <div style={{ width: '100%', marginTop: '1rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.25rem' }}>
        <div className="font-display" style={{ fontSize: '1rem', fontWeight: 'bold', color: isBoosting ? 'var(--klustor-pink)' : 'var(--text-primary)', letterSpacing: '0.1em', transition: 'color 0.1s' }}>
          BOOST
        </div>
        <div className="font-mono" style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
          {isEmpty ? 'EMPTY' : `${Math.round(pct)}%`}
        </div>
      </div>
      
      {/* Background track (full 100% width) */}
      <div style={{ 
        width: '100%', height: '16px', background: 'rgba(0,0,0,0.1)', 
        borderRadius: '8px', border: '1px solid var(--border-light)',
        position: 'relative', overflow: 'hidden'
      }}>
        {/* Max capacity limit indicator (shows how much you CAN fill based on design score) */}
        <div style={{
          position: 'absolute', top: 0, bottom: 0, left: 0, width: `${maxPct}%`,
          background: 'rgba(255,255,255,0.2)', borderRight: '2px solid rgba(0,0,0,0.2)'
        }} />

        {/* Current boost level */}
        <div style={{
          position: 'absolute', top: 0, bottom: 0, left: 0, width: `${pct}%`,
          background: isBoosting ? 'var(--klustor-pink)' : 'var(--klustor-cyan)',
          transition: 'width 0.1s linear, background 0.1s',
          boxShadow: isBoosting ? '0 0 10px var(--klustor-pink)' : 'none'
        }} />
      </div>
    </div>
  );
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

function AnalogSpeedometer({ speedKmh }: { speedKmh: number }) {
  const maxSpeed = 300;
  const clampedSpeed = Math.min(Math.max(speedKmh, 0), maxSpeed);
  const angle = -120 + (clampedSpeed / maxSpeed) * 240;
  
  const arcLength = 251.3;
  const offset = arcLength - (clampedSpeed / maxSpeed) * arcLength;

  return (
    <div style={{ 
      position: 'relative', width: '140px', height: '140px', marginTop: '1.5rem', marginBottom: '1rem',
      background: 'var(--bg-secondary)', backdropFilter: 'blur(4px)',
      borderRadius: '50%', border: '3px solid var(--text-primary)', 
      boxShadow: '4px 4px 0px var(--text-primary)' 
    }}>
      <svg width="100%" height="100%" viewBox="0 0 140 140" style={{ display: 'block' }}>
        {/* Track */}
        <path d="M 18.04 100 A 60 60 0 1 1 121.96 100" fill="none" stroke="rgba(18,22,25,0.1)" strokeWidth="6" strokeLinecap="round" />
        
        {/* Dynamic active arc (colored) */}
        <path 
          d="M 18.04 100 A 60 60 0 1 1 121.96 100" 
          fill="none" 
          stroke="var(--klustor-pink)" 
          strokeWidth="6" 
          strokeLinecap="round" 
          strokeDasharray={arcLength}
          strokeDashoffset={offset}
          style={{ transition: 'stroke-dashoffset 0.1s linear' }}
        />

        {/* Ticks */}
        {Array.from({ length: 11 }).map((_, i) => {
          const tickAngle = -120 + i * 24;
          const rad = (tickAngle - 90) * (Math.PI / 180);
          const r1 = i % 2 === 0 ? 50 : 54;
          const r2 = 60;
          return (
            <line 
              key={i} 
              x1={70 + r1 * Math.cos(rad)} 
              y1={70 + r1 * Math.sin(rad)} 
              x2={70 + r2 * Math.cos(rad)} 
              y2={70 + r2 * Math.sin(rad)} 
              stroke="var(--text-primary)" 
              strokeWidth={i % 2 === 0 ? 3 : 1.5} 
            />
          );
        })}

        {/* Needle */}
        <g style={{ transform: `rotate(${angle}deg)`, transformOrigin: '70px 70px', transition: 'transform 0.1s linear' }}>
          <polygon points="67,70 73,70 70,22" fill="var(--klustor-cyan)" stroke="var(--text-primary)" strokeWidth="1.5" strokeLinejoin="round" />
          <circle cx="70" cy="70" r="8" fill="var(--text-primary)" />
          <circle cx="70" cy="70" r="3" fill="var(--bg-primary)" />
        </g>
      </svg>
      
      {/* Digital Readout inside dial */}
      <div style={{ position: 'absolute', bottom: '22px', left: '0', right: '0', textAlign: 'center' }}>
        <div className="font-mono" style={{ fontSize: '1.8rem', fontWeight: '900', color: 'var(--text-primary)', lineHeight: 1 }}>
          {String(Math.round(clampedSpeed)).padStart(3, '0')}
        </div>
        <div className="font-display" style={{ fontSize: '0.7rem', fontWeight: 'bold', color: 'var(--text-primary)', letterSpacing: '0.1em' }}>
          KM/H
        </div>
      </div>
    </div>
  );
}

function ControlsLegend() {
  return (
    <div style={{ 
      position: 'absolute', top: '2rem', right: '2rem', 
      background: 'var(--bg-secondary)', backdropFilter: 'blur(8px)',
      padding: '1.5rem', borderRadius: '24px', 
      border: '2px solid var(--border-light)',
      boxShadow: '0 8px 32px rgba(0,0,0,0.05)',
      display: 'flex', flexDirection: 'column', gap: '0.75rem',
      minWidth: '200px'
    }}>
      <div className="font-display" style={{ fontSize: '1rem', fontWeight: 'bold', color: 'var(--text-muted)', letterSpacing: '0.1em', marginBottom: '0.5rem' }}>
        CONTROLS
      </div>
      
      {[
        { key: 'W / ↑', action: 'ACCELERATE' },
        { key: 'S / ↓', action: 'BRAKE / REVERSE' },
        { key: 'A D / ← →', action: 'STEER' },
        { key: 'SHIFT', action: 'NOS BOOST', color: 'var(--klustor-pink)' },
        { key: 'R', action: 'RESET TO TRACK' },
        { key: 'ESC', action: 'PAUSE' }
      ].map(ctrl => (
        <div key={ctrl.key} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div className="font-mono" style={{ 
            background: 'var(--bg-primary)', padding: '0.25rem 0.5rem', 
            borderRadius: '4px', border: '1px solid var(--border-light)',
            fontSize: '0.85rem', fontWeight: 'bold', color: 'var(--text-primary)'
          }}>
            {ctrl.key}
          </div>
          <div className="font-display" style={{ fontSize: '0.85rem', fontWeight: 'bold', color: ctrl.color || 'var(--text-primary)' }}>
            {ctrl.action}
          </div>
        </div>
      ))}
    </div>
  );
}

export default function RaceHUD({ 
  phase, countdown, lapTimeMs, speed, currentCheckpoint, latestSplitDiff, carPosition,
  boost, maxBoost, isBoosting
}: RaceHUDProps) {
  const speedKmh = Math.round(Math.abs(speed) * 3.6);
  const trackData = useMemo(() => getTrackData(), []);

  return (
    <div className="klustor-race-hud">
      {/* Top Left — Main Info */}
      <div style={{ position: 'absolute', top: '2rem', left: '2rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        
        {/* Timer Panel */}
        <div style={{ 
          background: 'var(--bg-secondary)', 
          backdropFilter: 'blur(8px)',
          padding: '1.2rem 2rem', 
          borderRadius: '24px', 
          border: '2px solid var(--border-light)',
          boxShadow: '0 8px 32px rgba(0,0,0,0.05)',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center'
        }}>
          <div className="font-display" style={{ 
            fontSize: '1.2rem', 
            fontWeight: '900',
            letterSpacing: '0.15em', 
            color: 'var(--text-muted)',
            marginBottom: '0.2rem'
          }}>
            VICE COAST
          </div>
          <div className="font-display" style={{ 
            fontSize: '3.5rem', 
            fontWeight: '900', 
            lineHeight: 1, 
            color: 'var(--text-primary)',
            letterSpacing: '0.05em',
            fontVariantNumeric: 'tabular-nums'
          }}>
            {formatRaceTime(lapTimeMs)}
          </div>
        </div>
        
        <div style={{
          background: 'var(--bg-secondary)', 
          backdropFilter: 'blur(8px)',
          padding: '1rem 2rem', 
          borderRadius: '24px', 
          border: '2px solid var(--border-light)',
          boxShadow: '0 8px 32px rgba(0,0,0,0.05)',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          width: '280px'
        }}>
          <AnalogSpeedometer speedKmh={speedKmh} />
          <BoostGauge boost={boost} maxBoost={maxBoost} isBoosting={isBoosting} />
        </div>

        {/* Checkpoint Panel */}
        <div style={{ 
          background: 'var(--bg-secondary)', 
          backdropFilter: 'blur(8px)',
          padding: '0.75rem 1.5rem', 
          borderRadius: '24px', 
          border: '2px solid var(--border-light)',
          boxShadow: '0 8px 32px rgba(0,0,0,0.05)',
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '1.5rem'
        }}>
          <div className="font-display" style={{ 
            fontSize: '1.1rem', 
            fontWeight: '900',
            color: 'var(--text-primary)',
            letterSpacing: '0.1em'
          }}>
            CHECKPOINT <span style={{ color: 'var(--klustor-pink)' }}>{Math.min(currentCheckpoint, trackData.totalCheckpoints)}</span> / {trackData.totalCheckpoints}
          </div>

          {/* Split Diff */}
          {latestSplitDiff !== undefined && latestSplitDiff !== null && (
            <div className="font-mono" style={{ 
              fontSize: '1.2rem', 
              fontWeight: 'bold', 
              color: latestSplitDiff < 0 ? 'var(--klustor-green)' : '#FF4444',
            }}>
              {latestSplitDiff > 0 ? '+' : ''}{(latestSplitDiff / 1000).toFixed(2)}s
            </div>
          )}
        </div>
      </div>

      <ControlsLegend />

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
