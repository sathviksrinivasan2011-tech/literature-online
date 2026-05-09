import { createServer } from "node:http";
import { Server } from "socket.io";
import {
  applyAsk,
  createRoom,
  declareSet,
  makePlayer,
  publicRoomState,
  startGame,
  type Player,
  type RoomState
} from "../lib/game";
import type { ClientToServerEvents, ServerToClientEvents } from "../lib/socket-events";

const hostname = process.env.HOSTNAME || "0.0.0.0";
const port = Number(process.env.PORT || 4000);
const allowedOrigins = parseAllowedOrigins();

type SocketData = {
  roomCode?: string;
  playerId?: string;
};

const rooms = new Map<string, RoomState>();
const playerRoom = new Map<string, string>();

const httpServer = createServer((req, res) => {
  if (req.url === "/health") {
    res.writeHead(200, { "content-type": "application/json" });
    res.end(JSON.stringify({ ok: true, service: "literature-online-socket" }));
    return;
  }

  res.writeHead(200, { "content-type": "text/plain" });
  res.end("Literature Online Socket.IO server");
});

const io = new Server<ClientToServerEvents, ServerToClientEvents, never, SocketData>(httpServer, {
  transports: ["websocket", "polling"],
  cors: {
    origin: (origin, callback) => {
      if (!origin || allowedOrigins.includes("*") || allowedOrigins.includes(origin)) {
        callback(null, true);
        return;
      }
      callback(new Error("Origin is not allowed by CORS."));
    },
    methods: ["GET", "POST"],
    credentials: true
  },
  serveClient: false
});

io.on("connection", (socket) => {
  socket.emit("presence", { connected: true });

  socket.on("room:create", (payload, ack) => {
    safeAck(ack, () => {
      const player = makePlayer(crypto.randomUUID(), payload.name);
      player.host = true;
      player.ready = true;
      attachSocket(player, socket.id);
      const room = createRoom(makeRoomCode(), player);
      rooms.set(room.code, room);
      playerRoom.set(player.id, room.code);
      socket.data = { roomCode: room.code, playerId: player.id };
      socket.join(room.code);
      emitRoom(io, room);
      return { roomCode: room.code, playerId: player.id };
    });
  });

  socket.on("room:join", (payload, ack) => {
    safeAck(ack, () => {
      const room = rooms.get(payload.roomCode.trim().toUpperCase());
      if (!room) throw new Error("Room not found.");
      if (room.phase !== "lobby" && !payload.playerId) throw new Error("This game has already started.");

      let player = payload.playerId ? room.players.find((candidate) => candidate.id === payload.playerId) : undefined;
      if (!player) {
        if (room.players.length >= 8) throw new Error("Room is full.");
        player = makePlayer(crypto.randomUUID(), payload.name);
        room.players.push(player);
      }

      player.name = payload.name ? player.name : player.name;
      player.status = "connected";
      attachSocket(player, socket.id);
      playerRoom.set(player.id, room.code);
      socket.data = { roomCode: room.code, playerId: player.id };
      socket.join(room.code);
      emitRoom(io, room);
      return { roomCode: room.code, playerId: player.id };
    });
  });

  socket.on("player:ready", (payload, ack) => {
    safeAck(ack, () => {
      const { room, player } = requirePlayer(socket);
      if (room.phase !== "lobby") throw new Error("Readiness only applies in the lobby.");
      player.ready = payload.ready || player.host;
      emitRoom(io, room);
    });
  });

  socket.on("game:start", (ack) => {
    safeAck(ack, () => {
      const { room, player } = requirePlayer(socket);
      if (!player.host) throw new Error("Only the host can start.");
      startGame(room);
      emitRoom(io, room);
    });
  });

  socket.on("game:ask", (payload, ack) => {
    safeAck(ack, () => {
      const { room, player } = requirePlayer(socket);
      const result = applyAsk(room, player.id, payload);
      emitRoom(io, room);
      io.to(room.code).emit("toast", result.toast);
    });
  });

  socket.on("game:declare", (payload, ack) => {
    safeAck(ack, () => {
      const { room, player } = requirePlayer(socket);
      const result = declareSet(room, player.id, payload);
      emitRoom(io, room);
      io.to(room.code).emit("toast", result.toast);
    });
  });

  socket.on("room:leave", (ack) => {
    safeAck(ack, () => {
      const room = detachSocket(socket.id);
      if (room) emitRoom(io, room);
    });
  });

  socket.on("disconnect", () => {
    const room = detachSocket(socket.id);
    if (room) emitRoom(io, room);
  });
});

setInterval(cleanupRooms, 60_000).unref();

httpServer.listen(port, hostname, () => {
  console.log(`Literature Online Socket.IO server ready on ${hostname}:${port}`);
});

function safeAck<T>(ack: ((response: { ok: true; data?: T } | { ok: false; error: string }) => void) | undefined, fn: () => T | void) {
  try {
    const data = fn();
    if (data === undefined) {
      ack?.({ ok: true });
      return;
    }
    ack?.({ ok: true, data });
  } catch (error) {
    ack?.({ ok: false, error: error instanceof Error ? error.message : "Something went wrong." });
  }
}

function requirePlayer(socket: { data: SocketData }) {
  const roomCode = socket.data.roomCode;
  const playerId = socket.data.playerId;
  if (!roomCode || !playerId) throw new Error("Join a room first.");
  const room = rooms.get(roomCode);
  if (!room) throw new Error("Room not found.");
  const player = room.players.find((candidate) => candidate.id === playerId);
  if (!player) throw new Error("Player not found.");
  return { room, player };
}

function attachSocket(player: Player, socketId: string) {
  if (!player.socketIds.includes(socketId)) player.socketIds.push(socketId);
  player.status = "connected";
}

function detachSocket(socketId: string) {
  for (const room of rooms.values()) {
    const player = room.players.find((candidate) => candidate.socketIds.includes(socketId));
    if (!player) continue;
    player.socketIds = player.socketIds.filter((id) => id !== socketId);
    player.status = player.socketIds.length ? "connected" : "disconnected";
    room.updatedAt = Date.now();
    return room;
  }
  return null;
}

function emitRoom(io: Server<ClientToServerEvents, ServerToClientEvents, never, SocketData>, room: RoomState) {
  for (const player of room.players) {
    for (const socketId of player.socketIds) {
      io.to(socketId).emit("room:state", publicRoomState(room, player.id));
    }
  }
}

function makeRoomCode() {
  const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let code = "";
  do {
    code = Array.from({ length: 5 }, () => alphabet[Math.floor(Math.random() * alphabet.length)]).join("");
  } while (rooms.has(code));
  return code;
}

function cleanupRooms() {
  const now = Date.now();
  for (const [code, room] of rooms) {
    const noPresence = room.players.every((player) => player.status === "disconnected");
    const expired = now - room.updatedAt > 1000 * 60 * 45;
    if (noPresence && expired) {
      rooms.delete(code);
      for (const player of room.players) playerRoom.delete(player.id);
    }
  }
}

function parseAllowedOrigins() {
  const configured = process.env.BACKEND_ALLOWED_ORIGINS || process.env.CLIENT_ORIGIN;
  if (!configured) return process.env.NODE_ENV === "production" ? [] : ["*"];
  return configured.split(",").map((origin) => origin.trim()).filter(Boolean);
}
