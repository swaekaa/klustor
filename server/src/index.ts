import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import * as roomManager from './roomManager';
import * as leaderboardService from './leaderboardService';
import * as raceLeaderService from './raceLeaderService';

const app = express();
app.use(cors());

const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST']
  },
  maxHttpBufferSize: 1e7 // 10 MB for large Base64 Unlayer images
});

// Track which room each socket is in
const socketRoomMap = new Map<string, string>();   // socketId → roomId
const socketDisplayNameMap = new Map<string, string>(); // socketId → displayName
// Prevent duplicate global result submissions per socket session
const globalResultSubmitted = new Set<string>(); // socketId

// ── Broadcast leader update to a room (10Hz tick) ─────────────────────────
function broadcastLeaderUpdate(roomId: string) {
  const snapshot = raceLeaderService.getLeaderSnapshot(roomId);
  if (!snapshot) return;
  
  io.to(roomId).emit('leader_update', {
    leaderId: snapshot.playerId,
    displayName: snapshot.displayName,
    position: snapshot.position,
    rotation: snapshot.rotation,
    progress: snapshot.progress,
    speed: snapshot.speed,
    livery: snapshot.livery,
    timestamp: Date.now(),
  });
}

// ── Race position HUD update (can be less frequent) ───────────────────────
function broadcastRacePositions(roomId: string) {
  const rankings = raceLeaderService.getAllPlayerProgress(roomId);
  io.to(roomId).emit('race_positions_updated', rankings.map(p => ({
    playerId: p.playerId,
    displayName: p.displayName,
    rank: p.rank,
    checkpointIndex: p.checkpointIndex,
    isFinished: p.isFinished,
  })));
}

