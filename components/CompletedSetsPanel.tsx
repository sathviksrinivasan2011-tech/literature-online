"use client";

import { memo } from "react";
import { Card } from "@/components/Card";
import { getSetLabel, literatureSets, type PublicRoomState } from "@/lib/game";

export const CompletedSetsPanel = memo(function CompletedSetsPanel({ state, compact }: { state: PublicRoomState; compact?: boolean }) {
  return (
    <div className={["h-full rounded-3xl border border-white/10 bg-black/22 p-4 shadow-card backdrop-blur", compact ? "" : "sticky top-24"].join(" ")}>
      <h2 className="text-lg font-black">Completed sets</h2>
      <p className="mt-1 text-sm text-stone-300">Score is tracked by declared literature sets.</p>

      <div className="mt-4 grid grid-cols-2 gap-2">
        {state.players.map((player) => (
          <div key={player.id} className="rounded-2xl border border-white/10 bg-white/7 p-3">
            <p className="truncate text-sm font-bold">{player.name}</p>
            <p className="text-2xl font-black text-brass">{player.score}</p>
          </div>
        ))}
      </div>

      <div className="thin-scroll mt-4 max-h-[52dvh] space-y-3 overflow-y-auto pr-1">
        {literatureSets.map((set) => {
          const completed = state.completedSets.find((item) => item.setId === set.id);
          const owner = completed ? state.players.find((player) => player.id === completed.claimedBy) : null;
          return (
            <div key={set.id} className="rounded-2xl border border-white/10 bg-white/7 p-3">
              <div className="flex items-center justify-between gap-2">
                <p className="text-sm font-bold">{getSetLabel(set.id)}</p>
                <p className="text-xs text-stone-300">{owner ? owner.name : "Open"}</p>
              </div>
              <div className="mt-3 flex -space-x-8 overflow-hidden">
                {set.cards.map((card) => <Card key={card} card={card} small muted={!completed} />)}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
});
