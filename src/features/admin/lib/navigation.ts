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
      label: "Overview",
      items: [
        {
          key: "dashboard",
          label: "Dashboard",
          description: "Track metrics, trends, quick actions, and system health in one place.",
          href: "/admin",
          icon: LayoutDashboard,
          keywords: ["dashboard", "metrics", "overview", "health"],
        },
      ],
    },
    {
      id: "content",
      label: "Content",
      items: [
        {
          key: "posts",
          label: "Posts",
          description: "Manage Markdown posts, saved views, filters, and batch operations.",
          href: "/admin/posts",
          icon: FileText,
          keywords: ["posts", "markdown", "editor", "content"],
        },
      ],
    },
    {
      id: "interaction",
      label: "Interaction",
      items: [
        {
          key: "comments",
          label: "Comments",
          description: "Review comment threads, visitor context, and moderation signals.",
          href: "/admin/comments",
          icon: MessageCircle,
          keywords: ["comments", "moderation", "review", "risk"],
        },
        {
          key: "suggestions",
          label: "Suggestions",
          description: "Process feedback tickets, reply templates, and follow-up states.",
          href: "/admin/suggestions",
          icon: MessageSquare,
          keywords: ["suggestions", "feedback", "tickets", "reply"],
        },
      ],
    },
    {
      id: "site",
      label: "Site",
      items: [
        {
          key: "friends",
          label: "Friend links",
          description: "Maintain link details, reachability checks, and site metadata.",
          href: "/admin/friends",
          icon: Link2,
          keywords: ["friends", "links", "health", "metadata"],
        },
        {
          key: "about",
          label: "About page",
          description: "Edit profile blocks, social items, tech stack, and body content.",
          href: "/admin/about",
          icon: Info,
          keywords: ["about", "profile", "social", "stack"],
        },
      ],
    },
    {
      id: "system",
      label: "System",
      items: [
        {
          key: "settings",
          label: "Settings",
          description: "Save general, UI, SEO, SMTP, and security settings by section.",
          href: "/admin/settings",
          icon: Settings,
          keywords: ["settings", "seo", "smtp", "security"],
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
      label: "Create post",
      hint: "Open the editor directly and start a new Markdown post.",
      href: "/admin/posts/edit?new=1",
      icon: FileText,
      group: "Quick actions",
      keywords: ["create post", "new post", "editor"],
    },
    {
      id: "action:pending-comments",
      label: "Review comments",
      hint: "Jump to comment moderation and work through pending items.",
      href: "/admin/comments",
      icon: MessageCircle,
      group: "Quick actions",
      keywords: ["pending comments", "moderation", "review"],
    },
    {
      id: "action:settings-security",
      label: "Security settings",
      hint: "Check the access path, password rules, and recent session activity.",
      href: "/admin/settings?section=security",
      icon: Settings,
      group: "Quick actions",
      keywords: ["security", "password", "admin access"],
    },
  ]
}