io.on('connection', (socket) => {
  console.log('Client connected:', socket.id);
  
  let currentRoomId: string | null = null;
  let currentPlayerId: string | null = null;

  // ── ROOM MANAGEMENT ───────────────────────────────────────────────────────

  socket.on('create_room', (payload, callback) => {
    try {
      const { displayName, avatar, config } = payload;
      const room = roomManager.createRoom(socket.id, displayName, avatar, config);
      
      socket.join(room.id);
      currentRoomId = room.id;
      currentPlayerId = socket.id;
      socketRoomMap.set(socket.id, room.id);
      socketDisplayNameMap.set(socket.id, displayName);

      callback({ success: true, room: roomManager.sanitizeRoom(room) });
    } catch (err: any) {
      callback({ success: false, error: err.message });
    }
  });

  socket.on('join_room', (payload, callback) => {
    try {
      const { roomCode, displayName, avatar } = payload;
      const roomRaw = roomManager.getRoomByCode(roomCode);
      if (!roomRaw) throw new Error('Room not found');

      const room = roomManager.joinRoom(roomRaw.id, socket.id, displayName, avatar);
      if (!room) throw new Error('Could not join room');

      socket.join(room.id);
      currentRoomId = room.id;
      currentPlayerId = socket.id;
      socketRoomMap.set(socket.id, room.id);
      socketDisplayNameMap.set(socket.id, displayName);

      const safeRoom = roomManager.sanitizeRoom(room);
      io.to(room.id).emit('room_state_updated', safeRoom);
      callback({ success: true, room: safeRoom });
    } catch (err: any) {
      callback({ success: false, error: err.message });
    }
  });

  socket.on('set_player_ready', (payload, callback) => {
    try {
      if (!currentRoomId || !currentPlayerId) throw new Error('Not in a room');
      const room = roomManager.setPlayerReady(currentRoomId, currentPlayerId, payload.isReady);
      if (room) {
        io.to(room.id).emit('room_state_updated', roomManager.sanitizeRoom(room));
      }
      callback({ success: true });
    } catch (err: any) {
      callback({ success: false, error: err.message });
    }
  });

  socket.on('start_challenge', (_, callback) => {
    try {
      if (!currentRoomId || !currentPlayerId) throw new Error('Not in a room');
      const room = roomManager.startChallenge(currentRoomId, currentPlayerId);
      
      io.to(room.id).emit('challenge_started', roomManager.sanitizeRoom(room));
      callback({ success: true });
    } catch (err: any) {
      callback({ success: false, error: err.message });
    }
  });

  socket.on('update_live_score', (payload, callback) => {
    try {
      if (!currentRoomId || !currentPlayerId) throw new Error('Not in a room');
      const { score } = payload;
      
      const room = roomManager.updateLiveScore(currentRoomId, currentPlayerId, score);
      
      const safeRoom = roomManager.sanitizeRoom(room);
      io.to(room.id).emit('room_state_updated', safeRoom);
      callback({ success: true });
    } catch (err: any) {
      callback({ success: false, error: err.message });
    }
  });

  socket.on('submit_livery', (payload, callback) => {
    try {
      if (!currentRoomId || !currentPlayerId) throw new Error('Not in a room');
      const { data, designScore } = payload;
      
      const room = roomManager.submitLivery(currentRoomId, currentPlayerId, data, designScore);
      
      io.to(room.id).emit('player_submitted', roomManager.sanitizeRoom(room));
      callback({ success: true });
    } catch (err: any) {
      callback({ success: false, error: err.message });
    }
  });
  
  socket.on('get_player_livery', (payload, callback) => {
    try {
      if (!currentRoomId) throw new Error('Not in a room');
      const { playerId } = payload;
      const data = roomManager.getFullPlayerLivery(currentRoomId, playerId);
      callback({ success: true, data });
    } catch (err: any) {
      callback({ success: false, error: err.message });
    }
  });

  socket.on('submit_race_result', (payload, callback) => {
    try {
      if (!currentRoomId || !currentPlayerId) throw new Error('Not in a room');
      const { raceTime, raceScore, topSpeed } = payload;
      
      const room = roomManager.submitRaceResult(currentRoomId, currentPlayerId, raceTime, raceScore, topSpeed);
      
      // Mark player as finished in race leader service
      raceLeaderService.markPlayerFinished(currentRoomId, currentPlayerId, raceTime);
      
      io.to(room.id).emit('leaderboard_updated', roomManager.sanitizeRoom(room));
      callback({ success: true });
    } catch (err: any) {
      callback({ success: false, error: err.message });
    }
  });

  socket.on('restart_room', (_, callback) => {
    try {
      if (!currentRoomId || !currentPlayerId) throw new Error('Not in a room');
      
      const room = roomManager.restartRoom(currentRoomId, currentPlayerId);
      // Clear race leader state for this room
      raceLeaderService.removeRoom(currentRoomId);
      
      io.to(room.id).emit('room_state_updated', roomManager.sanitizeRoom(room));
      callback({ success: true });
    } catch (err: any) {
      callback({ success: false, error: err.message });
    }
  });

  socket.on('update_room_config', (updates, callback) => {
    try {
      if (!currentRoomId || !currentPlayerId) throw new Error('Not in a room');
      
      const room = roomManager.updateRoomConfig(currentRoomId, currentPlayerId, updates);
      
      io.to(room.id).emit('room_state_updated', roomManager.sanitizeRoom(room));
      callback({ success: true });
    } catch (err: any) {
      callback({ success: false, error: err.message });
    }
  });

  // ── RACE PROGRESS + GHOST CAR ─────────────────────────────────────────────

  socket.on('update_race_progress', (payload) => {
    // Fire-and-forget (no callback needed for high-frequency updates)
    if (!currentRoomId || !currentPlayerId) return;
    
    const { checkpointIndex, progress, position, rotation, speed, finishTimeMs } = payload;
    const displayName = socketDisplayNameMap.get(socket.id) || 'UNKNOWN';
    
    // Server-side validation
    const validation = raceLeaderService.validateProgressUpdate({ checkpointIndex, progress, speed });
    if (!validation.valid) {
      console.warn(`[RaceLeader] Invalid update from ${socket.id}: ${validation.reason}`);
      return;
    }
    
    const { leaderChanged, newLeaderId, previousLeaderId } = raceLeaderService.updatePlayerProgress(
      currentRoomId,
      currentPlayerId,
      displayName,
      { checkpointIndex, progress, position, rotation, speed, finishTimeMs: finishTimeMs ?? null }
    );
    
    if (leaderChanged && newLeaderId) {
      // Fetch new leader's livery and update
      const newLeaderLivery = roomManager.getFullPlayerLivery(currentRoomId, newLeaderId);
      raceLeaderService.setLeaderLivery(currentRoomId, newLeaderLivery);
      
      // Broadcast leader change event
      io.to(currentRoomId).emit('leader_changed', {
        previousLeaderId,
        newLeaderId,
        newLeaderDisplayName: socketDisplayNameMap.get(newLeaderId) || 'UNKNOWN',
      });
    }
  });

  socket.on('get_race_positions', (_, callback) => {
    try {
      if (!currentRoomId) throw new Error('Not in a room');
      const rankings = raceLeaderService.getAllPlayerProgress(currentRoomId);
      callback({ success: true, rankings: rankings.map(p => ({
        playerId: p.playerId,
        displayName: p.displayName,
        rank: p.rank,
        checkpointIndex: p.checkpointIndex,
        isFinished: p.isFinished,
      }))});
    } catch (err: any) {
      callback({ success: false, error: err.message });
    }
  });

  // ── GLOBAL LEADERBOARD ────────────────────────────────────────────────────

  socket.on('get_global_leaderboard', (_, callback) => {
    try {
      const response = leaderboardService.getLeaderboardResponse(socket.id);
      callback({ success: true, ...response });
    } catch (err: any) {
      callback({ success: false, error: err.message });
    }
  });

  socket.on('submit_global_result', (payload, callback) => {
    try {
      if (!currentRoomId || !currentPlayerId) throw new Error('Must be in a room to submit result');
      if (globalResultSubmitted.has(socket.id)) throw new Error('Already submitted result for this session');
      
      const { displayName, avatar, raceTime, topSpeed, designScore, liveryThumb } = payload;
      
      // Server-side validation
      const validation = leaderboardService.validateRaceResult(raceTime, topSpeed);
      if (!validation.valid) {
        throw new Error(`Result rejected: ${validation.reason}`);
      }
      
      globalResultSubmitted.add(socket.id);
      
      const { isNewBest, rank } = leaderboardService.upsertEntry({
        playerId: socket.id,
        displayName: displayName || socketDisplayNameMap.get(socket.id) || 'UNKNOWN',
        avatar: avatar || '🚗',
        bestTime: raceTime,
        topSpeed,
        designScore: designScore ?? 0,
        racesCompleted: 1,
        liveryThumb: liveryThumb ?? '',
        lastUpdated: Date.now(),
      });
      
      const leaderboardData = leaderboardService.getLeaderboardResponse(socket.id);
      
      // Broadcast updated leaderboard to everyone (not just the room)
      if (isNewBest) {
        io.emit('global_leaderboard_updated', leaderboardData);
      }
      
      callback({ success: true, isNewBest, rank, leaderboard: leaderboardData });
    } catch (err: any) {
      callback({ success: false, error: err.message });
    }
  });

  // ── DISCONNECT ────────────────────────────────────────────────────────────

  socket.on('disconnect', () => {
    console.log('Client disconnected:', socket.id);
    if (currentRoomId && currentPlayerId) {
      // Remove from race leader tracking
      const { leaderChanged, newLeaderId, previousLeaderId } = raceLeaderService.removePlayer(currentRoomId, currentPlayerId);
      
      if (leaderChanged && currentRoomId) {
        if (newLeaderId) {
          const newLeaderLivery = roomManager.getFullPlayerLivery(currentRoomId, newLeaderId);
          raceLeaderService.setLeaderLivery(currentRoomId, newLeaderLivery);
        }
        io.to(currentRoomId).emit('leader_changed', {
          previousLeaderId,
          newLeaderId,
          newLeaderDisplayName: newLeaderId ? (socketDisplayNameMap.get(newLeaderId) || 'UNKNOWN') : null,
        });
      }
      
      // Remove from room
      const room = roomManager.removePlayer(currentRoomId, currentPlayerId);
      if (room) {
        io.to(room.id).emit('player_left', roomManager.sanitizeRoom(room));
      }
    }
    
    socketRoomMap.delete(socket.id);
    socketDisplayNameMap.delete(socket.id);
  });
});

// ── Ghost car broadcast tick (10Hz) ──────────────────────────────────────────
setInterval(() => {
  // socketRoomMap is socketId → roomId, so iterate values for unique rooms
  const seenRooms = new Set<string>();
  for (const roomId of socketRoomMap.values()) {
    if (seenRooms.has(roomId)) continue;
    seenRooms.add(roomId);
    const snapshot = raceLeaderService.getLeaderSnapshot(roomId);
    if (snapshot) {
      broadcastLeaderUpdate(roomId);
    }
  }
}, 100); // 10Hz

// ── Race positions broadcast tick (2Hz for HUD) ──────────────────────────────
setInterval(() => {
  const seenRooms = new Set<string>();
  for (const [, roomId] of socketRoomMap.entries()) {
    if (!seenRooms.has(roomId)) {
      seenRooms.add(roomId);
      broadcastRacePositions(roomId);
    }
  }
}, 500); // 2Hz

const PORT = process.env.PORT || 4000;
httpServer.listen(PORT, () => {
  console.log(`KLUSTOR Multiplayer Server running on port ${PORT}`);
});
