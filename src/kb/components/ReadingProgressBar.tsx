"use client";

import { useEffect, useState } from "react";
import { subscribeScroll } from '@kb/lib/scroll-dispatcher';

export default function ReadingProgressBar() {
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    return subscribeScroll(({ scrollY, scrollHeight, clientHeight }) => {
      const totalScroll = scrollHeight - clientHeight;

      if (totalScroll > 0) {
        const currentProgress = (scrollY / totalScroll) * 100;
        setProgress(Math.min(100, Math.max(0, currentProgress)));
      } else {
        setProgress(0);
      }
    });
  }, []);

  return (
    <div
      className="fixed top-0 left-0 right-0 h-[2.5px] z-50 pointer-events-none transition-transform duration-75 ease-out bg-accent origin-left"
      style={{ transform: `scaleX(${progress / 100})` }}
      aria-hidden="true"
    />
  );
}
