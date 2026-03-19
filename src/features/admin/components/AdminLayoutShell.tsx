"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { useEffect, useMemo, useState, useTransition } from "react"
import {
  ArrowUpRight,
  Command,
  Expand,
  FileText,
  LayoutDashboard,
  LogOut,
  Monitor,
  PanelLeft,
  ShieldCheck,
  Sparkles,
} from "lucide-react"
import { toast } from "sonner"

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
import { AdminCommandPalette } from "@/features/admin/components/AdminCommandPalette"
import { useAdminShellStore } from "@/features/admin/components/admin-shell-store"
import {
  getAdminCommandItems,
  getAdminNavigationGroups,
  resolveAdminNavigationKey,
} from "@/features/admin/lib/navigation"

import { logoutAction } from "@/app/admin/actions"
import ThemeToggle from "@/features/admin/components/ThemeToggle"

type NavLabels = {
  navPosts?: string
  navComments?: string
  about?: string
}

type SessionSnapshot = {
  currentIp: string
  currentDevice: string
  lastLoginAt: string | null
  lastLoginIp: string | null
  activeSessionCount: number
}

function formatSessionTime(value: string | null) {
  if (!value) return "首次登录后显示"

  return new Date(value).toLocaleString("zh-CN", {
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  })
}

function getInitials(username: string) {
  return (username || "A")
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part.charAt(0).toUpperCase())
    .join("")
}

function buildQuickActions(selectedKey: string) {
  const actions = [
    {
      href: "/admin/posts/edit?new=1",
      label: "新建文章",
      icon: FileText,
      visible: selectedKey === "dashboard" || selectedKey === "posts",
      primary: true,
    },
    {
      href: "/admin/comments",
      label: "待审评论",
      icon: ShieldCheck,
      visible: selectedKey === "dashboard" || selectedKey === "comments",
      primary: false,
    },
    {
      href: "/admin",
      label: "数据总览",
      icon: LayoutDashboard,
      visible: selectedKey !== "dashboard",
      primary: false,
    },
  ]

  return actions.filter((item) => item.visible)
}

function TopBarMetric({
  label,
  value,
}: {
  label: string
  value: string
}) {
  return (
    <div className="rounded-2xl border border-border/60 bg-background/90 px-3 py-2">
      <div className="text-[11px] uppercase tracking-[0.14em] text-muted-foreground">
        {label}
      </div>
      <div className="mt-1 text-sm font-medium text-foreground">{value}</div>
    </div>
  )
}

