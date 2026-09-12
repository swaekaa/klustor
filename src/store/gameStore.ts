import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { GameState, LiveryData, CarStats, TemplateView } from '../types';

// ============================================================
// KLUSTOR // VICE COAST RACING — Zustand Game Store
// ============================================================

const DEFAULT_PLAYER: Partial<GameState['player']> & { cash: number, rep: number, racesWon: number, bestTime: number | null, driverName: string } = {
  cash: 1000,
  rep: 0,
  racesWon: 0,
  bestTime: null,
  bestSplits: [],
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

      // ── Reset all livery designs ──────────────────────────────
      resetLivery: () => {
        set({ currentLivery: null });
      },

      // ── Save a new livery face from Unlayer ─────────────────
      saveLiveryFace: (dataUrl: string, view: TemplateView, newStats: CarStats, liveryName?: string) => {
        const state = get();
        const existing = state.currentLivery;
        
        // Merge textures
        const newTextures = {
          ...(existing?.textures || {}),
          [view]: dataUrl,
        };

        // For now, average the stats with the new one.
        // If there are existing stats, we do a basic blend, or just keep the latest for simplicity.
        // Actually, the best way to average stats is to recalculate them in the UI and pass them here, 
        // OR pass the specific face's stats and average them. The user requested all sides contribute.
        // We'll store the computed overallStats passed from UI.
        const livery: LiveryData = {
          name: liveryName ?? existing?.name ?? 'MY LIVERY',
          textures: newTextures,
          stats: {
            ...newStats,
            overallRating: computeOverallRating(newStats),
          },
          createdAt: existing?.createdAt ?? new Date().toISOString(),
        };
        set({ currentLivery: livery });
      },

      // ── Record a completed race ───────────────────────────
      recordRaceResult: (time: number, topSpeed: number, splits: number[]) => {
        const state = get();
        const livery = state.currentLivery;

        const record = {
          id: `vice-coast-${Date.now()}`,
          trackId: 'vice-coast',
          time,
          topSpeed,
          designScore: livery?.stats.designScore ?? 0,
          liveryTextures: livery?.textures ?? {},
          liveryName: livery?.name ?? 'DEFAULT',
          driverName: state.player.driverName,
          isNPC: false,
          createdAt: new Date().toISOString(),
        };

        const isNewBest =
          state.player.bestTime === null || 
          time < state.player.bestTime ||
          !state.player.bestSplits ||
          state.player.bestSplits.length === 0;

        set((s) => ({
          raceRecords: [...s.raceRecords, record],
          bestLivery: isNewBest ? (livery ?? s.bestLivery) : s.bestLivery,
          player: {
            ...s.player,
            cash: s.player.cash + 500 + (isNewBest ? 250 : 0),
            rep: s.player.rep + 10 + (isNewBest ? 5 : 0),
            racesWon: s.player.racesWon + 1,
            bestTime: isNewBest ? time : s.player.bestTime,
            bestSplits: isNewBest ? splits : s.player.bestSplits,
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
      name: 'klustor-racing-v2',
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
              console.warn('[KLUSTOR] LocalStorage quota — stripping livery textures');
              const fallback = { ...value };
              if (fallback.state) {
                // Strip large dataUrls to save space
                if (fallback.state.raceRecords) {
                  fallback.state.raceRecords = fallback.state.raceRecords.map(
                    (r: any) => ({ ...r, liveryTextures: {} })
                  );
                }
                if (fallback.state.currentLivery) {
                  fallback.state.currentLivery.textures = {};
                }
                if (fallback.state.bestLivery) {
                  fallback.state.bestLivery.textures = {};
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

