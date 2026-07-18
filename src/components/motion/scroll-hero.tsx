"use client";

import * as React from "react";
import Image from "next/image";
import {
  motion,
  useReducedMotion,
  useScroll,
  useTransform,
  type MotionValue,
} from "framer-motion";

const FLOAT_CHIPS = ["COE expiry", "Depreciation", "OMV", "ARF", "Verified dealers", "Flat plans"];

/**
 * Scroll-driven hero: background images crossfade as you scroll, plus orbs,
 * speed lines, floating chips, marquee and staggered copy. Reduced-motion safe.
 */
export function ScrollHero({
  images,
  children,
}: {
  images: string[];
  children: React.ReactNode;
}) {
  const ref = React.useRef<HTMLDivElement>(null);
  const reduce = useReducedMotion();
  const list = images.length > 0 ? images : ["/logo.png"];
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start start", "end end"],
  });

  const contentY = useTransform(scrollYProgress, [0, 1], [0, -70]);
  const contentOpacity = useTransform(scrollYProgress, [0, 0.8, 1], [1, 1, 0.2]);
  const glowOpacity = useTransform(scrollYProgress, [0, 0.5, 1], [0.55, 0.35, 0.15]);
  const indicatorOpacity = useTransform(scrollYProgress, [0, 0.18], [1, 0]);

  if (reduce) {
    return (
      <section className="relative isolate flex min-h-svh items-center overflow-hidden">
        <div className="absolute inset-0 -z-10">
          <Image src={list[0]} alt="" fill priority sizes="100vw" className="object-cover" />
          <div className="absolute inset-0 bg-gradient-to-b from-black/75 via-black/55 to-black/85" />
        </div>
        <div className="mx-auto w-full max-w-6xl px-4">{children}</div>
      </section>
    );
  }

  // Keep the track tall enough for crossfades, but not so extreme that
  // browsers/tools feel stuck mid-scroll.
  const trackVh = Math.max(160, list.length * 70);

  return (
    <div ref={ref} className="relative" style={{ height: `${trackVh}vh` }}>
      <div className="sticky top-0 flex h-svh items-center overflow-hidden">
        {/* Multi-image crossfade layers */}
        <div className="absolute inset-0 -z-20">
          {list.map((src, i) => (
            <HeroLayer
              key={`${src}-${i}`}
              src={src}
              index={i}
              count={list.length}
              progress={scrollYProgress}
              priority={i === 0}
            />
          ))}
        </div>
        <div className="absolute inset-0 -z-10 bg-gradient-to-b from-black/75 via-black/50 to-black/88" />

        {/* Animated gradient orbs */}
        <motion.div
          style={{ opacity: glowOpacity }}
          className="pointer-events-none absolute inset-0 -z-10 overflow-hidden"
          aria-hidden
        >
          <motion.div
            className="absolute -top-24 -left-16 size-[28rem] rounded-full bg-primary/35 blur-3xl"
            animate={{ x: [0, 40, -20, 0], y: [0, 30, -10, 0] }}
            transition={{ duration: 14, repeat: Infinity, ease: "easeInOut" }}
          />
          <motion.div
            className="absolute top-1/3 -right-20 size-[24rem] rounded-full bg-orange-400/25 blur-3xl"
            animate={{ x: [0, -50, 20, 0], y: [0, -25, 35, 0] }}
            transition={{ duration: 18, repeat: Infinity, ease: "easeInOut" }}
          />
          <motion.div
            className="absolute bottom-0 left-1/3 size-[20rem] rounded-full bg-white/10 blur-3xl"
            animate={{ scale: [1, 1.15, 1], opacity: [0.25, 0.45, 0.25] }}
            transition={{ duration: 10, repeat: Infinity, ease: "easeInOut" }}
          />
        </motion.div>

        {/* Speed lines */}
        <div className="pointer-events-none absolute inset-0 -z-10 overflow-hidden" aria-hidden>
          {Array.from({ length: 6 }).map((_, i) => (
            <motion.span
              key={i}
              className="absolute h-px bg-gradient-to-r from-transparent via-white/40 to-transparent"
              style={{ top: `${18 + i * 12}%`, left: "-20%", width: "55%" }}
              animate={{ x: ["0%", "170%"], opacity: [0, 0.75, 0] }}
              transition={{
                duration: 3 + i * 0.35,
                repeat: Infinity,
                delay: i * 0.4,
                ease: "easeInOut",
              }}
            />
          ))}
        </div>

        {/* Floating chips */}
        <div className="pointer-events-none absolute inset-0 -z-10 hidden md:block" aria-hidden>
          {FLOAT_CHIPS.map((label, i) => (
            <motion.span
              key={label}
              className="absolute rounded-full border border-white/20 bg-white/10 px-3 py-1 text-[11px] font-medium tracking-wide text-white/90 backdrop-blur-md"
              style={{
                top: `${16 + (i % 3) * 22}%`,
                left: i % 2 === 0 ? `${8 + (i % 3) * 4}%` : "auto",
                right: i % 2 === 1 ? `${6 + (i % 3) * 5}%` : "auto",
              }}
              animate={{ y: [0, -14, 0], opacity: [0.5, 1, 0.5] }}
              transition={{
                duration: 4 + (i % 3),
                repeat: Infinity,
                delay: i * 0.3,
                ease: "easeInOut",
              }}
            >
              {label}
            </motion.span>
          ))}
        </div>

        {/* Progress dots for image index */}
        <HeroDots count={list.length} progress={scrollYProgress} />

        <motion.div
          style={{ y: contentY, opacity: contentOpacity }}
          className="relative z-10 mx-auto w-full max-w-6xl px-4"
        >
          <motion.div
            initial={{ opacity: 0, y: 28 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.75, ease: [0.22, 1, 0.36, 1] }}
          >
            {children}
          </motion.div>
        </motion.div>

        {/* Marquee */}
        <div className="pointer-events-none absolute inset-x-0 bottom-14 z-10 overflow-hidden border-y border-white/10 bg-black/30 py-2 backdrop-blur-sm">
          <motion.div
            className="flex whitespace-nowrap text-xs font-medium tracking-[0.22em] text-white/65 uppercase"
            animate={{ x: ["0%", "-50%"] }}
            transition={{ duration: 26, repeat: Infinity, ease: "linear" }}
          >
            {Array.from({ length: 2 }).map((_, loop) => (
              <span key={loop} className="flex shrink-0 gap-10 px-5">
                {[
                  "Transparent pricing",
                  "Singapore COE",
                  "Dealer subscriptions",
                  "WhatsApp dealers",
                  "Verified lots",
                  "No per-car fees",
                ].map((t) => (
                  <span key={`${loop}-${t}`}>{t}</span>
                ))}
              </span>
            ))}
          </motion.div>
        </div>

        <motion.div
          style={{ opacity: indicatorOpacity }}
          className="absolute inset-x-0 bottom-4 z-10 flex justify-center"
        >
          <motion.span
            className="flex flex-col items-center gap-1 text-xs font-medium tracking-wide text-white/75"
            animate={{ y: [0, 6, 0] }}
            transition={{ duration: 1.6, repeat: Infinity, ease: "easeInOut" }}
          >
            Scroll to explore
            <span className="h-7 w-px bg-gradient-to-b from-white/80 to-transparent" />
          </motion.span>
        </motion.div>
      </div>
    </div>
  );
}