export function AdminLayoutShell({
  children,
  username,
  siteTitle,
  navLabels = {},
  sessionSnapshot,
}: {
  children: React.ReactNode
  username: string
  siteTitle: string
  navLabels?: NavLabels
  sessionSnapshot: SessionSnapshot
}) {
  const pathname = usePathname()
  const selectedKey = resolveAdminNavigationKey(pathname)
  const setCommandPaletteOpen = useAdminShellStore((state) => state.setCommandPaletteOpen)
  const [fullscreen, setFullscreen] = useState(false)
  const [logoutAllPending, startLogoutAllTransition] = useTransition()

  const navGroups = useMemo(() => getAdminNavigationGroups(navLabels), [navLabels])
  const commandItems = useMemo(() => getAdminCommandItems(navGroups), [navGroups])
  const activeNav =
    navGroups.flatMap((group) => group.items).find((item) => item.key === selectedKey) ??
    navGroups[0].items[0]
  const activeGroup =
    navGroups.find((group) => group.items.some((item) => item.key === selectedKey)) ?? navGroups[0]
  const quickActions = buildQuickActions(selectedKey)

  useEffect(() => {
    const handleFullscreenChange = () => {
      setFullscreen(Boolean(document.fullscreenElement))
    }

    document.addEventListener("fullscreenchange", handleFullscreenChange)
    return () => document.removeEventListener("fullscreenchange", handleFullscreenChange)
  }, [])

  const toggleFullscreen = async () => {
    try {
      if (document.fullscreenElement) {
        await document.exitFullscreen()
        return
      }

      await document.documentElement.requestFullscreen()
    } catch {
      toast.error("当前环境不支持全屏切换")
    }
  }

  const handleLogoutAll = () => {
    startLogoutAllTransition(async () => {
      try {
        const response = await fetch("/api/admin/auth/logout-all", {
          method: "POST",
        })

        if (!response.ok) {
          toast.error("注销所有会话失败")
          return
        }

        window.location.href = "/admin"
      } catch {
        toast.error("注销所有会话失败")
      }
    })
  }

  return (
    <SidebarProvider
      defaultOpen
      className="min-h-screen bg-[radial-gradient(circle_at_top,_rgba(14,165,233,0.08),_transparent_32%),linear-gradient(180deg,_rgba(248,250,252,0.96),_rgba(255,255,255,1))]"
      style={
        {
          "--sidebar-width": "17.5rem",
          "--sidebar-width-icon": "3.5rem",
        } as React.CSSProperties
      }
    >
      <AdminCommandPalette items={commandItems} />

      <Sidebar
        variant="inset"
        collapsible="offcanvas"
        className="border-r-0 bg-transparent p-0 md:p-3"
      >
        <div className="flex h-full flex-col rounded-[28px] border border-sidebar-border/70 bg-sidebar/96 shadow-[0_24px_60px_rgba(15,23,42,0.08)]">
          <SidebarHeader className="gap-4 px-4 py-5">
            <div className="space-y-3">
              <Badge
                variant="outline"
                className="w-fit rounded-full border-sidebar-border/70 bg-sidebar-accent/40 px-3 py-1 text-[11px] tracking-[0.18em] text-sidebar-foreground/70"
              >
                Coet Admin
              </Badge>
              <div className="space-y-1">
                <div className="text-lg font-semibold text-sidebar-foreground">{siteTitle}</div>
                <p className="text-sm leading-6 text-sidebar-foreground/70">
                  导航只保留工作路径，说明和次要信息都收进顶栏与页面内部。
                </p>
              </div>
            </div>
          </SidebarHeader>

          <SidebarSeparator className="mx-4" />

          <SidebarContent className="px-3 py-3">
            {navGroups.map((group) => (
              <SidebarGroup key={group.id} className="px-1 py-1.5">
                <SidebarGroupLabel className="px-3 text-[11px] tracking-[0.18em] text-sidebar-foreground/55">
                  {group.label}
                </SidebarGroupLabel>
                <SidebarGroupContent>
                  <SidebarMenu>
                    {group.items.map((item) => {
                      const Icon = item.icon
                      const active = item.key === selectedKey
                      return (
                        <SidebarMenuItem key={item.key}>
                          <SidebarMenuButton
                            asChild
                            isActive={active}
                            tooltip={item.label}
                            className={cn(
                              "h-auto min-h-[52px] rounded-2xl px-3 py-3",
                              active
                                ? "bg-sidebar-accent text-sidebar-accent-foreground shadow-sm"
                                : "hover:bg-sidebar-accent/70"
                            )}
                          >
                            <Link href={item.href}>
                              <Icon className="mt-0.5 size-4 shrink-0" />
                              <div className="flex min-w-0 flex-1 flex-col gap-1">
                                <span className="truncate text-sm font-semibold">{item.label}</span>
                                <span className="line-clamp-2 text-xs leading-5 text-sidebar-foreground/65">
                                  {item.description}
                                </span>
                              </div>
                            </Link>
                          </SidebarMenuButton>
                        </SidebarMenuItem>
                      )
                    })}
                  </SidebarMenu>
                </SidebarGroupContent>
              </SidebarGroup>
            ))}
          </SidebarContent>

          <SidebarFooter className="gap-3 px-4 py-4">
            <div className="rounded-[24px] border border-sidebar-border/70 bg-sidebar-accent/35 p-4">
              <div className="flex items-center gap-3">
                <div className="flex size-10 items-center justify-center rounded-2xl bg-sidebar text-sidebar-foreground shadow-sm">
                  <Sparkles className="size-4" />
                </div>
                <div className="min-w-0">
                  <div className="text-sm font-semibold text-sidebar-foreground">Ctrl + K</div>
                  <p className="text-xs leading-5 text-sidebar-foreground/65">
                    全局搜索页面、设置区块和常用动作
                  </p>
                </div>
              </div>
            </div>
            <Button
              asChild
              variant="outline"
              className="h-11 justify-between rounded-2xl border-sidebar-border/70 bg-sidebar-accent/25 text-sidebar-foreground hover:bg-sidebar-accent"
            >
              <Link href="/" target="_blank">
                <span>打开前台</span>
                <ArrowUpRight className="size-4" />
              </Link>
            </Button>
          </SidebarFooter>
        </div>
      </Sidebar>

      <SidebarRail />

      <SidebarInset className="bg-transparent shadow-none md:m-0 md:rounded-none">
        <div className="mx-auto flex min-h-screen w-full max-w-[1680px] flex-col px-4 pb-6 pt-4 sm:px-6 xl:px-8">
          <header className="sticky top-0 z-30 pb-4">
            <div className="rounded-[28px] border border-border/70 bg-background/92 px-4 py-4 shadow-[0_20px_60px_rgba(15,23,42,0.06)] backdrop-blur sm:px-5 lg:px-6">
              <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
                <div className="flex min-w-0 items-start gap-3">
                  <SidebarTrigger className="mt-1 h-10 w-10 rounded-2xl border border-border/70 bg-background shadow-sm hover:bg-accent md:hidden">
                    <PanelLeft className="size-4" />
                  </SidebarTrigger>

                  <div className="min-w-0 space-y-2">
                    <Badge variant="outline" className="rounded-full bg-background text-xs text-muted-foreground">
                      {activeGroup.label}
                    </Badge>
                    <div className="space-y-1">
                      <h1 className="truncate text-2xl font-semibold tracking-tight text-foreground">
                        {activeNav.label}
                      </h1>
                      <p className="max-w-3xl text-sm leading-6 text-muted-foreground">
                        {activeNav.description}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  {quickActions.map((action) => {
                    const Icon = action.icon
                    return (
                      <Button
                        key={action.href}
                        asChild
                        size="sm"
                        variant={action.primary ? "default" : "outline"}
                        className="h-10 rounded-2xl"
                      >
                        <Link href={action.href}>
                          <Icon className="size-4" />
                          <span className="hidden sm:inline">{action.label}</span>
                        </Link>
                      </Button>
                    )
                  })}

                  <Button
                    type="button"
                    variant="outline"
                    className="h-10 rounded-2xl"
                    onClick={() => setCommandPaletteOpen(true)}
                  >
                    <Command className="size-4" />
                    <span className="hidden md:inline">命令面板</span>
                    <span className="rounded-full border border-border/70 bg-background px-2 py-0.5 text-[11px] text-muted-foreground">
                      Ctrl+K
                    </span>
                  </Button>

                  <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    className="h-10 w-10 rounded-2xl"
                    onClick={toggleFullscreen}
                    aria-label={fullscreen ? "退出全屏" : "进入全屏"}
                  >
                    <Expand className="size-4" />
                  </Button>

                  <ThemeToggle />

                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="outline" className="h-11 rounded-2xl px-2.5 shadow-sm">
                        <Avatar className="size-8 rounded-2xl">
                          <AvatarFallback className="rounded-2xl bg-primary/10 text-xs font-semibold text-primary">
                            {getInitials(username)}
                          </AvatarFallback>
                        </Avatar>
                        <div className="hidden min-w-0 text-left md:block">
                          <div className="truncate text-sm font-semibold text-foreground">{username}</div>
                          <div className="text-xs text-muted-foreground">已启用安全会话</div>
                        </div>
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-[320px] rounded-[24px] p-2">
                      <DropdownMenuLabel className="px-3 py-3">
                        <div className="flex items-center gap-3">
                          <Avatar className="size-12 rounded-[18px]">
                            <AvatarFallback className="rounded-[18px] bg-primary/10 text-primary">
                              {getInitials(username)}
                            </AvatarFallback>
                          </Avatar>
                          <div className="min-w-0 space-y-1">
                            <div className="truncate text-sm font-semibold text-foreground">
                              {username}
                            </div>
                            <div className="text-xs text-muted-foreground">
                              当前设备 {sessionSnapshot.currentDevice}
                            </div>
                          </div>
                        </div>
                      </DropdownMenuLabel>

                      <div className="grid gap-2 px-2 pb-2 sm:grid-cols-2">
                        <TopBarMetric label="当前 IP" value={sessionSnapshot.currentIp} />
                        <TopBarMetric
                          label="活跃会话"
                          value={`${sessionSnapshot.activeSessionCount} 个`}
                        />
                        <TopBarMetric
                          label="最近登录"
                          value={formatSessionTime(sessionSnapshot.lastLoginAt)}
                        />
                        <TopBarMetric
                          label="最近登录 IP"
                          value={sessionSnapshot.lastLoginIp || "暂无记录"}
                        />
                      </div>

                      <DropdownMenuSeparator />

                      <DropdownMenuItem
                        className="rounded-2xl px-3 py-2.5"
                        onSelect={(event) => {
                          event.preventDefault()
                          setCommandPaletteOpen(true)
                        }}
                      >
                        <Command className="size-4" />
                        打开命令面板
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        className="rounded-2xl px-3 py-2.5"
                        onSelect={(event) => {
                          event.preventDefault()
                          handleLogoutAll()
                        }}
                        disabled={logoutAllPending}
                      >
                        <Monitor className="size-4" />
                        注销全部会话
                      </DropdownMenuItem>
                      <DropdownMenuItem asChild className="rounded-2xl p-0 focus:bg-transparent">
                        <form action={logoutAction} className="w-full">
                          <button
                            type="submit"
                            className="flex w-full items-center gap-2 rounded-2xl px-3 py-2.5 text-sm text-red-600 outline-none transition-colors hover:bg-red-50 dark:hover:bg-red-950/30"
                          >
                            <LogOut className="size-4" />
                            安全退出
                          </button>
                        </form>
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </div>
            </div>
          </header>

          <main className="flex-1">
            <div className="flex w-full flex-col gap-5">{children}</div>
          </main>
        </div>
      </SidebarInset>
    </SidebarProvider>
  )
}
