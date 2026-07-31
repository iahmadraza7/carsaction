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

const PLANE_W = 6.4;
const PLANE_H = 3.6;

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
}: {
  url: string;
  position: [number, number, number];
  rotation: [number, number, number];
}) {
  const texture = useTexture(url);
  React.useLayoutEffect(() => {
    texture.colorSpace = THREE.SRGBColorSpace;
    texture.anisotropy = 8;
  }, [texture]);

  return (
    <mesh position={position} rotation={rotation}>
      <planeGeometry args={[PLANE_W, PLANE_H]} />
      <meshStandardMaterial map={texture} roughness={0.85} metalness={0.05} />
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
  const pointer = React.useRef({ x: 0, y: 0 });
  const targetPointer = React.useRef({ x: 0, y: 0 });
  const drift = React.useRef(0);

  const planes = React.useMemo(() => {
    const list = images.slice(0, mobile ? 3 : 4);
    const depthGap = mobile ? 2.8 : 3.2;
    return list.map((url, i) => {
      const t = list.length <= 1 ? 0 : i / (list.length - 1);
      const curve = (t - 0.5) * (mobile ? 0.55 : 0.85);
      return {
        url,
        position: [
          curve * 1.6 + (i % 2 === 0 ? -0.15 : 0.2),
          (i % 2 === 0 ? 0.12 : -0.18) * (mobile ? 0.6 : 1),
          -i * depthGap,
        ] as [number, number, number],
        rotation: [0, -curve * 0.35, 0] as [number, number, number],
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

  useFrame((state, delta) => {
    const p = progress.get();
    drift.current += delta;

    const tiltScale = mobile ? 0.02 : 0.06;
    pointer.current.x += (targetPointer.current.x - pointer.current.x) * 0.06;
    pointer.current.y += (targetPointer.current.y - pointer.current.y) * 0.06;

    const idleX = Math.sin(drift.current * 0.35) * 0.04;
    const idleY = Math.cos(drift.current * 0.28) * 0.025;

    const camZ = THREE.MathUtils.lerp(4.2, mobile ? -3.2 : -5.5, p);
    const camY = THREE.MathUtils.lerp(0.15, -0.35, p) + idleY + pointer.current.y * -tiltScale;
    const camX = idleX + pointer.current.x * tiltScale * 1.4;
    const rotY = THREE.MathUtils.lerp(0.08, -0.22, p) + pointer.current.x * tiltScale * 0.8;

    camera.position.set(camX, camY, camZ);
    camera.rotation.set(
      -0.04 + pointer.current.y * tiltScale * 0.5,
      rotY,
      0,
    );
    camera.updateProjectionMatrix();
  });

  return (
    <>
      <color attach="background" args={["#0c0a08"]} />
      <fog attach="fog" args={["#0c0a08", 6, 18]} />
      <ambientLight intensity={0.35} />
      <directionalLight
        position={[2.5, 3.5, 4]}
        intensity={1.15}
        color="#ffb86b"
      />
      <pointLight position={[-3, 1.5, 2]} intensity={0.45} color="#ff8a3d" />
      <pointLight position={[2, -1, -4]} intensity={0.25} color="#fff4e6" />

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
      className="absolute inset-0 h-full w-full"
      dpr={[1, 1.5]}
      frameloop={active ? "always" : "never"}
      gl={{ antialias: true, alpha: false, powerPreference: "high-performance" }}
      camera={{ position: [0, 0.15, 4.2], fov: mobile ? 48 : 42, near: 0.1, far: 40 }}
    >
      <React.Suspense fallback={null}>
        <Scene images={list} progress={progress} mobile={mobile} />
      </React.Suspense>
    </Canvas>
  );
}
