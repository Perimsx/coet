"use client";

import { useEffect, useState, useRef, useTransition, useCallback, useMemo } from "react";
import { useRouter } from "next/navigation";
import { Search as SearchIcon, X, AlertCircle, Clock, Trash2, Terminal } from "lucide-react";
import { Index } from "flexsearch";
import { Command } from "cmdk";
import { useUIModal } from '@/features/knowledge-base/context/ui-context';
import { categoryMap } from '@/features/knowledge-base/lib/constants';
import { useMounted } from '@/features/knowledge-base/hooks/use-mounted';

interface SearchItem {
  title: string;
  slug: string;
  permalink: string;
  category: string;
  description: string;
  content: string;
  date?: string;
}

type IndexState = "idle" | "loading" | "ready" | "error";

function highlightText(text: string, highlight: string, className?: string) {
  if (!text) return null;
  if (!highlight.trim()) return <span className={className}>{text}</span>;
  const escapedHighlight = highlight.replace(/[-\/\\^$*+?.()|[\]{}]/g, "\\$&");
  const regex = new RegExp(`(${escapedHighlight})`, "gi");
  const lcHighlight = highlight.toLowerCase().trim();
  const parts = text.split(regex);
  return (
    <span className={className}>
      {parts.map((part, i) =>
        part.toLowerCase().includes(lcHighlight) ? (
          <mark key={i} className="text-foreground font-semibold px-1.5 py-0.5 mx-0.5 rounded-xs bg-accent/12 !text-accent font-sans">
            {part}
          </mark>
        ) : (
          part
        )
      )}
    </span>
  );
}


