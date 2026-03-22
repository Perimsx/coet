"use client";

import { slug } from "github-slugger";
import Link from "@/shared/components/Link";
import { cn } from '@/shared/utils/utils'
import { ArrowUpDown } from 'lucide-react'
import PageHeader from "@/shared/components/PageHeader";
import { motion, type Variants } from "framer-motion";
import { useState } from "react";

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
  const [sortOrder, setSortOrder] = useState<SortOrder>("desc");
  const sortedTags = sortTagsByCount(tagCounts, sortOrder);

  const totalTags = sortedTags.length;
  const totalReferences = Object.values(tagCounts).reduce(
    (sum, count) => sum + count,
    0,
  );
  const tagsMetaText = `已成功解析 ${totalTags} 个脑电波节点，遭遇 ${totalReferences} 次高频读取。`;

  const toggleSortLabel = sortOrder === "desc" ? "按热度降序" : "按字母升序";

  return (
    <section className="mx-auto max-w-5xl px-4 pt-0 pb-4 sm:pt-2 sm:px-6 lg:px-8">
      <div className="mb-0 sm:mb-2">
        <PageHeader
          title="全部标签"
          meta={tagsMetaText}
          action={
            <button
              onClick={() =>
                setSortOrder((prev) => (prev === "desc" ? "asc" : "desc"))
              }
              className={cn(
                "group inline-flex items-center gap-2 px-3 py-1.5 rounded-md transition-all text-[11px] font-bold tracking-tight uppercase",
                "border border-zinc-200 dark:border-zinc-800 text-zinc-500 dark:text-zinc-400",
                "bg-zinc-50/50 dark:bg-zinc-900/30 hover:bg-zinc-100 dark:hover:bg-zinc-800"
              )}
            >
              <ArrowUpDown className="h-3.5 w-3.5 text-zinc-400 group-hover:text-zinc-600 dark:group-hover:text-zinc-300 transition-colors" />
              <span className="leading-none">{toggleSortLabel}</span>
            </button>
          }
        />
      </div>

      {sortedTags.length === 0 ? (
        <div className="border-border/30 bg-muted/20 mt-6 rounded-2xl border px-4 py-12 text-center text-sm text-foreground/40">
          未找到任何标签
        </div>
      ) : (
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="flex flex-wrap gap-3 sm:gap-4 flex-start"
        >
          {sortedTags.map((tag) => {
            const label = tag;
            const count = tagCounts[tag];

            return (
              <motion.div key={tag} variants={itemVariants}>
                <Link
                  href={`/tags/${slug(tag)}`}
                  className="group relative flex items-center gap-2 rounded-2xl border border-border/40 bg-card/10 px-4 py-2.5 transition-all hover:bg-card hover:shadow-xl hover:shadow-primary/5 hover:-translate-y-1 hover:border-primary/20"
                >
                  <span className="text-sm font-semibold text-foreground/70 group-hover:text-primary transition-colors">
                    # {label}
                  </span>
                  <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-muted/50 px-1.5 text-[9px] font-black text-muted-foreground/40 transition-colors group-hover:bg-primary/10 group-hover:text-primary/60">
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
