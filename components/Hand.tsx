"use client";

import { BookOpenCheck, MessageCircleQuestion } from "lucide-react";
import { memo, useState } from "react";
import { Card } from "@/components/Card";
import { getSetLabel, type CardId, type LiteratureSetId } from "@/lib/game";

export const Hand = memo(function Hand({
  cards,
  disabled,
  onAsk,
  onDeclare,
  declareableSets
}: {
  cards: CardId[];
  disabled: boolean;
  onAsk: () => void;
  onDeclare: (setId: LiteratureSetId) => void;
  declareableSets: LiteratureSetId[];
}) {
  const [selectedSet, setSelectedSet] = useState<LiteratureSetId | "">("");
  return (
    <section className="fixed inset-x-0 bottom-0 z-30 border-t border-white/10 bg-ink/92 px-3 pb-[calc(10px+var(--safe-bottom))] pt-3 shadow-card backdrop-blur">
      <div className="mx-auto flex max-w-7xl items-end gap-3">
        <div className="min-w-0 flex-1">
          <div className="thin-scroll flex min-h-36 gap-0 overflow-x-auto px-1 pb-3 pt-2">
            {cards.map((card, index) => (
              <div key={card} className={index === 0 ? "" : "-ml-8 sm:-ml-10"}>
                <Card card={card} />
              </div>
            ))}
            {!cards.length && <div className="grid h-28 place-items-center rounded-2xl border border-dashed border-white/15 px-6 text-sm text-stone-300">No cards in hand</div>}
          </div>
        </div>
        <div className="flex w-32 shrink-0 flex-col gap-2 sm:w-44">
          <button
            disabled={disabled}
            onClick={onAsk}
            className="flex min-h-12 items-center justify-center gap-2 rounded-2xl bg-felt-400 px-3 text-sm font-black text-ink shadow-glow transition active:scale-[.98] disabled:cursor-not-allowed disabled:bg-stone-600 disabled:text-stone-300 disabled:shadow-none"
          >
            <MessageCircleQuestion size={18} />
            Ask
          </button>
          <div className="flex gap-2">
            <select
              value={selectedSet}
              onChange={(event) => setSelectedSet(event.target.value as LiteratureSetId)}
              className="min-w-0 flex-1 rounded-xl border border-white/10 bg-white/8 px-2 py-2 text-xs text-stone-100 outline-none"
            >
              <option value="">Set</option>
              {declareableSets.map((setId) => <option key={setId} value={setId}>{getSetLabel(setId)}</option>)}
            </select>
            <button
              disabled={!selectedSet}
              onClick={() => {
                if (selectedSet) onDeclare(selectedSet);
                setSelectedSet("");
              }}
              className="grid h-10 w-10 place-items-center rounded-xl border border-brass/50 bg-brass text-ink disabled:border-white/10 disabled:bg-stone-700 disabled:text-stone-400"
              title="Declare set"
            >
              <BookOpenCheck size={18} />
            </button>
          </div>
        </div>
      </div>
    </section>
  );
});
