import { ChallengeRoom, MultiplayerPlayer, MultiplayerRoomStatus } from './types';

// In-memory store
const rooms: Map<string, ChallengeRoom> = new Map();

// Generate a random 4-letter room code (e.g. VICE-4821)
function generateRoomCode(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  const digits = '0123456789';
  let code = 'VICE-';
  for (let i = 0; i < 4; i++) {
    code += digits.charAt(Math.floor(Math.random() * digits.length));
  }
  return code;
}

export function createRoom(
  leaderId: string,
  leaderName: string,
  config: {
    name: string;
    title: string;
    description: string;
    editingDurationSeconds: number;
    maxPlayers: number;
    racingEnabled: boolean;
  }
): ChallengeRoom {
  const roomId = Date.now().toString(36) + Math.random().toString(36).substring(2);
  const code = generateRoomCode();

  const leader: MultiplayerPlayer = {
    id: leaderId,
    displayName: leaderName,
    isLeader: true,
    isReady: true,
    hasSubmitted: false,
    joinedAt: Date.now(),
    submittedAt: null,
    liveryDataUrl: null,
    designScore: null,
    raceTime: null,
    raceScore: null,
    topSpeed: null,
    totalScore: null,
    wins: 0,
    status: 'joined',
  };

  const room: ChallengeRoom = {
    id: roomId,
    code,
    leaderId,
    ...config,
    status: 'lobby',
    createdAt: Date.now(),
    startedAt: null,
    endsAt: null,
    players: [leader],
  };

  rooms.set(roomId, room);
  return room;
}

export function getRoomByCode(code: string): ChallengeRoom | undefined {
  return Array.from(rooms.values()).find((r) => r.code === code);
}

export function getRoomById(id: string): ChallengeRoom | undefined {
  return rooms.get(id);
}

export function joinRoom(roomId: string, playerId: string, displayName: string): ChallengeRoom | null {
  const room = rooms.get(roomId);
  if (!room) return null;

  if (room.players.length >= room.maxPlayers) throw new Error('Room is full');
  if (room.status !== 'lobby') throw new Error('Challenge has already started');
  if (room.players.find(p => p.id === playerId)) return room; // Already joined

  const player: MultiplayerPlayer = {
    id: playerId,
    displayName,
    isLeader: false,
    isReady: false,
    hasSubmitted: false,
    joinedAt: Date.now(),
    submittedAt: null,
    liveryDataUrl: null,
    designScore: null,
    raceTime: null,
    raceScore: null,
    topSpeed: null,
    totalScore: null,
    wins: 0,
    status: 'joined',
  };

  room.players.push(player);
  return room;
}

export function setPlayerReady(roomId: string, playerId: string, isReady: boolean) {
  const room = rooms.get(roomId);
  if (!room) return;
  const player = room.players.find(p => p.id === playerId);
  if (player) {
    player.isReady = isReady;
    player.status = isReady ? 'ready' : 'joined';
  }
  return room;
}

export function startChallenge(roomId: string, leaderId: string) {
  const room = rooms.get(roomId);
  if (!room) throw new Error('Room not found');
  if (room.leaderId !== leaderId) throw new Error('Only the leader can start');
  if (room.status !== 'lobby') throw new Error('Room is not in lobby');

  room.status = 'editing';
  room.startedAt = Date.now();
  room.endsAt = room.startedAt + room.editingDurationSeconds * 1000;
  
  room.players.forEach(p => {
    p.status = 'editing';
  });

  return room;
}

export function submitLivery(
  roomId: string,
  playerId: string,
  dataUrl: string,
  designScore: number
) {
  const room = rooms.get(roomId);
  if (!room) throw new Error('Room not found');
  
  if (room.endsAt && Date.now() > room.endsAt + 2000) { // 2s grace period
    throw new Error('Submission deadline passed');
  }

  const player = room.players.find(p => p.id === playerId);
  if (!player) throw new Error('Player not in room');
  if (player.hasSubmitted) throw new Error('Already submitted');

  player.hasSubmitted = true;
  player.submittedAt = Date.now();
  player.liveryDataUrl = dataUrl;
  player.designScore = designScore;
  player.status = 'submitted';
  
  if (!room.racingEnabled) {
    player.totalScore = designScore;
  }
  
  checkIfPhaseShouldChange(room);
  
  return room;
}

