"use client";

import { memo } from "react";
import { getCardMeta, type CardId } from "@/lib/game";

type Props = {
  card: CardId;
  small?: boolean;
  muted?: boolean;
};

export const Card = memo(function Card({ card, small, muted }: Props) {
  const meta = getCardMeta(card);
  return (
    <div
      className={[
        "relative shrink-0 select-none rounded-xl border bg-stone-50 text-ink shadow-card transition-transform duration-150",
        small ? "h-20 w-14 p-2" : "h-28 w-20 p-2.5 sm:h-32 sm:w-24",
        muted ? "opacity-45" : "hover:-translate-y-2 active:-translate-y-2",
        meta.color === "red" ? "border-rose-200 text-rose-600" : "border-stone-200 text-stone-950"
      ].join(" ")}
    >
      <div className="text-base font-black leading-none sm:text-lg">{meta.rank}</div>
      <div className="text-lg leading-none sm:text-xl">{meta.label.slice(-1)}</div>
      <div className="absolute inset-0 grid place-items-center text-3xl font-black opacity-90 sm:text-4xl">{meta.label.slice(-1)}</div>
      <div className="absolute bottom-2 right-2 rotate-180 text-base font-black leading-none sm:text-lg">{meta.rank}</div>
    </div>
  );
});
