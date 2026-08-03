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

        {showBackToTop && <div className="w-5 h-[1px] bg-border/60 shrink-0" />}

        {/* 移动端 Toggle 按钮 */}
        <TooltipIconButton label={open ? "关闭目录" : "文章目录"} side="left">
          <motion.button
            type="button"
            aria-label={open ? "关闭目录" : "打开目录"}
            onClick={() => setOpen(!open)}
            whileTap={{ scale: 0.94 }}
            className={`group flex h-[34px] w-[34px] items-center justify-center transition-colors cursor-pointer ${
              open
                ? "bg-primary text-primary-foreground shadow-xs"
                : "text-muted-foreground hover:bg-primary hover:text-primary-foreground"
            }`}
          >
            <List className="w-4 h-4" />
          </motion.button>
        </TooltipIconButton>
      </motion.div>

      {/* 2. 桌面端专属：居中悬浮进度胶囊按钮 (仅在目录被折叠隐藏时显示) */}
      <div className="hidden lg:flex fixed z-[90] flex-col items-end gap-2.5 transition-all duration-500 top-[55%] -translate-y-1/2 right-6 xl:right-10">
        <TooltipIconButton label={open ? "关闭目录" : "文章目录"} side="left">
          <motion.button
            type="button"
            aria-label={open ? "关闭目录" : "打开目录"}
            onClick={() => setOpen(!open)}
            whileHover={{ scale: 1.05, y: -2 }}
            whileTap={{ scale: 0.92 }}
            className={`group relative flex items-center justify-center transition-all duration-500 h-12 min-w-[52px] px-3.5 rounded-full bg-background/90 backdrop-blur-xl border border-border/60 shadow-md text-muted-foreground hover:text-primary cursor-pointer ${
              open
                ? "border-primary/25 text-primary bg-primary/15 opacity-0 pointer-events-none"
                : ""
            }`}
          >
            <List className="w-4 h-4 shrink-0" />
            <span className="text-[14px] font-black tracking-tighter transition-colors ml-2 inline-block group-hover:text-primary">
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
            initial={{ opacity: 0, y: 20, scale: 0.98, filter: "blur(4px)" }}
            animate={{
              opacity: 1,
              y: 0,
              scale: 1,
              filter: "blur(0px)",
            }}
            exit={{ opacity: 0, y: 10, scale: 0.98, filter: "blur(4px)" }}
            transition={{
              duration: 0.5,
              ease: [0.16, 1, 0.3, 1],
              layout: { duration: 0.4, ease: [0.16, 1, 0.3, 1] },
            }}
            className="fixed bottom-[calc(5.5rem+env(safe-area-inset-bottom))] right-1.5 sm:right-3 z-[105] flex max-h-[50vh] w-[min(85vw,300px)] flex-col overflow-hidden rounded-2xl border border-border/60 bg-background/95 backdrop-blur-3xl shadow-xl lg:relative lg:bottom-auto lg:right-auto lg:top-0 lg:max-h-[min(70vh,600px)] lg:w-[270px] lg:rounded-none lg:rounded-bl-2xl lg:border-0 lg:border-l lg:border-border/50 lg:bg-transparent lg:backdrop-blur-none lg:shadow-none select-none will-change-transform will-change-opacity origin-bottom-right lg:origin-top-right"
          >
            {/* 顶栏控制组 */}
            <div className="flex items-center justify-between px-3 pt-1.5 pb-0">
              <h3 className="text-[14px] font-bold tracking-tight text-foreground">
                {dictionary.toc.title || "目录"}
              </h3>
              <div className="flex items-center gap-1.5">
                <TooltipIconButton label="回到顶部" side="bottom">
                  <button
                    type="button"
                    onClick={() =>
                      window.scrollTo({ top: 0, behavior: "smooth" })
                    }
                    className="flex h-8 w-8 items-center justify-center rounded-full text-muted-foreground transition-all hover:bg-muted hover:text-foreground"
                  >
                    <ArrowUp className="w-4 h-4" />
                  </button>
                </TooltipIconButton>

                <div className="w-px h-3 bg-border/60 mx-0.5" />

                <TooltipIconButton label="关闭目录" side="bottom">
                  <button
                    type="button"
                    onClick={() => setOpen(false)}
                    className="flex h-8 w-8 items-center justify-center rounded-full text-muted-foreground transition-all hover:bg-red-500/10 hover:text-red-500"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </TooltipIconButton>
              </div>
            </div>

            {/* TOC 项目滚动区 */}
            <div className="flex flex-1 flex-col pl-0 pr-1.5 pt-0 pb-0 min-h-0 sm:pr-2">
              <nav
                ref={listContainerRef}
                className="no-scrollbar min-h-0 flex-1 overflow-y-auto pr-1 [mask-image:linear-gradient(to_bottom,transparent,black_24px,black_calc(100%-24px),transparent)]"
              >
                <motion.ul
                  initial="hidden"
                  animate="visible"
                  variants={{
                    visible: {
                      transition: {
                        staggerChildren: 0.03,
                        delayChildren: 0.1,
                      },
                    },
                  }}
                  className="relative py-1.5 space-y-0.5"
                >
                  {tocItems.map((item, index) => {
                    const isActive = activeId === item.targetId;
                    return (
                      <motion.li
                        key={`${item.url}-${index}`}
                        variants={{
                          hidden: { opacity: 0, x: 10 },
                          visible: { opacity: 1, x: 0 },
                        }}
                        transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
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
                          className={`group relative flex items-center rounded-lg px-2.5 py-1.5 transition-all duration-200 ${
                            isActive
                              ? "bg-primary/[0.06] dark:bg-primary/[0.12] text-primary font-semibold"
                              : "font-normal text-muted-foreground/80 hover:text-foreground hover:bg-muted/40"
                          }`}
                        >
                          <span
                            className={
                              isActive
                                ? "whitespace-normal break-words font-semibold text-primary"
                                : "truncate"
                            }
                            style={{
                              paddingLeft: `${Math.max(0, item.depth - 2) * 12}px`,
                              fontSize: item.depth === 2 ? "13px" : "12px",
                            }}
                          >
                            {item.value}
                          </span>
                        </a>
                      </motion.li>
                    );
                  })}
                </motion.ul>
              </nav>
            </div>
          </motion.aside>
        )}
      </AnimatePresence>
    </>
  );
}
