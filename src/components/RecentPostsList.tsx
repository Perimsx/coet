"use client";

import Link from "next/link";
import { ChevronRight, Activity } from "lucide-react";
import { allBlogs } from "contentlayer/generated";
import { useLanguage } from "@/shared/contexts/LanguageContext";

export default function RecentPostsList() {
  const { dictionary } = useLanguage();
  const recentPosts = allBlogs
    .filter((post) => !post.draft)
    .sort((a, b) => {
      const left = new Date(a.date ?? 0).getTime();
      const right = new Date(b.date ?? 0).getTime();
      return right - left;
    })
    .map((p) => ({
      title: p.title,
      description: p.summary ?? "",
      category: Array.isArray(p.categories) ? p.categories[0] ?? "" : "",
      date: p.date ?? "",
      permalink: p.path,
    }))
    .slice(0, 3);

  if (recentPosts.length === 0) return null;

  return (
    <div className="animate-spring-reveal delay-700 w-full text-left border-t border-border pt-8 sm:pt-10">
      <div className="flex items-center justify-between mb-6 select-none">
        <div className="flex items-center gap-2">
          <Activity className="h-3.5 w-3.5 text-accent" />
          <h2 className="text-caption-10 font-semibold tracking-widest text-neutral-6 uppercase">
            {dictionary.home.latestHeading}
          </h2>
        </div>
        <Link
          href="/blog"
          className="text-label-12 text-neutral-6 hover:text-accent transition-colors font-medium flex items-center gap-0.5"
        >
          {dictionary.home.viewAll} <ChevronRight className="h-3 w-3" />
        </Link>
      </div>
      <div className="flex flex-col gap-2.5">
        {recentPosts.map((post) => (
          <Link
            key={post.permalink}
            href={post.permalink}
            className="group relative flex flex-col sm:flex-row sm:items-center justify-between p-3.5 sm:p-4 border border-border/60 hover:border-border bg-paper/60 hover:bg-neutral-2/60 rounded-lg hover:-translate-y-0.5 transition-all duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] shadow-xs"
          >
            <div className="flex flex-col gap-1 min-w-0 pr-4">
              <span className="font-serif text-copy-15 font-medium text-neutral-10 group-hover:text-accent transition-colors truncate">
                {post.title}
              </span>
              {post.description && (
                <span className="text-copy-13 font-normal text-neutral-7 line-clamp-1">
                  {post.description}
                </span>
              )}
            </div>
            <div className="flex items-center gap-3 mt-2 sm:mt-0 shrink-0 text-label-12 text-neutral-6">
              {post.category && (
                <span className="px-2 py-0.5 bg-neutral-2 text-neutral-8 rounded-sm text-[11px] font-medium">
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
