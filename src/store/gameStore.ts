import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { GameState, LiveryData, CarStats, TemplateView } from '../types';

export async function generateThumbnail(base64Str: string): Promise<string> {
  if (!base64Str || !base64Str.startsWith('data:image')) return '';
  return new Promise((resolve) => {
    const img = new Image();
    img.crossOrigin = 'Anonymous';
    img.onload = () => {
      const canvas = document.createElement('canvas');
      // Scale down to max 160px width
      const scale = 160 / Math.max(img.width, 1);
      canvas.width = img.width * scale;
      canvas.height = img.height * scale;
      const ctx = canvas.getContext('2d');
      if (!ctx) return resolve('');
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
      // Export as heavily compressed JPEG
      resolve(canvas.toDataURL('image/jpeg', 0.6));
    };
    img.onerror = () => resolve('');
    img.src = base64Str;
  });
}

// ============================================================
// KLUSTOR // VICE COAST RACING — Zustand Game Store
// ============================================================

const DEFAULT_PLAYER: Partial<GameState['player']> & { cash: number, rep: number, racesWon: number, bestTime: number | null, driverName: string, driverAvatar: string } = {
  cash: 1000,
  rep: 0,
  racesWon: 0,
  bestTime: null,
  bestSplits: [],
  driverName: '',
  driverAvatar: '🚗',
  deviceId: typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).substring(2, 15),
};

export const defaultStats = (): CarStats => ({
  topSpeed: 100,
  acceleration: 3,
  handling: 3,
  designScore: 0,
  overallRating: 3,
});

export function sanitizeStats(stats: any): CarStats {
  if (!stats) return defaultStats();
  return {
    topSpeed: typeof stats.topSpeed === 'number' && !Number.isNaN(stats.topSpeed) ? stats.topSpeed : 100,
    acceleration: typeof stats.acceleration === 'number' && !Number.isNaN(stats.acceleration) ? stats.acceleration : 3,
    handling: typeof stats.handling === 'number' && !Number.isNaN(stats.handling) ? stats.handling : 3,
    designScore: typeof stats.designScore === 'number' && !Number.isNaN(stats.designScore) ? stats.designScore : 0,
    overallRating: typeof stats.overallRating === 'number' && !Number.isNaN(stats.overallRating) ? stats.overallRating : 3,
  };
}

function computeOverallRating(stats: CarStats): number {
  const ts = Number.isNaN(stats.topSpeed) || !stats.topSpeed ? 100 : stats.topSpeed;
  const ac = Number.isNaN(stats.acceleration) || !stats.acceleration ? 3 : stats.acceleration;
  const hn = Number.isNaN(stats.handling) || !stats.handling ? 3 : stats.handling;
  const ds = Number.isNaN(stats.designScore) || stats.designScore === undefined ? 0 : stats.designScore;

  return parseFloat(
    ((ts / 140 * 10 * 0.3) +
     (ac * 0.25) +
     (hn * 0.25) +
     (ds * 0.2)).toFixed(1)
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

      updateDriverAvatar: (avatar: string) => {
        set(state => ({
          player: {
            ...state.player,
            driverAvatar: avatar
          }
        }));
      },
      updateDriverName: (name: string) => {
        set(state => ({
          player: {
            ...state.player,
            driverName: name
          }
        }));
      },
      updateLiveryName: (name: string) => {
        set((state) => ({
          currentLivery: state.currentLivery 
            ? { ...state.currentLivery, name }
            : { name, textures: {}, stats: defaultStats(), createdAt: new Date().toISOString() }
        }));
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

      // ── Hard reset game state ───────────────────────────────
      resetGame: () => {
        set({
          player: { ...DEFAULT_PLAYER },
          currentLivery: null,
          bestLivery: null,
          raceRecords: [],
        });
      },

      // ── Clear Leaderboard (Records only) ────────────────────
      clearLeaderboard: () => {
        set((s) => ({
          raceRecords: [],
          bestLivery: null,
          player: {
            ...s.player,
            bestTime: null,
            bestSplits: [],
          }
        }));
      }
    }),
    {
      name: 'klustor-racing-v2',
      storage: {
        getItem: (name) => {
          const str = localStorage.getItem(name);
          if (!str) return null;
          try {
            const data = JSON.parse(str);
            if (data?.state) {
              if (data.state.player && !data.state.player.deviceId) {
                data.state.player.deviceId = typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).substring(2, 15);
              }
              if (data.state.currentLivery?.stats) {
                data.state.currentLivery.stats = sanitizeStats(data.state.currentLivery.stats);
              }
              if (data.state.bestLivery?.stats) {
                data.state.bestLivery.stats = sanitizeStats(data.state.bestLivery.stats);
              }
              if (Array.isArray(data.state.raceRecords)) {
                data.state.raceRecords = data.state.raceRecords.map((r: any) => ({
                  ...r,
                  designScore: typeof r.designScore === 'number' && !Number.isNaN(r.designScore) ? r.designScore : 0
                }));
              }
            }
            return data;
          } catch {
            return null;
          }
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

