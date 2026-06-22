"use client";

import { useMemo, type ComponentType } from "react";
import { useQueryState } from "nuqs";
import Link from "next/link";
import {
  Layers,
  Layout,
  Cpu,
  Infinity as InfinityIcon,
  Database,
  Shield,
  Calendar,
  BookOpen,
  FolderOpen
} from "lucide-react";
import { Post } from "#content";
import { categoryMap } from '@/features/knowledge-base/lib/constants';

type HomePost = Omit<Post, "content" | "toc">;

interface HomeContentProps {
  posts: HomePost[];
  categories: string[];
}

const CATEGORY_ICONS: Record<string, ComponentType<{ size?: number; className?: string }>> = {
  frontend: Layout,
  backend: Cpu,
  devops: InfinityIcon,
  database: Database,
  security: Shield,
};

export default function HomeContent({ posts, categories }: HomeContentProps) {
  const [activeCategory, setActiveCategory] = useQueryState("category");

  // posts 已经在服务端按日期降序排列
  // 按当前分类过滤
  const displayPosts = useMemo(() => {
    if (!activeCategory) return posts;
    return posts.filter((p) => p.category === activeCategory);
  }, [posts, activeCategory]);

  // 预计算各分类文章数量，避免在 .map() 中重复过滤
  const categoryCounts = useMemo(() => {
    const map: Record<string, number> = {};
    posts.forEach(p => { if (p.category) map[p.category] = (map[p.category] || 0) + 1; });
    return map;
  }, [posts]);

  return (
    <div className="flex flex-col gap-8 py-4 select-text animate-fade-in">
      {/* 卷首语区 */}
      <section className="flex flex-col gap-4.5 border-b border-divider/40 pb-6.5">
        <h1 className="font-sans text-3xl md:text-[2.2rem] tracking-tight font-extrabold bg-gradient-to-r from-foreground via-foreground to-accent bg-clip-text text-transparent leading-none">
          序栈<sup className="text-[0.45em] ml-0.5 align-super">®</sup>
        </h1>
        <div className="flex flex-col gap-2.5 text-foreground/70 leading-[1.8] font-sans text-[0.92rem] md:text-[0.96rem] max-w-2xl">
          <p>序栈（Sequence Stack）是一个专注于计算机底层原理、系统安全与现代软件架构的计算机技术知识库。</p>
          <p>我们在此系统性记录从内核机制、安全攻防对抗到分布式架构的开发与调试实践。</p>
          <p>去除冗余的信息噪音，只留严谨的逻辑推演与工程代码沉淀。</p>
        </div>
        <div className="flex items-center gap-4.5 mt-1.5 text-xs text-foreground/60">
          <span className="flex items-center gap-1.5">
            <BookOpen size={13} className="opacity-70" />
            <span>{posts.length} 篇文档</span>
          </span>
          {categories.length > 0 && (
            <>
              <span className="select-none text-divider/60">·</span>
              <span className="flex items-center gap-1.5">
                <FolderOpen size={13} className="opacity-70" />
                <span>{categories.length} 个分类</span>
              </span>
            </>
          )}
        </div>
      </section>

      {/* 分类过滤区 */}
      {categories.length > 0 && (
        <section className="flex flex-col gap-3">
          <h2 className="text-[10px] font-bold tracking-widest text-foreground/60 uppercase">
            Categories
          </h2>
          <div className="flex flex-nowrap gap-1.5 overflow-x-auto hide-scrollbar pb-2 md:pb-0 -mx-4 px-4 md:mx-0 md:px-0 select-none">
            <button
              onClick={() => setActiveCategory(null)}
              className={`flex shrink-0 items-center gap-1.5 text-xs font-medium px-3 py-2.5 border transition-all duration-300 active:scale-[0.97] focus:outline-none focus-visible:ring-2 focus-visible:ring-accent/50 focus-visible:ring-offset-1 cursor-pointer rounded-xs ${
                activeCategory === null
                  ? "border-accent bg-accent text-background shadow-md shadow-accent/20"
                  : "border-divider text-foreground/55 hover:border-foreground/30 hover:text-foreground bg-muted/40 hover:bg-muted/80 hover:shadow-sm"
              }`}
            >
              <Layers size={13} className={activeCategory === null ? "opacity-90" : "opacity-60"} />
              <span>All ({posts.length})</span>
            </button>
            {categories.map((category) => {
              const count = categoryCounts[category] ?? 0;
              const isActive = activeCategory === category;
              const IconComponent = CATEGORY_ICONS[category.toLowerCase()] || BookOpen;
              return (
                <button
                  key={category}
                  onClick={() =>
                    setActiveCategory(isActive ? null : category)
                  }
                  className={`flex shrink-0 items-center gap-1.5 text-xs font-medium px-3 py-2.5 border transition-all duration-300 active:scale-[0.97] focus:outline-none focus-visible:ring-2 focus-visible:ring-accent/50 focus-visible:ring-offset-1 cursor-pointer rounded-xs ${
                    isActive
                      ? "border-accent bg-accent text-background shadow-md shadow-accent/20"
                      : "border-divider text-foreground/55 hover:border-foreground/30 hover:text-foreground bg-muted/40 hover:bg-muted/80 hover:shadow-sm"
                  }`}
                >
                  <IconComponent size={13} className={isActive ? "opacity-90" : "opacity-60"} />
                  <span>{categoryMap[category] || category} ({count})</span>
                </button>
              );
            })}
          </div>
        </section>
      )}

      {/* 文章列表 */}
      <section className="flex flex-col gap-4">
        <h2 className="text-[10px] font-bold tracking-widest text-foreground/60 uppercase border-b border-divider/40 pb-2">
          {activeCategory ? `${categoryMap[activeCategory] || activeCategory} — ${displayPosts.length} 篇文档` : "Recent Documents"}
        </h2>

        {displayPosts.length === 0 ? (
          <p className="text-sm text-foreground/60 italic py-4">
            该分类暂无文档。
          </p>
        ) : (
          <div key={String(activeCategory)} className="flex flex-col gap-1.5 animate-fade-in">
            {displayPosts.map((post) => (
              <Link
                key={post.permalink}
                href={post.permalink}
                className="group relative flex flex-col gap-2 py-4.5 px-4 -mx-4 border-b border-divider/30 last:border-0 hover:bg-foreground/[0.015] rounded-sm transition-all duration-500 ease-out hover:-translate-y-px hover:shadow-[0_4px_20px_rgba(0,0,0,0.02)] focus:outline-none focus-visible:ring-1 focus-visible:ring-accent/50 overflow-hidden"
              >
                {/* 悬浮时的左侧动效竖线 */}
                <div className="absolute left-0 top-0 bottom-0 w-[3px] bg-accent -translate-x-full group-hover:translate-x-0 transition-transform duration-500 cubic-bezier(0.16, 1, 0.3, 1)" />

                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 group-hover:pl-2 transition-all duration-500 cubic-bezier(0.16, 1, 0.3, 1)">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <h3 className="font-sans font-bold text-[1.05rem] text-foreground group-hover:text-accent transition-colors duration-300 leading-snug truncate min-w-0">
                      {post.title}
                    </h3>
                  </div>

                  <div className="flex items-center gap-2.5 shrink-0 select-none">
                    {post.category && (
                      <span className="bg-accent/8 border border-accent/20 text-accent font-bold px-1.5 py-0.5 rounded-xs text-[9px] tracking-wider uppercase">
                        {categoryMap[post.category] || post.category}
                      </span>
                    )}
                    {post.date && (
                      <span className="flex items-center gap-1 text-[11px] text-foreground/60 font-mono">
                        <Calendar size={11} className="opacity-70" />
                        <time>{post.date.split("T")[0]}</time>
                      </span>
                    )}
                  </div>
                </div>
                {post.description && (
                  <p className="text-xs sm:text-[0.88rem] text-foreground/60 max-w-3xl leading-relaxed group-hover:pl-2 transition-all duration-500 cubic-bezier(0.16, 1, 0.3, 1)">
                    {post.description}
                  </p>
                )}
              </Link>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
