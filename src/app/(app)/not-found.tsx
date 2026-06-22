import Link from "next/link";
import { Search, LayoutTemplate, ChevronRight } from "lucide-react";
import { posts } from "#content";
import { sortByDate } from '@/features/knowledge-base/lib/tree';
import { categoryMap } from '@/features/knowledge-base/lib/constants';

export default function AppNotFound() {
  const recentPosts = sortByDate(posts.map((p) => ({ ...p, date: p.date ?? "" }))).slice(0, 3);

  return (
    <div className="flex flex-col items-center py-8 px-4 text-center">
      {/* 404 number */}
      <h1 className="font-sans text-[100px] sm:text-[140px] font-extrabold tracking-[-0.06em] leading-none select-none mb-4 bg-gradient-to-b from-foreground via-foreground/70 to-foreground/10 bg-clip-text text-transparent">
        404
      </h1>
      <p className="font-mono text-xs tracking-[0.2em] text-foreground/25 uppercase mb-6">NOT FOUND</p>
      <p className="text-sm text-foreground/60 mb-2">此路径不存在于当前系统中</p>
      <p className="text-xs text-foreground/35 mb-8">可能是链接已过期，或地址输入有误。</p>

      {/* Search bar */}
      <div className="w-full max-w-sm mb-8">
        <Link
          href="/kb"
          className="group w-full flex items-center justify-between px-4 py-2.5 bg-foreground/[0.02] border border-foreground/[0.06] backdrop-blur-md rounded-sm text-sm text-foreground/40 hover:text-foreground/60 hover:border-foreground/[0.12] transition-all duration-300"
        >
          <span className="flex items-center gap-2">
            <Search size={14} />
            搜索知识库文档...
          </span>
          <kbd className="text-[10px] opacity-50 font-mono bg-foreground/5 px-1.5 py-0.5 rounded-sm border border-divider/50">Ctrl K</kbd>
        </Link>
      </div>

      {/* Buttons */}
      <div className="flex items-center gap-3 mb-10">
        <Link
          href="/kb"
          className="group flex items-center justify-center gap-2 rounded-sm bg-foreground text-background px-9 py-3.5 text-xs font-semibold tracking-wider hover:bg-foreground/90 hover:scale-[1.02] hover:shadow-[0_0_25px_rgba(2,132,199,0.18)] active:scale-[0.98] transition-all duration-500 cubic-bezier(0.16,1,0.3,1) select-none shadow-sm"
        >
          <LayoutTemplate size={14} />
          返回知识库
          <ChevronRight size={13} className="opacity-50 group-hover:translate-x-0.5 transition-transform" />
        </Link>
      </div>

      {/* Recent posts */}
      {recentPosts.length > 0 && (
        <div className="w-full max-w-md">
          <div className="flex items-center gap-3 mb-5">
            <span className="text-[10px] font-mono tracking-widest text-accent font-bold uppercase">Recent</span>
            <div className="flex-1 h-px bg-divider/30" />
          </div>
          <div className="grid gap-3">
            {recentPosts.map((post) => (
              <Link
                key={post.slug}
                href={post.permalink}
                className="group relative flex items-start gap-4 px-4 py-3.5 rounded-sm border border-divider/40 bg-foreground/[0.01] dark:bg-white/[0.005] hover:border-foreground/20 hover:bg-foreground/[0.02] hover:-translate-y-0.5 transition-all duration-500 cubic-bezier(0.16, 1, 0.3, 1) text-left before:absolute before:left-0 before:top-1/2 before:-translate-y-1/2 before:w-[3px] before:h-0 before:bg-accent before:rounded-full before:transition-all before:duration-300 hover:before:h-[60%]"
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1.5">
                    <span className="text-[10px] font-mono tracking-wider text-accent/70 uppercase">
                      {categoryMap[post.category ?? ""] ?? post.category}
                    </span>
                    {post.date && (
                      <>
                        <span className="text-divider/40">&middot;</span>
                        <span className="text-[10px] font-mono text-foreground/30">{post.date}</span>
                      </>
                    )}
                  </div>
                  <h3 className="text-sm font-bold text-foreground/80 group-hover:text-foreground transition-colors truncate">
                    {post.title}
                  </h3>
                  {post.description && (
                    <p className="text-xs text-foreground/40 mt-1 line-clamp-1">{post.description}</p>
                  )}
                </div>
                <ChevronRight size={14} className="mt-1 shrink-0 text-foreground/20 group-hover:text-foreground/50 group-hover:translate-x-0.5 transition-all" />
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
