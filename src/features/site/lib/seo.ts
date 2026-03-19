import type { Metadata } from "next"

import siteMetadata from "@/config/site"
import { getSiteSettings } from "@/server/site-settings"

type MetadataAlternates = NonNullable<Metadata["alternates"]>

interface PageSEOProps
  extends Omit<
    Metadata,
    "title" | "description" | "keywords" | "openGraph" | "twitter" | "alternates"
  > {
  title: string
  description?: string
  image?: string
  pathname?: string
  absoluteTitle?: boolean
  alternates?: Metadata["alternates"]
}

export interface BreadcrumbItem {
  name: string
  item: string
}

export function normalizeSiteUrl(value?: string) {
  const fallback = siteMetadata.siteUrl || ""
  const raw = (value || fallback).trim()

  if (!raw) {
    return "https://localhost:3000"
  }

  const withProtocol = /^https?:\/\//i.test(raw) ? raw : `https://${raw}`
  return withProtocol.replace(/\/+$/, "")
}

export function normalizePathname(pathname = "/") {
  if (!pathname || pathname === "." || pathname === "./") {
    return "/"
  }

  const cleaned = pathname.trim().replace(/\\/g, "/")
  const withLeadingSlash = cleaned.startsWith("/") ? cleaned : `/${cleaned}`
  const normalized = withLeadingSlash.replace(/\/{2,}/g, "/")

  return normalized.length > 1 ? normalized.replace(/\/+$/, "") : normalized
}

export function joinSiteUrl(siteUrl: string, pathname = "/") {
  return `${normalizeSiteUrl(siteUrl)}${normalizePathname(pathname)}`
}

export function resolveUrl(siteUrl: string, value?: string | URL | null) {
  if (!value) return undefined
  if (value instanceof URL) return value.toString()

  if (/^https?:\/\//i.test(value)) {
    return value
  }

  return joinSiteUrl(siteUrl, value)
}

export function resolveImageUrl(siteUrl: string, image?: string | null) {
  return resolveUrl(siteUrl, image || undefined)
}

export function parseSeoKeywords(value?: string | null) {
  if (!value) return undefined

  const keywords = value
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean)

  return keywords.length > 0 ? keywords : undefined
}

export function languageToOgLocale(language?: string | null) {
  const normalized = String(language || siteMetadata.language || "zh-CN").trim()
  return normalized.replace(/-/g, "_")
}

function mergeAlternates(
  siteUrl: string,
  pathname: string,
  alternates?: Metadata["alternates"],
): Metadata["alternates"] {
  const canonical = resolveUrl(
    siteUrl,
    typeof alternates?.canonical === "string" || alternates?.canonical instanceof URL
      ? alternates.canonical
      : pathname,
  )

  if (!alternates) {
    return {
      canonical,
    }
  }

  const merged: MetadataAlternates = {
    ...alternates,
    canonical,
  }

  if (alternates.types) {
    merged.types = Object.fromEntries(
      Object.entries(alternates.types).map(([mimeType, url]) => [
        mimeType,
        Array.isArray(url) ? url : resolveUrl(siteUrl, url) || url,
      ]),
    )
  }

  return merged
}

export async function getSeoContext() {
  const settings = await getSiteSettings()
  const siteUrl = normalizeSiteUrl(settings.siteUrl || siteMetadata.siteUrl)
  const siteTitle = settings.title || siteMetadata.title
  const description = settings.description || siteMetadata.description
  const language = siteMetadata.language || "zh-CN"
  const socialBanner =
    resolveImageUrl(siteUrl, settings.socialBanner || siteMetadata.socialBanner) ||
    joinSiteUrl(siteUrl, "/")

  return {
    settings,
    siteUrl,
    siteTitle,
    description,
    language,
    socialBanner,
    keywords: parseSeoKeywords(settings.seoKeywords),
    openGraphLocale: languageToOgLocale(language),
  }
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
  const seo = await getSeoContext()
  const resolvedDescription = description || seo.description
  const resolvedImage = resolveImageUrl(seo.siteUrl, image) || seo.socialBanner
  const canonicalUrl = joinSiteUrl(seo.siteUrl, pathname)
  const resolvedTitle = absoluteTitle ? title : `${title} | ${seo.siteTitle}`

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
  }
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
  }
}

export function genWebSiteJsonLd(siteTitle: string, siteUrl: string, description?: string) {
  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: siteTitle,
    url: siteUrl,
    description,
  }
}
