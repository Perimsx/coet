import { ReactNode } from "react";
import { CoreContent } from "pliny/utils/contentlayer";
import type { Authors, Blog } from "contentlayer/generated";
import { Coffee, Cone } from "lucide-react";
import Comments from "@/features/comments/components/Comments";
import FloatingToc from "@/features/content/components/FloatingToc";
import Link from "@/shared/components/Link";
import SectionContainer from "@/features/site/components/SectionContainer";
import { siteMetadata } from "@/blog.config";
import { getDictionary } from "@/shared/utils/i18n";
import ReadingProgressBar from "@/features/site/components/ReadingProgressBar";
import { TocProvider } from "@/features/content/components/TocContext";
import { PostLayoutContent } from "@/features/content/components/PostLayoutContent";
import { ArticleEnhancer } from "@/features/content/components/ArticleEnhancer";
import TypewriterSummary from "@/features/content/components/TypewriterSummary";
import PostHeader from "@/features/content/components/PostHeader";

function formatPostDate(dateString: string, locale: "zh" | "en" = "zh") {
  const d = new Date(dateString);
  if (locale === "en") {
    return d.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  }
  const now = new Date();
  if (d.getFullYear() === now.getFullYear()) {
    return `${d.getMonth() + 1}月${d.getDate()}日`;
  }
  return `${d.getFullYear().toString().slice(-2)}年${d.getMonth() + 1}月${d.getDate()}日`;
}

interface LayoutProps {
  content: CoreContent<Blog>;
  authorDetails: CoreContent<Authors>[];
  toc?: { value: string; url: string; depth: number }[];
  next?: { path: string; title: string; date?: string };
  prev?: { path: string; title: string; date?: string };
  children: ReactNode;
}