export function submitRaceResult(
  roomId: string,
  playerId: string,
  raceTime: number,
  raceScore: number,
  topSpeed: number
) {
  const room = rooms.get(roomId);
  if (!room) throw new Error('Room not found');
  if (!room.racingEnabled) throw new Error('Racing is not enabled for this room');

  const player = room.players.find(p => p.id === playerId);
  if (!player) throw new Error('Player not in room');
  if (!player.hasSubmitted) throw new Error('Must submit livery before racing');
  if (player.raceTime !== null) throw new Error('Already submitted race result');

  player.raceTime = raceTime;
  player.raceScore = raceScore;
  player.topSpeed = topSpeed;
  
  // Calculate total score (70% design, 30% race)
  if (player.designScore !== null) {
    player.totalScore = (player.designScore * 0.7) + (raceScore * 0.3);
  }
  
  player.status = 'finished';
  return room;
}

export function removePlayer(roomId: string, playerId: string) {
  const room = rooms.get(roomId);
  if (!room) return null;

  const playerIndex = room.players.findIndex(p => p.id === playerId);
  if (playerIndex > -1) {
    room.players[playerIndex].status = 'disconnected';
    
    if (room.status === 'lobby') {
      room.players.splice(playerIndex, 1);
    }
  }

  if (room.players.length === 0 || room.players.filter(p => p.status !== 'disconnected').length === 0) {
    rooms.delete(roomId);
    return null; // Room deleted
  }

  // If leader leaves during lobby, transfer leadership
  if (room.leaderId === playerId && room.status === 'lobby') {
    const nextLeader = room.players.find(p => p.status !== 'disconnected');
    if (nextLeader) {
      room.leaderId = nextLeader.id;
      nextLeader.isLeader = true;
    }
  }

  return room;
}

// Strip dataUrls to prevent blasting huge payloads constantly
export function sanitizeRoom(room: ChallengeRoom): ChallengeRoom {
  return {
    ...room,
    players: room.players.map(p => ({
      ...p,
      liveryDataUrl: p.liveryDataUrl ? 'uploaded' : null
    }))
  };
}

export function getFullPlayerLivery(roomId: string, playerId: string): string | null {
  const room = rooms.get(roomId);
  if (!room) return null;
  const player = room.players.find(p => p.id === playerId);
  return player?.liveryDataUrl || null;
}

function checkIfPhaseShouldChange(room: ChallengeRoom) {
  // If everyone submitted
  const allSubmitted = room.players.filter(p => p.status !== 'disconnected').every(p => p.hasSubmitted);
  if (allSubmitted && room.status === 'editing') {
    room.status = room.racingEnabled ? 'racing' : 'results';
  }
}

export function restartRoom(roomId: string, leaderId: string) {
  const room = rooms.get(roomId);
  if (!room) throw new Error('Room not found');
  if (room.leaderId !== leaderId) throw new Error('Only the leader can restart the room');

  // Award crown to the winner of the current phase
  const eligible = room.players.filter(p => p.hasSubmitted && p.status !== 'disconnected');
  if (eligible.length > 0) {
    eligible.sort((a, b) => {
      if (room.racingEnabled) {
        const aTime = a.raceTime || Infinity;
        const bTime = b.raceTime || Infinity;
        return aTime - bTime;
      } else {
        const aTime = a.submittedAt || Infinity;
        const bTime = b.submittedAt || Infinity;
        return aTime - bTime;
      }
    });
    // The winner is the first element
    const winner = eligible[0];
    winner.wins += 1;
  }

  room.status = 'lobby';
  room.startedAt = null;
  room.endsAt = null;

  room.players.forEach(p => {
    if (p.status !== 'disconnected') {
      p.status = p.isLeader ? 'ready' : 'joined';
    }
    p.hasSubmitted = false;
    p.submittedAt = null;
    p.liveryDataUrl = null;
    p.designScore = null;
    p.raceTime = null;
    p.raceScore = null;
    p.topSpeed = null;
    p.totalScore = null;
    p.isReady = p.isLeader; // Leader auto ready
  });

  return room;
}

export function updateRoomConfig(roomId: string, leaderId: string, updates: { editingDurationSeconds?: number }) {
  const room = rooms.get(roomId);
  if (!room) throw new Error('Room not found');
  if (room.leaderId !== leaderId) throw new Error('Only the leader can change config');
  if (room.status !== 'lobby') throw new Error('Cannot change config after start');

  if (updates.editingDurationSeconds !== undefined) {
    room.editingDurationSeconds = updates.editingDurationSeconds;
  }
  return room;
}

