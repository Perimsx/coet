import brandingConfig from "@/config/branding"
import headerNavLinks, { type HeaderNavLink } from "@/config/navigation"

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
    mobileMenuLabel: "导航菜单",
  },
  header: {
    featureFlags: {
      enableSearch: true,
      enableSuggestion: true,
      enableThemeSwitch: true,
    },
  },
  hero: {
    greetingPrefix: "Hi there, I'm",
    displayName: "kerntau",
    role: "A Full Stack Developer",
    tagline: "知行合一， 缄默前行。",
    bottomText: "关关难过关关过，长路漫漫亦灿灿。",
    avatarSrc: brandingConfig.logo,
    avatarAlt: "Avatar",
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
    latestPostsTitle: "最新发布",
    allPostsLabel: "全部文章",
    browseMorePostsLabel: "浏览更多文章",
    categoriesTitle: "全部分类",
    allCategoriesLabel: "全部分类",
    popularTagsTitle: "热门标签",
    allTagsLabel: "全部标签",
    postDateLabel: "发布于",
    paginationSummaryTemplate: "Page {current} of {total}",
    previousPageLabel: "上一页",
    nextPageLabel: "下一页",
  },
  suggestion: {
    triggerTitle: "发送建议",
    dialogTitle: "联系站长",
    dialogSubtitle: "反馈与建议",
    dialogDescription: "发送建议表单",
    successTitle: "发送成功",
    successDescription: "感谢反馈！站长会尽快回复哦。",
    qqLabel: "您的身份",
    qqHint: "支持 QQ 号",
    qqPlaceholder: "填写您的 QQ...",
    contentLabel: "您的留言",
    contentHint: "想法与建议",
    contentPlaceholder: "发现了 Bug？或者有什么想对站长说的？",
    submitLabel: "提交反馈",
    submittingLabel: "正在发送...",
  },
  footer: {
    runtimeLabel: "本站已运行",
    poweredByLabel: "由",
    poweredByName: "腾讯云",
    poweredBySuffix: "驱动",
    poweredByClassName:
      "text-[#00a4ff] dark:text-[#00a4ff]/90 brightness-110",
    rightsText: "All rights reserved",
    policeBadgeIcon: "https://www.beian.gov.cn/img/ghs.png",
    policeBadgeAlt: "公安备案图标",
  },
}
