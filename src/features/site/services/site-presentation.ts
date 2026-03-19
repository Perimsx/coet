import "server-only"

import { cache } from "react"

import {
  sitePresentationDefaults,
  type FooterPresentation,
  type HeroPresentation,
  type HomePresentation,
  type SiteFeatureFlags,
  type SuggestionPresentation,
} from "@/config/site-presentation"
import { getSiteSettings } from "@/server/site-settings"

function readToggle(value: string | undefined, fallback: boolean) {
  if (value === "true") return true
  if (value === "false") return false
  return fallback
}

function resolveHeroPresentation(
  settings: Awaited<ReturnType<typeof getSiteSettings>>
): HeroPresentation {
  return {
    ...sitePresentationDefaults.hero,
    greetingPrefix:
      settings.heroGreetingPrefix || sitePresentationDefaults.hero.greetingPrefix,
    displayName:
      settings.heroDisplayName || sitePresentationDefaults.hero.displayName,
    role: settings.heroRole || sitePresentationDefaults.hero.role,
    tagline: settings.welcomeMessage || sitePresentationDefaults.hero.tagline,
    bottomText: settings.heroBottomText || sitePresentationDefaults.hero.bottomText,
    avatarSrc: settings.heroAvatar || sitePresentationDefaults.hero.avatarSrc,
    avatarAlt:
      settings.heroDisplayName ||
      settings.headerTitle ||
      sitePresentationDefaults.hero.avatarAlt,
  }
}

function resolveFeatureFlags(
  settings: Awaited<ReturnType<typeof getSiteSettings>>
): SiteFeatureFlags {
  return {
    enableSearch: readToggle(
      settings.enableSearch,
      sitePresentationDefaults.header.featureFlags.enableSearch
    ),
    enableSuggestion: readToggle(
      settings.enableSuggestion,
      sitePresentationDefaults.header.featureFlags.enableSuggestion
    ),
    enableThemeSwitch: readToggle(
      settings.enableThemeSwitch,
      sitePresentationDefaults.header.featureFlags.enableThemeSwitch
    ),
  }
}

function resolveFooterPresentation(
  settings: Awaited<ReturnType<typeof getSiteSettings>>
): FooterPresentation {
  return {
    ...sitePresentationDefaults.footer,
    poweredByLabel:
      settings.footerPoweredByLabel || sitePresentationDefaults.footer.poweredByLabel,
    poweredByName:
      settings.footerPoweredByName || sitePresentationDefaults.footer.poweredByName,
    rightsText:
      settings.footerRightsText || sitePresentationDefaults.footer.rightsText,
    policeBadgeIcon:
      settings.footerPoliceBadgeIcon ||
      sitePresentationDefaults.footer.policeBadgeIcon,
  }
}

export const getSitePresentation = cache(async () => {
  const settings = await getSiteSettings()

  return {
    headerTitle: settings.headerTitle,
    navigation: sitePresentationDefaults.navigation,
    header: {
      featureFlags: resolveFeatureFlags(settings),
    },
    hero: resolveHeroPresentation(settings),
    home: sitePresentationDefaults.home satisfies HomePresentation,
    suggestion: sitePresentationDefaults.suggestion satisfies SuggestionPresentation,
    footer: resolveFooterPresentation(settings),
  }
})