export default function Search() {
  const router = useRouter();
  const { isSearchOpen, setIsSearchOpen } = useUIModal();

  const isMounted = useMounted();

  const [query, setQuery] = useState("");
  const queryRef = useRef(query);
  useEffect(() => {
    queryRef.current = query;
  }, [query]);

  const [debouncedQuery, setDebouncedQuery] = useState("");
  const [results, setResults] = useState<SearchItem[]>([]);
  const [allItems, setAllItems] = useState<SearchItem[]>([]);
  const [indexState, setIndexState] = useState<IndexState>("idle");
  const [history, setHistory] = useState<string[]>([]);
  const [, startTransition] = useTransition();
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [searchTime, setSearchTime] = useState(0);
  const isComposingRef = useRef(false);

  const closeSearch = useCallback(() => {
    setIsSearchOpen(false);
    setQuery("");
    setSelectedCategory(null);
  }, [setIsSearchOpen]);

  // 提取内容中匹配位置的片段（约 120 字符窗口）
  function getContentSnippet(content: string | undefined, q: string): string | null {
    if (!content || !q.trim()) return null;
    const lc = content.toLowerCase();
    const lq = q.toLowerCase().trim();
    const pos = lc.indexOf(lq);
    if (pos === -1) {
      return content.length <= 120 ? content : content.slice(0, 120) + "...";
    }
    const start = Math.max(0, pos - 40);
    const end = Math.min(content.length, pos + lq.length + 80);
    let snippet = content.slice(start, end);
    if (start > 0) snippet = "..." + snippet;
    if (end < content.length) snippet = snippet + "...";
    return snippet;
  }

  const searchIndexRef = useRef<Index | null>(null);

  // 输入防抖 (中文拼音输入期间阻断更新)
  useEffect(() => {
    if (isComposingRef.current) return;
    const timer = setTimeout(() => {
      setDebouncedQuery(query);
    }, 250);
    return () => clearTimeout(timer);
  }, [query]);

  // Ctrl+K / Cmd+K 快捷键
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === "k") {
        e.preventDefault();
        if (isSearchOpen) {
          closeSearch();
        } else {
          setIsSearchOpen(true);
        }
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isSearchOpen, closeSearch, setIsSearchOpen]);

  // 打开时初始化索引和搜索历史
  useEffect(() => {
    if (!isSearchOpen) return;

    // 重新加载历史记录，并进行安全性验证与长度截断 (.slice(0, 5))
    try {
      const saved = localStorage.getItem("kb_search_history");
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) {
          const sanitized = parsed.filter((item) => typeof item === "string" && item.trim() !== "").slice(0, 5);
          setTimeout(() => setHistory(sanitized), 0);
        }
      }
    } catch {
      // ignore
    }

    if (searchIndexRef.current) return;

    setIndexState("loading");

    // 中英文混合高性能 Bigram 分词器
    const idx = new Index({
      tokenize: ((str: string) => {
        const cjkRegex = /[\u4e00-\u9fa5]/g;
        // 提取英文单词
        const englishWords = str.replace(cjkRegex, " ").split(/[\s\.\-\/_]+/).filter(Boolean);
        const cjkTokens: string[] = [];
        // 对连续中文文本片段进行 Bigram + 单字分词
        const cjkSegments = str.match(/[\u4e00-\u9fa5]+/g) || [];
        for (const segment of cjkSegments) {
          for (let i = 0; i < segment.length; i++) {
            cjkTokens.push(segment[i]);
            if (i < segment.length - 1) {
              cjkTokens.push(segment.slice(i, i + 2));
            }
          }
        }
        return [...englishWords, ...cjkTokens];
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
      }) as any
    });

    fetch("/search-index.json")
      .then((res) => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        return res.json();
      })
      .then((data: SearchItem[]) => {
        setAllItems(data);
        data.forEach((item, i) => {
          idx.add(i, `${item.title} ${item.category} ${item.description} ${item.content}`);
        });
        searchIndexRef.current = idx;
        setIndexState("ready");

        const currentQuery = queryRef.current;
        if (currentQuery.trim()) {
          const startTime = performance.now();
          const hits = idx.search(currentQuery, { limit: 8 }) as number[];
          setResults(hits.map((hitsIdx) => data[hitsIdx]).filter(Boolean));
          setSearchTime(Math.round(performance.now() - startTime));
        }
      })
      .catch(() => {
        setIndexState("error");
      });
  }, [isSearchOpen]);

  // 执行搜索
  useEffect(() => {
    if (!debouncedQuery.trim() || !searchIndexRef.current) {
      setResults([]);
      setSearchTime(0);
      return;
    }
    const startTime = performance.now();
    startTransition(() => {
      const hits = searchIndexRef.current!.search(debouncedQuery, { limit: 8 }) as number[];
      setResults(hits.map((i) => allItems[i]).filter(Boolean));
      setSearchTime(Math.round(performance.now() - startTime));
    });
  }, [debouncedQuery, allItems]);

  // 派生值：分类过滤后的结果 (支持无 query 时的分类纯展示)
  const filteredResults = useMemo(() => {
    if (selectedCategory) {
      if (!query.trim()) {
        return allItems
          .filter((item) => item.category === selectedCategory)
          .sort((a, b) => ((b.date ?? "") > (a.date ?? "") ? 1 : -1));
      }
      return results.filter((item) => item.category === selectedCategory);
    }
    return results;
  }, [results, selectedCategory, query, allItems]);

  // 推荐文章 (仅在过滤后结果均为空，且既无 query 也无分类时，才按日期倒序取前 5 篇)
  const sortedSuggestedItems = useMemo(() => {
    if (filteredResults.length !== 0 || query.trim() || selectedCategory) return [];
    return [...allItems]
      .sort((a, b) => ((b.date ?? "") > (a.date ?? "") ? 1 : -1))
      .slice(0, 5);
  }, [filteredResults, query, selectedCategory, allItems]);

  // 实际显示的列表
  const displayItems = (query.trim() || selectedCategory) ? filteredResults : sortedSuggestedItems;

  // 当前结果中出现的分类，无 query 选了分类时展示全部分类 pills 以供方便切换
  const resultCategories = useMemo(() => {
    if (!query.trim()) {
      return Object.keys(categoryMap);
    }
    return [...new Set(results.map((item) => item.category))];
  }, [results, query]);

  // 保存搜索历史
  const saveToHistory = useCallback((q: string) => {
    const trimmed = q.trim();
    if (!trimmed) return;
    setHistory((prev) => {
      const next = [trimmed, ...prev.filter((item) => item !== trimmed)].slice(0, 5);
      localStorage.setItem("kb_search_history", JSON.stringify(next));
      return next;
    });
  }, []);

  // 清空所有搜索历史
  const clearHistory = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    setHistory([]);
    localStorage.setItem("kb_search_history", JSON.stringify([]));
  }, []);

  const handleNavigate = useCallback(
    (path: string) => {
      if (query.trim()) {
        saveToHistory(query);
      }
      closeSearch();
      router.push(path);
    },
    [router, query, saveToHistory, closeSearch]
  );

  if (!isMounted) return null;
  if (!isSearchOpen) return null;

  return (
    <Command.Dialog
      open={isSearchOpen}
      onOpenChange={(open) => {
        if (open) setIsSearchOpen(true);
        else closeSearch();
      }}
      label="全局搜索"
      container={isMounted ? document.body : undefined}
      filter={() => 1} // 禁用内置客户端过滤，使用 FlexSearch 结果
      className="fixed inset-0 z-[70] flex items-start justify-center pt-[10vh] px-4 sm:px-6 no-print select-none"
    >
      {/* 遮罩 */}
      <div
        className="absolute inset-0 bg-background/50 backdrop-blur-sm"
        onClick={closeSearch}
        aria-hidden="true"
      />

      {/* 搜索面板 */}
      <div className="relative w-full max-w-[768px] bg-background border border-divider/40 shadow-2xl flex flex-col overflow-hidden max-h-[85vh] rounded-xl animate-search-reveal">
        {/* 输入区 */}
        <div className="flex items-center gap-3 px-5 h-14 border-b border-divider/50 shrink-0">
          <SearchIcon size={18} className="text-foreground/35 shrink-0" />
          <Command.Input
            placeholder="键入开始搜索"
            value={query}
            onValueChange={setQuery}
            onCompositionStart={() => {
              isComposingRef.current = true;
            }}
            onCompositionEnd={(e) => {
              isComposingRef.current = false;
              setDebouncedQuery(e.currentTarget.value);
            }}
            className="flex-1 bg-transparent border-0 text-base focus:outline-none focus:ring-0 focus:border-transparent text-foreground placeholder-foreground/35"
          />
          {query && (
            <button
              onClick={() => setQuery("")}
              className="p-2 min-w-[44px] min-h-[44px] flex items-center justify-center rounded-full text-foreground/35 hover:text-foreground hover:bg-foreground/5 transition-colors cursor-pointer"
              aria-label="清除内容"
            >
              <X size={16} />
            </button>
          )}
          <button
            onClick={closeSearch}
            className="p-2 min-w-[44px] min-h-[44px] flex items-center justify-center rounded-full text-foreground/35 hover:text-foreground hover:bg-foreground/5 transition-colors cursor-pointer"
            aria-label="关闭"
          >
            <X size={16} />
          </button>
        </div>

        {/* 结果区 */}
        <Command.List className="flex-1 overflow-y-auto scroll-smooth">
          {indexState === "error" && (
            <div className="py-12 text-center flex flex-col items-center gap-3">
              <AlertCircle size={24} className="text-destructive/60" />
              <p className="text-sm text-foreground/60">
                搜索索引加载失败。
              </p>
            </div>
          )}

          {indexState === "loading" && (
            <div className="py-12 text-center text-sm text-foreground/40 animate-pulse">
              正在加载索引…
            </div>
          )}

          {indexState === "ready" && query.trim() === "" && selectedCategory === null && (
            <div className="py-8 px-6 flex flex-col gap-6.5">
              {/* 搜索历史 */}
              {history.length > 0 && (
                <div className="flex flex-col gap-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-foreground/45 flex items-center gap-1.5 font-sans tracking-wide">
                      <Clock size={12} className="opacity-70" />
                      最近搜索
                    </span>
                    <button
                      onClick={clearHistory}
                      className="text-[11px] font-sans font-medium text-foreground/30 hover:text-foreground/60 transition-colors flex items-center gap-1 cursor-pointer"
                    >
                      <Trash2 size={11} />
                      清除历史
                    </button>
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {history.map((item) => (
                      <button
                        key={item}
                        onClick={() => setQuery(item)}
                        className="text-xs px-2.5 py-1.5 rounded bg-muted/30 border border-divider/40 text-foreground/65 hover:text-foreground hover:border-foreground/35 hover:bg-muted/65 transition-colors cursor-pointer"
                      >
                        {item}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* 探索技术分类 */}
              <div className="flex flex-col gap-3 border-t border-divider/25 pt-5">
                <span className="text-xs font-semibold text-foreground/45 flex items-center gap-1.5 font-sans tracking-wide">
                  <Terminal size={12} className="opacity-70" />
                  探索技术分类
                </span>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {Object.entries(categoryMap).map(([key, label]) => (
                    <button
                      key={key}
                      onClick={() => {
                        setQuery("");
                        setSelectedCategory(key);
                      }}
                      className="flex items-center justify-between px-3 py-2 text-xs text-foreground/65 border border-divider/40 bg-muted/10 hover:bg-accent/[0.03] hover:border-accent/40 hover:text-accent rounded transition-all duration-300 cursor-pointer"
                    >
                      <span>{label}</span>
                      <span className="text-[10px] font-mono opacity-40 uppercase tracking-widest">{key}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* 热门搜索推荐 */}
              <div className="flex flex-col gap-3 border-t border-divider/25 pt-5">
                <span className="text-xs font-semibold text-foreground/45 flex items-center gap-1.5 font-sans tracking-wide">
                  <AlertCircle size={12} className="opacity-70" />
                  热门搜索推荐
                </span>
                <div className="flex flex-wrap gap-2 text-xs">
                  {["DDD 领域驱动设计", "Redis 分布式锁", "Cassandra 架构", "ES 索引设计", "API 网关"].map((term) => (
                    <button
                      key={term}
                      onClick={() => {
                        setQuery(term);
                      }}
                      className="px-3 py-1.5 text-xs text-foreground/50 hover:text-accent bg-muted/20 hover:bg-accent/5 rounded-full border border-divider/30 hover:border-accent/30 transition-all cursor-pointer font-medium"
                    >
                      #{term}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {indexState === "ready" && (query.trim() !== "" || selectedCategory !== null) && displayItems.length === 0 && (
            <div className="py-12 text-center text-sm text-foreground/45 flex flex-col items-center gap-2">
              <SearchIcon size={24} className="text-foreground/20 mb-2" />
              未找到与 &ldquo;<span className="text-foreground font-semibold">{query || (selectedCategory ? categoryMap[selectedCategory] : "")}</span>&rdquo; 相关的文档
            </div>
          )}

          {indexState === "ready" && (query.trim() !== "" || selectedCategory !== null) && displayItems.length > 0 && (
            <div className="flex flex-col">
              {/* 检索状态统计栏 */}
              <div className="px-6 py-2.5 border-b border-divider/20 bg-muted/10 flex items-center justify-between text-[11px] font-sans font-semibold text-foreground/40 shrink-0 select-none">
                <div className="flex items-center gap-2">
                  <span>检索到 {displayItems.length} 个结果 {searchTime > 0 && `(耗时 ${searchTime}ms)`}</span>
                </div>
                <span className="opacity-60 uppercase font-mono tracking-widest text-[9px]">Hits Limit: 8</span>
              </div>

              {/* 分类筛选 pills */}
              {resultCategories.length > 1 && (
                <div className="flex flex-wrap gap-1.5 px-5 py-3 border-b border-divider/30 shrink-0">
                  <button
                    onClick={() => setSelectedCategory(null)}
                    className={`text-[11px] font-medium px-2.5 py-1.5 border transition-colors cursor-pointer rounded-xs ${
                      selectedCategory === null
                        ? "border-foreground bg-foreground text-background"
                        : "border-divider text-foreground/55 hover:border-foreground/30 hover:text-foreground bg-muted/40 hover:bg-muted/80"
                    }`}
                  >
                    All
                  </button>
                  {resultCategories.map((cat) => {
                    const isActive = selectedCategory === cat;
                    return (
                      <button
                        key={cat}
                        onClick={() => setSelectedCategory(isActive ? null : cat)}
                        className={`text-[11px] font-medium px-2.5 py-1.5 border transition-colors cursor-pointer rounded-xs ${
                          isActive
                            ? "border-foreground bg-foreground text-background"
                            : "border-divider text-foreground/55 hover:border-foreground/30 hover:text-foreground bg-muted/40 hover:bg-muted/80"
                        }`}
                      >
                        {categoryMap[cat] || cat}
                      </button>
                    );
                  })}
                </div>
              )}

              {/* 结果项列表 */}
              {displayItems.map((item) => {
                const contentText = getContentSnippet(item.content, query);
                return (
                  <Command.Item
                    key={item.permalink}
                    value={item.permalink}
                    onSelect={() => handleNavigate(item.permalink)}
                    className="relative flex flex-col w-full text-left px-6 py-4.5 transition-all duration-300 border-b border-divider/30 last:border-b-0 outline-none focus:outline-none animate-fade-in data-[selected=true]:bg-accent/[0.02] dark:data-[selected=true]:bg-accent/[0.04] cursor-pointer group"
                  >
                    {/* 选中态左侧亮色指示条 */}
                    <div className="absolute left-0 top-0 bottom-0 w-[3px] bg-accent scale-y-0 group-data-[selected=true]:scale-y-100 transition-transform duration-200 origin-center" />

                    {/* 标题行 */}
                    <div className="flex items-center justify-between gap-3 mb-2 w-full">
                      <div className="flex items-center gap-2.5 min-w-0 flex-1">
                        {highlightText(item.title, query, "text-base font-bold text-foreground leading-snug group-data-[selected=true]:text-accent transition-colors truncate block")}
                        {item.category && (
                          <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-sm bg-accent/10 text-accent uppercase tracking-wider shrink-0 select-none">
                            {categoryMap[item.category] || item.category}
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-2 select-none shrink-0">
                        {item.date && (
                          <span className="text-[11px] font-mono text-foreground/30 font-light group-data-[selected=true]:text-foreground/45 transition-colors">
                            {item.date}
                          </span>
                        )}
                        {/* Enter 快捷徽章 */}
                        <div className="flex items-center opacity-0 scale-90 group-data-[selected=true]:opacity-100 group-data-[selected=true]:scale-100 transition-all duration-200 ml-1">
                          <span className="text-[9px] font-mono font-bold px-1.5 py-0.5 rounded-sm bg-accent/10 text-accent flex items-center gap-1 border border-accent/20">
                            <span>Enter</span>
                            <kbd className="no-underline text-[11px] leading-none">↵</kbd>
                          </span>
                        </div>
                      </div>
                    </div>
                    {/* 描述 */}
                    {item.description &&
                      highlightText(item.description, query, "block text-sm text-foreground/55 leading-relaxed line-clamp-3 mb-1")
                    }
                    {/* 正文片段 */}
                    {contentText &&
                      highlightText(contentText, query, "block mt-1.5 text-xs text-foreground/40 leading-relaxed line-clamp-2 pl-3 border-l border-divider/60 font-sans italic")
                    }
                  </Command.Item>
                );
              })}
            </div>
          )}
        </Command.List>

        {/* 底部提示 */}
        {indexState === "ready" && displayItems.length > 0 && (
          <div className="border-t border-divider/50 px-6 py-2.5 flex items-center justify-center gap-6 text-xs text-foreground/40 shrink-0 select-none">
            <span className="flex items-center gap-1">↑↓ 切换</span>
            <span className="flex items-center gap-1">⏎ 选择</span>
            <span className="flex items-center gap-1">Esc 关闭</span>
          </div>
        )}
      </div>
    </Command.Dialog>
  );
}