function HeroLayer({
  src,
  index,
  count,
  progress,
  priority,
}: {
  src: string;
  index: number;
  count: number;
  progress: MotionValue<number>;
  priority?: boolean;
}) {
  const w = 1 / count;
  const f = w / 2;
  const start = index * w;
  const end = (index + 1) * w;

  let inputs: number[];
  let outputs: number[];
  if (index === 0) {
    inputs = [0, end, Math.min(1, end + f)];
    outputs = [1, 1, 0];
  } else if (index === count - 1) {
    inputs = [Math.max(0, start - f), start, 1];
    outputs = [0, 1, 1];
  } else {
    inputs = [start - f, start, end, end + f];
    outputs = [0, 1, 1, 0];
  }

  const opacity = useTransform(progress, inputs, outputs);
  const scale = useTransform(
    progress,
    [Math.max(0, start - f), Math.min(1, end + f)],
    [1.14, 1],
  );
  const x = useTransform(
    progress,
    [Math.max(0, start - f), Math.min(1, end + f)],
    ["-2%", "2%"],
  );

  return (
    <motion.div style={{ opacity }} className="absolute inset-0">
      <motion.div style={{ scale, x }} className="absolute inset-0">
        <Image src={src} alt="" fill priority={priority} sizes="100vw" className="object-cover" />
      </motion.div>
    </motion.div>
  );
}

function HeroDots({ count, progress }: { count: number; progress: MotionValue<number> }) {
  if (count < 2) return null;
  return (
    <div className="absolute top-1/2 right-4 z-10 hidden -translate-y-1/2 flex-col gap-2 sm:flex">
      {Array.from({ length: count }).map((_, i) => (
        <HeroDot key={i} index={i} count={count} progress={progress} />
      ))}
    </div>
  );
}

function HeroDot({
  index,
  count,
  progress,
}: {
  index: number;
  count: number;
  progress: MotionValue<number>;
}) {
  const start = index / count;
  const end = (index + 1) / count;
  const active = useTransform(progress, [start, (start + end) / 2, end], [0.35, 1, 0.35]);
  const height = useTransform(progress, [start, (start + end) / 2, end], [8, 22, 8]);

  return (
    <motion.span
      style={{ opacity: active, height }}
      className="w-1.5 rounded-full bg-white shadow-sm"
    />
  );
}
