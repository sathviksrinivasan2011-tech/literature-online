"use client";

import { AnimatePresence, motion } from "framer-motion";
import { memo } from "react";
import type { PublicRoomState } from "@/lib/game";

export const TurnBar = memo(function TurnBar({
  state,
  currentPlayerId
}: {
  state: PublicRoomState;
  currentPlayerId: string | null;
}) {
  const player = state.players.find((candidate) => candidate.id === state.turnPlayerId);
  const isMine = player?.id === currentPlayerId;
  const label = state.phase === "finished" ? "Game complete" : player ? `${player.name}'s turn` : "Waiting";

  return (
    <div className="fixed inset-x-0 top-0 z-50 px-3 pt-[calc(10px+var(--safe-top))]">
      <AnimatePresence mode="wait">
        <motion.div
          key={label}
          className={[
            "mx-auto flex h-14 max-w-3xl items-center justify-center rounded-full border px-4 text-center text-xl font-black shadow-card backdrop-blur transition-colors duration-300 sm:text-2xl",
            isMine
              ? "turn-pulse border-felt-400/70 bg-felt-400 text-ink"
              : state.phase === "playing"
                ? "border-white/15 bg-stone-100/92 text-ink"
                : "border-white/10 bg-stone-700/70 text-stone-100"
          ].join(" ")}
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -8 }}
          transition={{ duration: .18 }}
        >
          {label}
        </motion.div>
      </AnimatePresence>
    </div>
  );
});
