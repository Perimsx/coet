"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import {
  BadgeCheck,
  ChevronRight,
  ExternalLink,
  FileText,
  Home,
  Info,
  LayoutDashboard,
  Link2,
  MessageCircle,
  MessageSquare,
  PanelLeftClose,
  Settings,
  Sparkles,
  UserCircle2,
} from "lucide-react"

import { cn } from "@/components/lib/utils"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Separator } from "@/components/ui/separator"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarInset,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
  SidebarRail,
  SidebarSeparator,
  SidebarTrigger,
} from "@/components/ui/sidebar"
import ThemeToggle from "@/features/admin/components/ThemeToggle"

import { logoutAction } from "@/app/admin/actions"

type NavLabels = {
  navPosts?: string
  navComments?: string
  about?: string
}

type NavItem = {
  key: string
  label: string
  href: string
  icon: React.ComponentType<{ className?: string }>
  group: "workspace" | "site"
}

const quickActions = [
  {
    href: "/admin/posts/edit?new=1",
    label: "新建文章",
    icon: FileText,
  },
  {
    href: "/admin/comments",
    label: "审核评论",
    icon: MessageCircle,
  },
]

function resolveSelectedKey(pathname: string) {
  if (pathname.startsWith("/admin/posts")) return "posts"
  if (pathname.startsWith("/admin/comments")) return "comments"
  if (pathname.startsWith("/admin/suggestions")) return "suggestions"
  if (pathname.startsWith("/admin/friends")) return "friends"
  if (pathname.startsWith("/admin/about")) return "about"
  if (pathname.startsWith("/admin/settings")) return "settings"
  return "dashboard"
}

function getInitials(username: string) {
  return (username || "A")
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part.charAt(0).toUpperCase())
    .join("")
}

function buildNavItems(labels: NavLabels): NavItem[] {
  return [
    {
      key: "dashboard",
      label: "仪表盘",
      href: "/admin",
      icon: LayoutDashboard,
      group: "workspace",
    },
    {
      key: "posts",
      label: labels.navPosts || "文章管理",
      href: "/admin/posts",
      icon: FileText,
      group: "workspace",
    },
    {
      key: "comments",
      label: labels.navComments || "评论管理",
      href: "/admin/comments",
      icon: MessageCircle,
      group: "workspace",
    },
    {
      key: "suggestions",
      label: "建议管理",
      href: "/admin/suggestions",
      icon: MessageSquare,
      group: "workspace",
    },
    {
      key: "friends",
      label: "友链管理",
      href: "/admin/friends",
      icon: Link2,
      group: "site",
    },
    {
      key: "about",
      label: labels.about || "关于页面",
      href: "/admin/about",
      icon: Info,
      group: "site",
    },
    {
      key: "settings",
      label: "站点设置",
      href: "/admin/settings",
      icon: Settings,
      group: "site",
    },
  ]
}

function resolvePageTitle(selectedKey: string, labels: NavLabels) {
  const items = buildNavItems(labels)
  return items.find((item) => item.key === selectedKey)?.label || "仪表盘"
}

function buildBreadcrumbs(pathname: string, selectedKey: string, labels: NavLabels) {
  const pageTitle = resolvePageTitle(selectedKey, labels)

  if (selectedKey === "dashboard") {
    return [{ href: "/admin", label: "仪表盘" }]
  }

  const contentKeys = new Set(["posts", "comments", "suggestions"])
  const siteKeys = new Set(["friends", "about", "settings"])
  const groupLabel = contentKeys.has(selectedKey)
    ? "内容工作区"
    : siteKeys.has(selectedKey)
      ? "站点工作区"
      : "后台"

  const items = [
    { href: "/admin", label: "仪表盘" },
    { label: groupLabel },
    { label: pageTitle },
  ]

  if (pathname.includes("/edit")) {
    items.push({ label: "编辑器" })
  }

  return items
}

function ShellNavGroup({
  label,
  items,
  selectedKey,
}: {
  label: string
  items: NavItem[]
  selectedKey: string
}) {
  return (
    <SidebarGroup>
      <SidebarGroupLabel className="px-3 text-[11px] uppercase tracking-[0.22em] text-sidebar-foreground/55">
        {label}
      </SidebarGroupLabel>
      <SidebarGroupContent>
        <SidebarMenu>
          {items.map((item) => {
            const Icon = item.icon
            return (
              <SidebarMenuItem key={item.key}>
                <SidebarMenuButton
                  asChild
                  isActive={selectedKey === item.key}
                  tooltip={item.label}
                  className="h-9 rounded-xl px-3 text-[13px] font-medium"
                >
                  <Link href={item.href}>
                    <Icon className="size-4" />
                    <span>{item.label}</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            )
          })}
        </SidebarMenu>
      </SidebarGroupContent>
    </SidebarGroup>
  )
}

