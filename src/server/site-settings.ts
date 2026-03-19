import "server-only";

import { promises as fs } from "fs";
import path from "path";
import siteMetadata from "@/config/site";
import { sitePresentationDefaults } from "@/config/site-presentation";

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
};

export type GeneralSettingsPayload = Pick<
  SiteSettings,
  | "title"
  | "headerTitle"
  | "description"
  | "siteUrl"
  | "icp"
  | "policeBeian"
  | "footerRightsText"
  | "footerPoweredByLabel"
  | "footerPoweredByName"
  | "footerPoliceBadgeIcon"
>;

export type UiUxSettingsPayload = Pick<
  SiteSettings,
  | "welcomeMessage"
  | "heroGreetingPrefix"
  | "heroDisplayName"
  | "heroRole"
  | "heroBottomText"
  | "heroAvatar"
  | "enableSearch"
  | "enableSuggestion"
  | "enableThemeSwitch"
>;

export type SeoSocialSettingsPayload = Pick<
  SiteSettings,
  | "email"
  | "github"
  | "x"
  | "yuque"
  | "seoKeywords"
  | "socialBanner"
  | "googleSearchConsole"
>;

export type SecuritySettingsPayload = Record<string, never>;

export type SiteSettingsSection =
  | "general"
  | "uiux"
  | "seoSocial"
  | "smtp"
  | "security";

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

function hasDefinedField<T extends object, K extends keyof T>(
  target: T,
  key: K,
) {
  return Object.prototype.hasOwnProperty.call(target, key);
}

function mergeStringField<T extends object, K extends keyof T>(
  next: T,
  current: string,
  key: K,
  max: number,
) {
  return hasDefinedField(next, key) ? normalize(next[key], max) : current;
}

function mergeToggleField<T extends object, K extends keyof T>(
  next: T,
  current: string,
  key: K,
) {
  return hasDefinedField(next, key)
    ? normalizeToggle(next[key], current)
    : current;
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
    };
  } catch {
    return base;
  }
}

export async function saveSiteSettings(next: Partial<SiteSettings>) {
  const current = await getSiteSettings();
  const merged: SiteSettings = {
    title: mergeStringField(next, current.title, "title", 120) || current.title,
    headerTitle:
      mergeStringField(next, current.headerTitle, "headerTitle", 120) ||
      current.headerTitle,
    description:
      mergeStringField(next, current.description, "description", 300) ||
      current.description,
    email: mergeStringField(next, current.email, "email", 120),
    github: mergeStringField(next, current.github, "github", 240),
    x: mergeStringField(next, current.x, "x", 240),
    yuque: mergeStringField(next, current.yuque, "yuque", 240),
    icp: mergeStringField(next, current.icp, "icp", 120),
    policeBeian: mergeStringField(
      next,
      current.policeBeian,
      "policeBeian",
      120,
    ),
    siteUrl: mergeStringField(next, current.siteUrl, "siteUrl", 120),
    seoKeywords: mergeStringField(
      next,
      current.seoKeywords,
      "seoKeywords",
      500,
    ),
    socialBanner: mergeStringField(
      next,
      current.socialBanner,
      "socialBanner",
      240,
    ),
    welcomeMessage: mergeStringField(
      next,
      current.welcomeMessage,
      "welcomeMessage",
      500,
    ),
    googleSearchConsole: mergeStringField(
      next,
      current.googleSearchConsole,
      "googleSearchConsole",
      240,
    ),
    siteCreatedAt: mergeStringField(
      next,
      current.siteCreatedAt,
      "siteCreatedAt",
      100,
    ),
    heroGreetingPrefix:
      mergeStringField(
        next,
        current.heroGreetingPrefix,
        "heroGreetingPrefix",
        120,
      ) || current.heroGreetingPrefix,
    heroDisplayName:
      mergeStringField(next, current.heroDisplayName, "heroDisplayName", 120) ||
      current.heroDisplayName,
    heroRole:
      mergeStringField(next, current.heroRole, "heroRole", 160) ||
      current.heroRole,
    heroBottomText:
      mergeStringField(next, current.heroBottomText, "heroBottomText", 240) ||
      current.heroBottomText,
    heroAvatar:
      mergeStringField(next, current.heroAvatar, "heroAvatar", 300) ||
      current.heroAvatar,
    enableSearch: mergeToggleField(next, current.enableSearch, "enableSearch"),
    enableSuggestion: mergeToggleField(
      next,
      current.enableSuggestion,
      "enableSuggestion",
    ),
    enableThemeSwitch: mergeToggleField(
      next,
      current.enableThemeSwitch,
      "enableThemeSwitch",
    ),
    footerPoweredByLabel:
      mergeStringField(
        next,
        current.footerPoweredByLabel,
        "footerPoweredByLabel",
        80,
      ) || current.footerPoweredByLabel,
    footerPoweredByName:
      mergeStringField(
        next,
        current.footerPoweredByName,
        "footerPoweredByName",
        120,
      ) || current.footerPoweredByName,
    footerRightsText:
      mergeStringField(
        next,
        current.footerRightsText,
        "footerRightsText",
        160,
      ) || current.footerRightsText,
    footerPoliceBadgeIcon:
      mergeStringField(
        next,
        current.footerPoliceBadgeIcon,
        "footerPoliceBadgeIcon",
        300,
      ) || current.footerPoliceBadgeIcon,
  };
  await fs.writeFile(
    settingsFilePath,
    `${JSON.stringify(merged, null, 2)}\n`,
    "utf8",
  );
  return merged;
}

export async function saveSiteSettingsSection(
  section: SiteSettingsSection,
  payload:
    | GeneralSettingsPayload
    | UiUxSettingsPayload
    | SeoSocialSettingsPayload
    | SecuritySettingsPayload,
) {
  if (section === "security") {
    return getSiteSettings();
  }

  return saveSiteSettings(payload as Partial<SiteSettings>);
}
