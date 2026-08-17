"use client";

import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useToc } from "./TocContext";
import { useNavLanguage } from "@/features/site/lib/nav-language";
import { TooltipIconButton } from "@/shared/components/TooltipIconButton";
import { ArrowUp, X, List, ChevronUp } from "lucide-react";

export interface TocHeadingItem {
  value?: string;
  text?: string;
  url?: string;
  id?: string;
  depth?: number;
  level?: number;
}

function getTargetId(urlOrId: string) {
  const hashPart = urlOrId.includes("#")
    ? urlOrId.split("#").pop() || ""
    : urlOrId;
  const normalized = hashPart.replace(/^#/, "").trim();
  if (!normalized) return "";
  try {
    return decodeURIComponent(normalized);
  } catch {
    return normalized;
  }
}

export default function FloatingToc({ toc }: { toc?: TocHeadingItem[] }) {
  const { isTocOpen: open, setIsTocOpen: setOpen } = useToc();
  const [activeId, setActiveId] = useState("");
  const listContainerRef = useRef<HTMLElement | null>(null);
  const tickingRef = useRef(false);
  const { dictionary } = useNavLanguage();

  const tocItems = useMemo(() => {
    return (toc || [])
      .map((item, idx) => {
        const value = item.value || item.text || "";
        const rawUrl = item.url || item.id || "";
        const depth = item.depth || item.level || 2;
        let targetId = getTargetId(rawUrl);
        if (!targetId && value) {
          targetId =
            value
              .toLowerCase()
              .replace(/[^a-z0-9\u4e00-\u9fa5]+/g, "-")
              .replace(/^-+|-+$/g, "") || `heading-${idx + 1}`;
        }
        const url = `#${targetId}`;
        return { value, url, depth, targetId };
      })
      .filter((item) => item.value.trim().length > 0 && item.targetId);
  }, [toc]);

  const tocIds = useMemo(() => {
    return tocItems.map((item) => item.targetId);
  }, [tocItems]);

  const activeIndex = useMemo(() => {
    if (!activeId) return -1;
    return tocItems.findIndex((item) => item.targetId === activeId);
  }, [activeId, tocItems]);

  const progressLabel = useMemo(() => {
    if (!tocItems.length) return "0%";
    if (activeIndex < 0) return "0%";
    const percent = Math.round(((activeIndex + 1) / tocItems.length) * 100);
    return `${percent}%`;
  }, [activeIndex, tocItems.length]);

  const updateActiveToc = useCallback(() => {
    if (!tocIds.length) {
      setActiveId("");
      return;
    }

    const articleNode = document.getElementById("article");
    let headings: HTMLElement[] = [];

    if (articleNode) {
      headings = Array.from(
        articleNode.querySelectorAll<HTMLElement>("h2, h3, h4"),
      );
    }

    if (!headings.length) {
      headings = tocIds
        .map((id) => document.getElementById(id))
        .filter((node): node is HTMLElement => Boolean(node));
    }

    if (!headings.length) {
      setActiveId("");
      return;
    }

    if (window.scrollY < 120) {
      setActiveId(headings[0].id || tocIds[0]);
      return;
    }

    const isAtBottom =
      window.innerHeight + window.scrollY >=
      document.documentElement.scrollHeight - 60;
    if (isAtBottom) {
      const last = headings[headings.length - 1];
      setActiveId(last.id || tocIds[tocIds.length - 1]);
      return;
    }

    const navOffset = 180;
    let currentActive = headings[0].id || tocIds[0];

    for (let i = 0; i < headings.length; i++) {
      const heading = headings[i];
      const rect = heading.getBoundingClientRect();

      if (rect.top <= navOffset) {
        currentActive = heading.id || tocIds[i] || currentActive;
      } else {
        break;
      }
    }

    setActiveId(currentActive);
  }, [tocIds]);

  useEffect(() => {
    if (!tocIds.length) return;

    const onScroll = () => {
      if (tickingRef.current) return;
      tickingRef.current = true;
      window.requestAnimationFrame(() => {
        updateActiveToc();
        tickingRef.current = false;
      });
    };

    const onHashChange = () => updateActiveToc();
    document.addEventListener("scroll", onScroll, {
      capture: true,
      passive: true,
    });
    window.addEventListener("hashchange", onHashChange);
    const initTimer = window.setTimeout(updateActiveToc, 80);

    return () => {
      document.removeEventListener("scroll", onScroll, true);
      window.removeEventListener("hashchange", onHashChange);
      window.clearTimeout(initTimer);
    };
  }, [tocIds, updateActiveToc]);

  const [showBackToTop, setShowBackToTop] = useState(false);

  useEffect(() => {
    const checkScroll = () => {
      setShowBackToTop(window.scrollY > 160);
    };
    window.addEventListener("scroll", checkScroll, { passive: true });
    checkScroll();
    return () => window.removeEventListener("scroll", checkScroll);
  }, []);

  if (!tocItems.length) return null;

  return (
    <>
      {/* 1. 移动端专属：右下角矩形 Dock (含返回顶部与目录按钮) */}
      <motion.div
        initial={{ opacity: 0, x: 15 }}
        animate={{ opacity: 1, x: 0 }}
        className="lg:hidden fixed z-[90] flex flex-col items-center overflow-hidden rounded-l-xl rounded-r-none bg-background/90 backdrop-blur-2xl border-l border-y border-border/60 shadow-lg bottom-[calc(1.5rem+env(safe-area-inset-bottom))] right-0"
      >
        {/* 移动端返回顶部 */}
        <AnimatePresence>
          {showBackToTop && (
            <TooltipIconButton label="返回顶部" side="left">
              <motion.button
                type="button"
                aria-label="返回顶部"
                onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "34px" }}
                exit={{ opacity: 0, height: 0 }}
                whileTap={{ scale: 0.94 }}
                className="group flex h-[34px] w-[34px] items-center justify-center text-muted-foreground hover:bg-primary hover:text-primary-foreground transition-colors cursor-pointer"
              >
                <ChevronUp className="w-4 h-4 transition-transform group-hover:-translate-y-0.5" />
              </motion.button>
            </TooltipIconButton>
          )}
        </AnimatePresence>

        {showBackToTop && <div className="w-4 h-[1px] bg-border shrink-0" />}

        {/* 移动端 Toggle 按钮 */}
        <TooltipIconButton label={open ? "关闭目录" : "文章目录"} side="left">
          <motion.button
            type="button"
            aria-label={open ? "关闭目录" : "打开目录"}
            onClick={() => setOpen(!open)}
            whileTap={{ scale: 0.94 }}
            className={`group flex h-[34px] w-[34px] items-center justify-center transition-colors cursor-pointer rounded-full border border-border ${
              open
                ? "bg-neutral-2 text-accent"
                : "bg-paper text-neutral-7 hover:text-accent"
            }`}
          >
            <List className="w-4 h-4" />
          </motion.button>
        </TooltipIconButton>
      </motion.div>

      {/* 2. 桌面端专属：居中悬浮进度胶囊按钮 */}
      <div className="hidden lg:flex fixed z-[90] flex-col items-end gap-2 transition-all duration-300 top-[55%] -translate-y-1/2 right-6 xl:right-10">
        <TooltipIconButton label={open ? "关闭目录" : "文章目录"} side="left">
          <motion.button
            type="button"
            aria-label={open ? "关闭目录" : "打开目录"}
            onClick={() => setOpen(!open)}
            whileHover={{ scale: 1.03, y: -1 }}
            whileTap={{ scale: 0.95 }}
            className={`group relative flex items-center justify-center transition-all duration-300 h-9 px-3 rounded-full bg-paper/90 backdrop-blur-md border border-border shadow-xs text-neutral-7 hover:text-accent cursor-pointer ${
              open
                ? "border-accent/30 text-accent bg-neutral-2 opacity-0 pointer-events-none"
                : ""
            }`}
          >
            <List className="w-3.5 h-3.5 shrink-0" />
            <span className="text-label-12 font-medium tracking-tight ml-1.5 inline-block group-hover:text-accent">
              {progressLabel}
            </span>
          </motion.button>
        </TooltipIconButton>
      </div>

      {/* 3. 目录展开侧边栏 / 浮层 */}
      <AnimatePresence>
        {open && (
          <motion.aside
            id="floating-toc-panel"
            key="toc-panel"
            layout
            initial={{ opacity: 0, y: 12, scale: 0.98 }}
            animate={{
              opacity: 1,
              y: 0,
              scale: 1,
            }}
            exit={{ opacity: 0, y: 8, scale: 0.98 }}
            transition={{
              duration: 0.3,
              ease: [0.22, 1, 0.36, 1],
            }}
            className="fixed bottom-[calc(5.5rem+env(safe-area-inset-bottom))] right-2 sm:right-4 z-[105] flex max-h-[50vh] w-[min(85vw,290px)] flex-col overflow-hidden rounded-xl border border-border bg-paper/95 backdrop-blur-xl shadow-lg lg:relative lg:bottom-auto lg:right-auto lg:top-0 lg:max-h-[min(70vh,600px)] lg:w-[260px] lg:rounded-none lg:border-0 lg:border-l lg:border-border lg:bg-transparent lg:backdrop-blur-none lg:shadow-none select-none origin-bottom-right lg:origin-top-right"
          >
            {/* 顶栏控制组 */}
            <div className="flex items-center justify-between px-3 pt-2 pb-1 border-b border-border/40 lg:border-none">
              <h3 className="text-caption-10 font-semibold tracking-widest text-neutral-6 uppercase">
                {dictionary.toc.title || "目录"}
              </h3>
              <div className="flex items-center gap-1">
                <TooltipIconButton label="回到顶部" side="bottom">
                  <button
                    type="button"
                    onClick={() =>
                      window.scrollTo({ top: 0, behavior: "smooth" })
                    }
                    className="flex h-7 w-7 items-center justify-center rounded-full text-neutral-6 transition-colors hover:bg-neutral-2 hover:text-neutral-9"
                  >
                    <ArrowUp className="w-3.5 h-3.5" />
                  </button>
                </TooltipIconButton>

                <div className="w-px h-3 bg-border mx-0.5" />

                <TooltipIconButton label="关闭目录" side="bottom">
                  <button
                    type="button"
                    onClick={() => setOpen(false)}
                    className="flex h-7 w-7 items-center justify-center rounded-full text-neutral-6 transition-colors hover:bg-neutral-2 hover:text-accent"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </TooltipIconButton>
              </div>
            </div>

            {/* TOC 项目滚动区 */}
            <div className="flex flex-1 flex-col pl-0 pr-1 pt-1 pb-1 min-h-0">
              <nav
                ref={listContainerRef}
                className="no-scrollbar min-h-0 flex-1 overflow-y-auto pr-1"
              >
                <ul className="relative py-1 space-y-0.5">
                  {tocItems.map((item, index) => {
                    const isActive = activeId === item.targetId;
                    return (
                      <li
                        key={`${item.url}-${index}`}
                        className="relative leading-normal"
                      >
                        <a
                          href={item.url}
                          data-target={item.targetId}
                          aria-current={isActive ? "location" : undefined}
                          onClick={() => {
                            if (window.innerWidth < 640) {
                              setOpen(false);
                            }
                          }}
                          className={`group relative flex items-center rounded-md px-2.5 py-1 text-label-12 transition-colors duration-200 ${
                            isActive
                              ? "bg-neutral-2 text-accent font-medium"
                              : "font-normal text-neutral-7 hover:text-neutral-10 hover:bg-neutral-2/50"
                          }`}
                        >
                          <span
                            className={
                              isActive
                                ? "whitespace-normal break-words font-medium text-accent"
                                : "truncate"
                            }
                            style={{
                              paddingLeft: `${Math.max(0, item.depth - 2) * 10}px`,
                              fontSize: item.depth === 2 ? "12.5px" : "11.5px",
                            }}
                          >
                            {item.value}
                          </span>
                        </a>
                      </li>
                    );
                  })}
                </ul>
              </nav>
            </div>
          </motion.aside>
        )}
      </AnimatePresence>
    </>
  );
}
