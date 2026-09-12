import { useEffect, useRef } from 'react';

// ============================================================
// Synthetic V12 Engine Sound via Web Audio API
// ============================================================

export function useEngineSound(speed: number, isBoosting: boolean, phase: string) {
  const audioCtxRef = useRef<AudioContext | null>(null);
  const oscillatorsRef = useRef<OscillatorNode[]>([]);
  const gainNodeRef = useRef<GainNode | null>(null);
  const filterNodeRef = useRef<BiquadFilterNode | null>(null);
  
  const initialized = useRef(false);
  const fakeSpeedRef = useRef(0);

  useEffect(() => {
    // Only init when race starts or countdown begins
    if (!initialized.current && (phase === 'countdown' || phase === 'racing')) {
      const initAudio = () => {
        if (initialized.current) return;
        try {
          const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
          const ctx = new AudioContext();
          audioCtxRef.current = ctx;

          // Master Gain (Volume)
          const masterGain = ctx.createGain();
          masterGain.gain.value = 0.15; // Base volume
          masterGain.connect(ctx.destination);
          gainNodeRef.current = masterGain;

          // Lowpass filter to muffle the harsh "bee" buzz and add "throatiness"
          const filter = ctx.createBiquadFilter();
          filter.type = 'lowpass';
          filter.frequency.value = 400;
          filter.Q.value = 3; // Adds a bit of resonance/growl
          filter.connect(masterGain);
          filterNodeRef.current = filter;

          // V12 Simulation: Mixed waveforms for a deeper, throatier engine
          const types: OscillatorType[] = ['sawtooth', 'sawtooth', 'square', 'triangle'];
          const detunes = [5, -5, 0, 0];
          
          for (let i = 0; i < 4; i++) {
            const osc = ctx.createOscillator();
            osc.type = types[i];
            osc.detune.value = detunes[i];
            
            // The triangle wave acts as a sub-bass layer
            if (i === 3) {
              const subGain = ctx.createGain();
              subGain.gain.value = 1.5;
              osc.connect(subGain);
              subGain.connect(filter);
            } else if (i === 2) { // Square wave gives it a hollow exhaust growl, lower its volume slightly
              const sqGain = ctx.createGain();
              sqGain.gain.value = 0.4;
              osc.connect(sqGain);
              sqGain.connect(filter);
            } else {
              osc.connect(filter);
            }
            
            osc.start();
            oscillatorsRef.current.push(osc);
          }

          initialized.current = true;
          
          // Remove listener once init is successful
          window.removeEventListener('keydown', initAudio);
        } catch (err) {
          console.warn('[KLUSTOR] Audio init failed:', err);
        }
      };

      // Need user gesture to unlock audio
      window.addEventListener('keydown', initAudio);
      
      return () => {
        window.removeEventListener('keydown', initAudio);
      };
    }
  }, [phase]);

  // Update pitch and volume based on speed and boost
  useEffect(() => {
    if (!audioCtxRef.current || !initialized.current) return;
    if (audioCtxRef.current.state === 'suspended') {
      audioCtxRef.current.resume();
    }

    const absSpeed = Math.abs(speed);
    
    // Artificially accumulate speed when at top speed to force extra shifts indefinitely
    if (absSpeed > 20) {
      fakeSpeedRef.current += 0.05; 
    } else {
      // Decay quickly when braking/slowing down to simulate downshifts
      fakeSpeedRef.current = Math.max(0, fakeSpeedRef.current - 0.2);
    }
    
    const effectiveSpeed = absSpeed + fakeSpeedRef.current;

    // Simulate gears
    const GEAR_RATIO = 12;
    const speedInGear = effectiveSpeed % GEAR_RATIO;
    const gear = Math.floor(effectiveSpeed / GEAR_RATIO) + 1;
    
    // Cap the overall pitch addition from gears so it doesn't squeak infinitely, 
    // but the speedInGear will keep wrapping around (shifting) forever!
    const effectiveGear = Math.min(gear, 6); 
    
    // Lower base frequency to give it a heavier motor sound (35Hz idle) -> Increased back to 60Hz per user feedback
    const baseFreq = 60 + (speedInGear * 7.5) + (effectiveGear * 6); 
    const targetFreq = isBoosting ? baseFreq * 1.6 : baseFreq;

    // Keep filter relatively closed to muffle the bee-like high frequencies, unless boosting
    const targetFilterFreq = isBoosting ? 3000 : 300 + (absSpeed * 15);
    
    // Lower volume globally per request.
    const targetGain = isBoosting ? 0.1 : 0.04 + Math.min(absSpeed / 120, 0.04);

    const now = audioCtxRef.current.currentTime;
    
    // Smooth transitions for normal driving, but snap quickly on shifts
    oscillatorsRef.current.forEach((osc, i) => {
      // Triangle sub-bass (index 3) is an octave down
      const freq = i === 3 ? targetFreq * 0.5 : targetFreq;
      osc.frequency.setTargetAtTime(freq, now, 0.05);
    });

    if (filterNodeRef.current) {
      filterNodeRef.current.frequency.setTargetAtTime(targetFilterFreq, now, 0.1);
    }

    if (gainNodeRef.current) {
      // Mute completely if paused/finished
      if (phase !== 'racing' && phase !== 'countdown') {
        gainNodeRef.current.gain.setTargetAtTime(0, now, 0.1);
      } else {
        gainNodeRef.current.gain.setTargetAtTime(targetGain, now, 0.1);
      }
    }
  }, [speed, isBoosting, phase]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (audioCtxRef.current) {
        oscillatorsRef.current.forEach(osc => {
          try { osc.stop(); } catch(e) {}
        });
        audioCtxRef.current.close();
      }
    };
  }, []);
}
