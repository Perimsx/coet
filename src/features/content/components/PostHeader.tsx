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
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 sm:gap-8 items-center">
        {/* 左侧主要信息大区 */}
        <div className="lg:col-span-8 space-y-3.5">
          {/* 顶栏元数据组 */}
          <div className="flex flex-wrap items-center gap-2 select-none text-label-12">
            {/* 作者 */}
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-neutral-2 text-neutral-8 border border-border font-normal shrink-0">
              <span className="relative w-3.5 h-3.5 rounded-full overflow-hidden shrink-0 bg-neutral-3">
                <Image
                  src={authorAvatar}
                  alt={authorName}
                  fill
                  className="object-cover"
                />
              </span>
              <span className="font-medium text-caption-10 leading-none">
                {authorName}
              </span>
            </div>

            {/* 分类 Badge */}
            {category && (
              <Link
                href={`/blog/category/${categorySlug}`}
                className="inline-flex items-center justify-center h-6 px-2.5 text-label-12 font-medium rounded-md bg-neutral-2 text-accent hover:bg-neutral-3 transition-colors shrink-0 leading-none"
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
                  className="inline-flex items-center justify-center h-6 px-2 rounded-md bg-neutral-1 text-neutral-6 hover:text-neutral-9 hover:bg-neutral-2 transition-colors font-normal text-label-12 shrink-0 leading-none"
                >
                  <span>#{getTagLabel(tag, locale)}</span>
                </Link>
              ))}
          </div>

          {/* 文章大标题 (Yohaku 衬线大标题) */}
          <h1 className="font-serif text-title-24 sm:text-title-28 lg:text-display-36 font-medium tracking-tight text-neutral-10 leading-[1.25]">
            {title}
          </h1>

          {/* 文章摘要 */}
          {summary && (
            <p className="text-copy-14 sm:text-copy-15 text-neutral-7 leading-relaxed font-normal">
              {summary}
            </p>
          )}

          {/* 丰富作者/时间元数据栏 */}
          <div className="flex flex-wrap items-center justify-between gap-4 text-label-12 text-neutral-6 pt-3 border-t border-border">
            <div className="flex items-center gap-3 flex-wrap">
              {formattedDate && (
                <time
                  dateTime={date}
                  className="flex items-center gap-1.5 text-neutral-7 font-normal"
                >
                  <Calendar className="w-3.5 h-3.5 text-accent" />
                  <span>{formattedDate}</span>
                </time>
              )}

              <span className="text-neutral-4">&middot;</span>

              <span className="flex items-center gap-1.5 text-neutral-7 font-normal">
                <Clock className="w-3.5 h-3.5 text-accent" />
                <span>
                  约 {readTimeMinutes} 分钟阅读
                </span>
              </span>
            </div>
          </div>
        </div>

        {/* 右侧封面展示 */}
        {coverSrc && (
          <div className="lg:col-span-4 w-full flex justify-center lg:justify-end">
            <div className="aspect-[16/10] w-full max-w-[340px] rounded-lg overflow-hidden bg-neutral-2 border border-border shadow-xs">
              <Image
                src={coverSrc}
                alt={title}
                fill
                sizes="(max-width: 1024px) 100vw, 340px"
                className="object-cover"
                priority
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
