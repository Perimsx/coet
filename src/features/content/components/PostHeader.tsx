"use client";

import React from "react";
import Link from "@/shared/components/Link";
import Image from "@/features/content/components/Image";
import {
  getCategoryLabel,
  getTagLabel,
  normalizeTagToSlug,
} from "@/features/content/lib/post-categories";
import { Calendar, Clock } from "lucide-react";

interface PostHeaderProps {
  title: string;
  summary?: string;
  date: string;
  category?: string | null;
  tags?: string[];
  coverImage?: string | string[];
  readTimeMinutes?: number;
  authorName?: string;
  authorAvatar?: string;
  locale?: "zh" | "en";
}

export default function PostHeader({
  title,
  summary,
  date,
  category,
  tags = [],
  coverImage,
  readTimeMinutes = 5,
  authorName = "Kerntau",
  authorAvatar = "/avatar.png",
  locale = "zh",
}: PostHeaderProps) {
  const dateLocale = locale === "en" ? "en-US" : "zh-CN";
  const formattedDate = date
    ? new Date(date).toLocaleDateString(dateLocale, {
        year: "numeric",
        month: "long",
        day: "numeric",
      })
    : "";

  const rawCover = Array.isArray(coverImage)
    ? coverImage[0]
    : typeof coverImage === "string"
      ? coverImage
      : "";

  const fallbackImages = [
    "https://images.unsplash.com/photo-1555066931-4365d14bab8c?auto=format&fit=crop&w=1200&q=80",
    "https://images.unsplash.com/photo-1618401471353-b98afee0b2eb?auto=format&fit=crop&w=1200&q=80",
    "https://images.unsplash.com/photo-1633356122544-f134324a6cee?auto=format&fit=crop&w=1200&q=80",
    "https://images.unsplash.com/photo-1544383835-bda2bc66a55d?auto=format&fit=crop&w=1200&q=80",
    "https://images.unsplash.com/photo-1507238691740-187a5b1d37b8?auto=format&fit=crop&w=1200&q=80",
  ];
  const titleHash = Math.abs(
    title
      .split("")
      .reduce((acc, char) => (acc << 5) - acc + char.charCodeAt(0), 0),
  );
  const defaultCover = fallbackImages[titleHash % fallbackImages.length];

  const coverSrc = rawCover || defaultCover;

  const categorySlug = category || "uncategorized";
  const categoryLabel = getCategoryLabel(categorySlug, locale);

  return (
    <div className="w-full">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
        {/* 左侧主要信息大区 */}
        <div className="lg:col-span-8 space-y-4">
          {/* 顶栏一体化精美元数据 Pill 组（作者头像 + 分类高亮 + 标签列表） */}
          <div className="flex flex-wrap items-center gap-2 select-none text-xs">
            {/* 作者 Capsule */}
            <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-zinc-100 dark:bg-zinc-800/80 text-zinc-800 dark:text-zinc-200 border border-zinc-200/60 dark:border-zinc-700/50 font-medium shrink-0">
              <span className="relative w-4 h-4 rounded-full overflow-hidden shrink-0 bg-primary/20">
                <Image
                  src={authorAvatar}
                  alt={authorName}
                  fill
                  className="object-cover"
                />
              </span>
              <span className="font-bold text-xs leading-none">
                {authorName}
              </span>
            </div>

            {/* 分类 Badge */}
            {category && (
              <Link
                href={`/blog/category/${categorySlug}`}
                className="inline-flex items-center justify-center h-6 sm:h-6.5 px-2.5 text-xs font-bold rounded-md bg-blue-500/10 text-blue-600 dark:bg-blue-500/20 dark:text-blue-400 hover:bg-blue-500/20 transition-colors shrink-0 leading-none"
              >
                <span>{categoryLabel}</span>
              </Link>
            )}

            {/* 文章标签列表 */}
            {tags &&
              tags.length > 0 &&
              tags.slice(0, 4).map((tag) => (
                <Link
                  key={tag}
                  href={`/tags/${normalizeTagToSlug(tag)}`}
                  className="inline-flex items-center justify-center h-6 sm:h-6.5 px-2 rounded-md bg-zinc-100/80 dark:bg-zinc-800/80 text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 hover:bg-zinc-200/80 transition-colors font-medium text-xs border-0 shrink-0 leading-none"
                >
                  <span>#{getTagLabel(tag, locale)}</span>
                </Link>
              ))}
          </div>

          {/* 文章大标题 */}
          <h1 className="text-xl sm:text-2xl lg:text-3xl font-extrabold tracking-tight text-foreground leading-[1.3]">
            {title}
          </h1>

          {/* 文章摘要 */}
          {summary && (
            <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed font-normal">
              {summary}
            </p>
          )}

          {/* 丰富作者/时间元数据栏 */}
          <div className="flex flex-wrap items-center justify-between gap-4 text-xs text-muted-foreground pt-3 border-t border-border/60">
            <div className="flex items-center gap-3 flex-wrap">
              {formattedDate && (
                <time
                  dateTime={date}
                  className="flex items-center gap-1.5 text-blue-500/90 dark:text-blue-400/90 font-medium"
                >
                  <Calendar className="w-3.5 h-3.5" />
                  <span className="text-muted-foreground">{formattedDate}</span>
                </time>
              )}

              <span className="opacity-40">&middot;</span>

              <span className="flex items-center gap-1.5 text-blue-500/90 dark:text-blue-400/90 font-medium">
                <Clock className="w-3.5 h-3.5" />
                <span className="text-muted-foreground">
                  约 {readTimeMinutes} 分钟阅读
                </span>
              </span>
            </div>
          </div>
        </div>

        {/* 右侧封面大图 (精顺 16:9，适中尺寸) */}
        {coverSrc && (
          <div className="lg:col-span-4 w-full flex justify-center lg:justify-end">
            <div className="aspect-[16/9] w-full max-w-[340px] rounded-2xl overflow-hidden bg-muted/20 border border-border/60 shadow-sm group">
              <Image
                src={coverSrc}
                alt={title}
                fill
                sizes="(max-width: 1024px) 100vw, 360px"
                className="object-cover transition-transform duration-700 ease-[cubic-bezier(0.16,1,0.3,1)] group-hover:scale-105"
                priority
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
