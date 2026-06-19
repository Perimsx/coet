import "server-only";

import { promises as fs } from "fs";
import path from "path";
import { siteMetadata, sitePresentationDefaults } from "@/blog.config";

export type SiteSettings = {
  title: string;
  headerTitle: string;
  description: string;
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
  indexNowKey: string;
  baiduToken: string;
  baiduSearchConsole: string;
};

const settingsFilePath = path.join(
  process.cwd(),
  "storage",
  "settings",
  "site-settings.json",
);

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
    email: siteMetadata.email || "",
    github: siteMetadata.github || "",
    x: siteMetadata.x || "",
    yuque: siteMetadata.yuque || "",
    icp: "",
    policeBeian: "",
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
    indexNowKey: "",
    baiduToken: "",
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
  try {
    const raw = await fs.readFile(settingsFilePath, "utf8");
    const parsed = JSON.parse(raw) as Partial<SiteSettings>;
    return {
      title: normalize(parsed.title, 120) || base.title,
      headerTitle: normalize(parsed.headerTitle, 120) || base.headerTitle,
      description: normalize(parsed.description, 300) || base.description,
      email: normalize(parsed.email, 120) || base.email,
      github: normalize(parsed.github, 240) || base.github,
      x: normalize(parsed.x, 240) || base.x,
      yuque: normalize(parsed.yuque, 240) || base.yuque,
      icp: normalize(parsed.icp, 120),
      policeBeian: normalize(parsed.policeBeian, 120),
      siteUrl: normalize(parsed.siteUrl, 120) || base.siteUrl,
      seoKeywords: normalize(parsed.seoKeywords, 500),
      socialBanner: normalize(parsed.socialBanner, 240) || base.socialBanner,
      welcomeMessage:
        normalize(parsed.welcomeMessage, 500) || base.welcomeMessage,
      googleSearchConsole:
        normalize(parsed.googleSearchConsole, 240) || base.googleSearchConsole,
      siteCreatedAt: normalize(parsed.siteCreatedAt, 100) || base.siteCreatedAt,
      heroGreetingPrefix:
        normalize(parsed.heroGreetingPrefix, 120) || base.heroGreetingPrefix,
      heroDisplayName:
        normalize(parsed.heroDisplayName, 120) || base.heroDisplayName,
      heroRole: normalize(parsed.heroRole, 160) || base.heroRole,
      heroBottomText:
        normalize(parsed.heroBottomText, 240) || base.heroBottomText,
      heroAvatar: normalize(parsed.heroAvatar, 300) || base.heroAvatar,
      enableSearch: normalizeToggle(parsed.enableSearch, base.enableSearch),
      enableSuggestion: normalizeToggle(
        parsed.enableSuggestion,
        base.enableSuggestion,
      ),
      enableThemeSwitch: normalizeToggle(
        parsed.enableThemeSwitch,
        base.enableThemeSwitch,
      ),
      footerPoweredByLabel:
        normalize(parsed.footerPoweredByLabel, 80) || base.footerPoweredByLabel,
      footerPoweredByName:
        normalize(parsed.footerPoweredByName, 120) || base.footerPoweredByName,
      footerRightsText:
        normalize(parsed.footerRightsText, 160) || base.footerRightsText,
      footerPoliceBadgeIcon:
        normalize(parsed.footerPoliceBadgeIcon, 300) ||
        base.footerPoliceBadgeIcon,
      friendName: normalize(parsed.friendName, 120),
      friendUrl: normalize(parsed.friendUrl, 240),
      friendAvatar: normalize(parsed.friendAvatar, 300),
      friendDescription: normalize(parsed.friendDescription, 300),
      indexNowKey: normalize(parsed.indexNowKey, 120),
      baiduToken: normalize(parsed.baiduToken, 120),
      baiduSearchConsole: normalize(parsed.baiduSearchConsole, 240),
    };
  } catch {
    return base;
  }
}
