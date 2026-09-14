import { create } from 'zustand';
import { io, Socket } from 'socket.io-client';
import type { ChallengeRoom, MultiplayerPlayer } from '../../server/src/types'; // Share types for simplicity

interface MultiplayerState {
  socket: Socket | null;
  room: ChallengeRoom | null;
  isConnected: boolean;
  error: string | null;
  
  // Actions
  connect: () => void;
  disconnect: () => void;
  createRoom: (displayName: string, config: any) => Promise<ChallengeRoom>;
  joinRoom: (roomCode: string, displayName: string) => Promise<ChallengeRoom>;
  leaveRoom: () => void;
  setReady: (isReady: boolean) => Promise<void>;
  startChallenge: () => Promise<void>;
  restartRoom: () => Promise<void>;
  submitLivery: (dataUrl: string, designScore: number) => Promise<void>;
  submitRaceResult: (raceTime: number, raceScore: number) => Promise<void>;
  clearError: () => void;
}

export const useMultiplayerStore = create<MultiplayerState>((set, get) => ({
  socket: null,
  room: null,
  isConnected: false,
  error: null,

  connect: () => {
    if (get().socket) return;
    
    // Connect to the local Node.js server (assumes running concurrently)
    const socket = io('http://localhost:4000');
    
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

    set({ socket });
  },

  disconnect: () => {
    const { socket } = get();
    if (socket) {
      socket.disconnect();
      set({ socket: null, room: null, isConnected: false });
    }
  },

  createRoom: (displayName, config) => {
    return new Promise((resolve, reject) => {
      const { socket } = get();
      if (!socket) return reject('No socket connection');
      
      socket.emit('create_room', { displayName, config }, (res: any) => {
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

  joinRoom: (roomCode, displayName) => {
    return new Promise((resolve, reject) => {
      const { socket } = get();
      if (!socket) return reject('No socket connection');
      
      socket.emit('join_room', { roomCode, displayName }, (res: any) => {
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

  submitLivery: (dataUrl, designScore) => {
    return new Promise((resolve, reject) => {
      const { socket } = get();
      if (!socket) return reject('No socket connection');
      
      socket.emit('submit_livery', { dataUrl, designScore }, (res: any) => {
        if (res.success) resolve();
        else {
          set({ error: res.error });
          reject(res.error);
        }
      });
    });
  },

  submitRaceResult: (raceTime, raceScore) => {
    return new Promise((resolve, reject) => {
      const { socket } = get();
      if (!socket) return reject('No socket connection');
      
      socket.emit('submit_race_result', { raceTime, raceScore }, (res: any) => {
        if (res.success) resolve();
        else {
          set({ error: res.error });
          reject(res.error);
        }
      });
    });
  },
  
  clearError: () => set({ error: null })
}));