export function AdminLayoutShell({
  children,
  username,
  siteTitle,
  navLabels = {},
}: {
  children: React.ReactNode
  username: string
  siteTitle: string
  navLabels?: NavLabels
}) {
  const pathname = usePathname()
  const selectedKey = resolveSelectedKey(pathname)
  const navItems = buildNavItems(navLabels)
  const workspaceItems = navItems.filter((item) => item.group === "workspace")
  const siteItems = navItems.filter((item) => item.group === "site")
  const pageTitle = resolvePageTitle(selectedKey, navLabels)
  const breadcrumbs = buildBreadcrumbs(pathname, selectedKey, navLabels)

  return (
    <SidebarProvider defaultOpen>
      <div className="min-h-screen bg-[radial-gradient(circle_at_top_left,_rgba(59,130,246,0.12),_transparent_34%),linear-gradient(180deg,_rgba(255,255,255,0.82),_rgba(248,250,252,0.96))] dark:bg-[radial-gradient(circle_at_top_left,_rgba(59,130,246,0.14),_transparent_30%),linear-gradient(180deg,_rgba(2,6,23,0.92),_rgba(2,6,23,1))]">
        <Sidebar
          variant="inset"
          collapsible="icon"
          className="border-r border-sidebar-border/70 bg-sidebar/95 backdrop-blur-xl"
        >
          <SidebarHeader className="gap-3 px-3 py-4">
            <Link
              href="/admin"
              className="flex items-center gap-3 rounded-2xl border border-sidebar-border/70 bg-sidebar-accent/40 px-3 py-3 transition-colors hover:bg-sidebar-accent"
            >
              <div className="flex size-10 items-center justify-center rounded-2xl bg-sidebar-primary text-sidebar-primary-foreground shadow-sm">
                <Sparkles className="size-4" />
              </div>
              <div className="min-w-0 group-data-[collapsible=icon]:hidden">
                <div className="truncate text-sm font-semibold text-sidebar-foreground">
                  {siteTitle}
                </div>
                <div className="truncate text-xs text-sidebar-foreground/60">
                  后台工作台
                </div>
              </div>
            </Link>
            <div className="rounded-2xl border border-sidebar-border/70 bg-sidebar-accent/35 px-3 py-3 group-data-[collapsible=icon]:hidden">
              <div className="flex items-center justify-between gap-2">
                <span className="text-xs font-medium text-sidebar-foreground/65">当前账号</span>
                <Badge
                  variant="secondary"
                  className="rounded-full border-none bg-emerald-500/15 px-2 py-0 text-[10px] text-emerald-700 dark:text-emerald-300"
                >
                  在线
                </Badge>
              </div>
              <div className="mt-2 text-sm font-semibold text-sidebar-foreground">{username}</div>
            </div>
          </SidebarHeader>

          <SidebarSeparator className="mx-3" />

          <SidebarContent className="px-2 pb-2">
            <ShellNavGroup label="内容工作区" items={workspaceItems} selectedKey={selectedKey} />
            <ShellNavGroup label="站点工作区" items={siteItems} selectedKey={selectedKey} />
          </SidebarContent>

          <SidebarFooter className="px-3 py-3">
            <Button
              asChild
              variant="outline"
              className="h-10 justify-between rounded-2xl border-sidebar-border/70 bg-sidebar-accent/35 text-sidebar-foreground hover:bg-sidebar-accent"
            >
              <Link href="/" target="_blank">
                <span className="flex items-center gap-2">
                  <Home className="size-4" />
                  <span className="group-data-[collapsible=icon]:hidden">打开前台</span>
                </span>
                <ExternalLink className="size-4 group-data-[collapsible=icon]:hidden" />
              </Link>
            </Button>
          </SidebarFooter>
          <SidebarRail />
        </Sidebar>

        <SidebarInset className="min-h-screen bg-transparent">
          <header className="sticky top-0 z-30 border-b border-border/70 bg-background/78 backdrop-blur-xl">
            <div className="flex flex-col gap-4 px-4 py-4 md:px-6">
              <div className="flex items-start justify-between gap-3">
                <div className="flex min-w-0 items-start gap-3">
                  <SidebarTrigger className="mt-0.5 h-9 w-9 rounded-xl border border-border/70 bg-background shadow-sm hover:bg-accent">
                    <PanelLeftClose className="size-4" />
                  </SidebarTrigger>
                  <div className="min-w-0 space-y-2">
                    <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                      {breadcrumbs.map((item, index) => (
                        <div key={`${item.label}-${index}`} className="flex items-center gap-2">
                          {index > 0 ? <ChevronRight className="size-3.5" /> : null}
                          {item.href ? (
                            <Link href={item.href} className="transition-colors hover:text-foreground">
                              {item.label}
                            </Link>
                          ) : (
                            <span>{item.label}</span>
                          )}
                        </div>
                      ))}
                    </div>
                    <div className="flex flex-wrap items-center gap-3">
                      <h1 className="text-2xl font-semibold tracking-tight text-foreground">
                        {pageTitle}
                      </h1>
                      <Badge
                        variant="outline"
                        className="rounded-full border-border/70 bg-background/80 px-2.5 py-0.5 text-[11px] font-medium"
                      >
                        极简高密度
                      </Badge>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <div className="hidden items-center gap-2 lg:flex">
                    {quickActions.map((action) => {
                      const Icon = action.icon
                      return (
                        <Button
                          key={action.href}
                          asChild
                          variant={action.href.includes("/posts/") ? "default" : "outline"}
                          size="sm"
                          className="h-9 rounded-xl"
                        >
                          <Link href={action.href}>
                            <Icon className="size-4" />
                            {action.label}
                          </Link>
                        </Button>
                      )
                    })}
                  </div>
                  <ThemeToggle />
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="outline" className="h-10 rounded-2xl px-2.5 shadow-sm">
                        <Avatar className="size-7 rounded-xl">
                          <AvatarFallback className="rounded-xl bg-primary/10 text-xs font-semibold text-primary">
                            {getInitials(username)}
                          </AvatarFallback>
                        </Avatar>
                        <span className="hidden text-sm font-medium md:inline">{username}</span>
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-64 rounded-2xl p-2">
                      <DropdownMenuLabel className="px-2 py-2">
                        <div className="flex items-center gap-3">
                          <Avatar className="size-10 rounded-2xl">
                            <AvatarFallback className="rounded-2xl bg-primary/10 text-primary">
                              {getInitials(username)}
                            </AvatarFallback>
                          </Avatar>
                          <div className="space-y-1">
                            <div className="text-sm font-semibold text-foreground">{username}</div>
                            <div className="text-xs text-muted-foreground">管理员已登录</div>
                          </div>
                        </div>
                      </DropdownMenuLabel>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem asChild>
                        <Link href="/" target="_blank" className="cursor-pointer rounded-xl">
                          <ExternalLink className="size-4" />
                          前往前台
                        </Link>
                      </DropdownMenuItem>
                      <DropdownMenuItem disabled className="rounded-xl opacity-100">
                        <UserCircle2 className="size-4" />
                        账号信息仅后台可见
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem asChild className="rounded-xl p-0 focus:bg-transparent">
                        <form action={logoutAction} className="w-full">
                          <button
                            type="submit"
                            className={cn(
                              "flex w-full items-center gap-2 rounded-xl px-2 py-1.5 text-sm text-red-600 outline-none transition-colors hover:bg-red-50 dark:hover:bg-red-950/30"
                            )}
                          >
                            <BadgeCheck className="size-4" />
                            退出登录
                          </button>
                        </form>
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </div>

              <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-border/70 bg-card/80 px-4 py-3 shadow-sm">
                <div className="space-y-1">
                  <div className="text-sm font-medium text-foreground">专注处理后台内容与运营任务</div>
                  <div className="text-xs text-muted-foreground">
                    保留现有能力，提升信息密度、筛选效率和移动端可操作性。
                  </div>
                </div>
                <div className="flex flex-wrap items-center gap-2 lg:hidden">
                  {quickActions.map((action) => {
                    const Icon = action.icon
                    return (
                      <Button
                        key={action.href}
                        asChild
                        variant={action.href.includes("/posts/") ? "default" : "outline"}
                        size="sm"
                        className="rounded-xl"
                      >
                        <Link href={action.href}>
                          <Icon className="size-4" />
                          {action.label}
                        </Link>
                      </Button>
                    )
                  })}
                </div>
              </div>
            </div>
          </header>

          <div className="px-4 py-5 md:px-6 md:py-6">
            <div className="mx-auto flex w-full max-w-[1600px] flex-col gap-5">{children}</div>
          </div>
          <Separator className="opacity-0" />
        </SidebarInset>
      </div>
    </SidebarProvider>
  )
}
