import { getTrackData } from '../data/viceCoastCircuit';
import { formatRaceTime } from '../hooks/useRaceState';
import type { RacePhase } from '../hooks/useRaceState';
import * as THREE from 'three';
import { useMemo, useState, useEffect } from 'react';
import { useTelemetryStore } from '../../store/telemetryStore';

interface RaceHUDProps {
  phase: RacePhase;
  countdown: number;
  lapTimeMs: number;
  currentCheckpoint: number;
  latestSplitDiff?: number | null;
  lapSplits?: number[];
}

function BoostGauge() {
  const boost = useTelemetryStore(s => s.boost);
  const maxBoost = useTelemetryStore(s => s.maxBoost);
  const isBoosting = useTelemetryStore(s => s.isBoosting);

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

function Minimap({ currentCheckpoint }: { currentCheckpoint: number }) {
  const trackData = useMemo(() => getTrackData(), []);
  const [isExpanded, setIsExpanded] = useState(false);
  const carPosition = useTelemetryStore(s => s.carPosition);
  
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key.toLowerCase() === 'm') setIsExpanded(prev => !prev);
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  const W = isExpanded ? 600 : 180;
  const H = isExpanded ? 600 : 180;
  // Increase padding so it doesn't overlap the "TRACK MAP" title at the top left
  const pad = isExpanded ? 80 : 15;

  // Calculate bounds
  const minX = Math.min(...trackData.samples.map(p => p.position.x));
  const maxX = Math.max(...trackData.samples.map(p => p.position.x));
  const minZ = Math.min(...trackData.samples.map(p => p.position.z));
  const maxZ = Math.max(...trackData.samples.map(p => p.position.z));

  const scale = Math.min((W - pad * 2) / (maxX - minX || 1), (H - pad * 2) / (maxZ - minZ || 1));

  // To center perfectly, calculate the actual SVG size of the track and offset it
  const trackW = (maxX - minX) * scale;
  const trackH = (maxZ - minZ) * scale;
  const offsetX = (W - trackW) / 2;
  const offsetY = (H - trackH) / 2;

  const toSVG = (x: number, z: number) => ({
    svgX: (x - minX) * scale + offsetX,
    svgY: (z - minZ) * scale + offsetY,
  });

  const path = trackData.samples.map((p, i) => {
    const { svgX, svgY } = toSVG(p.position.x, p.position.z);
    return `${i === 0 ? 'M' : 'L'} ${svgX.toFixed(1)} ${svgY.toFixed(1)}`;
  }).join(' ') + ' Z';

  const carSVGX = carPosition ? toSVG(carPosition.x, carPosition.z).svgX : W / 2;
  const carSVGY = carPosition ? toSVG(carPosition.x, carPosition.z).svgY : H / 2;

  const startPt = toSVG(trackData.samples[0].position.x, trackData.samples[0].position.z);

  const containerStyle = isExpanded 
    ? {
        position: 'absolute' as const, top: '50%', left: '50%', transform: 'translate(-50%, -50%)',
        background: 'var(--bg-secondary)', padding: '2rem', borderRadius: '32px',
        border: '3px solid var(--klustor-cyan)', boxShadow: '0 8px 32px rgba(0,0,0,0.1)',
        zIndex: 1000
      }
    : {
        position: 'absolute' as const, bottom: '2rem', right: '2rem', 
        background: 'var(--bg-secondary)', backdropFilter: 'blur(12px)',
        padding: '1rem', borderRadius: '24px', 
        border: '2px solid var(--border-light)', boxShadow: '0 8px 24px rgba(0,0,0,0.05)',
        zIndex: 10
      };

  return (
    <div style={containerStyle}>
      {isExpanded && (
        <div className="font-display" style={{ position: 'absolute', top: '1.5rem', left: '2rem', fontSize: '1.5rem', color: 'var(--text-primary)' }}>
          TRACK MAP
        </div>
      )}
      <svg width={W} height={H} style={{ display: 'block', borderRadius: isExpanded ? '16px' : '12px', background: '#e0ecd3' /* Soft Green Land */ }}>
        
        {/* Water Inside the Track */}
        <path d={path} fill="#cce8f4" /* Soft Blue Lake */ />

        {/* Grid lines */}
        {isExpanded && (
          <g opacity={0.3}>
            {Array.from({length: 10}).map((_, i) => (
              <line key={`h${i}`} x1={0} y1={i * 60} x2={W} y2={i * 60} stroke="rgba(0,0,0,0.1)" strokeWidth={1} />
            ))}
            {Array.from({length: 10}).map((_, i) => (
              <line key={`v${i}`} x1={i * 60} y1={0} x2={i * 60} y2={H} stroke="rgba(0,0,0,0.1)" strokeWidth={1} />
            ))}
          </g>
        )}
        
        {/* Track Outline Base (Wide) */}
        <path d={path} fill="none" stroke="rgba(0,0,0,0.1)" strokeWidth={isExpanded ? 16 : 8} strokeLinejoin="round" />
        
        {/* Track Core Line */}
        <path d={path} fill="none" stroke="var(--klustor-cyan)" strokeWidth={isExpanded ? 4 : 2} strokeLinejoin="round" />
        
        {trackData.checkpoints.map((cp) => {
          if (cp.index === trackData.totalCheckpoints) return null; // Skip finish line for normal dots
          const { svgX, svgY } = toSVG(cp.position.x, cp.position.z);
          const done = currentCheckpoint > cp.index;
          return (
            <circle
              key={cp.id}
              cx={svgX}
              cy={svgY}
              r={isExpanded ? 6 : 4}
              fill={done ? 'var(--klustor-green)' : 'var(--bg-primary)'}
              stroke={done ? 'var(--klustor-green)' : 'var(--klustor-cyan)'}
              strokeWidth={2}
            />
          );
        })}

        {/* Start/Finish Line Indicator */}
        <circle cx={startPt.svgX} cy={startPt.svgY} r={isExpanded ? 10 : 6}
          fill="var(--klustor-pink)" stroke="var(--bg-secondary)" strokeWidth={isExpanded ? 3 : 2} />

        {/* Player Car Indicator */}
        <circle cx={carSVGX} cy={carSVGY} r={isExpanded ? 10 : 6} fill="var(--klustor-yellow)" stroke="var(--text-primary)" strokeWidth={isExpanded ? 3 : 2} />
      </svg>
      
      {!isExpanded && (
        <div className="font-mono" style={{ position: 'absolute', bottom: '1rem', right: '1rem', fontSize: '0.6rem', color: 'var(--text-muted)' }}>
          PRESS 'M'
        </div>
      )}
    </div>
  );
}

