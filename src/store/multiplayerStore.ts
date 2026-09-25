import { create } from 'zustand';
import { io, Socket } from 'socket.io-client';
import type { ChallengeRoom, MultiplayerPlayer } from '../../server/src/types'; // Share types for simplicity
import { useGlobalLeaderboardStore } from './globalLeaderboardStore';

interface MultiplayerState {
  socket: Socket | null;
  room: ChallengeRoom | null;
  isConnected: boolean;
  error: string | null;
  
  // Actions
  connect: () => void;
  disconnect: () => void;
  createRoom: (displayName: string, avatar: string, config: any) => Promise<ChallengeRoom>;
  joinRoom: (roomCode: string, displayName: string, avatar: string) => Promise<ChallengeRoom>;
  leaveRoom: () => void;
  setReady: (isReady: boolean) => Promise<void>;
  startChallenge: () => Promise<void>;
  restartRoom: () => Promise<void>;
  updateRoomConfig: (updates: { editingDurationSeconds?: number }) => Promise<void>;
  fetchPlayerLivery: (playerId: string) => Promise<Record<string, string>>;
  updateLiveScore: (score: number) => Promise<void>;
  submitLivery: (data: Record<string, string>, designScore: number) => Promise<void>;
  submitRaceResult: (raceTime: number, raceScore: number, topSpeed: number) => Promise<void>;
  getGlobalLeaderboard: () => Promise<void>;
  submitGlobalResult: (payload: { displayName: string; avatar: string; raceTime: number; topSpeed: number; designScore: number; liveryThumb?: string }) => Promise<{ isNewBest: boolean; rank: number }>;
  clearError: () => void;
}

