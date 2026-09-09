import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { GameState, PortfolioItem } from '../types';
import { jobs } from '../data/jobs';

const INITIAL_PLAYER = {
  cash: 0,
  reputation: 10,
  heat: 0,
  rank: 'STREET FIXER',
};

function computeRank(reputation: number): string {
  if (reputation < 20) return 'STREET FIXER';
  if (reputation < 50) return 'ASSOCIATE';
  if (reputation < 80) return 'CONNECTED';
  if (reputation < 100) return 'THE PLUG';
  return 'CITY BOSS';
}

export const useGameStore = create<GameState>()(
  persist(
    (set, get) => ({
      player: { ...INITIAL_PLAYER },
      unlockedJobs: ['job-01'], // First job unlocked by default
      completedJobs: [],
      activeJobId: null,
      portfolio: {},

      acceptJob: (jobId) => {
        set({ activeJobId: jobId });
      },

      submitJob: (jobId, finalImage, creativeScore) => {
        const job = jobs.find((j) => j.id === jobId);
        if (!job) return;

        set((state) => {
          if (state.completedJobs.includes(jobId)) {
            return state; // Guard against duplicate submissions
          }

          const newRep = Math.max(0, Math.min(100, state.player.reputation + job.repReward));
          const newHeat = Math.max(0, Math.min(100, state.player.heat + job.heatChange));

          const newPortfolioItem: PortfolioItem = {
            jobId,
            finalImage,
            creativeScore,
            paymentReceived: job.payment,
            timestamp: new Date().toISOString(),
          };

          const newCompletedJobs = [...state.completedJobs, jobId];

          // Unlock logic (hardcoded simple progression for now)
          const newUnlockedJobs = [...state.unlockedJobs];
          if (newCompletedJobs.length === 1 && !newUnlockedJobs.includes('job-02')) newUnlockedJobs.push('job-02', 'job-03');
          if (newCompletedJobs.length === 3 && !newUnlockedJobs.includes('job-04')) newUnlockedJobs.push('job-04');
          if (newCompletedJobs.length === 4 && !newUnlockedJobs.includes('job-05')) newUnlockedJobs.push('job-05');

          return {
            activeJobId: null, // clear active job
            completedJobs: newCompletedJobs,
            unlockedJobs: newUnlockedJobs,
            portfolio: {
              ...state.portfolio,
              [jobId]: newPortfolioItem,
            },
            player: {
              ...state.player,
              cash: state.player.cash + job.payment,
              reputation: newRep,
              heat: newHeat,
              rank: computeRank(newRep),
            },
          };
        });
      },

      unlockJob: (jobId) => {
        set((state) => ({
          unlockedJobs: state.unlockedJobs.includes(jobId) 
            ? state.unlockedJobs 
            : [...state.unlockedJobs, jobId]
        }));
      },

      resetGame: () => {
        set({
          player: { ...INITIAL_PLAYER },
          unlockedJobs: ['job-01'],
          completedJobs: [],
          activeJobId: null,
          portfolio: {},
        });
      },
    }),
    {
      name: 'klustor-fixer-v1',
      storage: {
        getItem: (name) => {
          const str = localStorage.getItem(name);
          return str ? JSON.parse(str) : null;
        },
        setItem: (name, value) => {
          try {
            localStorage.setItem(name, JSON.stringify(value));
          } catch (e: any) {
            if (e.name === 'QuotaExceededError' || e.message.includes('quota')) {
              console.warn('LocalStorage quota exceeded. Stripping finalImages from portfolio.');
              // Fallback: strip dataUrls to save progress
              const fallbackValue = { ...value };
              if (fallbackValue.state && fallbackValue.state.portfolio) {
                const strippedPortfolio = { ...fallbackValue.state.portfolio };
                for (const key in strippedPortfolio) {
                  strippedPortfolio[key] = {
                    ...strippedPortfolio[key],
                    finalImage: '' // Clear massive dataUrl
                  };
                }
                fallbackValue.state.portfolio = strippedPortfolio;
              }
              try {
                localStorage.setItem(name, JSON.stringify(fallbackValue));
              } catch (fallbackErr) {
                console.error('Fallback save also failed', fallbackErr);
              }
            }
          }
        },
        removeItem: (name) => localStorage.removeItem(name),
      },
    }
  )
);
