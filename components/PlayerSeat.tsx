"use client";

import { memo } from "react";
import type { PublicPlayer } from "@/lib/game";

export const PlayerSeat = memo(function PlayerSeat({
  player,
  active,
  self,
  className = ""
}: {
  player: PublicPlayer;
  active: boolean;
  self: boolean;
  className?: string;
}) {
  return (
    <div
      className={[
        "absolute flex min-w-28 items-center gap-2 rounded-2xl border px-3 py-2 shadow-card backdrop-blur transition-all duration-200",
        active ? "border-felt-400 bg-felt-400/18 shadow-glow" : "border-white/10 bg-black/30",
        self ? "ring-2 ring-brass/60" : "",
        className
      ].join(" ")}
    >
      <div className="grid h-9 w-9 shrink-0 place-items-center rounded-full text-sm font-black text-ink" style={{ background: player.avatar }}>
        {player.name.slice(0, 1).toUpperCase()}
      </div>
      <div className="min-w-0">
        <p className="truncate text-sm font-bold">{player.name}</p>
        <p className="text-xs text-stone-300">{player.cardCount} cards · {player.status}</p>
      </div>
    </div>
  );
});
