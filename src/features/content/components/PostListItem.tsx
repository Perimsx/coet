"use client";

import { motion } from "framer-motion";
import { useRouter } from "next/navigation";
import Image from "@/features/content/components/Image";
import type { KeyboardEvent, MouseEvent } from "react";
import {
  normalizeTagToSlug,
  getTagLabel,
} from "@/features/content/lib/post-categories";
import Link from "@/shared/components/Link";
import { cn } from "@/shared/utils/utils";

interface PostListItemProps {
  href: string;
  dateTime: string;
  dateText: string;
  title: string;
  summary?: string;
  categorySlug: string;
  categoryLabel: string;
  tags?: string[];
  images?: string[] | string;
  maxTags?: number;
  compact?: boolean;
  showImage?: boolean;
  locale?: 'zh' | 'en';
}

const postItemVariants = {
  hidden: { opacity: 0, y: 20, filter: "blur(8px)" },
  visible: {
    opacity: 1,
    y: 0,
    filter: "blur(0px)",
    transition: {
      type: "spring" as const,
      stiffness: 260,
      damping: 25,
    },
  },
};

export default function PostListItem({
  href,
  dateTime,
  dateText,
  title,
  summary,
  categorySlug,
  categoryLabel,
  tags = [],
  images,
  maxTags = 4,
  compact = false,
  showImage = true,
  locale = 'zh',
}: PostListItemProps) {
  const router = useRouter();
  const shownTags = tags.slice(0, maxTags);
  const rawCover = Array.isArray(images)
    ? images[0]
    : (typeof images === 'string' ? images : '');
  const coverSrc = rawCover || '/og-image.jpg';
  const hasImage = showImage && !!coverSrc;

  const handleCardClick = (event: MouseEvent<HTMLElement>) => {
    const target = event.target as HTMLElement;
    if (target.closest("a")) return;
    router.push(href);
  };

  const handleCardKeyDown = (event: KeyboardEvent<HTMLElement>) => {
    if (event.key !== "Enter" && event.key !== " ") return;
    event.preventDefault();
    router.push(href);
  };

  return (
    <motion.article
      variants={postItemVariants}
      whileHover={{ y: -1.5 }}
      whileTap={{ scale: 0.995 }}
      role="link"
      tabIndex={0}
      onClick={handleCardClick}
      onKeyDown={handleCardKeyDown}
      className={cn(
        "group relative flex flex-col items-start overflow-hidden rounded-xl border border-border/60 bg-paper/60 cursor-pointer sm:flex-row sm:items-center",
        compact ? "gap-4 p-4 sm:gap-5 sm:p-5" : "gap-6 p-5 sm:gap-8 sm:p-6",
        "transition-all duration-300 ease-[cubic-bezier(0.22,1,0.36,1)]",
        "hover:bg-neutral-2/60 hover:border-border shadow-xs",
      )}
    >
      {/* 左侧：正文内容区 */}
      <div
        className={cn(
          "z-10 flex w-full min-w-0 flex-1 flex-col justify-center",
          compact
            ? "sm:min-h-0"
            : "sm:min-h-[140px] sm:justify-between",
        )}
      >
        <div>
          {/* 元数据 */}
          <div
            className={cn(
              "flex flex-wrap items-center gap-x-2.5 gap-y-1.5 text-label-12 font-medium text-neutral-6",
              compact ? "mb-2" : "mb-3",
            )}
          >
            <Link
              href={`/blog/category/${categorySlug}`}
              className="text-accent transition-colors hover:text-neutral-10"
            >
              {categoryLabel}
            </Link>
            <span className="text-neutral-4">&middot;</span>
            <time
              dateTime={dateTime}
              className="text-neutral-6 transition-colors group-hover:text-neutral-8"
            >
              {dateText}
            </time>
          </div>

          {/* 标题 (Yohaku 衬线 + font-medium) */}
          <h2
            className={cn(
              "font-serif font-medium tracking-tight text-neutral-10 transition-colors duration-300 group-hover:text-accent",
              compact
                ? "text-title-20 leading-snug line-clamp-2"
                : "text-title-20 sm:text-title-24 leading-snug line-clamp-2 sm:line-clamp-3",
            )}
          >
            {title}
          </h2>

          {summary && (
            <p
              className={cn(
                "mt-3 text-copy-14 font-normal leading-relaxed text-neutral-7 transition-colors duration-300 group-hover:text-neutral-8",
                compact ? "mt-2 line-clamp-2" : "line-clamp-2 sm:line-clamp-3",
              )}
            >
              {summary}
            </p>
          )}
        </div>

        {/* 标签区 */}
        {!!shownTags.length && (
          <div
            className={cn(
              "flex flex-wrap items-center gap-2.5",
              compact ? "mt-3.5" : "mt-4 sm:mt-5",
            )}
          >
            {shownTags.map((tag) => (
              <Link
                key={tag}
                href={`/tags/${normalizeTagToSlug(tag)}`}
                className="text-label-12 font-normal text-neutral-6 transition-colors hover:text-accent"
              >
                #{getTagLabel(tag, locale)}
              </Link>
            ))}
          </div>
        )}
      </div>

      {/* 右侧封面缩略图 */}
      {hasImage && (
        <div className="relative w-full sm:w-[220px] lg:w-[260px] shrink-0 overflow-hidden rounded-lg bg-neutral-2 border border-border/40 mt-3 sm:mt-0">
          <div className="relative aspect-[16/10] w-full">
            <Image
              src={coverSrc}
              alt={title}
              fill
              sizes="(max-width: 1024px) 220px, 260px"
              className="object-cover transition-transform duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] group-hover:scale-[1.02]"
              loading="lazy"
            />
          </div>
        </div>
      )}
    </motion.article>
  );
}
