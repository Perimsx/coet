"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

interface PageNavigationShortcutsProps {
  prevHref: string | null;
  nextHref: string | null;
}

export default function PageNavigationShortcuts({
  prevHref,
  nextHref,
}: PageNavigationShortcutsProps) {
  const router = useRouter();

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Skip navigation when a dialog/modal is open
      if (document.querySelector('[role="dialog"]')) return;

      // 确保用户没有在 input, textarea 或 editable 元素中输入
      const target = e.target;
      if (!(target instanceof HTMLElement)) return;
      if (
        target.tagName === "INPUT" ||
        target.tagName === "TEXTAREA" ||
        target.isContentEditable
      ) {
        return;
      }

      if (e.key === "ArrowLeft" && prevHref) {
        e.preventDefault();
        router.push(prevHref);
      } else if (e.key === "ArrowRight" && nextHref) {
        e.preventDefault();
        router.push(nextHref);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [prevHref, nextHref, router]);

  return null;
}
