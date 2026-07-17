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

/**
 * Scroll-driven hero. A tall scroll track with a sticky viewport that crossfades
 * between car background images as the user scrolls, with overlaid content that
 * gently parallaxes. Falls back to a single static hero under reduced motion.
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
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start start", "end end"],
  });

  const contentY = useTransform(scrollYProgress, [0, 1], [0, -80]);
  const contentOpacity = useTransform(scrollYProgress, [0, 0.75, 1], [1, 1, 0.3]);
  const indicatorOpacity = useTransform(scrollYProgress, [0, 0.15], [1, 0]);

  if (reduce) {
    return (
      <section className="relative isolate flex min-h-svh items-center overflow-hidden">
        <div className="absolute inset-0 -z-10">
          <Image
            src={images[0]}
            alt=""
            fill
            priority
            sizes="100vw"
            className="object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-black/70 via-black/50 to-black/80" />
        </div>
        <div className="mx-auto w-full max-w-6xl px-4">{children}</div>
      </section>
    );
  }

  return (
    <div ref={ref} className="relative" style={{ height: `${images.length * 75 + 50}vh` }}>
      <div className="sticky top-0 flex h-svh items-center overflow-hidden">
        <div className="absolute inset-0 -z-10">
          {images.map((src, i) => (
            <HeroLayer
              key={src}
              src={src}
              index={i}
              count={images.length}
              progress={scrollYProgress}
              priority={i === 0}
            />
          ))}
          <div className="absolute inset-0 bg-gradient-to-b from-black/70 via-black/45 to-black/85" />
        </div>

        <motion.div
          style={{ y: contentY, opacity: contentOpacity }}
          className="mx-auto w-full max-w-6xl px-4"
        >
          {children}
        </motion.div>

        <motion.div
          style={{ opacity: indicatorOpacity }}
          className="absolute inset-x-0 bottom-6 flex justify-center"
        >
          <span className="flex flex-col items-center gap-1 text-xs font-medium tracking-wide text-white/70">
            Scroll to explore
            <span className="h-8 w-px animate-pulse bg-white/50" />
          </span>
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

  // Build a strictly-increasing input range clamped to [0, 1]. Edge layers stay
  // visible at the very start / very end so the hero is never blank.
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
    [1.12, 1],
  );

  return (
    <motion.div style={{ opacity }} className="absolute inset-0">
      <motion.div style={{ scale }} className="absolute inset-0">
        <Image src={src} alt="" fill priority={priority} sizes="100vw" className="object-cover" />
      </motion.div>
    </motion.div>
  );
}
