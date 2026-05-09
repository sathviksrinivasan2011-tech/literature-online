"use client";

import { AnimatePresence, motion } from "framer-motion";
import { Wifi, WifiOff } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { AskModal } from "@/components/AskModal";
import { CompletedSetsPanel } from "@/components/CompletedSetsPanel";
import { GameTable } from "@/components/GameTable";
import { Hand } from "@/components/Hand";
import { Lobby } from "@/components/Lobby";
import { ToastSystem } from "@/components/ToastSystem";
import { TurnBar } from "@/components/TurnBar";
import { useGameSocket } from "@/hooks/useGameSocket";
import { literatureSets, type LiteratureSetId } from "@/lib/game";

export default function Home() {
  const game = useGameSocket();
  const [askOpen, setAskOpen] = useState(false);
  const [panelOpen, setPanelOpen] = useState(false);

  const state = game.state;
  const isMyTurn = Boolean(state?.turnPlayerId && state?.turnPlayerId === state.you?.id);

  useEffect(() => {
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker.register("/sw.js").catch(() => undefined);
    }
  }, []);
  const declareableSets = useMemo(() => {
    if (!state?.you) return [];
    const hand = new Set(state.you.hand);
    const claimed = new Set(state.completedSets.map((set) => set.setId));
    return literatureSets
      .filter((set) => !claimed.has(set.id) && set.cards.every((card) => hand.has(card)))
      .map((set) => set.id as LiteratureSetId);
  }, [state]);

  if (!state || state.phase === "lobby") {
    return (
      <main className="min-h-dvh overflow-hidden bg-felt-950 text-stone-50">
        <Lobby game={game} />
        <ToastSystem toasts={game.toasts} />
      </main>
    );
  }

  return (
    <main className="min-h-dvh overflow-hidden bg-[radial-gradient(circle_at_top,#0d6b45,#031f18_62%)] pb-[calc(172px+var(--safe-bottom))] text-stone-50 lg:pb-0">
      <TurnBar state={state} currentPlayerId={state.you?.id ?? null} />

      <div className="mx-auto flex min-h-[calc(100dvh-68px)] w-full max-w-7xl gap-4 px-3 pb-4 pt-[86px] sm:px-5 lg:px-7">
        <section className="relative flex min-w-0 flex-1 flex-col">
          <div className="mb-3 flex items-center justify-between gap-3 rounded-full border border-white/10 bg-black/18 px-3 py-2 text-xs text-stone-200 backdrop-blur">
            <span className="font-semibold tracking-wide">Room {state.code}</span>
            <span className="flex items-center gap-2">
              {game.connected ? <Wifi size={15} className="text-felt-400" /> : <WifiOff size={15} className="text-rose-300" />}
              {game.connected ? "Connected" : "Reconnecting"}
            </span>
          </div>

          <GameTable state={state} currentPlayerId={state.you?.id ?? null} />

          <AnimatePresence>
            {state.phase === "finished" && (
              <motion.div
                className="absolute inset-x-4 top-1/2 z-20 rounded-2xl border border-brass/50 bg-ink/92 p-6 text-center shadow-card backdrop-blur"
                initial={{ opacity: 0, scale: .96, y: 18 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: .96 }}
              >
                <p className="text-xs uppercase tracking-[.28em] text-brass">Game complete</p>
                <h2 className="mt-2 text-3xl font-black">
                  {state.players.filter((p) => state.winnerIds.includes(p.id)).map((p) => p.name).join(" and ")} won
                </h2>
              </motion.div>
            )}
          </AnimatePresence>
        </section>

        <aside className="hidden w-80 shrink-0 lg:block">
          <CompletedSetsPanel state={state} />
        </aside>
      </div>

      <button
        className="fixed bottom-[calc(174px+var(--safe-bottom))] right-4 z-30 rounded-full border border-white/15 bg-black/50 px-4 py-2 text-sm font-bold shadow-card backdrop-blur lg:hidden"
        onClick={() => setPanelOpen(true)}
      >
        Sets
      </button>

      <Hand
        cards={state.you?.hand ?? []}
        disabled={!isMyTurn || state.phase !== "playing"}
        onAsk={() => setAskOpen(true)}
        onDeclare={(setId) => game.declareSet(setId)}
        declareableSets={declareableSets}
      />

      <AskModal
        open={askOpen}
        onClose={() => setAskOpen(false)}
        state={state}
        onAsk={(targetPlayerId, cardId) => {
          setAskOpen(false);
          game.ask(targetPlayerId, cardId);
        }}
      />

      <AnimatePresence>
        {panelOpen && (
          <motion.div className="fixed inset-0 z-40 bg-black/45 lg:hidden" onClick={() => setPanelOpen(false)}>
            <motion.div
              className="absolute inset-x-0 bottom-0 max-h-[74dvh] rounded-t-3xl border border-white/10 bg-felt-950 p-4 shadow-card"
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              transition={{ duration: .2 }}
              onClick={(event) => event.stopPropagation()}
            >
              <CompletedSetsPanel state={state} compact />
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <ToastSystem toasts={game.toasts} />
    </main>
  );
}
