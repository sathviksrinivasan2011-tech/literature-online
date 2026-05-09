import type { AskPayload, DeclarePayload, MoveToast, PublicRoomState } from "./game";

export type ClientToServerEvents = {
  "room:create": (payload: { name: string }, ack: Ack<{ roomCode: string; playerId: string }>) => void;
  "room:join": (payload: { roomCode: string; name: string; playerId?: string }, ack: Ack<{ roomCode: string; playerId: string }>) => void;
  "player:ready": (payload: { ready: boolean }, ack: Ack) => void;
  "game:start": (ack: Ack) => void;
  "game:ask": (payload: AskPayload, ack: Ack) => void;
  "game:declare": (payload: DeclarePayload, ack: Ack) => void;
  "room:leave": (ack: Ack) => void;
};

export type ServerToClientEvents = {
  "room:state": (state: PublicRoomState) => void;
  "toast": (toast: MoveToast) => void;
  "presence": (payload: { connected: boolean }) => void;
};

export type Ack<T = unknown> = (response: { ok: true; data?: T } | { ok: false; error: string }) => void;
