"use client";

import * as React from "react";
import dynamic from "next/dynamic";
import Image from "next/image";
import {
  motion,
  useReducedMotion,
  useScroll,
  useTransform,
} from "framer-motion";

const HeroCanvas = dynamic(
  () => import("@/components/motion/hero-canvas").then((m) => m.HeroCanvas),
  { ssr: false },
);

/**
 * Sticky WebGL hero: tall scroll track drives a Three.js camera through car
 * image planes. Brand copy stays as HTML for SEO / clickability. Reduced-motion
 * and offscreen paths skip or pause the Canvas.
 */
export function ScrollHero({
  images,
  children,
}: {
  images: string[];
  children: React.ReactNode;
}) {
  const ref = React.useRef<HTMLDivElement>(null);
  const stickyRef = React.useRef<HTMLDivElement>(null);
  const reduce = useReducedMotion();
  const list = images.length > 0 ? images : ["/logo.png"];
  const [active, setActive] = React.useState(true);
  const [isMobile, setIsMobile] = React.useState(false);

  React.useEffect(() => {
    const mq = window.matchMedia("(max-width: 768px)");
    const apply = () => setIsMobile(mq.matches);
    apply();
    mq.addEventListener("change", apply);
    return () => mq.removeEventListener("change", apply);
  }, []);

  React.useEffect(() => {
    const el = stickyRef.current;
    if (!el || typeof IntersectionObserver === "undefined") return;
    const io = new IntersectionObserver(
      ([entry]) => setActive(entry.isIntersecting),
      { threshold: 0.05 },
    );
    io.observe(el);
    return () => io.disconnect();
  }, [reduce]);

  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start start", "end end"],
  });

  const contentY = useTransform(scrollYProgress, [0, 1], [0, -32]);
  const contentOpacity = useTransform(scrollYProgress, [0, 0.85, 1], [1, 1, 0.88]);
  const indicatorOpacity = useTransform(scrollYProgress, [0, 0.2], [1, 0]);

  if (reduce) {
    return (
      <section className="relative isolate flex min-h-svh items-center overflow-hidden">
        <div className="absolute inset-0 -z-10">
          <Image src={list[0]} alt="" fill priority sizes="100vw" className="object-cover" />
          <div className="absolute inset-0 bg-gradient-to-b from-black/80 via-black/55 to-black/90" />
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_30%_20%,rgba(255,138,61,0.18),transparent_55%)]" />
        </div>
        <div className="mx-auto w-full max-w-6xl px-4">{children}</div>
      </section>
    );
  }

  const trackVh = isMobile ? 160 : 200;

  return (
    <div ref={ref} className="relative" style={{ height: `${trackVh}vh` }}>
      <div
        ref={stickyRef}
        className="sticky top-0 flex h-svh items-center overflow-hidden bg-[#0c0a08]"
      >
        <div className="absolute inset-0">
          <HeroCanvas images={list} progress={scrollYProgress} active={active} />
        </div>

        {/* Atmosphere veil — readable copy, still lets car planes show through */}
        <div
          className="pointer-events-none absolute inset-0 bg-gradient-to-r from-black/80 via-black/35 to-black/25"
          aria-hidden
        />
        <div
          className="pointer-events-none absolute inset-0 bg-gradient-to-b from-black/40 via-transparent to-black/75"
          aria-hidden
        />
        <div
          className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_20%_20%,rgba(255,138,61,0.16),transparent_55%)]"
          aria-hidden
        />

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
