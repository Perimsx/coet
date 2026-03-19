"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import {
  BadgeCheck,
  ExternalLink,
  FileText,
  Home,
  Info,
  LayoutDashboard,
  Link2,
  MessageCircle,
  MessageSquare,
  PanelLeft,
  Settings,
  UserCircle2,
} from "lucide-react"

import { cn } from "@/components/lib/utils"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
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

type NavGroup = "workspace" | "site"
type NavKey = "dashboard" | "posts" | "comments" | "suggestions" | "friends" | "about" | "settings"

type NavItem = {
  key: NavKey
  label: string
  description: string
  href: string
  icon: React.ComponentType<{ className?: string }>
  group: NavGroup
}

type QuickAction = {
  href: string
  label: string
  icon: React.ComponentType<{ className?: string }>
  primary?: boolean
}

function resolveSelectedKey(pathname: string): NavKey {
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
      description: "查看后台核心状态与近期动态",
      href: "/admin",
      icon: LayoutDashboard,
      group: "workspace",
    },
    {
      key: "posts",
      label: labels.navPosts || "文章管理",
      description: "筛选、编辑与发布文章内容",
      href: "/admin/posts",
      icon: FileText,
      group: "workspace",
    },
    {
      key: "comments",
      label: labels.navComments || "评论管理",
      description: "集中处理评论审核与站长回复",
      href: "/admin/comments",
      icon: MessageCircle,
      group: "workspace",
    },
    {
      key: "suggestions",
      label: "建议管理",
      description: "处理访客建议并记录回复",
      href: "/admin/suggestions",
      icon: MessageSquare,
      group: "workspace",
    },
    {
      key: "friends",
      label: "友链管理",
      description: "维护友链申请与展示信息",
      href: "/admin/friends",
      icon: Link2,
      group: "site",
    },
    {
      key: "about",
      label: labels.about || "关于页面",
      description: "更新关于信息与展示模块",
      href: "/admin/about",
      icon: Info,
      group: "site",
    },
    {
      key: "settings",
      label: "站点设置",
      description: "维护站点配置、SEO 与账号信息",
      href: "/admin/settings",
      icon: Settings,
      group: "site",
    },
  ]
}

function buildQuickActions(selectedKey: NavKey): QuickAction[] {
  const actions: QuickAction[] = []

  if (selectedKey === "dashboard" || selectedKey === "posts") {
    actions.push({
      href: "/admin/posts/edit?new=1",
      label: "新建文章",
      icon: FileText,
      primary: true,
    })
  }

  if (selectedKey === "dashboard" || selectedKey === "comments") {
    actions.push({
      href: "/admin/comments",
      label: "审核评论",
      icon: MessageCircle,
    })
  }

  return actions
}

function ShellNavGroup({
  label,
  items,
  selectedKey,
}: {
  label: string
  items: NavItem[]
  selectedKey: NavKey
}) {
  return (
    <SidebarGroup>
      <SidebarGroupLabel className="px-3 text-[11px] tracking-[0.14em] text-sidebar-foreground/60">
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
                  className="h-9 rounded-lg px-3 text-[13px] font-medium"
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
  const activeNav = navItems.find((item) => item.key === selectedKey) ?? navItems[0]
  const quickActions = buildQuickActions(selectedKey)

  return (
    <SidebarProvider defaultOpen className="min-h-screen bg-muted/20">
      <Sidebar
        variant="sidebar"
        collapsible="offcanvas"
        className="border-r border-sidebar-border bg-sidebar"
      >
        <SidebarHeader className="gap-3 px-3 py-4">
          <div className="rounded-xl border border-sidebar-border/70 bg-sidebar-accent/35 px-3 py-3">
            <div className="truncate text-sm font-semibold text-sidebar-foreground">{siteTitle}</div>
            <div className="mt-1 text-xs text-sidebar-foreground/65">后台管理</div>
          </div>
          <div className="rounded-xl border border-sidebar-border/70 bg-sidebar-accent/20 px-3 py-2.5">
            <div className="text-xs text-sidebar-foreground/60">当前账号</div>
            <div className="mt-1 text-sm font-medium text-sidebar-foreground">{username}</div>
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
            className="h-10 justify-between rounded-xl border-sidebar-border/70 bg-sidebar-accent/30 text-sidebar-foreground hover:bg-sidebar-accent"
          >
            <Link href="/" target="_blank">
              <span className="flex items-center gap-2">
                <Home className="size-4" />
                <span>打开前台</span>
              </span>
              <ExternalLink className="size-4" />
            </Link>
          </Button>
        </SidebarFooter>
      </Sidebar>

      <SidebarInset className="min-h-screen bg-transparent">
        <header className="sticky top-0 z-30 border-b border-border/70 bg-background/90 backdrop-blur-md">
          <div className="mx-auto flex w-full max-w-[1320px] items-center justify-between gap-3 px-4 py-3 md:px-6">
            <div className="flex min-w-0 items-center gap-3">
              <SidebarTrigger className="h-9 w-9 rounded-lg border border-border/70 bg-background shadow-sm hover:bg-accent">
                <PanelLeft className="size-4" />
              </SidebarTrigger>
              <div className="min-w-0">
                <h1 className="truncate text-xl font-semibold tracking-tight text-foreground">
                  {activeNav.label}
                </h1>
                <p className="hidden truncate text-xs text-muted-foreground sm:block">
                  {activeNav.description}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              {quickActions.map((action) => {
                const Icon = action.icon
                return (
                  <Button
                    key={action.href}
                    asChild
                    size="sm"
                    variant={action.primary ? "default" : "outline"}
                    className="h-9 rounded-lg"
                  >
                    <Link href={action.href}>
                      <Icon className="size-4" />
                      <span className="hidden sm:inline">{action.label}</span>
                    </Link>
                  </Button>
                )
              })}

              <ThemeToggle />

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" className="h-10 rounded-xl px-2.5 shadow-sm">
                    <Avatar className="size-7 rounded-lg">
                      <AvatarFallback className="rounded-lg bg-primary/10 text-xs font-semibold text-primary">
                        {getInitials(username)}
                      </AvatarFallback>
                    </Avatar>
                    <span className="hidden text-sm font-medium md:inline">{username}</span>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-64 rounded-xl p-2">
                  <DropdownMenuLabel className="px-2 py-2">
                    <div className="flex items-center gap-3">
                      <Avatar className="size-10 rounded-xl">
                        <AvatarFallback className="rounded-xl bg-primary/10 text-primary">
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
                    <Link href="/" target="_blank" className="cursor-pointer rounded-lg">
                      <ExternalLink className="size-4" />
                      前往前台
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem disabled className="rounded-lg opacity-100">
                    <UserCircle2 className="size-4" />
                    账号信息仅后续可编辑
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem asChild className="rounded-lg p-0 focus:bg-transparent">
                    <form action={logoutAction} className="w-full">
                      <button
                        type="submit"
                        className={cn(
                          "flex w-full items-center gap-2 rounded-lg px-2 py-1.5 text-sm text-red-600 outline-none transition-colors hover:bg-red-50 dark:hover:bg-red-950/30"
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
        </header>

        <div className="px-4 py-4 md:px-6 md:py-6">
          <div className="mx-auto flex w-full max-w-[1320px] flex-col gap-5">{children}</div>
        </div>
        <Separator className="opacity-0" />
      </SidebarInset>
    </SidebarProvider>
  )
}
