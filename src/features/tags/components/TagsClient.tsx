"use client";

import { normalizeTagToSlug, getTagLabel } from "@/features/content/lib/post-categories";
import Link from "@/shared/components/Link";
import { cn } from '@/shared/utils/utils'
import { ArrowUpDown } from 'lucide-react'
import PageHeader from "@/shared/components/PageHeader";
import { motion, type Variants } from "framer-motion";
import { useState } from "react";
import { useNavLanguage } from "@/features/site/lib/nav-language";

type SortOrder = "asc" | "desc";

function sortTagsByCount(
  tagCounts: Record<string, number>,
  sortOrder: SortOrder,
) {
  return Object.keys(tagCounts).sort((a, b) => {
    const diff = tagCounts[b] - tagCounts[a];
    if (diff !== 0) {
      return sortOrder === "desc" ? diff : -diff;
    }
    return a.localeCompare(b, "zh-Hans-CN");
  });
}

const containerVariants: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.03,
    },
  },
};

const itemVariants: Variants = {
  hidden: { opacity: 0, scale: 0.9, y: 10 },
  visible: {
    opacity: 1,
    scale: 1,
    y: 0,
    transition: {
      type: "spring",
      stiffness: 260,
      damping: 20,
    },
  },
};

export default function TagsClient({
  tagCounts,
}: {
  tagCounts: Record<string, number>;
}) {
  const { locale, dictionary } = useNavLanguage();
  const [sortOrder, setSortOrder] = useState<SortOrder>("desc");
  const sortedTags = sortTagsByCount(tagCounts, sortOrder);

  const totalTags = sortedTags.length;
  const totalReferences = Object.values(tagCounts).reduce(
    (sum, count) => sum + count,
    0,
  );

  const t = dictionary.tagsPage;
  const tagsMetaText = t.meta
    .replace('{total}', String(totalTags))
    .replace('{refs}', String(totalReferences));
  const toggleSortLabel = sortOrder === "desc" ? t.sortDesc : t.sortAsc;

  return (
    <section className="mx-auto max-w-5xl px-4 pt-4 pb-12 sm:pt-6 sm:pb-16 sm:px-6 lg:px-8">
      <div>
        <PageHeader
          title={t.allTags}
          meta={tagsMetaText}
          action={
            <button
              onClick={() =>
                setSortOrder((prev) => (prev === "desc" ? "asc" : "desc"))
              }
              className={cn(
                "group inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full transition-colors text-label-12 font-medium cursor-pointer",
                "border border-border text-neutral-7 hover:text-accent hover:border-accent/40",
                "bg-neutral-1 hover:bg-neutral-2 shadow-xs"
              )}
            >
              <ArrowUpDown className="h-3 w-3 text-neutral-5 group-hover:text-accent transition-colors" />
              <span className="leading-none">{toggleSortLabel}</span>
            </button>
          }
        />
      </div>

      {sortedTags.length === 0 ? (
        <div className="border border-border bg-neutral-1 mt-6 rounded-lg px-4 py-12 text-center text-copy-14 text-neutral-6">
          {t.noTagsFound}
        </div>
      ) : (
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="flex flex-wrap gap-2.5 sm:gap-3 items-center mt-6"
        >
          {sortedTags.map((tag) => {
            const label = getTagLabel(tag, locale);
            const count = tagCounts[tag];

            return (
              <motion.div key={tag} variants={itemVariants}>
                <Link
                  href={`/tags/${normalizeTagToSlug(tag)}`}
                  className="group relative flex items-center gap-2 rounded-full border border-border bg-neutral-1 px-3.5 py-1.5 transition-all hover:bg-neutral-2 hover:border-accent/40 hover:-translate-y-0.5 shadow-xs"
                >
                  <span className="text-copy-13 font-medium text-neutral-8 group-hover:text-accent transition-colors">
                    #{label}
                  </span>
                  <span className="flex h-4 min-w-4 items-center justify-center rounded-full bg-neutral-2 px-1.5 text-caption-10 font-normal text-neutral-6 tabular-nums group-hover:text-accent">
                    {count}
                  </span>
                </Link>
              </motion.div>
            );
          })}
        </motion.div>
      )}
    </section>
  );
}
