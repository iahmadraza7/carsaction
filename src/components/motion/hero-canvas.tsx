"use client";

import * as React from "react";
import * as THREE from "three";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { useTexture } from "@react-three/drei";
import type { MotionValue } from "framer-motion";

type HeroCanvasProps = {
  images: string[];
  /** 0–1 scroll progress through the sticky hero track. */
  progress: MotionValue<number>;
  /** When false, the WebGL loop pauses (offscreen / hidden). */
  active: boolean;
};

function useIsMobile() {
  const [mobile, setMobile] = React.useState(false);
  React.useEffect(() => {
    const mq = window.matchMedia("(max-width: 768px)");
    const apply = () => setMobile(mq.matches);
    apply();
    mq.addEventListener("change", apply);
    return () => mq.removeEventListener("change", apply);
  }, []);
  return mobile;
}

function ImagePlane({
  url,
  position,
  rotation,
  scale = 1,
}: {
  url: string;
  position: [number, number, number];
  rotation: [number, number, number];
  scale?: number;
}) {
  const texture = useTexture(url);
  React.useLayoutEffect(() => {
    texture.colorSpace = THREE.SRGBColorSpace;
    texture.anisotropy = 8;
    texture.needsUpdate = true;
  }, [texture]);

  // Basic material: full texture brightness without depending on scene lights.
  return (
    <mesh position={position} rotation={rotation} scale={scale}>
      <planeGeometry args={[8, 4.5]} />
      <meshBasicMaterial map={texture} toneMapped={false} />
    </mesh>
  );
}

function Scene({
  images,
  progress,
  mobile,
}: {
  images: string[];
  progress: MotionValue<number>;
  mobile: boolean;
}) {
  const { camera } = useThree();
  const lookTarget = React.useMemo(() => new THREE.Vector3(0, 0, -4), []);
  const pointer = React.useRef({ x: 0, y: 0 });
  const targetPointer = React.useRef({ x: 0, y: 0 });
  const drift = React.useRef(0);

  const planes = React.useMemo(() => {
    const list = images.slice(0, mobile ? 3 : 4);
    const depthGap = mobile ? 3.4 : 4;
    return list.map((url, i) => {
      const t = list.length <= 1 ? 0 : i / (list.length - 1);
      const curve = (t - 0.5) * (mobile ? 0.7 : 1.1);
      return {
        url,
        position: [
          curve * 2.2 + (i % 2 === 0 ? 0.35 : -0.25),
          (i % 2 === 0 ? 0.05 : -0.2) * (mobile ? 0.5 : 1),
          -1.2 - i * depthGap,
        ] as [number, number, number],
        rotation: [0, -curve * 0.28, 0] as [number, number, number],
        scale: i === 0 ? 1.15 : 1 - i * 0.04,
      };
    });
  }, [images, mobile]);

  React.useEffect(() => {
    if (mobile) return;
    const onMove = (e: PointerEvent) => {
      const nx = (e.clientX / window.innerWidth) * 2 - 1;
      const ny = (e.clientY / window.innerHeight) * 2 - 1;
      targetPointer.current.x = nx;
      targetPointer.current.y = ny;
    };
    window.addEventListener("pointermove", onMove, { passive: true });
    return () => window.removeEventListener("pointermove", onMove);
  }, [mobile]);

  useFrame((_state, delta) => {
    const p = progress.get();
    drift.current += delta;

    const tiltScale = mobile ? 0.025 : 0.07;
    pointer.current.x += (targetPointer.current.x - pointer.current.x) * 0.06;
    pointer.current.y += (targetPointer.current.y - pointer.current.y) * 0.06;

    const idleX = Math.sin(drift.current * 0.35) * 0.05;
    const idleY = Math.cos(drift.current * 0.28) * 0.03;

    const camZ = THREE.MathUtils.lerp(5.2, mobile ? -4 : -7.5, p);
    const camY = THREE.MathUtils.lerp(0.1, -0.4, p) + idleY + pointer.current.y * -tiltScale;
    const camX = idleX + pointer.current.x * tiltScale * 1.6;

    camera.position.set(camX, camY, camZ);
    lookTarget.set(
      pointer.current.x * tiltScale * 2.5,
      camY * 0.2,
      THREE.MathUtils.lerp(-2.5, -10, p),
    );
    camera.lookAt(lookTarget);
  });

  return (
    <>
      <color attach="background" args={["#120e0a"]} />
      <fog attach="fog" args={["#120e0a", 10, 28]} />
      <ambientLight intensity={0.9} />
      <directionalLight position={[3, 4, 5]} intensity={0.55} color="#ffb86b" />

      {planes.map((plane) => (
        <ImagePlane key={plane.url} {...plane} />
      ))}
    </>
  );
}

/**
 * Full-bleed WebGL hero scene: car photo planes in Z-depth with a scroll-linked
 * camera. Parent owns reduced-motion / SSR fallbacks.
 */
export function HeroCanvas({ images, progress, active }: HeroCanvasProps) {
  const mobile = useIsMobile();
  const list = images.length > 0 ? images : [];

  if (list.length === 0) return null;

  return (
    <Canvas
      className="!absolute inset-0 h-full w-full"
      style={{ position: "absolute", inset: 0, width: "100%", height: "100%" }}
      dpr={[1, 1.5]}
      frameloop={active ? "always" : "never"}
      gl={{
        antialias: true,
        alpha: false,
        powerPreference: "high-performance",
        preserveDrawingBuffer: true,
      }}
      camera={{ position: [0, 0.1, 5.2], fov: mobile ? 50 : 40, near: 0.1, far: 50 }}
    >
      <React.Suspense fallback={null}>
        <Scene images={list} progress={progress} mobile={mobile} />
      </React.Suspense>
    </Canvas>
  );
}