export const useMultiplayerStore = create<MultiplayerState>((set, get) => ({
  socket: null,
  room: null,
  isConnected: false,
  error: null,

  connect: () => {
    if (get().socket) return;
    
    // Connect to the local Node.js server or production server
    const serverUrl = import.meta.env.VITE_SERVER_URL || `${window.location.protocol}//${window.location.hostname}:4000`;
    const socket = io(serverUrl);
    
    socket.on('connect', () => {
      set({ isConnected: true, error: null });
    });
    
    socket.on('disconnect', () => {
      set({ isConnected: false });
    });
    
    socket.on('room_state_updated', (room: ChallengeRoom) => set({ room }));
    socket.on('player_joined', (room: ChallengeRoom) => set({ room }));
    socket.on('player_left', (room: ChallengeRoom) => set({ room }));
    socket.on('challenge_started', (room: ChallengeRoom) => set({ room }));
    socket.on('player_submitted', (room: ChallengeRoom) => set({ room }));
    socket.on('leaderboard_updated', (room: ChallengeRoom) => set({ room }));
    socket.on('challenge_finished', (room: ChallengeRoom) => set({ room }));

    // Global leaderboard live updates
    socket.on('global_leaderboard_updated', (data: any) => {
      useGlobalLeaderboardStore.getState().setLeaderboardData(data);
    });

    // Race positions (for HUD)
    socket.on('race_positions_updated', (positions: any[]) => {
      useGlobalLeaderboardStore.getState().setRacePositions(positions);
    });

    set({ socket });
  },

  disconnect: () => {
    const { socket } = get();
    if (socket) {
      socket.disconnect();
      set({ socket: null, room: null, isConnected: false });
    }
  },

  createRoom: (displayName, avatar, config) => {
    return new Promise((resolve, reject) => {
      const { socket } = get();
      if (!socket) return reject('No socket connection');
      
      socket.emit('create_room', { displayName, avatar, config }, (res: any) => {
        if (res.success) {
          set({ room: res.room, error: null });
          resolve(res.room);
        } else {
          set({ error: res.error });
          reject(res.error);
        }
      });
    });
  },

  joinRoom: (roomCode, displayName, avatar) => {
    return new Promise((resolve, reject) => {
      const { socket } = get();
      if (!socket) return reject('No socket connection');
      
      socket.emit('join_room', { roomCode, displayName, avatar }, (res: any) => {
        if (res.success) {
          set({ room: res.room, error: null });
          resolve(res.room);
        } else {
          set({ error: res.error });
          reject(res.error);
        }
      });
    });
  },

  leaveRoom: () => {
    const { socket } = get();
    if (socket) {
      socket.disconnect(); // Brutal leave, forces a reconnect later
      set({ socket: null, room: null, isConnected: false });
      get().connect(); // Reconnect fresh
    }
  },

  setReady: (isReady) => {
    return new Promise((resolve, reject) => {
      const { socket } = get();
      if (!socket) return reject('No socket connection');
      
      socket.emit('set_player_ready', { isReady }, (res: any) => {
        if (res.success) resolve();
        else {
          set({ error: res.error });
          reject(res.error);
        }
      });
    });
  },

  startChallenge: () => {
    return new Promise((resolve, reject) => {
      const { socket } = get();
      if (!socket) return reject('No socket connection');
      
      socket.emit('start_challenge', {}, (res: any) => {
        if (res.success) resolve();
        else {
          set({ error: res.error });
          reject(res.error);
        }
      });
    });
  },

  restartRoom: () => {
    return new Promise((resolve, reject) => {
      const { socket } = get();
      if (!socket) return reject('No socket connection');
      
      socket.emit('restart_room', {}, (res: any) => {
        if (res.success) resolve();
        else {
          set({ error: res.error });
          reject(res.error);
        }
      });
    });
  },

  updateRoomConfig: (updates) => {
    return new Promise((resolve, reject) => {
      const { socket } = get();
      if (!socket) return reject('No socket connection');
      
      socket.emit('update_room_config', updates, (res: any) => {
        if (res.success) {
          resolve();
        } else {
          set({ error: res.error });
          reject(res.error);
        }
      });
    });
  },

  fetchPlayerLivery: (playerId) => {
    return new Promise((resolve, reject) => {
      const { socket } = get();
      if (!socket) return reject('No socket connection');
      
      socket.emit('get_player_livery', { playerId }, (res: any) => {
        if (res.success) {
          resolve(res.data);
        } else {
          console.error('Failed to fetch player livery:', res.error);
          reject(res.error);
        }
      });
    });
  },

  updateLiveScore: (score) => {
    return new Promise((resolve, reject) => {
      const { socket } = get();
      if (!socket) return reject('No socket connection');
      
      socket.emit('update_live_score', { score }, (res: any) => {
        if (res.success) resolve();
        else reject(res.error);
      });
    });
  },

  submitLivery: (data, designScore) => {
    return new Promise((resolve, reject) => {
      const { socket } = get();
      if (!socket) return reject('No socket connection');
      
      socket.emit('submit_livery', { data, designScore }, (res: any) => {
        if (res.success) resolve();
        else {
          set({ error: res.error });
          reject(res.error);
        }
      });
    });
  },

  submitRaceResult: (raceTime, raceScore, topSpeed) => {
    return new Promise((resolve, reject) => {
      const { socket } = get();
      if (!socket) return reject('No socket connection');
      
      socket.emit('submit_race_result', { raceTime, raceScore, topSpeed }, (res: any) => {
        if (res.success) resolve();
        else {
          set({ error: res.error });
          reject(res.error);
        }
      });
    });
  },

  getGlobalLeaderboard: () => {
    return new Promise((resolve, reject) => {
      const { socket } = get();
      if (!socket) return reject('No socket connection');
      useGlobalLeaderboardStore.getState().setLoading(true);
      socket.emit('get_global_leaderboard', {}, (res: any) => {
        if (res.success) {
          useGlobalLeaderboardStore.getState().setLeaderboardData({
            top20: res.top20,
            totalPlayers: res.totalPlayers,
            playerEntry: res.playerEntry,
            playerRank: res.playerRank,
          });
          resolve();
        } else {
          useGlobalLeaderboardStore.getState().setLoading(false);
          reject(res.error);
        }
      });
    });
  },

  submitGlobalResult: (payload) => {
    return new Promise((resolve, reject) => {
      const { socket } = get();
      if (!socket) return reject('No socket connection');
      socket.emit('submit_global_result', payload, (res: any) => {
        if (res.success) {
          useGlobalLeaderboardStore.getState().setLeaderboardData(res.leaderboard);
          resolve({ isNewBest: res.isNewBest, rank: res.rank });
        } else {
          reject(res.error);
        }
      });
    });
  },
  
  clearError: () => set({ error: null })
}));
