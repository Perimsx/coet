import siteMetadata from "@/config/site";

export function normalizeSiteUrl(value?: string) {
  const fallback = siteMetadata.siteUrl || "";
  const raw = (value || fallback).trim();

  if (!raw) {
    return "https://localhost:3000";
  }

  const withProtocol = /^https?:\/\//i.test(raw) ? raw : `https://${raw}`;
  return withProtocol.replace(/\/+$/, "");
}

export function normalizePathname(pathname = "/") {
  if (!pathname || pathname === "." || pathname === "./") {
    return "/";
  }

  const cleaned = pathname.trim().replace(/\\/g, "/");
  const withLeadingSlash = cleaned.startsWith("/") ? cleaned : `/${cleaned}`;
  const normalized = withLeadingSlash.replace(/\/{2,}/g, "/");

  return normalized.length > 1 ? normalized.replace(/\/+$/, "") : normalized;
}

export function joinSiteUrl(siteUrl: string, pathname = "/") {
  return `${normalizeSiteUrl(siteUrl)}${normalizePathname(pathname)}`;
}

export function resolveUrl(siteUrl: string, value?: string | URL | null) {
  if (!value) return undefined;
  if (value instanceof URL) return value.toString();

  if (/^https?:\/\//i.test(value)) {
    return value;
  }

  return joinSiteUrl(siteUrl, value);
}

export function resolveImageUrl(siteUrl: string, image?: string | null) {
  return resolveUrl(siteUrl, image || undefined);
}
