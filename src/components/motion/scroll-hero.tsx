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
 * Sticky hero with a simple 3-image scroll crossfade.
 * Images stay full-bleed via object-cover (correct aspect, no stretch).
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
  // Hard-cap at 3 slides for a clean transition
  const list = (images.length > 0 ? images : ["/logo.png"]).slice(0, 3);

  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start start", "end end"],
  });

  const contentY = useTransform(scrollYProgress, [0, 1], [0, -24]);
  const contentOpacity = useTransform(scrollYProgress, [0, 0.9, 1], [1, 1, 0.92]);
  const indicatorOpacity = useTransform(scrollYProgress, [0, 0.18], [1, 0]);

  if (reduce) {
    return (
      <section className="relative isolate flex min-h-svh items-center overflow-hidden">
        <div className="absolute inset-0 -z-10">
          <Image
            src={list[0]}
            alt=""
            fill
            priority
            sizes="100vw"
            className="object-cover object-center"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-black/80 via-black/50 to-black/30" />
          <div className="absolute inset-0 bg-gradient-to-b from-black/35 via-transparent to-black/70" />
        </div>
        <div className="mx-auto w-full max-w-6xl px-4">{children}</div>
      </section>
    );
  }

  // ~70vh per slide — enough to crossfade without feeling stuck
  const trackVh = Math.max(180, list.length * 70);

  return (
    <div ref={ref} className="relative" style={{ height: `${trackVh}vh` }}>
      <div className="sticky top-0 flex h-svh items-center overflow-hidden bg-black">
        <div className="absolute inset-0">
          {list.map((src, i) => (
            <HeroSlide
              key={`${src}-${i}`}
              src={src}
              index={i}
              count={list.length}
              progress={scrollYProgress}
              priority={i === 0}
            />
          ))}
        </div>

        {/* Readability veil — left-weighted so copy stays clear */}
        <div
          className="pointer-events-none absolute inset-0 bg-gradient-to-r from-black/80 via-black/45 to-black/20"
          aria-hidden
        />
        <div
          className="pointer-events-none absolute inset-0 bg-gradient-to-b from-black/30 via-transparent to-black/65"
          aria-hidden
        />

        <motion.div
          style={{ y: contentY, opacity: contentOpacity }}
          className="relative z-10 mx-auto w-full max-w-6xl px-4"
        >
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.65, ease: [0.22, 1, 0.36, 1] }}
          >
            {children}
          </motion.div>
        </motion.div>

        <motion.div
          style={{ opacity: indicatorOpacity }}
          className="absolute inset-x-0 bottom-6 z-10 flex justify-center"
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

function HeroSlide({
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
  const fade = w * 0.35;
  const start = index * w;
  const end = (index + 1) * w;

  let inputs: number[];
  let outputs: number[];
  if (index === 0) {
    inputs = [0, end - fade, end];
    outputs = [1, 1, 0];
  } else if (index === count - 1) {
    inputs = [start, start + fade, 1];
    outputs = [0, 1, 1];
  } else {
    inputs = [start, start + fade, end - fade, end];
    outputs = [0, 1, 1, 0];
  }

  const opacity = useTransform(progress, inputs, outputs);
  // Subtle Ken Burns — keep scale modest so ratio stays natural
  const scale = useTransform(progress, [start, end], [1.06, 1]);

  return (
    <motion.div style={{ opacity }} className="absolute inset-0">
      <motion.div style={{ scale }} className="absolute inset-0">
        <Image
          src={src}
          alt=""
          fill
          priority={priority}
          sizes="100vw"
          className="object-cover object-center"
        />
      </motion.div>
    </motion.div>
  );
}
