import {
  FileText,
  Info,
  LayoutDashboard,
  Link2,
  MessageCircle,
  MessageSquare,
  Settings,
  type LucideIcon,
} from "lucide-react"

export type AdminSettingsSection =
  | "general"
  | "uiux"
  | "seoSocial"
  | "smtp"
  | "security"

export type AdminNavigationKey =
  | "dashboard"
  | "posts"
  | "comments"
  | "suggestions"
  | "friends"
  | "about"
  | "settings"

export type AdminNavigationItem = {
  key: AdminNavigationKey
  label: string
  description: string
  href: string
  icon: LucideIcon
  keywords: string[]
}

export type AdminNavigationGroup = {
  id: string
  label: string
  items: AdminNavigationItem[]
}

export type AdminCommandItem = {
  id: string
  label: string
  hint: string
  href: string
  icon: LucideIcon
  group: string
  keywords: string[]
}

export function getAdminNavigationGroups(): AdminNavigationGroup[] {
  return [
    {
      id: "overview",
      label: "总览",
      items: [
        {
          key: "dashboard",
          label: "仪表盘",
          description: "集中查看核心指标、趋势变化、快捷入口与系统状态。",
          href: "/admin",
          icon: LayoutDashboard,
          keywords: ["仪表盘", "总览", "指标", "趋势", "状态"],
        },
      ],
    },
    {
      id: "content",
      label: "内容",
      items: [
        {
          key: "posts",
          label: "文章管理",
          description: "管理 Markdown 文章、筛选视图、编辑入口与批量操作。",
          href: "/admin/posts",
          icon: FileText,
          keywords: ["文章", "内容", "编辑器", "筛选", "批量"],
        },
      ],
    },
    {
      id: "interaction",
      label: "互动",
      items: [
        {
          key: "comments",
          label: "评论管理",
          description: "审核评论线程、查看访客上下文与风险提示。",
          href: "/admin/comments",
          icon: MessageCircle,
          keywords: ["评论", "审核", "访客", "风控"],
        },
        {
          key: "suggestions",
          label: "建议收件箱",
          description: "处理反馈工单、快捷回复模版与状态流转。",
          href: "/admin/suggestions",
          icon: MessageSquare,
          keywords: ["建议", "反馈", "工单", "回复"],
        },
      ],
    },
    {
      id: "site",
      label: "站点",
      items: [
        {
          key: "friends",
          label: "友链管理",
          description: "维护友链资料、健康巡检结果与站点元信息。",
          href: "/admin/friends",
          icon: Link2,
          keywords: ["友链", "链接", "巡检", "元信息"],
        },
        {
          key: "about",
          label: "关于页面",
          description: "编辑个人资料模块、社交信息、技术栈与正文内容。",
          href: "/admin/about",
          icon: Info,
          keywords: ["关于", "资料", "社交", "技术栈"],
        },
      ],
    },
    {
      id: "system",
      label: "系统",
      items: [
        {
          key: "settings",
          label: "系统设置",
          description: "按分区保存基础信息、展示配置、SEO、邮件与安全设置。",
          href: "/admin/settings",
          icon: Settings,
          keywords: ["设置", "SEO", "邮件", "安全", "系统"],
        },
      ],
    },
  ]
}

export function resolveAdminNavigationKey(pathname: string): AdminNavigationKey {
  if (pathname.startsWith("/admin/posts")) return "posts"
  if (pathname.startsWith("/admin/comments")) return "comments"
  if (pathname.startsWith("/admin/suggestions")) return "suggestions"
  if (pathname.startsWith("/admin/friends")) return "friends"
  if (pathname.startsWith("/admin/about")) return "about"
  if (pathname.startsWith("/admin/settings")) return "settings"
  return "dashboard"
}

export function getAdminCommandItems(groups: AdminNavigationGroup[]): AdminCommandItem[] {
  const baseCommands = groups.flatMap((group) =>
    group.items.map((item) => ({
      id: `nav:${item.key}`,
      label: item.label,
      hint: item.description,
      href: item.href,
      icon: item.icon,
      group: group.label,
      keywords: item.keywords,
    }))
  )

  return [
    ...baseCommands,
    {
      id: "action:new-post",
      label: "新建文章",
      hint: "直接打开编辑器并开始撰写新的 Markdown 文章。",
      href: "/admin/posts/edit?new=1",
      icon: FileText,
      group: "快捷操作",
      keywords: ["新建文章", "写文章", "编辑器"],
    },
    {
      id: "action:pending-comments",
      label: "查看待审评论",
      hint: "跳转到评论审核页并处理待办内容。",
      href: "/admin/comments",
      icon: MessageCircle,
      group: "快捷操作",
      keywords: ["待审评论", "评论审核", "待办"],
    },
    {
      id: "action:settings-security",
      label: "打开安全设置",
      hint: "查看后台入口、密码规则与最近会话记录。",
      href: "/admin/settings?section=security",
      icon: Settings,
      group: "快捷操作",
      keywords: ["安全设置", "后台入口", "密码", "会话"],
    },
  ]
}
