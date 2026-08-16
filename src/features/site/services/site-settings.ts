import { siteMetadata, sitePresentationDefaults } from "@/blog.config";
import { getDatabaseSettings } from "@/features/content/lib/database-content-source";
import defaultSiteSettings from "@/../content/site-settings.json";

export type SiteSettings = {
  title: string;
  headerTitle: string;
  description: string;
  author: string;
  email: string;
  github: string;
  x: string;
  yuque: string;
  icp: string;
  policeBeian: string;
  siteUrl: string;
  seoKeywords: string;
  socialBanner: string;
  welcomeMessage: string;
  googleSearchConsole: string;
  siteCreatedAt: string;
  heroGreetingPrefix: string;
  heroDisplayName: string;
  heroRole: string;
  heroBottomText: string;
  heroAvatar: string;
  enableSearch: string;
  enableSuggestion: string;
  enableThemeSwitch: string;
  footerPoweredByLabel: string;
  footerPoweredByName: string;
  footerRightsText: string;
  footerPoliceBadgeIcon: string;
  friendName: string;
  friendUrl: string;
  friendAvatar: string;
  friendDescription: string;
  baiduSearchConsole: string;
};

function defaultSettings(): SiteSettings {
  const metadata = siteMetadata as typeof siteMetadata & {
    googleSearchConsole?: string;
    siteCreatedAt?: string;
  };

  return {
    title: siteMetadata.title || "",
    headerTitle:
      typeof siteMetadata.headerTitle === "string"
        ? siteMetadata.headerTitle
        : siteMetadata.title || "",
    description: siteMetadata.description || "",
    author: siteMetadata.author || "",
    email: siteMetadata.email || "",
    github: siteMetadata.github || "",
    x: siteMetadata.x || "",
    yuque: siteMetadata.yuque || "",
    icp: siteMetadata.icp || "",
    policeBeian: siteMetadata.policeBeian || "",
    siteUrl: siteMetadata.siteUrl || "",
    seoKeywords: "",
    socialBanner: siteMetadata.socialBanner || "",
    welcomeMessage: sitePresentationDefaults.hero.tagline,
    googleSearchConsole: metadata.googleSearchConsole || "",
    siteCreatedAt: metadata.siteCreatedAt || "2025-11-10 00:07:03",
    heroGreetingPrefix: sitePresentationDefaults.hero.greetingPrefix,
    heroDisplayName: sitePresentationDefaults.hero.displayName,
    heroRole: sitePresentationDefaults.hero.role,
    heroBottomText: sitePresentationDefaults.hero.bottomText,
    heroAvatar: sitePresentationDefaults.hero.avatarSrc,
    enableSearch: String(
      sitePresentationDefaults.header.featureFlags.enableSearch,
    ),
    enableSuggestion: String(
      sitePresentationDefaults.header.featureFlags.enableSuggestion,
    ),
    enableThemeSwitch: String(
      sitePresentationDefaults.header.featureFlags.enableThemeSwitch,
    ),
    footerPoweredByLabel: sitePresentationDefaults.footer.poweredByLabel,
    footerPoweredByName: sitePresentationDefaults.footer.poweredByName,
    footerRightsText: sitePresentationDefaults.footer.rightsText,
    footerPoliceBadgeIcon: sitePresentationDefaults.footer.policeBadgeIcon,
    friendName: "",
    friendUrl: "",
    friendAvatar: "",
    friendDescription: "",
    baiduSearchConsole: "",
  };
}

function normalize(value: unknown, max = 300) {
  if (typeof value !== "string") return "";
  return value.trim().slice(0, max);
}

function normalizeToggle(value: unknown, fallback: string) {
  if (value === "true" || value === "false") {
    return value;
  }

  const normalized = normalize(value, 5).toLowerCase();
  if (normalized === "true" || normalized === "false") {
    return normalized;
  }

  return fallback;
}

export async function getSiteSettings(): Promise<SiteSettings> {
  const base = defaultSettings();
  const parsed: Partial<SiteSettings> = (defaultSiteSettings as Partial<SiteSettings>) || {};

  const remoteSettings = await getDatabaseSettings();
  const values = { ...parsed, ...(remoteSettings || {}) };

  return {
    title: normalize(values.title, 120) || base.title,
    headerTitle: normalize(values.headerTitle, 120) || base.headerTitle,
    description: normalize(values.description, 300) || base.description,
    author: normalize(values.author, 120) || base.author,
    email: normalize(values.email, 120) || base.email,
    github: normalize(values.github, 240) || base.github,
    x: normalize(values.x, 240) || base.x,
    yuque: normalize(values.yuque, 240) || base.yuque,
    icp: normalize(values.icp, 120),
    policeBeian: normalize(values.policeBeian, 120),
    siteUrl: normalize(values.siteUrl, 120) || base.siteUrl,
    seoKeywords: normalize(values.seoKeywords, 500),
    socialBanner: normalize(values.socialBanner, 240) || base.socialBanner,
    welcomeMessage:
      normalize(values.welcomeMessage, 500) || base.welcomeMessage,
    googleSearchConsole:
      normalize(values.googleSearchConsole, 240) || base.googleSearchConsole,
    siteCreatedAt: normalize(values.siteCreatedAt, 100) || base.siteCreatedAt,
    heroGreetingPrefix:
      normalize(values.heroGreetingPrefix, 120) || base.heroGreetingPrefix,
    heroDisplayName:
      normalize(values.heroDisplayName, 120) || base.heroDisplayName,
    heroRole: normalize(values.heroRole, 160) || base.heroRole,
    heroBottomText:
      normalize(values.heroBottomText, 240) || base.heroBottomText,
    heroAvatar: normalize(values.heroAvatar, 300) || base.heroAvatar,
    enableSearch: normalizeToggle(values.enableSearch, base.enableSearch),
    enableSuggestion: normalizeToggle(
      values.enableSuggestion,
      base.enableSuggestion,
    ),
    enableThemeSwitch: normalizeToggle(
      values.enableThemeSwitch,
      base.enableThemeSwitch,
    ),
    footerPoweredByLabel:
      normalize(values.footerPoweredByLabel, 80) || base.footerPoweredByLabel,
    footerPoweredByName:
      normalize(values.footerPoweredByName, 120) || base.footerPoweredByName,
    footerRightsText:
      normalize(values.footerRightsText, 160) || base.footerRightsText,
    footerPoliceBadgeIcon:
      normalize(values.footerPoliceBadgeIcon, 300) ||
      base.footerPoliceBadgeIcon,
    friendName: normalize(values.friendName, 120),
    friendUrl: normalize(values.friendUrl, 240),
    friendAvatar: normalize(values.friendAvatar, 300),
    friendDescription: normalize(values.friendDescription, 300),
    baiduSearchConsole: normalize(values.baiduSearchConsole, 240),
  };
}
