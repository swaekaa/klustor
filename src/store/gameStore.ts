// ============================================================
// ZUSTAND GAME STORE (v5 compatible)
// Global state for the entire investigation experience
// ============================================================
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { DecisionId, EndingId, InvestigationMeta, PlayerState } from '../types';
import { case017 } from '../data/cases/case017';

function computeRank(reputation: number): string {
  if (reputation < 30) return 'COMPROMISED';
  if (reputation < 50) return 'ROOKIE INVESTIGATOR';
  if (reputation < 70) return 'FIELD INVESTIGATOR';
  if (reputation < 85) return 'SENIOR INVESTIGATOR';
  return 'LEAD INVESTIGATOR';
}

const INITIAL_PLAYER: PlayerState = {
  reputation: 50,
  heat: 0,
  casesCompleted: 0,
  rank: 'ROOKIE INVESTIGATOR',
};

interface GameStore {
  // State
  currentCaseId: string | null;
  player: PlayerState;
  discoveredClues: string[];
  reviewedEvidence: string[];
  savedImages: Record<string, string>;
  investigationMeta: Record<string, InvestigationMeta>;
  decision: DecisionId | null;
  ending: EndingId | null;
  progress: number;

  // Actions
  startCase: (caseId: string) => void;
  reviewEvidence: (evidenceId: string) => void;
  discoverClue: (clueId: string) => void;
  saveInvestigation: (evidenceId: string, dataUrl: string, meta?: Partial<InvestigationMeta>) => void;
  makeDecision: (decisionId: DecisionId) => void;
  resetGame: () => void;

  // Helpers
  isClueDiscovered: (clueId: string) => boolean;
  isEvidenceReviewed: (evidenceId: string) => boolean;
  canMakeDecision: () => boolean;
  getUnlockedEvidence: () => string[];
}

export const useGameStore = create<GameStore>()(
  persist(
    (set, get) => ({
      // ── Initial State ────────────────────────────────────────
      currentCaseId: null,
      player: { ...INITIAL_PLAYER },
      discoveredClues: [],
      reviewedEvidence: [],
      savedImages: {},
      investigationMeta: {},
      decision: null,
      ending: null,
      progress: 0,

      // ── Actions ──────────────────────────────────────────────
      startCase: (caseId) => {
        set({
          currentCaseId: caseId,
          player: { ...INITIAL_PLAYER },
          discoveredClues: [],
          reviewedEvidence: [],
          savedImages: {},
          investigationMeta: {},
          decision: null,
          ending: null,
          progress: 0,
        });
      },

      reviewEvidence: (evidenceId) => {
        set((state) => {
          if (state.reviewedEvidence.includes(evidenceId)) return state;
          const newReviewed = [...state.reviewedEvidence, evidenceId];
          return { reviewedEvidence: newReviewed };
        });
      },

      discoverClue: (clueId) => {
        set((state) => {
          if (state.discoveredClues.includes(clueId)) return state;

          const clue = case017.clues.find((c) => c.id === clueId);
          const xpGain = clue?.xp ?? 10;

          const newClues = [...state.discoveredClues, clueId];
          const totalClues = case017.clues.length;
          const clueProgress = Math.round((newClues.length / totalClues) * 60);
          const evidenceProgress = Math.round((state.reviewedEvidence.length / 5) * 40);

          const newRep = Math.min(100, state.player.reputation + Math.round(xpGain / 5));

          return {
            discoveredClues: newClues,
            progress: Math.min(100, evidenceProgress + clueProgress),
            player: {
              ...state.player,
              reputation: newRep,
              rank: computeRank(newRep),
            },
          };
        });
      },

      saveInvestigation: (evidenceId, dataUrl, meta) => {
        set((state) => ({
          savedImages: { ...state.savedImages, [evidenceId]: dataUrl },
          investigationMeta: {
            ...state.investigationMeta,
            [evidenceId]: {
              evidenceId,
              annotations: meta?.annotations ?? [],
              discoveredClueIds: meta?.discoveredClueIds ?? [],
              savedImage: dataUrl,
              timestamp: new Date().toISOString(),
            },
          },
        }));
      },

      makeDecision: (decisionId) => {
        const decision = case017.decisions.find((d) => d.id === decisionId);
        if (!decision) return;

        set((state) => {
          const newRep = Math.max(0, Math.min(100, state.player.reputation + decision.reputationDelta));
          const newHeat = Math.max(0, Math.min(100, state.player.heat + decision.heatDelta));
          return {
            decision: decisionId,
            ending: decision.endingId,
            player: {
              ...state.player,
              reputation: newRep,
              heat: newHeat,
              rank: computeRank(newRep),
            },
          };
        });
      },

      resetGame: () => {
        set({
          currentCaseId: null,
          player: { ...INITIAL_PLAYER },
          discoveredClues: [],
          reviewedEvidence: [],
          savedImages: {},
          investigationMeta: {},
          decision: null,
          ending: null,
          progress: 0,
        });
      },

      // ── Helpers (read current state via get()) ───────────────
      isClueDiscovered: (clueId) => get().discoveredClues.includes(clueId),

      isEvidenceReviewed: (evidenceId) => get().reviewedEvidence.includes(evidenceId),

      canMakeDecision: () => {
        const { discoveredClues, reviewedEvidence } = get();
        return discoveredClues.length >= 4 && reviewedEvidence.length >= 2;
      },

      getUnlockedEvidence: () => {
        const { discoveredClues } = get();
        const unlocked: string[] = ['evidence-01', 'evidence-02'];

        if (
          discoveredClues.includes('clue-plate-01') ||
          discoveredClues.includes('clue-person-02') ||
          discoveredClues.includes('clue-vehicle-01')
        ) {
          unlocked.push('evidence-03');
        }

        if (
          discoveredClues.includes('clue-redcoat-01') ||
          discoveredClues.includes('clue-vehicle-02') ||
          discoveredClues.includes('clue-location-velvet')
        ) {
          unlocked.push('evidence-04');
        }

        if (
          discoveredClues.includes('clue-phone-01') ||
          discoveredClues.includes('clue-footprints-01') ||
          discoveredClues.includes('clue-message-01')
        ) {
          unlocked.push('evidence-05');
        }

        return unlocked;
      },
    }),
    {
      name: 'photo-never-lies-v1',
    }
  )
);
