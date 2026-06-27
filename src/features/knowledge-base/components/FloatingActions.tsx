"use client";

import { useEffect, useState, useRef } from "react";
import { Home, ChevronUp } from "lucide-react";
import { useRouter } from "next/navigation";
import { subscribeScroll } from '@/features/knowledge-base/lib/scroll-dispatcher';
import { TooltipIconButton } from '@/shared/components/TooltipIconButton';

export default function FloatingActions() {
  const router = useRouter();
  const [visible, setVisible] = useState(false);
  const [atBottom, setAtBottom] = useState(false);
  const [hovering, setHovering] = useState(false);
  const [focusing, setFocusing] = useState(false);
  const hoveringRef = useRef(hovering);
  const focusingRef = useRef(focusing);
  const hideTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const scrollTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => { hoveringRef.current = hovering; }, [hovering]);
  useEffect(() => { focusingRef.current = focusing; }, [focusing]);

  const resetHideTimer = () => {
    if (hideTimeoutRef.current) {
      clearTimeout(hideTimeoutRef.current);
    }
    hideTimeoutRef.current = setTimeout(() => {
      if (!hoveringRef.current && !focusingRef.current) {
        setVisible(false);
      }
    }, 8000);
  };

  useEffect(() => {
    const unsubscribe = subscribeScroll(({ scrollY, scrollHeight, clientHeight }) => {
      const isVisible = scrollY > 150;
      setVisible(isVisible);

      const scrollPosition = clientHeight + scrollY;
      setAtBottom(scrollHeight - scrollPosition < 150);

      if (isVisible) {
        // 滚动期间清除隐藏定时器
        if (hideTimeoutRef.current) {
          clearTimeout(hideTimeoutRef.current);
          hideTimeoutRef.current = null;
        }

        // 防抖：停止滚动 200ms 后重新计时
        if (scrollTimeoutRef.current) {
          clearTimeout(scrollTimeoutRef.current);
        }

        scrollTimeoutRef.current = setTimeout(() => {
          if (!hoveringRef.current && !focusingRef.current) {
            hideTimeoutRef.current = setTimeout(() => {
              setVisible(false);
            }, 8000);
          }
        }, 200);
      }
    });

    return () => {
      unsubscribe();
      if (hideTimeoutRef.current) clearTimeout(hideTimeoutRef.current);
      if (scrollTimeoutRef.current) clearTimeout(scrollTimeoutRef.current);
    };
  }, []);

  const handleMouseEnter = () => {
    setHovering(true);
    if (hideTimeoutRef.current) {
      clearTimeout(hideTimeoutRef.current);
    }
  };

  const handleMouseLeave = () => {
    setHovering(false);
    resetHideTimer();
  };

  const handleFocus = () => {
    setFocusing(true);
    setVisible(true);
    if (hideTimeoutRef.current) {
      clearTimeout(hideTimeoutRef.current);
    }
  };

  const handleBlur = () => {
    setFocusing(false);
    resetHideTimer();
  };

  const scrollToTop = () => {
    const scrollRoot = document.getElementById("main-content");
    const behavior = window.matchMedia('(prefers-reduced-motion: reduce)').matches ? "auto" : "smooth";
    if (scrollRoot) {
      scrollRoot.scrollTo({ top: 0, behavior });
    } else {
      window.scrollTo({ top: 0, behavior });
    }
  };

  const goHome = () => {
    router.push("/kb");
  };

  return (
    <div
      className={`fixed z-50 right-3 sm:right-6 flex flex-col items-center justify-center w-9 sm:w-10 py-0.5 bg-background/70 rounded-full border border-divider/40 shadow-lg backdrop-blur-md transition-all duration-300 ease-out overflow-hidden hover:shadow-xl ${
        atBottom ? "bottom-[120px] sm:bottom-[130px]" : "bottom-6 sm:bottom-8"
      } ${
        visible
          ? "opacity-100 translate-x-0 sm:translate-y-0"
          : "opacity-0 translate-x-10 sm:translate-x-0 sm:translate-y-4 pointer-events-none"
      }`}
      id="floating-capsule"
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      onFocus={handleFocus}
      onBlur={handleBlur}
    >
      <TooltipIconButton label="返回主页" side="left">
        <button
          onClick={goHome}
          className="flex items-center justify-center w-full h-8 sm:h-9 text-foreground/50 hover:text-accent hover:bg-foreground/[0.06] transition-all duration-200 active:scale-95 cursor-pointer"
          aria-label="返回主页"
        >
          <Home size={14} strokeWidth={2} className="sm:w-3.5 sm:h-3.5" />
        </button>
      </TooltipIconButton>

      <TooltipIconButton label="回到顶部" side="left">
        <button
          onClick={scrollToTop}
          className="flex items-center justify-center w-full h-8 sm:h-9 text-foreground/50 hover:text-accent hover:bg-foreground/[0.06] transition-all duration-200 active:scale-95 cursor-pointer"
          aria-label="回到顶部"
        >
          <ChevronUp size={16} strokeWidth={2.5} className="sm:w-4 sm:h-4" />
        </button>
      </TooltipIconButton>
    </div>
  );
}
