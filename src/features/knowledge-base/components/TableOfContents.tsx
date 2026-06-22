"use client";

import { useEffect, useState, useMemo, useRef } from "react";
import { useUIModal, useTOC, VeliteTocItem } from '@/features/knowledge-base/context/ui-context';
import { subscribeScroll } from '@/features/knowledge-base/lib/scroll-dispatcher';

interface TableOfContentsProps {
  toc?: VeliteTocItem[];
  onNavigate?: () => void;
}

// 移动端 Header 高度 + 额外偏移
const SCROLL_OFFSET = 72;

function getMainScrollRoot() {
  return document.getElementById("main-content");
}

function getScrollMetrics(scrollState?: { scrollY: number; scrollHeight: number; clientHeight: number }) {
  if (scrollState) return scrollState;

  const scrollRoot = getMainScrollRoot();
  if (scrollRoot) {
    return {
      scrollY: scrollRoot.scrollTop,
      scrollHeight: scrollRoot.scrollHeight,
      clientHeight: scrollRoot.clientHeight,
    };
  }

  return {
    scrollY: window.scrollY || document.documentElement.scrollTop,
    scrollHeight: document.documentElement.scrollHeight,
    clientHeight: document.documentElement.clientHeight,
  };
}

function getTocDisplayTitle(title: string) {
  const cleaned = title
    .replace(/^\s*第[一二三四五六七八九十百千万\d]+[章节篇部分][：:\s]*/, "")
    .replace(/^\s*[（(]\d{1,3}[）)]\s*/, "")
    .replace(/^\s*\d{1,3}(?:[.．]\d{1,3})*[.．、:：)、)]\s*/, "")
    .replace(/^\s*\d{1,3}(?=[\u4e00-\u9fa5A-Za-z])/, "")
    .trim();

  return cleaned || title;
}

interface TableOfContentsContentProps {
  toc: VeliteTocItem[];
  onNavigate?: () => void;
}

export default function TableOfContents({ toc: propToc, onNavigate }: TableOfContentsProps) {
  if (propToc) {
    return <TableOfContentsContent toc={propToc} onNavigate={onNavigate} />;
  }

  return <TableOfContentsFromContext />;
}

function TableOfContentsFromContext() {
  const { currentToc } = useTOC();
  const { setIsMobileTOCOpen } = useUIModal();

  return (
    <TableOfContentsContent
      toc={currentToc}
      onNavigate={() => setIsMobileTOCOpen(false)}
    />
  );
}

