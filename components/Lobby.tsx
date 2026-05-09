"use client";

import { Copy, Crown, LogIn, Play, Plus, UserCheck } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import type { PublicRoomState } from "@/lib/game";

type GameActions = {
  state: PublicRoomState | null;
  connected: boolean;
  error: string | null;
  createRoom: (name: string) => void;
  joinRoom: (roomCode: string, name: string) => void;
  setReady: (ready: boolean) => void;
  startGame: () => void;
};

export function Lobby({ game }: { game: GameActions }) {
  const [name, setName] = useState("");
  const [roomCode, setRoomCode] = useState("");
  const state = game.state;
  const me = state?.players.find((player) => player.id === state.you?.id);
  const canStart = Boolean(me?.host && state && state.players.length >= 2 && state.players.every((player) => player.ready));

  const title = useMemo(() => state ? `Room ${state.code}` : "Literature Online", [state]);

  useEffect(() => {
    const match = document.cookie.match(/(?:^|; )literature_profile=([^;]+)/);
    if (!match || name) return;
    try {
      const profile = JSON.parse(decodeURIComponent(match[1])) as { name?: string };
      if (profile.name) setName(profile.name);
    } catch {
      // Ignore malformed optional profile cookies.
    }
  }, [name]);

  return (
    <div className="min-h-dvh bg-[radial-gradient(circle_at_top,#0d6b45,#031f18_68%)] px-4 py-[calc(18px+var(--safe-top))]">
      <div className="mx-auto grid min-h-[calc(100dvh-36px)] max-w-6xl content-center gap-5 lg:grid-cols-[1fr_440px]">
        <section className="flex flex-col justify-center">
          <div className="mb-5 inline-flex w-fit rounded-full border border-brass/40 bg-brass/12 px-3 py-1 text-xs font-bold uppercase tracking-[.2em] text-brass">
            Multiplayer card table
          </div>
          <h1 className="max-w-2xl text-5xl font-black leading-[.95] sm:text-7xl">{title}</h1>
          <p className="mt-5 max-w-xl text-base leading-7 text-stone-200 sm:text-lg">
            A fast, mobile-first Literature table for friends and cousins on voice chat. Create a private room, share the code, ready up, and start asking.
          </p>
        </section>

        <section className="rounded-3xl border border-white/10 bg-ink/78 p-4 shadow-card backdrop-blur sm:p-5">
          {!state ? (
            <div className="space-y-4">
              <label className="block">
                <span className="text-xs font-bold uppercase tracking-[.18em] text-brass">Nickname</span>
                <input
                  value={name}
                  onChange={(event) => setName(event.target.value)}
                  placeholder="Rahul"
                  className="mt-2 h-12 w-full rounded-2xl border border-white/10 bg-white/8 px-4 font-bold outline-none focus:border-felt-400"
                />
              </label>
              <div className="grid gap-3 sm:grid-cols-2">
                <button
                  disabled={!name.trim()}
                  onClick={() => game.createRoom(name)}
                  className="flex h-12 items-center justify-center gap-2 rounded-2xl bg-felt-400 font-black text-ink shadow-glow disabled:bg-stone-700 disabled:text-stone-400 disabled:shadow-none"
                >
                  <Plus size={18} />
                  Create
                </button>
                <div className="flex gap-2">
                  <input
                    value={roomCode}
                    onChange={(event) => setRoomCode(event.target.value.toUpperCase())}
                    placeholder="CODE"
                    className="h-12 min-w-0 flex-1 rounded-2xl border border-white/10 bg-white/8 px-3 font-black uppercase outline-none focus:border-felt-400"
                  />
                  <button
                    disabled={!name.trim() || roomCode.trim().length < 4}
                    onClick={() => game.joinRoom(roomCode, name)}
                    className="grid h-12 w-12 place-items-center rounded-2xl bg-brass text-ink disabled:bg-stone-700 disabled:text-stone-400"
                    title="Join room"
                  >
                    <LogIn size={19} />
                  </button>
                </div>
              </div>
              <a href="/api/auth/google" className="block h-11 w-full rounded-2xl border border-white/10 bg-white/7 pt-3 text-center text-sm font-bold text-stone-300">
                Continue with Google
              </a>
            </div>
          ) : (
            <div>
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-xs font-bold uppercase tracking-[.18em] text-brass">Private room</p>
                  <h2 className="text-4xl font-black">{state.code}</h2>
                </div>
                <button
                  onClick={() => navigator.clipboard?.writeText(`${location.origin}?room=${state.code}`)}
                  className="grid h-12 w-12 place-items-center rounded-2xl border border-white/10 bg-white/8"
                  title="Copy invite"
                >
                  <Copy size={18} />
                </button>
              </div>

              <div className="mt-5 space-y-2">
                {state.players.map((player) => (
                  <div key={player.id} className="flex items-center gap-3 rounded-2xl border border-white/10 bg-white/7 p-3">
                    <div className="grid h-10 w-10 place-items-center rounded-full font-black text-ink" style={{ background: player.avatar }}>
                      {player.name[0]?.toUpperCase()}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-bold">{player.name}</p>
                      <p className="text-xs text-stone-300">{player.ready ? "Ready" : "Not ready"} · {player.status}</p>
                    </div>
                    {player.host ? <Crown size={18} className="text-brass" /> : null}
                  </div>
                ))}
              </div>

              <div className="mt-5 grid gap-3 sm:grid-cols-2">
                {!me?.host && (
                  <button
                    onClick={() => game.setReady(!me?.ready)}
                    className="flex h-12 items-center justify-center gap-2 rounded-2xl bg-felt-400 font-black text-ink"
                  >
                    <UserCheck size={18} />
                    {me?.ready ? "Unready" : "Ready"}
                  </button>
                )}
                {me?.host && (
                  <button
                    disabled={!canStart}
                    onClick={game.startGame}
                    className="flex h-12 items-center justify-center gap-2 rounded-2xl bg-felt-400 font-black text-ink shadow-glow disabled:bg-stone-700 disabled:text-stone-400 disabled:shadow-none"
                  >
                    <Play size={18} />
                    Start game
                  </button>
                )}
              </div>
            </div>
          )}
          {game.error && <p className="mt-4 rounded-2xl border border-rose-300/30 bg-rose-950/60 p-3 text-sm text-rose-100">{game.error}</p>}
        </section>
      </div>
    </div>
  );
}
