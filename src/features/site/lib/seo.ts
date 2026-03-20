import type { Metadata } from "next";

import siteMetadata from "@/config/site";
import {
  joinSiteUrl,
  normalizeSiteUrl,
  resolveImageUrl,
  resolveUrl,
} from "@/shared/utils/site-url";
import { getSiteSettings } from "@/server/site-settings";

type MetadataAlternates = NonNullable<Metadata["alternates"]>;

interface PageSEOProps extends Omit<
  Metadata,
  "title" | "description" | "keywords" | "openGraph" | "twitter" | "alternates"
> {
  title: string;
  description?: string;
  image?: string;
  pathname?: string;
  absoluteTitle?: boolean;
  alternates?: Metadata["alternates"];
}

export interface BreadcrumbItem {
  name: string;
  item: string;
}

export { joinSiteUrl, normalizeSiteUrl, resolveImageUrl, resolveUrl };

export function parseSeoKeywords(value?: string | null) {
  if (!value) return undefined;

  const keywords = value
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);

  return keywords.length > 0 ? keywords : undefined;
}

export function languageToOgLocale(language?: string | null) {
  const normalized = String(
    language || siteMetadata.language || "zh-CN",
  ).trim();
  return normalized.replace(/-/g, "_");
}

function mergeAlternates(
  siteUrl: string,
  pathname: string,
  alternates?: Metadata["alternates"],
): Metadata["alternates"] {
  const canonical = resolveUrl(
    siteUrl,
    typeof alternates?.canonical === "string" ||
      alternates?.canonical instanceof URL
      ? alternates.canonical
      : pathname,
  );

  if (!alternates) {
    return {
      canonical,
    };
  }

  const merged: MetadataAlternates = {
    ...alternates,
    canonical,
  };

  if (alternates.types) {
    merged.types = Object.fromEntries(
      Object.entries(alternates.types).map(([mimeType, url]) => [
        mimeType,
        Array.isArray(url) ? url : resolveUrl(siteUrl, url) || url,
      ]),
    );
  }

  return merged;
}

export async function getSeoContext() {
  const settings = await getSiteSettings();
  const siteUrl = normalizeSiteUrl(settings.siteUrl || siteMetadata.siteUrl);
  const siteTitle = settings.title || siteMetadata.title;
  const description = settings.description || siteMetadata.description;
  const language = siteMetadata.language || "zh-CN";
  const socialBanner =
    resolveImageUrl(
      siteUrl,
      settings.socialBanner || siteMetadata.socialBanner,
    ) || joinSiteUrl(siteUrl, "/");

  return {
    settings,
    siteUrl,
    siteTitle,
    description,
    language,
    socialBanner,
    keywords: parseSeoKeywords(settings.seoKeywords),
    openGraphLocale: languageToOgLocale(language),
  };
}

export async function genPageMetadata({
  title,
  description,
  image,
  pathname = "/",
  absoluteTitle = false,
  alternates,
  ...metadataRest
}: PageSEOProps): Promise<Metadata> {
  const seo = await getSeoContext();

  /**
   * 优化描述逻辑：
   * 1. 优先使用传入的 description
   * 2. 如果没有传入且长度不足 50 字符，则根据基础配置自动补齐。
   * 确保最终描述长度在 80-160 字符之间。
   */
  let resolvedDescription = description || seo.description;

  if (resolvedDescription.length < 50) {
    const suffix = `。这是 ${seo.siteTitle} 的官方频道。致力于呈现深度技术分析、前端工程化实战与全栈开发经验方案，与开发者共同探寻技术的纯粹与美好。`;
    resolvedDescription = `${resolvedDescription}${suffix}`.slice(0, 160);
  }

  const resolvedImage = resolveImageUrl(seo.siteUrl, image) || seo.socialBanner;
  const canonicalUrl = joinSiteUrl(seo.siteUrl, pathname);
  const resolvedTitle = absoluteTitle ? title : `${title} | ${seo.siteTitle}`;

  return {
    metadataBase: new URL(seo.siteUrl),
    title: absoluteTitle ? { absolute: title } : title,
    description: resolvedDescription,
    keywords: seo.keywords,
    alternates: mergeAlternates(seo.siteUrl, canonicalUrl, alternates),
    openGraph: {
      title: resolvedTitle,
      description: resolvedDescription,
      url: canonicalUrl,
      siteName: seo.siteTitle,
      images: [resolvedImage],
      locale: seo.openGraphLocale,
      type: "website",
    },
    twitter: {
      title: resolvedTitle,
      description: resolvedDescription,
      card: "summary_large_image",
      images: [resolvedImage],
    },
    ...metadataRest,
  };
}

export function genBreadcrumbJsonLd(items: BreadcrumbItem[], siteUrl: string) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: item.name,
      item: resolveUrl(siteUrl, item.item),
    })),
  };
}

export function genWebSiteJsonLd(
  siteTitle: string,
  siteUrl: string,
  description?: string,
) {
  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: siteTitle,
    url: siteUrl,
    description,
  };
}
