"use client";

import { memo, useMemo } from "react";
import { PlayerSeat } from "@/components/PlayerSeat";
import type { PublicRoomState } from "@/lib/game";

export const GameTable = memo(function GameTable({ state, currentPlayerId }: { state: PublicRoomState; currentPlayerId: string | null }) {
  const ordered = useMemo(() => {
    const index = state.players.findIndex((player) => player.id === currentPlayerId);
    if (index < 0) return state.players;
    return [...state.players.slice(index), ...state.players.slice(0, index)];
  }, [currentPlayerId, state.players]);

  const seats = ordered.map((player, index) => {
    const positions = [
      "left-1/2 bottom-4 -translate-x-1/2",
      "left-3 top-1/2 -translate-y-1/2",
      "left-1/2 top-4 -translate-x-1/2",
      "right-3 top-1/2 -translate-y-1/2",
      "left-8 top-20",
      "right-8 top-20",
      "left-8 bottom-24",
      "right-8 bottom-24"
    ];
    return (
      <PlayerSeat
        key={player.id}
        player={player}
        active={state.turnPlayerId === player.id}
        self={player.id === currentPlayerId}
        className={positions[index % positions.length]}
      />
    );
  });

  return (
    <div className="relative min-h-[440px] flex-1 overflow-hidden rounded-[2rem] border border-white/10 felt-surface shadow-card sm:min-h-[560px] lg:min-h-0">
      <div className="absolute inset-8 rounded-[50%] border border-brass/25 bg-black/10 shadow-inner" />
      <div className="absolute left-1/2 top-1/2 grid h-36 w-52 -translate-x-1/2 -translate-y-1/2 place-items-center rounded-[50%] border border-white/10 bg-black/20 text-center shadow-inner sm:h-44 sm:w-72">
        <div>
          <p className="text-xs uppercase tracking-[.28em] text-brass">Literature</p>
          <p className="mt-2 text-sm font-semibold text-stone-200">{state.completedSets.length} sets completed</p>
        </div>
      </div>
      {seats}
    </div>
  );
});