export default function PostLayout({
  content,
  authorDetails,
  toc,
  next,
  prev,
  children,
}: LayoutProps) {
  const { slug, date, title, tags, categories } = content;
  const category = categories && categories.length > 0 ? categories[0] : null;
  const isEn =
    slug?.startsWith("en/") ||
    content.path?.startsWith("en/") ||
    content.filePath?.includes(".en.");
  const locale = isEn ? "en" : "zh";
  const dictionary = getDictionary(locale);
  const dateLocale = locale === "en" ? "en-US" : "zh-CN";

  return (
    <SectionContainer>
      <TocProvider>
        <ReadingProgressBar />

        <PostLayoutContent
          header={
            <PostHeader
              title={title}
              summary={content.summary}
              date={date}
              category={category}
              tags={tags}
              coverImage={content.images}
              readTimeMinutes={
                content.readingTime?.minutes
                  ? Math.ceil(content.readingTime.minutes)
                  : 5
              }
              authorName={authorDetails?.[0]?.name || "Kerntau"}
              authorAvatar={authorDetails?.[0]?.avatar || "/avatar.png"}
              locale={locale}
            />
          }
          toc={<FloatingToc toc={toc} />}
        >
          <div className="relative w-full">
            {/* 打字机摘要区域，位于封面图下方，正文主体上方 */}
            {content.summary && (
              <div className="w-full mt-6 mb-2">
                <TypewriterSummary summary={content.summary} />
              </div>
            )}

            <div className="w-full break-words pt-2 pb-2 sm:pt-4 sm:pb-4">
              <article id="article" className="article-detail">
                {children}
              </article>
              <ArticleEnhancer />
            </div>

            <div className="border-t border-border">
              <div className="py-6 px-4 sm:px-0" id="article-footer">
                <div className="group/license relative overflow-hidden rounded-xl border border-border bg-neutral-1 p-5 sm:p-6 shadow-xs">
                  <div className="relative z-10 flex flex-col gap-4 sm:gap-5">
                    {/* 顶部标题与链接 */}
                    <div className="space-y-1">
                      <h4 className="font-serif text-copy-15 font-medium text-neutral-10 line-clamp-2">
                        {title}
                      </h4>
                      <p className="inline-block rounded-md bg-neutral-2 px-2.5 py-0.5 text-caption-10 font-normal text-neutral-7 truncate max-w-full">
                        {`${siteMetadata.siteUrl}/blog/${slug}`}
                      </p>
                    </div>

                    {/* 四列元数据 */}
                    <div className="grid grid-cols-2 gap-y-4 gap-x-4 sm:grid-cols-4 pt-2 border-t border-border">
                      <div className="flex flex-col gap-1">
                        <span className="text-caption-10 font-semibold uppercase tracking-widest text-neutral-6">
                          {dictionary.post.authors}
                        </span>
                        <span className="text-label-12 font-medium text-neutral-9">
                          {authorDetails[0]?.name || siteMetadata.author}
                        </span>
                      </div>
                      <div className="flex flex-col gap-1">
                        <span className="text-caption-10 font-semibold uppercase tracking-widest text-neutral-6">
                          {dictionary.post.publishedAt}
                        </span>
                        <time className="text-label-12 font-normal text-neutral-8">
                          {new Date(date).toLocaleDateString(dateLocale)}
                        </time>
                      </div>
                      <div className="flex flex-col gap-1">
                        <span className="text-caption-10 font-semibold uppercase tracking-widest text-neutral-6">
                          {dictionary.post.updatedAt}
                        </span>
                        <time className="text-label-12 font-normal text-neutral-8">
                          {new Date(content.lastmod || date).toLocaleDateString(
                            dateLocale,
                          )}
                        </time>
                      </div>
                      <div className="flex flex-col gap-1">
                        <span className="text-caption-10 font-semibold uppercase tracking-widest text-neutral-6">
                          {dictionary.post.licenseLabel}
                        </span>
                        <Link
                          href="https://creativecommons.org/licenses/by-nc-sa/4.0/deed.zh"
                          rel="license noopener noreferrer"
                          className="text-label-12 font-medium text-accent hover:underline"
                        >
                          {dictionary.post.licenseName}
                        </Link>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <nav className="flex flex-col sm:flex-row w-full items-center justify-between py-6 px-4 sm:px-0 border-t border-border gap-4 sm:gap-0">
                {/* Previous Post (Newer) */}
                <div className="flex w-full sm:w-1/2 justify-start">
                  {prev?.path ? (
                    <Link
                      href={`/${prev.path}`}
                      className="group flex w-full items-center gap-3 transition-colors pr-4"
                    >
                      <div className="flex flex-col text-left">
                        <span className="text-caption-10 text-neutral-5 uppercase">
                          {dictionary.post.previousArticle || '上一篇'}
                        </span>
                        <span className="line-clamp-1 font-serif text-copy-14 font-medium text-neutral-9 transition-colors group-hover:text-accent">
                          {prev.title}
                        </span>
                        {prev.date && (
                          <time className="mt-0.5 text-caption-10 text-neutral-6">
                            {formatPostDate(prev.date, locale)}
                          </time>
                        )}
                      </div>
                    </Link>
                  ) : (
                    <div className="flex items-center gap-2 text-neutral-5 text-label-12 font-normal">
                      <Coffee className="w-4 h-4" />
                      <span>{dictionary.post.noPrevPost}</span>
                    </div>
                  )}
                </div>

                {/* Next Post (Older) */}
                <div className="flex w-full sm:w-1/2 justify-end mt-2 sm:mt-0">
                  {next?.path ? (
                    <Link
                      href={`/${next.path}`}
                      className="group flex w-full items-center justify-end gap-3 text-right transition-colors pl-4"
                    >
                      <div className="flex flex-col items-end text-right">
                        <span className="text-caption-10 text-neutral-5 uppercase">
                          {dictionary.post.nextArticle || '下一篇'}
                        </span>
                        <span className="line-clamp-1 font-serif text-copy-14 font-medium text-neutral-9 transition-colors group-hover:text-accent">
                          {next.title}
                        </span>
                        {next.date && (
                          <time className="mt-0.5 text-caption-10 text-neutral-6">
                            {formatPostDate(next.date, locale)}
                          </time>
                        )}
                      </div>
                    </Link>
                  ) : (
                    <div className="flex items-center justify-end gap-2 text-neutral-5 text-label-12 font-normal">
                      <span>{dictionary.post.noNextPost}</span>
                      <Cone className="w-4 h-4" />
                    </div>
                  )}
                </div>
              </nav>

              {siteMetadata.comments && (
                <div
                  className="py-6 text-center text-gray-700 dark:text-gray-300"
                  id="comment"
                >
                  <Comments slug={slug || ""} locale={locale} />
                </div>
              )}
            </div>
          </div>
        </PostLayoutContent>
      </TocProvider>
    </SectionContainer>
  );
}
