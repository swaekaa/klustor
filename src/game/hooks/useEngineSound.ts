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

          // Lowpass filter to muffle the harsh sawtooth
          const filter = ctx.createBiquadFilter();
          filter.type = 'lowpass';
          filter.frequency.value = 1000;
          filter.connect(masterGain);
          filterNodeRef.current = filter;

          // V12 Simulation: Multiple detuned oscillators for rich harmonics
          const numOscillators = 3;
          const detuneAmounts = [0, 15, -15];
          
          for (let i = 0; i < numOscillators; i++) {
            const osc = ctx.createOscillator();
            osc.type = 'sawtooth';
            osc.detune.value = detuneAmounts[i];
            osc.connect(filter);
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
    
    // Artificially accumulate speed when at top speed to force extra shifts
    if (absSpeed > 20) {
      // Max 4 extra shifts (48 units) over time
      fakeSpeedRef.current = Math.min(fakeSpeedRef.current + 0.05, 48); 
    } else {
      // Decay quickly when braking/slowing down to simulate downshifts
      fakeSpeedRef.current = Math.max(0, fakeSpeedRef.current - 0.2);
    }
    
    const effectiveSpeed = absSpeed + fakeSpeedRef.current;

    // Simulate gears
    // Max speed is roughly 60 m/s. Let's make gears every 12 m/s.
    const GEAR_RATIO = 12;
    const speedInGear = effectiveSpeed % GEAR_RATIO;
    const gear = Math.floor(effectiveSpeed / GEAR_RATIO) + 1;
    
    // Base frequency for idle is around 50Hz.
    // Speed adds to the frequency linearly within the current gear.
    // When boosting, we multiply the frequency to simulate high RPMs.
    const baseFreq = 50 + (speedInGear * 6) + (gear * 3); 
    const targetFreq = isBoosting ? baseFreq * 1.5 : baseFreq;

    // Filter opens up at high speeds / boost for a more aggressive scream
    const targetFilterFreq = isBoosting ? 4000 : 800 + (absSpeed * 40);
    
    // Lower volume globally per request.
    const targetGain = isBoosting ? 0.08 : 0.03 + Math.min(absSpeed / 150, 0.03);

    const now = audioCtxRef.current.currentTime;
    
    // Smooth transitions for normal driving, but snap quickly on shifts (which happen naturally via the modulo)
    oscillatorsRef.current.forEach(osc => {
      osc.frequency.setTargetAtTime(targetFreq, now, 0.05);
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
