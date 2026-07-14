// ── Types ────────────────────────────────────────────────────────────────

export type HeaderNavLink = {
  href: string
  title: string
  children?: {
    href: string
    title: string
  }[]
}

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
  edgeOneLabel: string
  edgeOneIcon: string
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

// ── Config ───────────────────────────────────────────────────────────────

const basePath = process.env.BASE_PATH || ""

const blogConfig = {
  site: {
    title: "序栈",
    author: "Kerntau",
    headerTitle: "序栈",
    description:
      "在有序的世界里，寻一处生活的归栈。用理性梳理日常，用技术温柔时光，不慌不忙，自在生长。",
    theme: "light",
    siteUrl: "https://blog.cot.wiki",
    language: "zh-CN",
    siteRepo: "https://github.com/kerntau/blog",
    siteLogo: "/logo.png",
    socialBanner: "/avatar.png",
    mastodon: "",
    email: "",
    github: "https://github.com/kerntau",
    x: "",
    yuque: "",
    facebook: "",
    youtube: "",
    linkedin: "",
    threads: "",
    instagram: "",
    medium: "",
    bluesky: "",
    stickyNav: true,
    analytics: {
      umamiAnalytics: {
        umamiWebsiteId: process.env.NEXT_UMAMI_ID,
      },
    },
    comments: {
      provider: "local" as const,
    },
    search: {
      provider: "kbar" as const,
      kbarConfig: {
        searchDocumentsPath: `${basePath}/search.json`,
      },
    },
    googleSearchConsole: process.env.GOOGLE_SEARCH_CONSOLE || "",
    icp: "鄂ICP备2025157857号", // 请在此处修改你的 ICP 备案号
    policeBeian: "鄂公网安备 42018502008592号", // 请在此处修改你的公安备案号
    siteCreatedAt: "2025-11-10 00:07:03",
  },

  branding: {
    logo: "/logo.png",
    favicon: "/favicon.ico",
    favicon16: "/favicon-16x16.png",
    favicon32: "/favicon-32x32.png",
    appleTouchIcon: "/apple-touch-icon.png",
    androidIcon192: "/android-chrome-192x192.png",
    androidIcon512: "/android-chrome-512x512.png",
    maskIcon: "",
    manifest: "/site.webmanifest",
    ogImage: "/avatar.png",
  } as const,

  navigation: {
    links: [
      { href: "/", title: "首页" },
      {
        href: "/archive",
        title: "文章",
        children: [
          { href: "/archive", title: "归档" },
          { href: "/blog/category", title: "分类" },
          { href: "/tags", title: "标签" },
        ],
      },
      { href: "/friends", title: "友链" },
      { href: "/about", title: "关于" },
    ] as HeaderNavLink[],
    mobileMenuLabel: "导航菜单",
  },

  presentation: {
    header: {
      featureFlags: {
        enableSearch: true,
        enableSuggestion: true,
        enableThemeSwitch: true,
      },
    },
    hero: {
      greetingPrefix: "你好，我是",
      displayName: "Kerntau",
      role: "全栈开发者",
      tagline: "知行合一，缄默前行。",
      bottomText: "落子无悔，下一站见，",
      avatarSrc: "/avatar.png",
      avatarAlt: "Kerntau 的头像",
      scrollAriaLabel: "滚动查看正文内容",
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
      latestPostsTitle: "最新文章",
      allPostsLabel: "全部文章",
      browseMorePostsLabel: "查看更多文章",
      categoriesTitle: "分类",
      allCategoriesLabel: "全部分类",
      popularTagsTitle: "热门标签",
      allTagsLabel: "全部标签",
      postDateLabel: "发布于",
      paginationSummaryTemplate: "第 {current} 页，共 {total} 页",
      previousPageLabel: "上一页",
      nextPageLabel: "下一页",
    },
    suggestion: {
      triggerTitle: "发送建议",
      dialogTitle: "联系站长",
      dialogSubtitle: "反馈与建议",
      dialogDescription: "站点反馈表单",
      successTitle: "发送成功",
      successDescription: "感谢你的反馈，我会尽快查看并回复。",
      qqLabel: "你的 QQ",
      qqHint: "5 到 12 位数字",
      qqPlaceholder: "请输入你的 QQ 号",
      contentLabel: "内容",
      contentHint: "想法、问题或需求",
      contentPlaceholder: "告诉我你发现了什么、哪里不顺手，或者希望下一步增加什么。",
      submitLabel: "提交反馈",
      submittingLabel: "提交中...",
    },
    footer: {
      runtimeLabel: "站点已运行",
      poweredByLabel: "基于",
      poweredByName: "本站系统",
      poweredBySuffix: "",
      poweredByClassName: "text-primary dark:text-primary/90 brightness-110",
      rightsText: "保留所有权利",
      policeBadgeIcon: "/static/images/ghs.png",
      policeBadgeAlt: "公安备案图标",
      edgeOneLabel: "边缘加速平台 EdgeOne 全力驱动",
      edgeOneIcon: "/static/images/EdgeOne.svg",
    },
  },

  techStack: [
    { name: "C", icon: "/assets/icons/tech/c.svg" },
    { name: "Python", icon: "/assets/icons/tech/python.svg" },
    { name: "JavaScript", icon: "/assets/icons/tech/javascript.svg" },
    { name: "TypeScript", icon: "/assets/icons/tech/typescript.svg" },
    { name: "HTML5", icon: "/assets/icons/tech/html5.svg" },
    { name: "CSS", icon: "/assets/icons/tech/css.svg" },
    { name: "Vue.js", icon: "/assets/icons/tech/vuedotjs.svg" },
    { name: "Nuxt", icon: "/assets/icons/tech/nuxt.svg" },
    { name: "React", icon: "/assets/icons/tech/react.svg" },
    { name: "Next.js", icon: "/assets/icons/tech/nextdotjs.svg" },
    { name: "Tailwind CSS", icon: "/assets/icons/tech/tailwindcss.svg" },
    { name: "PostCSS", icon: "/assets/icons/tech/postcss.svg" },
    { name: "Headless UI", icon: "/assets/icons/tech/headlessui.svg" },
    { name: "Radix UI", icon: "/assets/icons/tech/radixui.svg" },
    { name: "shadcn/ui", icon: "/assets/icons/tech/shadcnui.svg" },
    { name: "Drizzle ORM", icon: "/assets/icons/tech/drizzle.svg" },
    { name: "SQLite", icon: "/assets/icons/tech/sqlite.svg" },
    { name: "Node.js", icon: "/assets/icons/tech/nodedotjs.svg" },
    { name: "MDX", icon: "/assets/icons/tech/mdx.svg" },
    { name: "Markdown", icon: "/assets/icons/tech/markdown.svg" },
    { name: "pnpm", icon: "/assets/icons/tech/pnpm.svg" },
    { name: "Git", icon: "/assets/icons/tech/git.svg" },
    { name: "GitHub", icon: "/assets/icons/tech/github.svg" },
    { name: "Figma", icon: "/assets/icons/tech/figma.svg" },
    { name: "Java", icon: "/assets/icons/tech/java.svg" },
    { name: "Go", icon: "/assets/icons/tech/go.svg" },
    { name: "Rust", icon: "/assets/icons/tech/rust.svg" },
    { name: "C++", icon: "/assets/icons/tech/cplusplus.svg" },
    { name: "Docker", icon: "/assets/icons/tech/docker.svg" },
    { name: "Nginx", icon: "/assets/icons/tech/nginx.svg" },
    { name: "Redis", icon: "/assets/icons/tech/redis.svg" },
    { name: "MySQL", icon: "/assets/icons/tech/mysql.svg" },
    { name: "MongoDB", icon: "/assets/icons/tech/mongodb.svg" },
    { name: "Spring Boot", icon: "/assets/icons/tech/springboot.svg" },
    { name: "Angular", icon: "/assets/icons/tech/angular.svg" },
    { name: "Svelte", icon: "/assets/icons/tech/svelte.svg" },
  ] as const,
}

export default blogConfig

// ── Backward-compatible aliases ──────────────────────────────────────────

export const siteMetadata = blogConfig.site
export const brandingConfig = blogConfig.branding
export const sitePresentationDefaults: SitePresentationDefaults = {
  navigation: blogConfig.navigation,
  header: blogConfig.presentation.header,
  hero: blogConfig.presentation.hero,
  home: blogConfig.presentation.home,
  suggestion: blogConfig.presentation.suggestion,
  footer: blogConfig.presentation.footer,
}
export const techStack = blogConfig.techStack
