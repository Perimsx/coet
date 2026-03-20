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
    greetingPrefix: "你好，我是",
    displayName: defaultAuthor,
    role: "全栈开发者",
    tagline: "知行合一，缄默前行。",
    bottomText: "清楚表达，稳步交付，让下一次改动也依然轻松。",
    avatarSrc: brandingConfig.logo,
    avatarAlt: `${defaultAuthor} 的头像`,
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
    poweredByClassName:
      "text-primary dark:text-primary/90 brightness-110",
    rightsText: "保留所有权利",
    policeBadgeIcon: "https://www.beian.gov.cn/img/ghs.png",
    policeBadgeAlt: "公安备案图标",
  },
}
