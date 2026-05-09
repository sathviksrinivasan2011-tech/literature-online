"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { io, type Socket } from "socket.io-client";
import type { CardId, LiteratureSetId, MoveToast, PublicRoomState } from "@/lib/game";
import type { ClientToServerEvents, ServerToClientEvents } from "@/lib/socket-events";

type GameSocket = Socket<ServerToClientEvents, ClientToServerEvents>;

const PLAYER_KEY = "literature.playerId";
const ROOM_KEY = "literature.roomCode";
const NAME_KEY = "literature.nickname";
const socketUrl = process.env.NEXT_PUBLIC_SOCKET_URL;

export function useGameSocket() {
  const socketRef = useRef<GameSocket | null>(null);
  const [state, setState] = useState<PublicRoomState | null>(null);
  const [connected, setConnected] = useState(false);
  const [toasts, setToasts] = useState<MoveToast[]>([]);
  const [error, setError] = useState<string | null>(null);

  const pushToast = useCallback((toast: MoveToast) => {
    setToasts((existing) => [...existing.slice(-3), toast]);
    window.setTimeout(() => {
      setToasts((existing) => existing.filter((item) => item.id !== toast.id));
    }, 2800);
  }, []);

  const handleAck = useCallback(<T,>(onOk?: (data: T) => void) => {
    return (response: { ok: true; data?: T } | { ok: false; error: string }) => {
      if (!response.ok) {
        setError(response.error);
        pushToast({ id: crypto.randomUUID(), tone: "miss", message: response.error });
        return;
      }
      setError(null);
      if (response.data !== undefined && onOk) onOk(response.data);
    };
  }, [pushToast]);

  useEffect(() => {
    const socket: GameSocket = io(socketUrl, {
      autoConnect: true,
      transports: ["websocket", "polling"],
      withCredentials: true
    });
    socketRef.current = socket;
    socket.on("connect", () => setConnected(true));
    socket.on("disconnect", () => setConnected(false));
    socket.on("room:state", setState);
    socket.on("toast", pushToast);

    const playerId = localStorage.getItem(PLAYER_KEY);
    const roomCode = localStorage.getItem(ROOM_KEY);
    const name = localStorage.getItem(NAME_KEY);
    if (playerId && roomCode && name) {
      socket.emit("room:join", { roomCode, playerId, name }, handleAck((data) => {
        persist(data.roomCode, data.playerId, name);
      }));
    }

    return () => {
      socket.disconnect();
      socketRef.current = null;
    };
  }, [handleAck, pushToast]);

  const createRoom = useCallback((name: string) => {
    socketRef.current?.emit("room:create", { name }, handleAck<{ roomCode: string; playerId: string }>((data) => {
      persist(data.roomCode, data.playerId, name);
    }));
  }, [handleAck]);

  const joinRoom = useCallback((roomCode: string, name: string) => {
    socketRef.current?.emit("room:join", { roomCode, name }, handleAck<{ roomCode: string; playerId: string }>((data) => {
      persist(data.roomCode, data.playerId, name);
    }));
  }, [handleAck]);

  const setReady = useCallback((ready: boolean) => {
    socketRef.current?.emit("player:ready", { ready }, handleAck());
  }, [handleAck]);

  const startGame = useCallback(() => {
    socketRef.current?.emit("game:start", handleAck());
  }, [handleAck]);

  const ask = useCallback((targetPlayerId: string, cardId: CardId) => {
    socketRef.current?.emit("game:ask", { targetPlayerId, cardId }, handleAck());
  }, [handleAck]);

  const declareSet = useCallback((setId: LiteratureSetId) => {
    socketRef.current?.emit("game:declare", { setId }, handleAck());
  }, [handleAck]);

  return useMemo(() => ({
    state,
    connected,
    toasts,
    error,
    createRoom,
    joinRoom,
    setReady,
    startGame,
    ask,
    declareSet
  }), [ask, connected, createRoom, declareSet, error, joinRoom, setReady, startGame, state, toasts]);
}

function persist(roomCode: string, playerId: string, name: string) {
  localStorage.setItem(ROOM_KEY, roomCode);
  localStorage.setItem(PLAYER_KEY, playerId);
  localStorage.setItem(NAME_KEY, name);
}
