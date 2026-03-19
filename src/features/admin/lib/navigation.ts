import {
  FileText,
  Info,
  LayoutDashboard,
  Link2,
  MessageCircle,
  MessageSquare,
  Settings,
  type LucideIcon,
} from 'lucide-react'

export type AdminSettingsSection =
  | 'general'
  | 'uiux'
  | 'seoSocial'
  | 'smtp'
  | 'security'

export type AdminNavigationKey =
  | 'dashboard'
  | 'posts'
  | 'comments'
  | 'suggestions'
  | 'friends'
  | 'about'
  | 'settings'

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

type NavLabels = {
  navPosts?: string
  navComments?: string
  about?: string
}

export function getAdminNavigationGroups(labels: NavLabels = {}): AdminNavigationGroup[] {
  return [
    {
      id: 'overview',
      label: '概览',
      items: [
        {
          key: 'dashboard',
          label: '仪表盘',
          description: '查看指标矩阵、趋势图、系统状态和快捷工作流。',
          href: '/admin',
          icon: LayoutDashboard,
          keywords: ['dashboard', 'metrics', '系统状态', '仪表盘'],
        },
      ],
    },
    {
      id: 'content',
      label: '内容生产',
      items: [
        {
          key: 'posts',
          label: labels.navPosts || '文章中心',
          description: '管理文件型文章、批量操作和编辑器入口。',
          href: '/admin/posts',
          icon: FileText,
          keywords: ['文章', 'posts', 'markdown', '编辑器'],
        },
      ],
    },
    {
      id: 'interaction',
      label: '互动中枢',
      items: [
        {
          key: 'comments',
          label: labels.navComments || '评论审计',
          description: '审核评论线程、访客画像和风险命中。',
          href: '/admin/comments',
          icon: MessageCircle,
          keywords: ['评论', 'moderation', '审核', '风控'],
        },
        {
          key: 'suggestions',
          label: '建议收件箱',
          description: '跟进工单状态、插入回复模板和处理反馈。',
          href: '/admin/suggestions',
          icon: MessageSquare,
          keywords: ['建议', '工单', 'reply', '反馈'],
        },
      ],
    },
    {
      id: 'site',
      label: '站点资产',
      items: [
        {
          key: 'friends',
          label: '友链管理',
          description: '维护链接资料、健康状态和站点元信息。',
          href: '/admin/friends',
          icon: Link2,
          keywords: ['friends', '友链', 'links', 'health'],
        },
        {
          key: 'about',
          label: labels.about || '关于页构建',
          description: '编辑个人资料卡、社交项、技术栈和正文。',
          href: '/admin/about',
          icon: Info,
          keywords: ['about', '关于', '社交', '技术栈'],
        },
      ],
    },
    {
      id: 'system',
      label: '系统配置',
      items: [
        {
          key: 'settings',
          label: '设置中心',
          description: '按分区保存基础信息、UI、SEO、SMTP 与安全配置。',
          href: '/admin/settings',
          icon: Settings,
          keywords: ['settings', '配置', 'smtp', 'security'],
        },
      ],
    },
  ]
}

export function resolveAdminNavigationKey(pathname: string): AdminNavigationKey {
  if (pathname.startsWith('/admin/posts')) return 'posts'
  if (pathname.startsWith('/admin/comments')) return 'comments'
  if (pathname.startsWith('/admin/suggestions')) return 'suggestions'
  if (pathname.startsWith('/admin/friends')) return 'friends'
  if (pathname.startsWith('/admin/about')) return 'about'
  if (pathname.startsWith('/admin/settings')) return 'settings'
  return 'dashboard'
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
      id: 'action:new-post',
      label: '新建文章',
      hint: '直接进入沉浸式编辑器创建新的 Markdown 文章。',
      href: '/admin/posts/edit?new=1',
      icon: FileText,
      group: '快捷动作',
      keywords: ['create post', '写文章', '新建'],
    },
    {
      id: 'action:pending-comments',
      label: '待审评论',
      hint: '打开评论审计台并优先处理待审核内容。',
      href: '/admin/comments',
      icon: MessageCircle,
      group: '快捷动作',
      keywords: ['待审', '审核评论', 'comments pending'],
    },
    {
      id: 'action:settings-security',
      label: '安全设置',
      hint: '进入设置中心的安全区域查看登录入口和最近会话。',
      href: '/admin/settings?section=security',
      icon: Settings,
      group: '快捷动作',
      keywords: ['security', '密码', '入口路径'],
    },
  ]
}
