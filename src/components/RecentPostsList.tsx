"use client";

import Link from "next/link";
import { ChevronRight, Activity } from "lucide-react";
import { posts } from "#content";
import { sortByDate } from "@/features/knowledge-base/lib/tree";
import useLocaleDictionary from "@/shared/hooks/useLocaleDictionary";

export default function RecentPostsList() {
  const dictionary = useLocaleDictionary();
  const recentPosts = sortByDate(
    posts.map((p) => ({
      title: p.title,
      description: p.description ?? "",
      category: p.category ?? "",
      date: p.date ?? "",
      permalink: p.permalink,
    }))
  ).slice(0, 3);

  if (recentPosts.length === 0) return null;

  return (
    <div className="animate-spring-reveal delay-700 w-full text-left border-t border-divider/30 pt-10 sm:pt-14">
      <div className="flex items-center justify-between mb-8 select-none">
        <div className="flex items-center gap-2">
          <Activity className="h-4 w-4 text-accent animate-pulse" />
          <h2 className="text-[10px] font-bold tracking-widest text-foreground/60 uppercase">
            {dictionary.home.latestHeading}
          </h2>
        </div>
        <Link
          href="/kb"
          className="text-xs text-foreground/60 hover:text-foreground transition-colors font-semibold flex items-center gap-0.5"
        >
          {dictionary.home.viewAll} <ChevronRight className="h-3 w-3" />
        </Link>
      </div>
      <div className="flex flex-col gap-3">
        {recentPosts.map((post) => (
          <Link
            key={post.permalink}
            href={post.permalink}
            className="group relative flex flex-col sm:flex-row sm:items-center justify-between p-4.5 border border-divider/40 hover:border-foreground/20 bg-foreground/[0.003] hover:bg-foreground/[0.015] rounded-sm hover:-translate-y-0.5 hover:shadow-[0_4px_20px_rgba(0,0,0,0.015)] dark:hover:shadow-[0_4px_20px_rgba(0,0,0,0.15)] transition-all duration-500 cubic-bezier(0.16, 1, 0.3, 1) overflow-hidden"
          >
            <div className="absolute left-0 top-0 bottom-0 w-[3px] bg-accent -translate-x-[3px] group-hover:translate-x-0 transition-transform duration-500 cubic-bezier(0.16, 1, 0.3, 1)" />

            <div className="flex flex-col gap-1 min-w-0 pr-4 pl-0 group-hover:pl-2 transition-all duration-500 cubic-bezier(0.16, 1, 0.3, 1)">
              <span className="text-sm font-bold text-foreground group-hover:text-accent transition-colors truncate">
                {post.title}
              </span>
              {post.description && (
                <span className="text-xs text-foreground/60 line-clamp-1">
                  {post.description}
                </span>
              )}
            </div>
            <div className="flex items-center gap-4 mt-2 sm:mt-0 shrink-0 font-mono text-[10px] text-foreground/60 pr-0 group-hover:pr-1 transition-all duration-500 cubic-bezier(0.16, 1, 0.3, 1)">
              {post.category && (
                <span className="uppercase tracking-wider px-2 py-0.5 bg-foreground/5 dark:bg-white/5 rounded-sm">
                  {post.category}
                </span>
              )}
              {post.date && <span>{post.date.split("T")[0]}</span>}
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
