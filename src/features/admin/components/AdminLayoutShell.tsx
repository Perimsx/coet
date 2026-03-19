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
} from "lucide-react"
import { toast } from "sonner"

import { logoutAction } from "@/app/admin/actions"
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
  SidebarSeparator,
  SidebarTrigger,
} from "@/components/ui/sidebar"
import ThemeToggle from "@/features/admin/components/ThemeToggle"
import { AdminCommandPalette } from "@/features/admin/components/AdminCommandPalette"
import { useAdminShellStore } from "@/features/admin/components/admin-shell-store"
import {
  getAdminCommandItems,
  getAdminNavigationGroups,
  resolveAdminNavigationKey,
} from "@/features/admin/lib/navigation"

type SessionSnapshot = {
  currentIp: string
  currentDevice: string
  lastLoginAt: string | null
  lastLoginIp: string | null
  activeSessionCount: number
}

function formatSessionTime(value: string | null) {
  if (!value) return "暂无记录"

  return new Date(value).toLocaleString("zh-CN", {
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  })
}

function getInitials(username: string) {
  return (username || "Admin")
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
      label: "查看评论",
      icon: ShieldCheck,
      visible: selectedKey === "dashboard" || selectedKey === "comments",
      primary: false,
    },
    {
      href: "/admin",
      label: "返回仪表盘",
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
  compact = false,
}: {
  label: string
  value: string
  compact?: boolean
}) {
  return (
    <div
      className={cn(
        "rounded-full bg-white/84 px-4 py-2.5 shadow-[0_12px_24px_rgba(15,23,42,0.05)] ring-1 ring-slate-200/60 backdrop-blur-sm dark:bg-slate-950/70 dark:ring-white/10",
        compact && "px-3.5 py-2"
      )}
    >
      <div className="font-mono text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
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
  sessionSnapshot,
}: {
  children: React.ReactNode
  username: string
  siteTitle: string
  sessionSnapshot: SessionSnapshot
}) {
  const pathname = usePathname()
  const selectedKey = resolveAdminNavigationKey(pathname)
  const setCommandPaletteOpen = useAdminShellStore((state) => state.setCommandPaletteOpen)
  const [fullscreen, setFullscreen] = useState(false)
  const [logoutAllPending, startLogoutAllTransition] = useTransition()

  const navGroups = useMemo(() => getAdminNavigationGroups(), [])
  const commandItems = useMemo(() => getAdminCommandItems(navGroups), [navGroups])
  const flatNavItems = useMemo(() => navGroups.flatMap((group) => group.items), [navGroups])
  const activeNav = flatNavItems.find((item) => item.key === selectedKey) ?? flatNavItems[0]
  const activeGroup =
    navGroups.find((group) => group.items.some((item) => item.key === selectedKey)) ?? navGroups[0]
  const quickActions = buildQuickActions(selectedKey)

  const glassButtonClass =
    "border-white/70 bg-white/82 px-4 shadow-[0_12px_24px_rgba(15,23,42,0.06)] backdrop-blur-sm hover:bg-white dark:border-white/10 dark:bg-slate-950/70 dark:hover:bg-slate-950"

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
      toast.error("当前环境不支持全屏模式")
    }
  }

  const handleLogoutAll = () => {
    startLogoutAllTransition(async () => {
      try {
        const response = await fetch("/api/admin/auth/logout-all", {
          method: "POST",
        })

        if (!response.ok) {
          toast.error("退出其他会话失败")
          return
        }

        window.location.href = "/admin"
      } catch {
        toast.error("退出其他会话失败")
      }
    })
  }

  return (
    <SidebarProvider
      defaultOpen
      className="relative isolate min-h-screen bg-[#f7f9fb] text-foreground dark:bg-slate-950"
      style={
        {
          "--sidebar-width": "18.5rem",
          "--sidebar-width-icon": "4rem",
        } as React.CSSProperties
      }
    >
      <div className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(circle_at_top_left,rgba(37,99,235,0.16),transparent_24%),radial-gradient(circle_at_85%_10%,rgba(56,189,248,0.12),transparent_18%),linear-gradient(180deg,#f7f9fb_0%,#eef4ff_45%,#f7f9fb_100%)] dark:bg-[radial-gradient(circle_at_top_left,rgba(37,99,235,0.2),transparent_22%),radial-gradient(circle_at_80%_10%,rgba(56,189,248,0.1),transparent_18%),linear-gradient(180deg,#020617_0%,#081225_45%,#020617_100%)]" />
      <div className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(rgba(148,163,184,0.18)_0.6px,transparent_0.6px)] [background-size:24px_24px] [mask-image:linear-gradient(to_bottom,rgba(0,0,0,0.55),transparent_85%)] dark:bg-[radial-gradient(rgba(148,163,184,0.12)_0.6px,transparent_0.6px)]" />

      <AdminCommandPalette items={commandItems} />

      <Sidebar
        variant="inset"
        collapsible="offcanvas"
        className="border-r-0 bg-transparent p-0 md:p-5"
      >
        <div className="flex h-full flex-col overflow-hidden rounded-none border-0 bg-transparent md:rounded-[34px] md:border md:border-white/65 md:bg-white/72 md:backdrop-blur-2xl md:shadow-[0_24px_80px_rgba(37,99,235,0.14)] dark:md:border-white/10 dark:md:bg-slate-950/52 dark:md:shadow-[0_24px_80px_rgba(2,6,23,0.5)]">
          <SidebarHeader className="gap-5 px-5 py-6">
            <div className="space-y-4">
              <div className="flex items-center gap-2 text-[10px] uppercase tracking-[0.24em] text-sidebar-foreground/55">
                <span className="font-mono">Technical Editorial</span>
                <span className="size-1 rounded-full bg-blue-500/70" />
                <span className="font-mono">Admin Mode</span>
              </div>
              <div className="space-y-2">
                <div className="font-[family-name:var(--font-admin-display)] text-[1.45rem] font-extrabold tracking-[-0.04em] text-sidebar-foreground">
                  {siteTitle}
                </div>
                <p className="max-w-xs text-sm leading-6 text-sidebar-foreground/68">
                  以更安静、更清晰的方式处理内容、互动与站点配置。
                </p>
              </div>
              <Badge
                variant="outline"
                className="w-fit rounded-full border-white/70 bg-white/72 px-3 py-1 font-mono text-[10px] uppercase tracking-[0.2em] text-sidebar-foreground/70 dark:border-white/10 dark:bg-white/5"
              >
                Curator CMS
              </Badge>
            </div>
          </SidebarHeader>

          <SidebarSeparator className="mx-5 bg-white/60 dark:bg-white/10" />

          <SidebarContent className="px-3 py-4">
            {navGroups.map((group) => (
              <SidebarGroup key={group.id} className="px-1 py-1.5">
                <SidebarGroupLabel className="px-3 font-mono text-[10px] uppercase tracking-[0.24em] text-sidebar-foreground/46">
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
                              "h-auto min-h-[74px] rounded-[26px] border border-transparent px-3 py-3.5 transition-all duration-200",
                              active
                                ? "bg-gradient-to-br from-blue-600 to-blue-500 text-white shadow-[0_18px_40px_rgba(37,99,235,0.28)] hover:from-blue-600 hover:to-blue-500 hover:text-white"
                                : "bg-transparent text-sidebar-foreground hover:border-white/65 hover:bg-white/76 hover:text-sidebar-foreground dark:hover:border-white/10 dark:hover:bg-white/5"
                            )}
                          >
                            <Link href={item.href}>
                              <div
                                className={cn(
                                  "flex size-11 shrink-0 items-center justify-center rounded-[18px]",
                                  active
                                    ? "bg-white/14 text-white"
                                    : "bg-slate-900/5 text-slate-600 dark:bg-white/10 dark:text-slate-300"
                                )}
                              >
                                <Icon className="size-5" />
                              </div>
                              <div className="flex min-w-0 flex-1 flex-col gap-1.5">
                                <span className="truncate font-mono text-[11px] uppercase tracking-[0.18em]">
                                  {item.label}
                                </span>
                                <span
                                  className={cn(
                                    "line-clamp-2 text-xs leading-5",
                                    active ? "text-white/82" : "text-sidebar-foreground/62"
                                  )}
                                >
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

          <SidebarFooter className="gap-3 border-t border-white/60 px-4 py-5 dark:border-white/10">
            <Button
              type="button"
              variant="outline"
              className="h-11 justify-between rounded-full border-white/70 bg-white/78 px-4 text-sidebar-foreground shadow-sm hover:bg-white dark:border-white/10 dark:bg-white/5 dark:hover:bg-white/8"
              onClick={() => setCommandPaletteOpen(true)}
            >
              <span>命令面板</span>
              <span className="rounded-full bg-slate-950/5 px-2.5 py-1 font-mono text-[10px] uppercase tracking-[0.18em] text-sidebar-foreground/68 dark:bg-white/10">
                Ctrl+K
              </span>
            </Button>
            <Button
              asChild
              variant="outline"
              className="h-11 justify-between rounded-full border-white/70 bg-white/78 px-4 text-sidebar-foreground shadow-sm hover:bg-white dark:border-white/10 dark:bg-white/5 dark:hover:bg-white/8"
            >
              <Link href="/" target="_blank">
                <span>查看前台</span>
                <ArrowUpRight className="size-4" />
              </Link>
            </Button>
          </SidebarFooter>
        </div>
      </Sidebar>

      <SidebarInset className="overflow-x-clip bg-transparent shadow-none md:m-0 md:rounded-none">
        <div className="mx-auto flex min-h-screen w-full max-w-[1560px] flex-col px-4 pb-10 pt-4 sm:px-6 lg:px-8 xl:px-10">
          <header className="sticky top-0 z-20 pb-6 pt-1">
            <div className="overflow-hidden rounded-[32px] border border-white/72 bg-white/76 px-4 py-4 shadow-[0_24px_72px_rgba(37,99,235,0.14)] backdrop-blur-2xl dark:border-white/10 dark:bg-slate-950/56 dark:shadow-[0_24px_72px_rgba(2,6,23,0.5)] sm:px-5 lg:px-6">
              <div className="flex flex-col gap-5 xl:flex-row xl:items-start xl:justify-between">
                <div className="flex min-w-0 items-start gap-3.5">
                  <SidebarTrigger
                    className={cn(
                      "mt-0.5 h-11 w-11 rounded-[20px] border border-white/70 bg-white/82 shadow-[0_12px_24px_rgba(15,23,42,0.08)] backdrop-blur-sm hover:bg-white dark:border-white/10 dark:bg-slate-950/70 dark:hover:bg-slate-950",
                      glassButtonClass
                    )}
                  >
                    <PanelLeft className="size-4" />
                  </SidebarTrigger>

                  <div className="min-w-0 space-y-3">
                    <Badge
                      variant="outline"
                      className="w-fit rounded-full border-white/70 bg-white/78 px-3 py-1 font-mono text-[10px] uppercase tracking-[0.22em] text-slate-500 shadow-sm dark:border-white/10 dark:bg-white/5 dark:text-slate-300/70"
                    >
                      {activeGroup.label}
                    </Badge>
                    <div className="space-y-2">
                      <h1 className="font-[family-name:var(--font-admin-display)] text-[1.9rem] font-extrabold tracking-[-0.05em] text-foreground sm:text-[2.15rem]">
                        {activeNav.label}
                      </h1>
                      <p className="max-w-3xl text-sm leading-7 text-muted-foreground">
                        {activeNav.description}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="flex flex-col gap-3 xl:items-end">
                  <div className="hidden flex-wrap items-center gap-2 xl:flex">
                    <TopBarMetric
                      label="活跃会话"
                      value={`${sessionSnapshot.activeSessionCount} 个`}
                      compact
                    />
                    <TopBarMetric label="当前 IP" value={sessionSnapshot.currentIp} compact />
                    <TopBarMetric
                      label="最近登录"
                      value={formatSessionTime(sessionSnapshot.lastLoginAt)}
                      compact
                    />
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
                          className={
                            action.primary
                              ? "h-11 rounded-full bg-gradient-to-br from-blue-600 to-blue-500 px-5 text-white shadow-[0_18px_36px_rgba(37,99,235,0.24)] hover:from-blue-600 hover:to-blue-600"
                              : cn("h-11 rounded-full", glassButtonClass)
                          }
                        >
                          <Link href={action.href}>
                            <Icon className="size-4" />
                            <span className="hidden lg:inline">{action.label}</span>
                          </Link>
                        </Button>
                      )
                    })}

                    <Button
                      type="button"
                      variant="outline"
                      className={cn("h-11 rounded-full", glassButtonClass)}
                      onClick={() => setCommandPaletteOpen(true)}
                    >
                      <Command className="size-4" />
                      <span className="hidden md:inline">命令面板</span>
                      <span className="rounded-full bg-slate-950/5 px-2.5 py-1 font-mono text-[10px] uppercase tracking-[0.16em] text-muted-foreground dark:bg-white/10">
                        Ctrl+K
                      </span>
                    </Button>

                    <Button
                      type="button"
                      variant="outline"
                      size="icon"
                      className={cn("h-11 w-11 rounded-[20px]", glassButtonClass)}
                      onClick={toggleFullscreen}
                      aria-label={fullscreen ? "退出全屏" : "进入全屏"}
                    >
                      <Expand className="size-4" />
                    </Button>

                    <ThemeToggle />

                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button
                          variant="outline"
                          className={cn(
                            "h-11 rounded-full px-2.5 text-left shadow-[0_12px_24px_rgba(15,23,42,0.06)]",
                            glassButtonClass
                          )}
                        >
                          <Avatar className="size-8 rounded-[18px]">
                            <AvatarFallback className="rounded-[18px] bg-blue-600/12 text-xs font-semibold text-blue-700 dark:bg-blue-500/20 dark:text-sky-200">
                              {getInitials(username)}
                            </AvatarFallback>
                          </Avatar>
                          <div className="hidden min-w-0 md:block">
                            <div className="truncate text-sm font-semibold text-foreground">
                              {username}
                            </div>
                            <div className="text-xs text-muted-foreground">受保护会话</div>
                          </div>
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent
                        align="end"
                        className="w-[340px] rounded-[28px] border-white/70 bg-white/94 p-2 shadow-[0_24px_60px_rgba(37,99,235,0.15)] backdrop-blur-2xl dark:border-white/10 dark:bg-slate-950/86"
                      >
                        <DropdownMenuLabel className="px-3 py-3">
                          <div className="flex items-center gap-3">
                            <Avatar className="size-12 rounded-[20px]">
                              <AvatarFallback className="rounded-[20px] bg-blue-600/12 text-blue-700 dark:bg-blue-500/20 dark:text-sky-200">
                                {getInitials(username)}
                              </AvatarFallback>
                            </Avatar>
                            <div className="min-w-0 space-y-1">
                              <div className="truncate text-sm font-semibold text-foreground">
                                {username}
                              </div>
                              <div className="truncate text-xs text-muted-foreground">
                                当前设备：{sessionSnapshot.currentDevice}
                              </div>
                            </div>
                          </div>
                        </DropdownMenuLabel>

                        <div className="grid gap-2 px-2 pb-2 sm:grid-cols-2">
                          <TopBarMetric label="当前 IP" value={sessionSnapshot.currentIp} />
                          <TopBarMetric
                            label="活跃会话"
                            value={String(sessionSnapshot.activeSessionCount)}
                          />
                          <TopBarMetric
                            label="最近登录"
                            value={formatSessionTime(sessionSnapshot.lastLoginAt)}
                          />
                          <TopBarMetric
                            label="登录 IP"
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
                          退出其他会话
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
            </div>
          </header>

          <main className="min-w-0 flex-1">
            <div className="flex w-full flex-col gap-6">{children}</div>
          </main>
        </div>
      </SidebarInset>
    </SidebarProvider>
  )
}
