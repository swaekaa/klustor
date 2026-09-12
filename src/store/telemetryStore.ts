import { create } from 'zustand';
import * as THREE from 'three';

interface TelemetryState {
  speed: number;
  boost: number;
  maxBoost: number;
  isBoosting: boolean;
  carPosition: THREE.Vector3 | undefined;
  maxSpeedSeen: number;
  setTelemetry: (data: Partial<TelemetryState>) => void;
}

export const useTelemetryStore = create<TelemetryState>((set) => ({
  speed: 0,
  boost: 1.0,
  maxBoost: 1.0,
  isBoosting: false,
  carPosition: undefined,
  maxSpeedSeen: 0,
  setTelemetry: (data) => set((state) => {
    let newMaxSpeed = state.maxSpeedSeen;
    if (data.speed !== undefined) {
      newMaxSpeed = Math.max(newMaxSpeed, Math.abs(data.speed));
    }
    return { ...state, ...data, maxSpeedSeen: newMaxSpeed };
  }),
}));
