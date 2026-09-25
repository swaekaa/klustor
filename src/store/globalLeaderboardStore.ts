import { create } from 'zustand';

// ============================================================
// globalLeaderboardStore.ts
// Manages global leaderboard state + live race leader state
// ============================================================

export interface LeaderboardEntry {
  playerId: string;
  displayName: string;
  avatar: string;
  bestTime: number;       // ms
  topSpeed: number;       // m/s
  designScore: number;
  racesCompleted: number;
  liveryThumb: string;
  lastUpdated: number;
  rank: number;
}

export interface LiveLeaderState {
  leaderId: string | null;
  displayName: string;
  position: { x: number; y: number; z: number } | null;
  rotation: { x: number; y: number; z: number } | null;
  progress: number;
  speed: number;
  livery: Record<string, string> | null;
  timestamp: number;
}

export interface RacePosition {
  playerId: string;
  displayName: string;
  rank: number;
  checkpointIndex: number;
  isFinished: boolean;
}

interface GlobalLeaderboardState {
  // Global leaderboard data
  top20: LeaderboardEntry[];
  totalPlayers: number;
  playerEntry: LeaderboardEntry | null;
  playerRank: number | null;
  isLoading: boolean;
  lastFetched: number | null;

  // Live race state
  liveLeader: LiveLeaderState;
  racePositions: RacePosition[];

  // Actions
  setLeaderboardData: (data: { top20: LeaderboardEntry[]; totalPlayers: number; playerEntry: LeaderboardEntry | null; playerRank: number | null }) => void;
  setLiveLeader: (leader: Partial<LiveLeaderState>) => void;
  setRacePositions: (positions: RacePosition[]) => void;
  setLoading: (loading: boolean) => void;
  resetRaceState: () => void;
}

const DEFAULT_LIVE_LEADER: LiveLeaderState = {
  leaderId: null,
  displayName: '',
  position: null,
  rotation: null,
  progress: 0,
  speed: 0,
  livery: null,
  timestamp: 0,
};

export const useGlobalLeaderboardStore = create<GlobalLeaderboardState>((set) => ({
  top20: [],
  totalPlayers: 0,
  playerEntry: null,
  playerRank: null,
  isLoading: false,
  lastFetched: null,

  liveLeader: { ...DEFAULT_LIVE_LEADER },
  racePositions: [],

  setLeaderboardData: (data) => set({
    top20: data.top20,
    totalPlayers: data.totalPlayers,
    playerEntry: data.playerEntry,
    playerRank: data.playerRank,
    lastFetched: Date.now(),
    isLoading: false,
  }),

  setLiveLeader: (leader) => set((state) => ({
    liveLeader: { ...state.liveLeader, ...leader },
  })),

  setRacePositions: (positions) => set({ racePositions: positions }),

  setLoading: (loading) => set({ isLoading: loading }),

  resetRaceState: () => set({
    liveLeader: { ...DEFAULT_LIVE_LEADER },
    racePositions: [],
  }),
}));
