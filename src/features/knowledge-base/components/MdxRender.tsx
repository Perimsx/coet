"use client";

import { useEffect, useLayoutEffect, useRef, useState, useCallback } from "react";
import * as Dialog from "@radix-ui/react-dialog";

interface MDXRenderProps {
  content: string;
}

function appendWindowDots(container: HTMLElement) {
  ["bg-red-400/70", "bg-amber-400/70", "bg-emerald-400/70"].forEach((colorClass) => {
    const dot = document.createElement("div");
    dot.className = `w-[9px] h-[9px] rounded-full ${colorClass}`;
    container.appendChild(dot);
  });
}

export default function MDXRender({ content }: MDXRenderProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const closeButtonRef = useRef<HTMLButtonElement>(null);
  const imagesRef = useRef<string[]>([]);
  const lastFocusedImageRef = useRef<HTMLImageElement | null>(null);
  const [activeImageIndex, setActiveImageIndex] = useState<number | null>(null);
  const [activeImageUrl, setActiveImageUrl] = useState<string | null>(null);
  const [imageCount, setImageCount] = useState(0);

  const goToImage = useCallback((delta: number) => {
    setActiveImageIndex((prev) => {
      if (prev === null || imagesRef.current.length === 0) return prev;
      const next = (prev + delta + imagesRef.current.length) % imagesRef.current.length;
      return next;
    });
  }, []);

  // Derive active image URL and count from ref inside an effect (not during render)
  useEffect(() => {
    setImageCount(imagesRef.current.length);
    if (activeImageIndex !== null) {
      setActiveImageUrl(imagesRef.current[activeImageIndex] ?? null);
    } else {
      setActiveImageUrl(null);
    }
  }, [activeImageIndex, content]);

  useEffect(() => {
    if (activeImageIndex === null) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "ArrowLeft") goToImage(-1);
      if (e.key === "ArrowRight") goToImage(1);
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [activeImageIndex, goToImage]);

  // 恢复焦点到触发灯箱的图片，增加防丢失退回策略
  useEffect(() => {
    if (activeImageIndex === null) {
      const img = lastFocusedImageRef.current;
      if (img && document.body.contains(img)) {
        img.focus?.();
      } else {
        const article = document.getElementById("article");
        article?.focus?.();
      }
    }
  }, [activeImageIndex]);

  useLayoutEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    // Collect cleanup functions for event listeners
    const cleanups: (() => void)[] = [];
    let rafId = 0;
    let timer1: ReturnType<typeof setTimeout> | null = null;
    let timer2: ReturnType<typeof setTimeout> | null = null;

    // ── 事件委托：移动端代码块触摸事件统一监听 ────────────────
    const handleContainerTouch = (e: Event) => {
      const target = e.target as HTMLElement;
      const wrapper = target.closest?.(".code-block-wrapper");
      if (!wrapper) {
        // 点击非代码块区域时，隐藏所有复制按钮
        el.querySelectorAll<HTMLButtonElement>(".copy-btn").forEach((btn) => {
          btn.style.opacity = "";
          btn.style.pointerEvents = "";
        });
        return;
      }
      // 如果点击的是按钮本身，不处理
      if (target.closest?.(".copy-btn")) return;
      // 显示当前代码块的复制按钮
      const btn = wrapper.querySelector<HTMLButtonElement>(".copy-btn");
      if (btn) {
        btn.style.opacity = "1";
        btn.style.pointerEvents = "auto";
      }
      // 隐藏其他代码块的复制按钮
      el.querySelectorAll<HTMLDivElement>(".code-block-wrapper").forEach((otherWrapper) => {
        if (otherWrapper !== wrapper) {
          const otherBtn = otherWrapper.querySelector<HTMLButtonElement>(".copy-btn");
          if (otherBtn) {
            otherBtn.style.opacity = "";
            otherBtn.style.pointerEvents = "";
          }
        }
      });
    };
    el.addEventListener("touchstart", handleContainerTouch, { passive: true });
    cleanups.push(() => el.removeEventListener("touchstart", handleContainerTouch));

    // ── 标题：rehype-slug 与 rehype-autolink-headings 在构建时已处理 ────────

    // ── 表格：添加横向滚动容器 ──────────────────────────
    el.querySelectorAll("table").forEach((table) => {
      if (table.parentElement?.classList.contains("table-container")) return;
      const wrapper = document.createElement("div");
      wrapper.className =
        "table-container overflow-x-auto w-full border-t border-b border-divider my-6";
      table.parentNode?.insertBefore(wrapper, table);
      wrapper.appendChild(table);
    });

    // ── 事件委托：容器级 click 事件监听复制功能 ────────────────
    const handleContainerClick = async (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      const btn = target.closest(".copy-btn") as HTMLButtonElement | null;
      if (!btn) return;

      e.preventDefault();
      e.stopPropagation();

      const wrapper = btn.closest(".code-block-wrapper");
      if (!wrapper) return;

      const pre = wrapper.querySelector("pre");
      if (!pre) return;

      const code = pre.querySelector("code")?.textContent ?? pre.textContent ?? "";
      const textToCopy = code.trim();

      try {
        if (navigator.clipboard && window.isSecureContext) {
          await navigator.clipboard.writeText(textToCopy);
        } else {
          // Fallback 兼容局域网裸 IP / 非 HTTPS 环境
          const textArea = document.createElement("textarea");
          textArea.value = textToCopy;
          textArea.style.position = "absolute";
          textArea.style.left = "-9999px";
          textArea.style.top = "0";
          textArea.setAttribute("readonly", ""); // 防止 iOS 弹出软键盘
          document.body.appendChild(textArea);

          // 兼容 iOS 选择范围
          const isiOS = navigator.userAgent.match(/ipad|iphone/i);
          if (isiOS) {
            const range = document.createRange();
            range.selectNodeContents(textArea);
            const selection = window.getSelection();
            if (selection) {
              selection.removeAllRanges();
              selection.addRange(range);
            }
            textArea.setSelectionRange(0, 999999);
          } else {
            textArea.select();
          }

          const successful = document.execCommand("copy");
          document.body.removeChild(textArea);
          if (!successful) {
            throw new Error("execCommand copy failed");
          }
        }

        const originalText = btn.textContent;
        btn.textContent = "Copied";
        btn.classList.add("!text-emerald-500");
        setTimeout(() => {
          btn.textContent = originalText;
          btn.classList.remove("!text-emerald-500");
        }, 1800);
      } catch (err) {
        console.error("Copy failed:", err);
        const originalText = btn.textContent;
        btn.textContent = "Error";
        btn.classList.add("!text-rose-500");
        setTimeout(() => {
          btn.textContent = originalText;
          btn.classList.remove("!text-rose-500");
        }, 1800);
      }
    };
    el.addEventListener("click", handleContainerClick);
    cleanups.push(() => el.removeEventListener("click", handleContainerClick));

    const applyEnhancements = () => {
      // ── 代码块：样式 + 复制按钮 (适配 rehype-pretty-code) ────────────────
      el.querySelectorAll("figure[data-rehype-pretty-code-figure]").forEach((figure) => {
        // 自适应幂等防重：如果已经注入过复制按钮，直接跳过
        if (figure.querySelector(".copy-btn")) return;

        // 1. 设置 figure wrapper 样式 (解耦为 CSS 变量)
        figure.className =
          "code-block-wrapper relative my-5 flex flex-col " +
          "border border-[var(--code-wrapper-border)] rounded-lg overflow-hidden bg-[var(--code-wrapper-bg,#282c34)] shadow-sm select-text";

        const pres = figure.querySelectorAll("pre");
        if (pres.length === 0) return;

        // 2. 清理并设置内部所有 pre 样式，让 wrapper 统一边框和背景
        pres.forEach((pre) => {
          pre.className = "overflow-x-auto text-[14px] sm:text-[15px] scrollbar-thin !m-0 !py-4 !bg-transparent";
          pre.style.border = "none";
          pre.style.borderRadius = "0";
        });

        const lang = pres[0].getAttribute("data-language") || "text";

        // 3. 创建复制按钮
        const btn = document.createElement("button");
        btn.type = "button";
        btn.className =
          "copy-btn text-[10px] font-mono font-medium text-foreground/40 hover:text-foreground/75 " +
          "transition-all duration-200 cursor-pointer active:scale-95 px-1.5 py-0.5 rounded hover:bg-foreground/5";
        btn.textContent = "Copy";
        btn.setAttribute("aria-label", "复制代码");

        // 4. 判断并丰富 Header 顶栏
        const figcaption = figure.querySelector("figcaption");
        if (figcaption) {
          // 有文件名
          figcaption.className = "flex items-center justify-between px-3 py-1.5 border-b border-divider/30 bg-muted/20 select-none text-[10px] font-mono font-semibold text-foreground/40";

          // 创建左侧群组 (小圆点 + 文件名)
          const leftGroup = document.createElement("div");
          leftGroup.className = "flex items-center gap-2.5";

          const dots = document.createElement("div");
          dots.className = "flex items-center gap-1.5";
          appendWindowDots(dots);
          leftGroup.appendChild(dots);

          // 文件名标签
          const fileNameSpan = document.createElement("span");
          fileNameSpan.className = "text-[10px] font-mono font-semibold text-foreground/45 uppercase tracking-wider";
          fileNameSpan.textContent = figcaption.textContent || "";
          leftGroup.appendChild(fileNameSpan);

          figcaption.replaceChildren();
          figcaption.appendChild(leftGroup);
          figcaption.appendChild(btn);
        } else {
          // 无文件名，创建一个极简顶栏
          const header = document.createElement("div");
          header.className = "flex items-center justify-between px-3 py-1.5 border-b border-divider/30 bg-muted/20 select-none";

          const leftGroup = document.createElement("div");
          leftGroup.className = "flex items-center gap-2.5";

          const dots = document.createElement("div");
          dots.className = "flex items-center gap-1.5";
          appendWindowDots(dots);
          leftGroup.appendChild(dots);

          const langLabel = document.createElement("span");
          langLabel.className = "text-[10px] font-mono font-semibold text-foreground/45 uppercase tracking-widest";
          langLabel.textContent = lang;
          leftGroup.appendChild(langLabel);

          header.appendChild(leftGroup);
          header.appendChild(btn);

          // 插入在第一个 pre 之前
          figure.insertBefore(header, pres[0]);
        }
      });

      // ── 提示框 (Alert / Callout)：将 > [!NOTE] 转化为美观的卡片 ────
      el.querySelectorAll("blockquote").forEach((bq) => {
        const html = bq.innerHTML;
        const match = html.match(/\[!(NOTE|TIP|IMPORTANT|WARNING|CAUTION)\]/i);
        if (match) {
          const type = match[1].toUpperCase();

          const cleanHtml = html
            .replace(/\[!(NOTE|TIP|IMPORTANT|WARNING|CAUTION)\]\s*(<br\s*\/?>)?/i, "")
            .replace(/<p>\[!(NOTE|TIP|IMPORTANT|WARNING|CAUTION)\]\s*/i, "<p>")
            .trim();

          bq.innerHTML = cleanHtml;
          bq.className = "my-6 p-4.5 border-l-4 rounded-r-sm select-text transition-all duration-300 ease-out font-sans text-sm leading-relaxed hover:-translate-y-px hover:shadow-sm";

          if (type === "NOTE") {
            bq.classList.add("bg-blue-500/[0.03]", "border-blue-500/80", "text-foreground/90", "dark:bg-blue-400/[0.02]");
          } else if (type === "TIP") {
            bq.classList.add("bg-accent/[0.03]", "border-accent/80", "text-foreground/90", "dark:bg-accent/[0.02]");
          } else if (type === "IMPORTANT") {
            bq.classList.add("bg-purple-500/[0.03]", "border-purple-500/80", "text-foreground/90", "dark:bg-purple-400/[0.02]");
          } else if (type === "WARNING") {
            bq.classList.add("bg-amber-500/[0.03]", "border-amber-500/80", "text-foreground/90", "dark:bg-amber-400/[0.02]");
          } else if (type === "CAUTION") {
            bq.classList.add("bg-rose-500/[0.03]", "border-rose-500/80", "text-foreground/90", "dark:bg-rose-400/[0.02]");
          }
        }
      });

      // ── 提示折叠卡片 (details/summary)：习题与解析卡片化 ────────
      el.querySelectorAll("details").forEach((details) => {
        details.className = "my-5 border border-divider/50 rounded-sm bg-foreground/[0.003] dark:bg-white/[0.002] overflow-hidden transition-all duration-300 ease-out hover:border-divider hover:shadow-[0_2px_10px_rgba(0,0,0,0.02)]";

        const summary = details.querySelector("summary");
        if (summary) {
          summary.className = "px-4 py-3 font-sans text-xs font-bold tracking-wider text-foreground/75 cursor-pointer hover:bg-foreground/[0.015] focus:outline-none transition-colors border-b border-transparent select-none list-none [&::-webkit-details-marker]:hidden flex items-center gap-2";

          // 动态添加一个展开小箭头
          if (!summary.querySelector(".marker-icon")) {
            const marker = document.createElement("span");
            marker.className = "marker-icon transition-transform duration-300 text-foreground/30";
            marker.textContent = "▶";
            marker.style.fontSize = "8px";
            marker.style.display = "inline-block";
            summary.insertBefore(marker, summary.firstChild);

            const handleToggle = () => {
              if (details.open) {
                summary.classList.add("border-divider/30");
                marker.style.transform = "rotate(90deg)";
              } else {
                summary.classList.remove("border-divider/30");
                marker.style.transform = "rotate(0deg)";
              }
            };

            details.addEventListener("toggle", handleToggle);
            cleanups.push(() => details.removeEventListener("toggle", handleToggle));
          }
        }
      });

      // ── 图片灯箱 (Lightbox)：点击图片进行大图毛玻璃放大 ────────
      const allImages = Array.from(el.querySelectorAll("img")).map((img) => img.src);
      imagesRef.current = allImages;

      el.querySelectorAll("img").forEach((img) => {
        img.style.cursor = "zoom-in";
        img.setAttribute("tabindex", "0");
        img.setAttribute("role", "button");
        img.setAttribute("aria-label", "点击放大图片");

        if (img.dataset.lightboxBound === "true") return;
        img.dataset.lightboxBound = "true";

        const handleClick = () => {
          lastFocusedImageRef.current = img;
          const idx = allImages.indexOf(img.src);
          setActiveImageIndex(idx >= 0 ? idx : 0);
        };

        const handleKeyDown = (e: KeyboardEvent) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            handleClick();
          }
        };

        img.addEventListener("click", handleClick);
        img.addEventListener("keydown", handleKeyDown);
        cleanups.push(() => {
          delete img.dataset.lightboxBound;
          img.removeEventListener("click", handleClick);
          img.removeEventListener("keydown", handleKeyDown);
        });
      });
    };

    applyEnhancements();
    rafId = window.requestAnimationFrame(applyEnhancements);
    timer1 = setTimeout(applyEnhancements, 120);
    timer2 = setTimeout(applyEnhancements, 360);

    // Cleanup all event listeners on unmount or content change
    return () => {
      window.cancelAnimationFrame(rafId);
      if (timer1) clearTimeout(timer1);
      if (timer2) clearTimeout(timer2);
      cleanups.forEach((fn) => fn());
    };
  }, [content]);

  return (
    <>
      <div
        ref={containerRef}
        className={[
          "article-detail prose dark:prose-invert max-w-none",
          "prose-headings:font-sans prose-headings:font-semibold prose-headings:tracking-tight",
          "prose-h1:text-3xl prose-h1:mb-8",
          "prose-h2:pb-2",
          "prose-p:text-foreground/80",
          "prose-a:no-underline prose-a:border-b prose-a:border-divider",
          "prose-a:transition-colors prose-a:duration-150",
          "hover:prose-a:border-foreground",
          "prose-ul:list-disc prose-ul:pl-6 prose-ol:list-decimal prose-ol:pl-6",
          "prose-li:text-foreground/80",
          "prose-blockquote:pl-4 prose-blockquote:italic prose-blockquote:text-foreground/50",
          "prose-blockquote:not-italic",
          "prose-table:w-full prose-table:text-sm prose-table:text-left",
          "prose-th:font-semibold prose-th:border-b prose-th:border-divider",
          "prose-td:border-b prose-td:border-divider/50",
          "prose-img:max-w-full prose-img:border prose-img:border-divider prose-img:my-6",
          "prose-code:text-foreground/90",
          "prose-code:bg-muted/60",
          "prose-code:px-1.5 prose-code:py-0.5 prose-code:rounded-sm prose-code:text-[0.85em]",
          "prose-code:font-mono prose-code:before:content-none prose-code:after:content-none",
          "[&_pre_code]:!text-[1em] [&_pre_code]:!bg-transparent [&_pre_code]:!p-0",
          "selection:bg-accent/20"
        ].join(" ")}
        dangerouslySetInnerHTML={{ __html: content }}
      />

      {/* 极简磨砂大图 Lightbox 弹出层 (使用 Radix Dialog 托管滚动锁和焦点捕获) */}
      <Dialog.Root open={activeImageIndex !== null} onOpenChange={(open) => { if (!open) setActiveImageIndex(null); }}>
        <Dialog.Portal>
          <Dialog.Overlay className="fixed inset-0 z-[100] bg-black/80 backdrop-blur-md animate-fade-in-overlay no-print" />
          <Dialog.Content
            className="fixed inset-0 z-[100] flex items-center justify-center focus:outline-none no-print"
          >
            <Dialog.Title className="sr-only">图片预览</Dialog.Title>
            <Dialog.Description className="sr-only">放大预览当前文章内的插图</Dialog.Description>

            <Dialog.Close
              type="button"
              ref={closeButtonRef}
              className="absolute top-4 right-4 w-11 h-11 flex items-center justify-center text-white/80 hover:text-white transition-colors rounded-full hover:bg-white/10 focus:outline-none"
              aria-label="关闭预览"
            >
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </Dialog.Close>

            {/* 左箭头 */}
            {imageCount > 1 && (
              <button
                type="button"
                className="absolute left-3 top-1/2 -translate-y-1/2 w-11 h-11 flex items-center justify-center text-white/70 hover:text-white transition-colors rounded-full hover:bg-white/10 focus:outline-none"
                onClick={(e) => { e.stopPropagation(); goToImage(-1); }}
                aria-label="上一张图片"
              >
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="15 18 9 12 15 6" />
                </svg>
              </button>
            )}

            {/* 右箭头 */}
            {imageCount > 1 && (
              <button
                type="button"
                className="absolute right-3 top-1/2 -translate-y-1/2 w-11 h-11 flex items-center justify-center text-white/70 hover:text-white transition-colors rounded-full hover:bg-white/10 focus:outline-none"
                onClick={(e) => { e.stopPropagation(); goToImage(1); }}
                aria-label="下一张图片"
              >
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="9 18 15 12 9 6" />
                </svg>
              </button>
            )}

            {activeImageUrl && (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={activeImageUrl}
                alt="放大预览"
                className="max-w-[90vw] max-h-[90vh] object-contain transition-opacity duration-200"
                onLoad={(e) => { e.currentTarget.style.opacity = "1"; }}
                style={{ opacity: 0 }}
              />
            )}
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>
    </>
  );
}
