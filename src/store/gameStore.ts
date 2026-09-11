import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { GameState, LiveryData, CarStats, TemplateView } from '../types';

// ============================================================
// KLUSTOR // VICE COAST RACING — Zustand Game Store
// ============================================================

const DEFAULT_PLAYER = {
  cash: 1000,
  rep: 0,
  racesWon: 0,
  bestTime: null,
  driverName: 'KLUSTOR_07',
};

function computeOverallRating(stats: CarStats): number {
  return parseFloat(
    ((stats.topSpeed / 140 * 10 * 0.3) +
     (stats.acceleration * 0.25) +
     (stats.handling * 0.25) +
     (stats.designScore * 0.2)).toFixed(1)
  );
}

export const useGameStore = create<GameState>()(
  persist(
    (set, get) => ({
      player: { ...DEFAULT_PLAYER },
      currentLivery: null,
      bestLivery: null,
      raceRecords: [],

      // ── Save a new livery from Unlayer ────────────────────
      saveLivery: (dataUrl: string, name: string, view: TemplateView, stats: CarStats) => {
        const livery: LiveryData = {
          name,
          dataUrl,
          templateView: view,
          stats: {
            ...stats,
            overallRating: computeOverallRating(stats),
          },
          createdAt: new Date().toISOString(),
        };
        set({ currentLivery: livery });
      },

      // ── Record a completed race ───────────────────────────
      recordRaceResult: (time: number, topSpeed: number) => {
        const state = get();
        const livery = state.currentLivery;

        const record = {
          id: `vice-coast-${Date.now()}`,
          trackId: 'vice-coast',
          time,
          topSpeed,
          designScore: livery?.stats.designScore ?? 0,
          liveryDataUrl: livery?.dataUrl ?? '',
          liveryName: livery?.name ?? 'DEFAULT',
          driverName: state.player.driverName,
          isNPC: false,
          createdAt: new Date().toISOString(),
        };

        const isNewBest =
          state.player.bestTime === null || time < state.player.bestTime;

        set((s) => ({
          raceRecords: [...s.raceRecords, record],
          bestLivery: isNewBest ? (livery ?? s.bestLivery) : s.bestLivery,
          player: {
            ...s.player,
            cash: s.player.cash + 500 + (isNewBest ? 250 : 0),
            rep: s.player.rep + 10 + (isNewBest ? 5 : 0),
            racesWon: s.player.racesWon + 1,
            bestTime: isNewBest ? time : s.player.bestTime,
          },
        }));
      },

      // ── Reset ─────────────────────────────────────────────
      resetGame: () => {
        set({
          player: { ...DEFAULT_PLAYER },
          currentLivery: null,
          bestLivery: null,
          raceRecords: [],
        });
      },
    }),
    {
      name: 'klustor-racing-v1',
      storage: {
        getItem: (name) => {
          const str = localStorage.getItem(name);
          return str ? JSON.parse(str) : null;
        },
        setItem: (name, value) => {
          try {
            localStorage.setItem(name, JSON.stringify(value));
          } catch (e: any) {
            if (e.name === 'QuotaExceededError' || (e.message ?? '').includes('quota')) {
              console.warn('[KLUSTOR] LocalStorage quota — stripping livery dataUrls');
              const fallback = { ...value };
              if (fallback.state) {
                // Strip large dataUrls from raceRecords to save space
                if (fallback.state.raceRecords) {
                  fallback.state.raceRecords = fallback.state.raceRecords.map(
                    (r: any) => ({ ...r, liveryDataUrl: '' })
                  );
                }
                if (fallback.state.currentLivery) {
                  fallback.state.currentLivery = {
                    ...fallback.state.currentLivery,
                    dataUrl: '',
                  };
                }
                if (fallback.state.bestLivery) {
                  fallback.state.bestLivery = {
                    ...fallback.state.bestLivery,
                    dataUrl: '',
                  };
                }
              }
              try {
                localStorage.setItem(name, JSON.stringify(fallback));
              } catch {
                console.error('[KLUSTOR] Fallback save also failed');
              }
            }
          }
        },
        removeItem: (name) => localStorage.removeItem(name),
      },
    }
  )
);