function AnalogSpeedometer() {
  const speed = useTelemetryStore(s => s.speed);
  const speedKmh = Math.round(Math.abs(speed) * 3.6);
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

function SplitsOverlay({ lapSplits = [] }: { lapSplits?: number[] }) {
  const [showSplits, setShowSplits] = useState(false);
  const trackData = useMemo(() => getTrackData(), []);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Tab') {
        e.preventDefault();
        setShowSplits(true);
      }
    };
    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.key === 'Tab') {
        e.preventDefault();
        setShowSplits(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, []);

  if (!showSplits) return null;

  return (
    <div style={{
      position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)',
      background: 'var(--bg-secondary)', backdropFilter: 'blur(8px)',
      padding: '2rem', borderRadius: '32px', 
      border: '2px solid var(--border-light)',
      boxShadow: '0 16px 64px rgba(0,0,0,0.1)',
      display: 'flex', flexDirection: 'column', gap: '1rem',
      minWidth: '300px', zIndex: 500
    }}>
      <div className="font-display" style={{ fontSize: '1.5rem', fontWeight: 'bold', color: 'var(--text-primary)', letterSpacing: '0.1em', textAlign: 'center', marginBottom: '1rem' }}>
        SECTOR TIMES
      </div>
      
      {Array.from({ length: trackData.totalCheckpoints }).map((_, i) => {
        const timeMs = lapSplits[i];
        const prevTimeMs = i > 0 ? (lapSplits[i-1] || 0) : 0;
        const sectorTime = timeMs ? timeMs - prevTimeMs : null;
        
        return (
          <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.5rem 1rem', background: 'var(--bg-primary)', borderRadius: '12px' }}>
            <div className="font-mono" style={{ fontSize: '0.9rem', fontWeight: 'bold', color: 'var(--text-muted)' }}>
              SECTOR {i + 1}
            </div>
            <div className="font-mono" style={{ fontSize: '1.2rem', fontWeight: 'bold', color: sectorTime ? 'var(--text-primary)' : 'rgba(0,0,0,0.2)' }}>
              {sectorTime ? formatRaceTime(sectorTime) : '--:--.--'}
            </div>
          </div>
        );
      })}
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
        { key: 'TAB', action: 'VIEW SPLITS' },
        { key: 'M', action: 'MAP', color: 'var(--klustor-cyan)' },
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
  phase, countdown, lapTimeMs, currentCheckpoint, latestSplitDiff, lapSplits
}: RaceHUDProps) {
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
          <AnalogSpeedometer />
          <BoostGauge />
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

      <SplitsOverlay lapSplits={lapSplits} />
      <ControlsLegend />

      <Minimap currentCheckpoint={currentCheckpoint} />

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
