// ============================================================
// KLUSTOR: THE FIXER — Core Type Definitions
// ============================================================

export type JobStatus = 'locked' | 'available' | 'active' | 'completed';
export type JobDifficulty = 'easy' | 'medium' | 'hard';
export type ValidationType = 'dimension' | 'visual' | 'save';

export interface ValidationRequirement {
  id: string;
  label: string;
  type: ValidationType;
}

export interface Client {
  id: string;
  name: string;
  role: string;
  portrait?: string;
  personalityQuotes: string[];
}

export interface Job {
  id: string;
  title: string;
  clientId: string;
  location: string;
  brief: string;
  clientBriefTasks: string[]; // E.g., "Add a frame", "Add text"
  payment: number;
  repReward: number;
  heatChange: number;
  difficulty: JobDifficulty;
  image: string; // The original input asset (URL or base64)
  requirements: ValidationRequirement[];
  status: JobStatus;
}

// ============================================================
// Player / Game State Types
// ============================================================

export interface PortfolioItem {
  jobId: string;
  finalImage: string; // base64 dataUrl from Unlayer
  creativeScore: number;
  paymentReceived: number;
  timestamp: string;
}

export interface PlayerState {
  cash: number;
  reputation: number;
  heat: number;
  rank: string;
}

export interface GameState {
  player: PlayerState;
  unlockedJobs: string[];
  completedJobs: string[];
  activeJobId: string | null;
  portfolio: Record<string, PortfolioItem>; // jobId → PortfolioItem
  
  // Actions
  acceptJob: (jobId: string) => void;
  submitJob: (jobId: string, finalImage: string, creativeScore: number) => void;
  unlockJob: (jobId: string) => void;
  resetGame: () => void;
}
