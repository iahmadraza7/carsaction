"use client";

import * as React from "react";
import { motion, useReducedMotion } from "framer-motion";

type RevealProps = {
  children: React.ReactNode;
  className?: string;
  /** Vertical offset to slide from, in px. */
  y?: number;
  delay?: number;
  duration?: number;
  once?: boolean;
};

/**
 * Fade + slide a block into view as it enters the viewport. No-ops (renders
 * children in place) when the user prefers reduced motion.
 */
export function Reveal({
  children,
  className,
  y = 24,
  delay = 0,
  duration = 0.6,
  once = true,
}: RevealProps) {
  const reduce = useReducedMotion();

  if (reduce) {
    return <div className={className}>{children}</div>;
  }

  return (
    <motion.div
      className={className}
      initial={{ opacity: 0, y }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once, amount: 0.2 }}
      transition={{ duration, delay, ease: [0.22, 1, 0.36, 1] }}
    >
      {children}
    </motion.div>
  );
}
