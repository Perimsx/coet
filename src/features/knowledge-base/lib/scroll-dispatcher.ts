/**
 * 知识库滚动事件协调调度器。
 * 优先监听中间正文滚动容器，回退到 window，避免多个组件各自绑定 scroll listener。
 */

type ScrollState = {
  scrollY: number;
  scrollHeight: number;
  clientHeight: number;
  target: HTMLElement | Window;
};

type ScrollCallback = (state: ScrollState) => void;

const listeners = new Set<ScrollCallback>();
let scrollTarget: HTMLElement | Window | null = null;
let ticking = false;

const getScrollTarget = (): HTMLElement | Window => {
  return document.getElementById("main-content") || window;
};

const getScrollState = (): ScrollState => {
  const target = getScrollTarget();

  if (target instanceof HTMLElement) {
    return {
      scrollY: target.scrollTop,
      scrollHeight: target.scrollHeight,
      clientHeight: target.clientHeight,
      target,
    };
  }

  return {
    scrollY: window.scrollY || document.documentElement.scrollTop,
    scrollHeight: document.documentElement.scrollHeight,
    clientHeight: document.documentElement.clientHeight,
    target,
  };
};

const handleScroll = () => {
  if (!ticking) {
    ticking = true;
    window.requestAnimationFrame(() => {
      const state = getScrollState();
      listeners.forEach((listener) => {
        try {
          listener(state);
        } catch (e) {
          console.error("Error in scroll listener callback:", e);
        }
      });
      ticking = false;
    });
  }
};

const ensureListening = () => {
  if (typeof window === "undefined") return;

  const nextTarget = getScrollTarget();
  if (scrollTarget === nextTarget) return;

  if (scrollTarget) {
    scrollTarget.removeEventListener("scroll", handleScroll);
  }

  scrollTarget = nextTarget;
  scrollTarget.addEventListener("scroll", handleScroll, { passive: true });
};

export const subscribeScroll = (callback: ScrollCallback) => {
  if (typeof window === "undefined") {
    return () => {};
  }

  listeners.add(callback);
  ensureListening();
  // 立即以当前值触发一次以保证状态同步
  callback(getScrollState());

  return () => {
    listeners.delete(callback);
    if (listeners.size === 0 && scrollTarget) {
      scrollTarget.removeEventListener("scroll", handleScroll);
      scrollTarget = null;
    }
  };
};
