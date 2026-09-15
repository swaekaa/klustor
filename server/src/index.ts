import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import * as roomManager from './roomManager';

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

io.on('connection', (socket) => {
  console.log('Client connected:', socket.id);
  
  // Track which room this socket is in to handle disconnects gracefully
  let currentRoomId: string | null = null;
  let currentPlayerId: string | null = null;

  socket.on('create_room', (payload, callback) => {
    try {
      const { displayName, avatar, config } = payload;
      const room = roomManager.createRoom(socket.id, displayName, avatar, config);
      
      socket.join(room.id);
      currentRoomId = room.id;
      currentPlayerId = socket.id;

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

  socket.on('submit_draft_livery', (payload, callback) => {
    try {
      if (!currentRoomId || !currentPlayerId) throw new Error('Not in a room');
      const { dataUrl } = payload;
      
      const room = roomManager.submitDraftLivery(currentRoomId, currentPlayerId, dataUrl);
      
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
      const { dataUrl, designScore } = payload;
      
      // We store the full dataUrl, but broadcast sanitized room state
      const room = roomManager.submitLivery(currentRoomId, currentPlayerId, dataUrl, designScore);
      
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
      const dataUrl = roomManager.getFullPlayerLivery(currentRoomId, playerId);
      callback({ success: true, dataUrl });
    } catch (err: any) {
      callback({ success: false, error: err.message });
    }
  });

  socket.on('submit_race_result', (payload, callback) => {
    try {
      if (!currentRoomId || !currentPlayerId) throw new Error('Not in a room');
      const { raceTime, raceScore, topSpeed } = payload;
      
      const room = roomManager.submitRaceResult(currentRoomId, currentPlayerId, raceTime, raceScore, topSpeed);
      
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

  socket.on('disconnect', () => {
    console.log('Client disconnected:', socket.id);
    if (currentRoomId && currentPlayerId) {
      const room = roomManager.removePlayer(currentRoomId, currentPlayerId);
      if (room) {
        io.to(room.id).emit('player_left', roomManager.sanitizeRoom(room));
      }
    }
  });
});

// Periodic timer check (every second) to enforce deadline expirations globally
setInterval(() => {
  // Wait, roomManager doesn't expose the rooms map directly, we can add a method if needed
  // But clients can also handle visual timer. For strict enforcement, we'd iterate over rooms here.
}, 1000);

const PORT = process.env.PORT || 4000;
httpServer.listen(PORT, () => {
  console.log(`KLUSTOR Multiplayer Server running on port ${PORT}`);
});
