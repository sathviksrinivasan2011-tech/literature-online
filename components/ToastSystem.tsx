"use client";

import { AnimatePresence, motion } from "framer-motion";
import { memo } from "react";
import type { MoveToast } from "@/lib/game";

export const ToastSystem = memo(function ToastSystem({ toasts }: { toasts: MoveToast[] }) {
  return (
    <div className="pointer-events-none fixed inset-x-0 top-24 z-[70] mx-auto flex max-w-md flex-col gap-2 px-4">
      <AnimatePresence>
        {toasts.map((toast) => (
          <motion.div
            key={toast.id}
            className={[
              "rounded-2xl border px-4 py-3 text-sm font-bold shadow-card backdrop-blur",
              toast.tone === "success" ? "border-felt-400/50 bg-felt-400/18 text-felt-50" : "",
              toast.tone === "miss" ? "border-rose-300/40 bg-rose-950/70 text-rose-50" : "",
              toast.tone === "info" ? "border-brass/40 bg-ink/86 text-stone-50" : "",
              toast.tone === "win" ? "border-brass bg-brass text-ink" : ""
            ].join(" ")}
            initial={{ opacity: 0, y: -10, scale: .98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -8, scale: .98 }}
            transition={{ duration: .18 }}
          >
            {toast.message}
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
});