function TableOfContentsContent({ toc, onNavigate }: TableOfContentsContentProps) {
  const [activeId, setActiveId] = useState<string>("");
  const isClickScrollingRef = useRef(false);
  const cleanupScrollEndRef = useRef<(() => void) | null>(null);

  useEffect(() => {
    return () => {
      if (cleanupScrollEndRef.current) {
        cleanupScrollEndRef.current();
      }
    };
  }, []);

  // 将树状 toc 拍平
  const flatToc = useMemo(() => {
    const result: { title: string; url: string; depth: number }[] = [];
    const traverse = (list: VeliteTocItem[], depth = 2) => {
      list.forEach((item) => {
        result.push({ title: item.title, url: item.url, depth });
        if (item.items?.length) traverse(item.items, depth + 1);
      });
    };
    if (toc) traverse(toc);
    return result;
  }, [toc]);

  useEffect(() => {
    if (flatToc.length === 0) return;

    const ids = flatToc.map((item) => item.url.replace(/^#/, ""));
    let cachedElements: HTMLElement[] = [];

    // 获取 DOM 标题元素
    const getElements = () => {
      if (cachedElements.length > 0 && cachedElements.every((el) => document.body.contains(el))) return cachedElements;
      cachedElements = ids
        .map((id) => document.getElementById(id))
        .filter((el): el is HTMLElement => el !== null);
      return cachedElements;
    };

    const handleScroll = (scrollState?: { scrollY: number; scrollHeight: number; clientHeight: number }) => {
      if (isClickScrollingRef.current) return;
      const elements = getElements();
      if (elements.length === 0) return;

      // 1. 触底判定：若已滑到页面最底部，直接高亮最后一个标题
      const { scrollY, scrollHeight, clientHeight } = getScrollMetrics(scrollState);
      const isScrollable = scrollHeight > clientHeight + 30;
      const isAtBottom = isScrollable && clientHeight + scrollY >= scrollHeight - 30;

      if (isAtBottom) {
        setActiveId(`#${elements[elements.length - 1].id}`);
        return;
      }

      // 2. 判定线高亮跟随：越过判定线且最靠近判定线的标题
      const scrollRoot = getMainScrollRoot();
      const triggerLine = (scrollRoot?.getBoundingClientRect().top ?? 0) + SCROLL_OFFSET + 30;
      let currentActive = "";

      for (let i = 0; i < elements.length; i++) {
        const el = elements[i];
        const rect = el.getBoundingClientRect();
        // 如果该标题顶部已经越过判定线
        if (rect.top <= triggerLine) {
          currentActive = `#${el.id}`;
        } else {
          // 由于标题是顺序排列的，一旦遇到没越过判定线的，就可以结束循环了
          break;
        }
      }

      // 如果没有任何标题越过判定线，默认高亮第一个标题
      if (!currentActive && elements.length > 0) {
        currentActive = `#${elements[0].id}`;
      }

      if (currentActive) {
        setActiveId(currentActive);
      }
    };

    // 初始执行，并延迟以保证 MDX 渲染完毕后 id 已被注入
    handleScroll();
    const timer1 = setTimeout(handleScroll, 100);
    const timer2 = setTimeout(handleScroll, 400);

    const unsubscribe = subscribeScroll((state) => {
      handleScroll(state);
    });

    return () => {
      unsubscribe();
      clearTimeout(timer1);
      clearTimeout(timer2);
    };
  }, [flatToc]);

  const handleLinkClick = (
    e: React.MouseEvent<HTMLAnchorElement>,
    url: string
  ) => {
    e.preventDefault();
    const id = url.replace(/^#/, "");
    const el = document.getElementById(id);
    if (el) {
      isClickScrollingRef.current = true;
      setActiveId(url);

      const scrollRoot = getMainScrollRoot();
      const behavior = window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth';
      if (scrollRoot) {
        const rootRect = scrollRoot.getBoundingClientRect();
        const top = scrollRoot.scrollTop + el.getBoundingClientRect().top - rootRect.top - SCROLL_OFFSET;
        scrollRoot.scrollTo({ top, behavior });
      } else {
        const top = el.getBoundingClientRect().top + window.scrollY - SCROLL_OFFSET;
        window.scrollTo({ top, behavior });
      }
      window.history.pushState(null, "", url);
      onNavigate?.();

      if (cleanupScrollEndRef.current) {
        cleanupScrollEndRef.current();
      }

      let safariDebounceTimer: ReturnType<typeof setTimeout> | null = null;
      const scrollTarget: HTMLElement | Window = scrollRoot || window;
      const safariScrollFallback = () => {
        if (safariDebounceTimer) clearTimeout(safariDebounceTimer);
        safariDebounceTimer = setTimeout(() => {
          isClickScrollingRef.current = false;
          scrollTarget.removeEventListener("scroll", safariScrollFallback);
          cleanupScrollEndRef.current = null;
        }, 500); // 调高至 500ms
      };

      const handleScrollEnd = () => {
        setTimeout(() => {
          isClickScrollingRef.current = false;
        }, 50);
        scrollTarget.removeEventListener("scrollend", handleScrollEnd);
        cleanupScrollEndRef.current = null;
      };

      const hasScrollEnd = typeof window !== "undefined" && "onscrollend" in (scrollTarget as unknown as Record<string, unknown>);
      if (hasScrollEnd) {
        scrollTarget.addEventListener("scrollend", handleScrollEnd);
        cleanupScrollEndRef.current = () => {
          scrollTarget.removeEventListener("scrollend", handleScrollEnd);
        };
      } else {
        scrollTarget.addEventListener("scroll", safariScrollFallback, { passive: true });
        cleanupScrollEndRef.current = () => {
          if (safariDebounceTimer) clearTimeout(safariDebounceTimer);
          scrollTarget.removeEventListener("scroll", safariScrollFallback);
        };
      }
    }
  };

  if (flatToc.length === 0) return null;

  return (
    <div className="w-full flex flex-col py-4 select-none">
      <h3 className="text-[11px] font-bold tracking-widest text-foreground/45 uppercase px-2 mb-2">
        On This Page
      </h3>
      <div className="flex flex-col border-l border-divider">
        {flatToc.map((item) => {
          const isActive = activeId === item.url;
          const pl =
            item.depth === 3 ? "pl-5" : item.depth >= 4 ? "pl-8" : "pl-3";

          return (
            <a
              key={item.url}
              href={item.url}
              onClick={(e) => handleLinkClick(e, item.url)}
              className={`block -ml-px border-l text-[12px] py-0.5 pr-2 transition-all duration-150 focus:outline-none ${pl} ${
                isActive
                  ? "border-foreground font-semibold text-foreground"
                  : "border-transparent text-foreground/50 hover:text-foreground hover:border-divider"
              }`}
            >
              <span className="block truncate leading-snug">{getTocDisplayTitle(item.title)}</span>
            </a>
          );
        })}
      </div>
    </div>
  );
}
