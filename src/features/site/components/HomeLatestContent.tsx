"use client";

import { motion, AnimatePresence } from "framer-motion";
import { useEffect, useState, Suspense, useMemo } from "react";
import type { Blog } from "contentlayer/generated";
import type { CoreContent } from "pliny/utils/contentlayer";
import { formatDate } from "pliny/utils/formatDate";
import { cn } from "@/shared/utils/utils";
import Link from "@/shared/components/Link";
import PostListItem from "@/features/content/components/PostListItem";
import PostPagination from "@/features/content/components/PostPagination";
import { resolvePostCategories } from "@/features/content/lib/post-categories";
import { getLocalizedCategoryLabel } from "@/features/content/lib/localized-category-label";
import { useNavLanguage } from "@/features/site/lib/nav-language";

interface HomeLatestContentProps {
  posts: CoreContent<Blog>[];
}

const listContainerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.12,
      delayChildren: 0.1,
    },
  },
};

export default function HomeLatestContent({ posts }: HomeLatestContentProps) {
  const { locale, dictionary, dateLocale } = useNavLanguage();
  const postsPerPage = 3;
  const [currentPage, setCurrentPage] = useState(1);

  // 根据当前 locale 过滤文章
  const filteredPosts = useMemo(() => {
    return posts.filter((post) => {
      const postLang = post.slug?.startsWith("en/") ? "en" : "zh";
      return postLang === locale;
    });
  }, [posts, locale]);

  // 当语言切换时，重置当前页为 1
  useEffect(() => {
    setCurrentPage(1);
  }, [locale]);

  const totalPages = Math.max(
    1,
    Math.ceil(filteredPosts.length / postsPerPage),
  );
  const startIndex = (currentPage - 1) * postsPerPage;
  const currentPosts = filteredPosts.slice(
    startIndex,
    startIndex + postsPerPage,
  );

  const handlePageChange = (page: number) => {
    const nextPage = Math.min(Math.max(page, 1), totalPages);
    if (nextPage === currentPage) return;
    setCurrentPage(nextPage);
    document
      .getElementById("latest-posts")
      ?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  return (
    <div
      id="latest-posts"
      className="mx-auto max-w-5xl px-4 pt-4 pb-0 sm:px-6 lg:px-8"
    >
      <div className="grid grid-cols-1 gap-5">
        <div className="w-full">
          <section className="h-full">
            <div className="flex items-center justify-between pb-5">
              <h3 className="text-[13px] font-black uppercase tracking-[0.2em] text-foreground/40 leading-8">
                {dictionary.home.latest}
              </h3>
              <Link
                href="/blog"
                className={cn(
                  "inline-flex h-7.5 items-center px-3.5 rounded-full transition-all text-[11px] font-bold tracking-tight uppercase shadow-sm backdrop-blur-md",
                  "border border-border/40 text-muted-foreground hover:text-primary",
                  "bg-background/60 hover:bg-primary/5",
                )}
              >
                {dictionary.common.allPosts}
              </Link>
            </div>

            <div className="-mx-5 overflow-x-hidden px-5">
              <div className="flex flex-col pb-2">
                <AnimatePresence mode="wait">
                  <motion.ul
                    key={currentPage}
                    variants={listContainerVariants}
                    initial="hidden"
                    animate="visible"
                    exit="hidden"
                    className="space-y-2"
                  >
                    {currentPosts.map((post) => {
                      const {
                        slug: postSlug,
                        date,
                        title,
                        summary,
                        tags,
                      } = post;
                      const postSourcePath =
                        post.filePath || post.path || post.slug || "";
                      const primaryCategory = resolvePostCategories(
                        post.categories,
                        postSourcePath,
                      )[0];
                      const categoryLabel =
                        getLocalizedCategoryLabel(primaryCategory, locale);

                      return (
                        <li
                          key={postSlug}
                          className="py-2 first:pt-0 last:pb-0"
                        >
                          <PostListItem
                            href={`/blog/${postSlug}`}
                            dateTime={date}
                            dateText={formatDate(date, dateLocale)}
                            title={title}
                            summary={summary}
                            categorySlug={primaryCategory}
                            categoryLabel={categoryLabel}
                            tags={tags || []}
                            images={post.images}
                            compact
                            showImage={false}
                          />
                        </li>
                      );
                    })}
                  </motion.ul>
                </AnimatePresence>

                <div className="mt-1 px-2 pb-0 transition-all">
                  <Suspense fallback={<div className="h-10" />}>
                    <PostPagination
                      totalPages={totalPages}
                      currentPage={currentPage}
                      onPageChange={handlePageChange}
                    />
                  </Suspense>
                </div>
              </div>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
