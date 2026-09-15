export type MultiplayerRoomStatus =
  | 'lobby'
  | 'editing'
  | 'submission'
  | 'racing'
  | 'results'
  | 'completed'
  | 'cancelled';

export type MultiplayerPlayerStatus =
  | 'joined'
  | 'ready'
  | 'editing'
  | 'submitted'
  | 'racing'
  | 'finished'
  | 'disconnected';

export interface MultiplayerPlayer {
  id: string; // Socket ID or stable ID
  displayName: string;
  avatar: string;
  isLeader: boolean;
  isReady: boolean;
  draftLivery?: string; // Live preview during challenge
  hasSubmitted: boolean;
  joinedAt: number;
  submittedAt: number | null;
  liveryDataUrl: string | null; // For MVP only
  designScore: number | null;
  raceTime: number | null;
  raceScore: number | null;
  topSpeed: number | null;
  totalScore: number | null;
  wins: number;
  status: MultiplayerPlayerStatus;
}

export interface ChallengeRoom {
  id: string;
  code: string;
  leaderId: string;
  name: string;
  title: string;
  description: string;
  editingDurationSeconds: number;
  maxPlayers: number;
  racingEnabled: boolean;
  status: MultiplayerRoomStatus;
  createdAt: number;
  startedAt: number | null;
  endsAt: number | null;
  players: MultiplayerPlayer[];
}
