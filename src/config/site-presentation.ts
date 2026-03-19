import brandingConfig from "@/config/branding"
import headerNavLinks, { type HeaderNavLink } from "@/config/navigation"

const defaultAuthor = process.env.NEXT_PUBLIC_SITE_AUTHOR || "Chen Guitao"

export type SiteFeatureFlags = {
  enableSearch: boolean
  enableSuggestion: boolean
  enableThemeSwitch: boolean
}

export type HeroPresentation = {
  greetingPrefix: string
  displayName: string
  role: string
  tagline: string
  bottomText: string
  avatarSrc: string
  avatarAlt: string
  scrollAriaLabel: string
  socialThemes: Record<string, { color: string }>
}

export type HomePresentation = {
  latestPostsTitle: string
  allPostsLabel: string
  browseMorePostsLabel: string
  categoriesTitle: string
  allCategoriesLabel: string
  popularTagsTitle: string
  allTagsLabel: string
  postDateLabel: string
  paginationSummaryTemplate: string
  previousPageLabel: string
  nextPageLabel: string
}

export type SuggestionPresentation = {
  triggerTitle: string
  dialogTitle: string
  dialogSubtitle: string
  dialogDescription: string
  successTitle: string
  successDescription: string
  qqLabel: string
  qqHint: string
  qqPlaceholder: string
  contentLabel: string
  contentHint: string
  contentPlaceholder: string
  submitLabel: string
  submittingLabel: string
}

export type FooterPresentation = {
  runtimeLabel: string
  poweredByLabel: string
  poweredByName: string
  poweredBySuffix: string
  poweredByClassName: string
  rightsText: string
  policeBadgeIcon: string
  policeBadgeAlt: string
}

export type SitePresentationDefaults = {
  navigation: {
    links: HeaderNavLink[]
    mobileMenuLabel: string
  }
  header: {
    featureFlags: SiteFeatureFlags
  }
  hero: HeroPresentation
  home: HomePresentation
  suggestion: SuggestionPresentation
  footer: FooterPresentation
}

export const sitePresentationDefaults: SitePresentationDefaults = {
  navigation: {
    links: headerNavLinks,
    mobileMenuLabel: "Navigation menu",
  },
  header: {
    featureFlags: {
      enableSearch: true,
      enableSuggestion: true,
      enableThemeSwitch: true,
    },
  },
  hero: {
    greetingPrefix: "Hi, I'm",
    displayName: defaultAuthor,
    role: "Full-stack developer",
    tagline: "Build systems that stay readable as they grow.",
    bottomText: "Write clearly, ship steadily, keep the next change easy.",
    avatarSrc: brandingConfig.logo,
    avatarAlt: `${defaultAuthor} avatar`,
    scrollAriaLabel: "Scroll to content",
    socialThemes: {
      github: { color: "bg-[#181717]" },
      mail: { color: "bg-[#EA4335]" },
      x: { color: "bg-[#000000]" },
      twitter: { color: "bg-[#1DA1F2]" },
      rss: { color: "bg-zinc-600" },
      wechat: { color: "bg-[#07C160]" },
      session: { color: "bg-[#3B5998]" },
      yuque: { color: "bg-[#25b864]" },
      bilibili: { color: "bg-[#00A1D6]" },
      douyin: { color: "bg-[#000000]" },
      default: { color: "bg-[#333333]" },
    },
  },
  home: {
    latestPostsTitle: "Latest posts",
    allPostsLabel: "All posts",
    browseMorePostsLabel: "Browse more posts",
    categoriesTitle: "Categories",
    allCategoriesLabel: "All categories",
    popularTagsTitle: "Popular tags",
    allTagsLabel: "All tags",
    postDateLabel: "Published",
    paginationSummaryTemplate: "Page {current} of {total}",
    previousPageLabel: "Previous",
    nextPageLabel: "Next",
  },
  suggestion: {
    triggerTitle: "Send feedback",
    dialogTitle: "Contact the site owner",
    dialogSubtitle: "Feedback and suggestions",
    dialogDescription: "Feedback form",
    successTitle: "Sent successfully",
    successDescription: "Thanks for the feedback. A reply will follow as soon as possible.",
    qqLabel: "Your QQ",
    qqHint: "5 to 12 digits",
    qqPlaceholder: "Enter your QQ number",
    contentLabel: "Message",
    contentHint: "Ideas, bugs, requests",
    contentPlaceholder: "Tell me what you found, what feels off, or what you hope to see next.",
    submitLabel: "Send feedback",
    submittingLabel: "Sending...",
  },
  footer: {
    runtimeLabel: "Site uptime",
    poweredByLabel: "Built with",
    poweredByName: "Next.js",
    poweredBySuffix: "",
    poweredByClassName:
      "text-primary dark:text-primary/90 brightness-110",
    rightsText: "All rights reserved",
    policeBadgeIcon: "https://www.beian.gov.cn/img/ghs.png",
    policeBadgeAlt: "Police registration badge",
  },
}
