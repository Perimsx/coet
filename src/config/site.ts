import brandingConfig from "./branding"

const basePath = process.env.BASE_PATH || ""

const siteTitle = process.env.NEXT_PUBLIC_SITE_TITLE || "kerntau"
const siteAuthor = process.env.NEXT_PUBLIC_SITE_AUTHOR || "Chen Guitao"
const siteDescription =
  process.env.NEXT_PUBLIC_SITE_DESCRIPTION ||
  "kerntau | 记录成长，分享价值"
const siteUrl =
  process.env.NEXT_PUBLIC_SITE_URL || "https://www.chenguitao.com"

const siteConfig = {
  title: siteTitle,
  author: siteAuthor,
  headerTitle: process.env.NEXT_PUBLIC_SITE_HEADER_TITLE || siteTitle,
  description: siteDescription,
  theme: process.env.NEXT_PUBLIC_SITE_THEME || "light",
  siteUrl,
  language: process.env.NEXT_PUBLIC_SITE_LANGUAGE || "zh-CN",
  siteRepo:
    process.env.NEXT_PUBLIC_SITE_REPO || "https://github.com/kerntau/Coet",
  siteLogo: brandingConfig.logo,
  socialBanner: brandingConfig.ogImage,
  mastodon: process.env.NEXT_PUBLIC_MASTODON_URL || "",
  email: process.env.NEXT_PUBLIC_SITE_EMAIL || "",
  github:
    process.env.NEXT_PUBLIC_GITHUB_URL || "",
  x: process.env.NEXT_PUBLIC_X_URL || "",
  yuque: process.env.NEXT_PUBLIC_YUQUE_URL || "",
  facebook: process.env.NEXT_PUBLIC_FACEBOOK_URL || "",
  youtube: process.env.NEXT_PUBLIC_YOUTUBE_URL || "",
  linkedin: process.env.NEXT_PUBLIC_LINKEDIN_URL || "",
  threads: process.env.NEXT_PUBLIC_THREADS_URL || "",
  instagram: process.env.NEXT_PUBLIC_INSTAGRAM_URL || "",
  medium: process.env.NEXT_PUBLIC_MEDIUM_URL || "",
  bluesky: process.env.NEXT_PUBLIC_BLUESKY_URL || "",
  stickyNav: true,
  analytics: {
    umamiAnalytics: {
      umamiWebsiteId: process.env.NEXT_UMAMI_ID,
    },
  },
  comments: {
    provider: "local",
  },
  search: {
    provider: "kbar",
    kbarConfig: {
      searchDocumentsPath: `${basePath}/search.json`,
    },
  },
  googleSearchConsole: process.env.GOOGLE_SEARCH_CONSOLE || "",
  siteCreatedAt: process.env.NEXT_PUBLIC_SITE_CREATED_AT || "2025-11-10 00:07:03",
} as const

export default siteConfig
