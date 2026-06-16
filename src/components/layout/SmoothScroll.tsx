"use client";

import { useEffect } from "react";
import Lenis from "lenis";
import { gsap } from "gsap";

export default function SmoothScroll({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    // 8.1 检查 prefers-reduced-motion 以决定是否跳过平滑滚动
    const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (prefersReducedMotion) return;

    const lenis = new Lenis({
      duration: 1.2,
      easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)), // 经典的 expo-out 缓动曲线
      orientation: "vertical",
      gestureOrientation: "vertical",
      smoothWheel: true,
    });

    // 8.2 将 Lenis 与 GSAP ticker 融合，消除双重 RAF 循环
    const updateLenis = (time: number) => {
      // time 单位为秒，lenis.raf 接收毫秒
      lenis.raf(time * 1000);
    };

    gsap.ticker.add(updateLenis);

    // 同步 ScrollTrigger
    lenis.on("scroll", () => {
      const gsapWithScrollTrigger = gsap as typeof gsap & {
        ScrollTrigger?: { update: () => void };
      };
      if (typeof window !== "undefined" && gsapWithScrollTrigger.ScrollTrigger) {
        gsapWithScrollTrigger.ScrollTrigger.update();
      }
    });

    return () => {
      gsap.ticker.remove(updateLenis);
      lenis.destroy();
    };
  }, []);

  return <>{children}</>;
}
