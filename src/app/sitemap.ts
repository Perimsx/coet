import type { MetadataRoute } from "next"
import { allBlogs } from "contentlayer/generated"
import { slug } from "github-slugger"

import { resolvePostCategories } from "@/features/content/lib/post-categories"
import {
  getSeoContext,
  joinSiteUrl,
  resolveImageUrl,
} from "@/features/site/lib/seo"

export const dynamic = "force-dynamic"

type SitemapEntry = MetadataRoute.Sitemap[number]

function getLatestTimestamp(values: Array<string | Date | undefined>) {
  const timestamps = values
    .filter(Boolean)
    .map((value) => new Date(value as string | Date).getTime())
    .filter((value) => Number.isFinite(value))

  return timestamps.length ? new Date(Math.max(...timestamps)) : new Date()
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const { siteUrl, socialBanner } = await getSeoContext();
  const publishedPosts = allBlogs.filter((post) => !post.draft);
  const now = new Date();

  const tagMap = new Map<string, Date>();
  const categoryMap = new Map<string, Date>();

  const blogRoutes: SitemapEntry[] = publishedPosts.map((post) => {
    const updatedAt = getLatestTimestamp([post.lastmod, post.date]);
    const resolvedCategories = resolvePostCategories(
      post.categories,
      post.filePath,
    );

    post.tags?.forEach((tag) => {
      const tagSlug = slug(tag);
      const current = tagMap.get(tagSlug);
      if (!current || updatedAt > current) {
        tagMap.set(tagSlug, updatedAt);
      }
    });

    resolvedCategories.forEach((category) => {
      const current = categoryMap.get(category);
      if (!current || updatedAt > current) {
        categoryMap.set(category, updatedAt);
      }
    });

    const images = post.images
      ? (Array.isArray(post.images) ? post.images : [post.images])
          .map((image) => resolveImageUrl(siteUrl, image))
          .filter((image): image is string => Boolean(image))
      : [socialBanner];

    // 确保 URL 拼接正确
    const postPath = post.path.startsWith("/") ? post.path : `/${post.path}`;

    return {
      url: joinSiteUrl(siteUrl, postPath),
      lastModified: updatedAt,
      changeFrequency: "weekly",
      priority: 0.9,
      images,
    };
  });

  const staticRoutes: SitemapEntry[] = [
    {
      url: joinSiteUrl(siteUrl, "/"),
      lastModified: getLatestTimestamp(
        blogRoutes.map((route) => route.lastModified),
      ),
      changeFrequency: "daily",
      priority: 1,
    },
    {
      url: joinSiteUrl(siteUrl, "/blog"),
      lastModified: getLatestTimestamp(
        blogRoutes.map((route) => route.lastModified),
      ),
      changeFrequency: "daily",
      priority: 0.85,
    },
    {
      url: joinSiteUrl(siteUrl, "/archive"),
      lastModified: getLatestTimestamp(
        blogRoutes.map((route) => route.lastModified),
      ),
      changeFrequency: "weekly",
      priority: 0.7,
    },
    {
      url: joinSiteUrl(siteUrl, "/tags"),
      lastModified: getLatestTimestamp(Array.from(tagMap.values())),
      changeFrequency: "weekly",
      priority: 0.7,
    },
    {
      url: joinSiteUrl(siteUrl, "/about"),
      lastModified: now,
      changeFrequency: "monthly",
      priority: 0.6,
    },
    {
      url: joinSiteUrl(siteUrl, "/friends"),
      lastModified: now,
      changeFrequency: "weekly",
      priority: 0.5,
    },
  ];

  const tagRoutes: SitemapEntry[] = Array.from(tagMap.entries()).map(
    ([tag, updatedAt]) => ({
      url: joinSiteUrl(siteUrl, `/tags/${tag}`),
      lastModified: updatedAt,
      changeFrequency: "weekly",
      priority: 0.75,
    }),
  );

  const categoryRoutes: SitemapEntry[] = Array.from(categoryMap.entries()).map(
    ([category, updatedAt]) => ({
      url: joinSiteUrl(
        siteUrl,
        `/blog/category/${encodeURIComponent(category)}`,
      ),
      lastModified: updatedAt,
      changeFrequency: "weekly",
      priority: 0.8,
    }),
  );

  return [
    ...staticRoutes,
    ...blogRoutes,
    ...tagRoutes,
    ...categoryRoutes,
  ];
}
