"use client";

import { motion, useReducedMotion } from "framer-motion";
import type { ReactNode } from "react";

export function Reveal({
  children,
  delay = 0,
  className,
}: {
  children: ReactNode;
  delay?: number;
  className?: string;
}) {
  const reduce = useReducedMotion();
  return (
    <motion.div
      className={className}
      initial={reduce ? false : { opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-80px" }}
      transition={{ duration: 0.6, delay, ease: [0.22, 1, 0.36, 1] }}
    >
      {children}
    </motion.div>
  );
}

// Hero phone: a brief being written, then a reel landing for approval.
export function HeroPhone() {
  const reduce = useReducedMotion();
  const lines = [
    { k: "Hook", v: "“The ₹180 breakfast Assagao locals won't tell you about”" },
    { k: "Shot 1", v: "Slow pour of the cold coffee, window light, 3s" },
    { k: "Shot 2", v: "Owner flips the poee sandwich, close-up, 2s" },
    { k: "Caption", v: "Open 8am–4pm · DM to reserve the balcony" },
  ];

  return (
    <motion.div
      initial={reduce ? false : { opacity: 0, y: 40, rotate: 4 }}
      animate={{ opacity: 1, y: 0, rotate: 2 }}
      transition={{ duration: 0.9, ease: [0.22, 1, 0.36, 1], delay: 0.15 }}
      className="relative mx-auto w-[290px] rounded-[2.6rem] border-[10px] border-ink-950 bg-sand-50 p-4 shadow-2xl shadow-ink-950/25"
      aria-hidden
    >
      <div className="mx-auto mb-4 h-5 w-24 rounded-full bg-ink-950" />
      <div className="flex items-center justify-between">
        <p className="text-[11px] font-semibold uppercase tracking-wider text-ink-500">AI brief</p>
        <span className="rounded-full bg-palm-500/15 px-2 py-0.5 text-[10px] font-medium text-palm-500">
          Ready
        </span>
      </div>
      <p className="mt-1 font-display text-2xl leading-tight">Café in Assagao</p>
      <div className="mt-4 space-y-2.5">
        {lines.map((l, i) => (
          <motion.div
            key={l.k}
            initial={reduce ? false : { opacity: 0, x: -12 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.7 + i * 0.25, duration: 0.45 }}
            className="rounded-xl bg-white p-3 shadow-sm"
          >
            <p className="text-[10px] font-semibold uppercase tracking-wider text-sunset-500">{l.k}</p>
            <p className="mt-0.5 text-[13px] leading-snug text-ink-900">{l.v}</p>
          </motion.div>
        ))}
      </div>
      <motion.div
        initial={reduce ? false : { opacity: 0, y: 16, scale: 0.96 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ delay: 1.9, duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
        className="mt-4 flex items-center gap-3 rounded-2xl bg-ink-950 p-3 text-sand-50"
      >
        <div className="grid size-10 place-items-center rounded-xl bg-sunset-500 text-sm">▶</div>
        <div className="min-w-0 flex-1">
          <p className="text-[13px] font-medium">Your reel is ready</p>
          <p className="text-[11px] text-sand-200/70">Tap to review and approve</p>
        </div>
      </motion.div>
    </motion.div>
  );
}
