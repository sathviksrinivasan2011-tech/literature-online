"use client";

import { AnimatePresence, motion } from "framer-motion";
import { Check, X } from "lucide-react";
import { memo, useMemo, useState } from "react";
import { Card } from "@/components/Card";
import { getCardMeta, getSetCards, literatureSets, type CardId, type LiteratureSetId, type PublicRoomState } from "@/lib/game";

export const AskModal = memo(function AskModal({
  open,
  onClose,
  state,
  onAsk
}: {
  open: boolean;
  onClose: () => void;
  state: PublicRoomState;
  onAsk: (targetPlayerId: string, cardId: CardId) => void;
}) {
  const [targetId, setTargetId] = useState("");
  const [setId, setSetId] = useState<LiteratureSetId | "">("");
  const [cardId, setCardId] = useState<CardId | "">("");
  const completed = new Set(state.completedSets.map((set) => set.setId));
  const legalSetIds = new Set(state.you?.legalSetIds ?? []);
  const targets = state.players.filter((player) => player.id !== state.you?.id && player.cardCount > 0);

  const legalCards = useMemo(() => {
    if (!setId) return [];
    const hand = new Set(state.you?.hand ?? []);
    return getSetCards(setId).filter((card) => !hand.has(card));
  }, [setId, state.you?.hand]);

  function close() {
    setTargetId("");
    setSetId("");
    setCardId("");
    onClose();
  }

  return (
    <AnimatePresence>
      {open && (
        <motion.div className="fixed inset-0 z-[60] grid place-items-end bg-black/55 p-3 sm:place-items-center" onClick={close}>
          <motion.div
            className="max-h-[88dvh] w-full max-w-2xl overflow-hidden rounded-3xl border border-white/10 bg-felt-950 shadow-card"
            initial={{ opacity: 0, scale: .96, y: 18 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: .96, y: 16 }}
            transition={{ duration: .16 }}
            onClick={(event) => event.stopPropagation()}
          >
            <header className="flex items-center justify-between border-b border-white/10 px-4 py-3">
              <div>
                <h2 className="text-lg font-black">Ask for a card</h2>
                <p className="text-xs text-stone-300">Only legal Literature moves are selectable.</p>
              </div>
              <button onClick={close} className="grid h-10 w-10 place-items-center rounded-full bg-white/8">
                <X size={18} />
              </button>
            </header>

            <div className="thin-scroll max-h-[calc(88dvh-76px)] space-y-5 overflow-y-auto p-4">
              <section>
                <p className="mb-2 text-xs font-bold uppercase tracking-[.18em] text-brass">Player</p>
                <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                  {targets.map((player) => (
                    <button
                      key={player.id}
                      onClick={() => setTargetId(player.id)}
                      className={[
                        "rounded-2xl border p-3 text-left transition",
                        targetId === player.id ? "border-felt-400 bg-felt-400/16" : "border-white/10 bg-white/7"
                      ].join(" ")}
                    >
                      <span className="block truncate font-bold">{player.name}</span>
                      <span className="text-xs text-stone-300">{player.cardCount} cards</span>
                    </button>
                  ))}
                </div>
              </section>

              <section>
                <p className="mb-2 text-xs font-bold uppercase tracking-[.18em] text-brass">Literature set</p>
                <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                  {literatureSets.map((set) => {
                    const legal = legalSetIds.has(set.id) && !completed.has(set.id);
                    return (
                      <button
                        key={set.id}
                        disabled={!legal}
                        onClick={() => {
                          setSetId(set.id);
                          setCardId("");
                        }}
                        className={[
                          "rounded-2xl border p-3 text-left transition disabled:cursor-not-allowed disabled:opacity-35",
                          setId === set.id ? "border-felt-400 bg-felt-400/16" : "border-white/10 bg-white/7"
                        ].join(" ")}
                      >
                        <span className="block truncate font-bold">{set.label}</span>
                        <span className="text-xs text-stone-300">{set.cards.length} cards</span>
                      </button>
                    );
                  })}
                </div>
              </section>

              <section>
                <p className="mb-2 text-xs font-bold uppercase tracking-[.18em] text-brass">Card</p>
                <div className="flex min-h-24 gap-2 overflow-x-auto pb-2">
                  {(setId ? getSetCards(setId) : []).map((card) => {
                    const legal = legalCards.includes(card);
                    return (
                      <button
                        key={card}
                        disabled={!legal}
                        onClick={() => setCardId(card)}
                        className={[
                          "rounded-xl border p-1 transition disabled:cursor-not-allowed disabled:opacity-35",
                          cardId === card ? "border-felt-400 bg-felt-400/15" : "border-transparent"
                        ].join(" ")}
                        title={getCardMeta(card).label}
                      >
                        <Card card={card} small muted={!legal} />
                      </button>
                    );
                  })}
                </div>
              </section>

              <button
                disabled={!targetId || !cardId}
                onClick={() => cardId && onAsk(targetId, cardId)}
                className="flex h-12 w-full items-center justify-center gap-2 rounded-2xl bg-felt-400 text-base font-black text-ink shadow-glow disabled:bg-stone-700 disabled:text-stone-400 disabled:shadow-none"
              >
                <Check size={18} />
                Ask for {cardId ? getCardMeta(cardId).label : "card"}
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
});
