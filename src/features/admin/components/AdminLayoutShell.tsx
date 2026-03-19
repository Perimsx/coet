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
  if (!value) return "Shown after your next successful sign-in"

  return new Date(value).toLocaleString(undefined, {
    month: "short",
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
      label: "Create post",
      icon: FileText,
      visible: selectedKey === "dashboard" || selectedKey === "posts",
      primary: true,
    },
    {
      href: "/admin/comments",
      label: "Review comments",
      icon: ShieldCheck,
      visible: selectedKey === "dashboard" || selectedKey === "comments",
      primary: false,
    },
    {
      href: "/admin",
      label: "Dashboard",
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
      toast.error("Fullscreen is not available in the current environment")
    }
  }

  const handleLogoutAll = () => {
    startLogoutAllTransition(async () => {
      try {
        const response = await fetch("/api/admin/auth/logout-all", {
          method: "POST",
        })

        if (!response.ok) {
          toast.error("Failed to sign out other sessions")
          return
        }

        window.location.href = "/admin"
      } catch {
        toast.error("Failed to sign out other sessions")
      }
    })
  }

  return (
    <SidebarProvider
      defaultOpen
      className="min-h-screen bg-[radial-gradient(circle_at_top_left,rgba(14,165,233,0.12),transparent_28%),radial-gradient(circle_at_top_right,rgba(15,23,42,0.04),transparent_22%),linear-gradient(180deg,rgba(248,250,252,0.96),rgba(255,255,255,1))] dark:bg-[radial-gradient(circle_at_top_left,rgba(14,165,233,0.16),transparent_28%),radial-gradient(circle_at_top_right,rgba(14,165,233,0.08),transparent_22%),linear-gradient(180deg,rgba(2,6,23,0.98),rgba(2,6,23,1))]"
      style={
        {
          "--sidebar-width": "18rem",
          "--sidebar-width-icon": "4rem",
        } as React.CSSProperties
      }
    >
      <AdminCommandPalette items={commandItems} />

      <Sidebar
        variant="inset"
        collapsible="offcanvas"
        className="border-r-0 bg-transparent p-0 md:p-4"
      >
        <div className="flex h-full flex-col overflow-hidden border-sidebar-border/70 bg-sidebar/95 md:rounded-[30px] md:border md:shadow-[0_24px_60px_rgba(15,23,42,0.08)]">
          <SidebarHeader className="gap-4 px-5 py-5">
            <div className="space-y-3">
              <Badge
                variant="outline"
                className="w-fit rounded-full border-sidebar-border/70 bg-sidebar-accent/35 px-3 py-1 text-[11px] tracking-[0.18em] text-sidebar-foreground/70"
              >
                ADMIN
              </Badge>
              <div className="space-y-1">
                <div className="text-lg font-semibold text-sidebar-foreground">{siteTitle}</div>
                <p className="text-sm leading-6 text-sidebar-foreground/68">
                  One clear route for navigation, work, and account security.
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
                              "h-auto min-h-[56px] rounded-[22px] border px-3 py-3",
                              active
                                ? "border-sidebar-border/80 bg-sidebar-accent/85 text-sidebar-accent-foreground shadow-sm"
                                : "border-transparent bg-transparent hover:border-sidebar-border/60 hover:bg-sidebar-accent/60"
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

          <SidebarFooter className="gap-2 border-t border-sidebar-border/60 px-4 py-4">
            <Button
              type="button"
              variant="outline"
              className="h-11 justify-between rounded-2xl border-sidebar-border/70 bg-sidebar-accent/20 text-sidebar-foreground hover:bg-sidebar-accent"
              onClick={() => setCommandPaletteOpen(true)}
            >
              <span>Command menu</span>
              <span className="rounded-full border border-sidebar-border/70 bg-sidebar px-2 py-0.5 text-[11px] text-sidebar-foreground/70">
                Ctrl+K
              </span>
            </Button>
            <Button
              asChild
              variant="outline"
              className="h-11 justify-between rounded-2xl border-sidebar-border/70 bg-sidebar-accent/20 text-sidebar-foreground hover:bg-sidebar-accent"
            >
              <Link href="/" target="_blank">
                <span>View site</span>
                <ArrowUpRight className="size-4" />
              </Link>
            </Button>
          </SidebarFooter>
        </div>
      </Sidebar>

      <SidebarInset className="overflow-x-clip bg-transparent shadow-none md:m-0 md:rounded-none">
        <div className="mr-auto flex min-h-screen w-full max-w-[1480px] flex-col px-4 pb-8 pt-4 sm:px-6 lg:px-8 xl:px-10">
          <header className="sticky top-0 z-20 pb-5">
            <div className="overflow-hidden rounded-[28px] border border-border/70 bg-background/88 px-4 py-4 shadow-[0_18px_48px_rgba(15,23,42,0.08)] backdrop-blur-xl sm:px-5 lg:px-6">
              <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
                <div className="flex min-w-0 items-start gap-3">
                  <SidebarTrigger className="mt-1 h-10 w-10 rounded-2xl border border-border/70 bg-background shadow-sm hover:bg-accent">
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
                          <span className="hidden lg:inline">{action.label}</span>
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
                    <span className="hidden md:inline">Command menu</span>
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
                    aria-label={fullscreen ? "Exit fullscreen" : "Enter fullscreen"}
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
                          <div className="text-xs text-muted-foreground">Protected session enabled</div>
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
                              Current device: {sessionSnapshot.currentDevice}
                            </div>
                          </div>
                        </div>
                      </DropdownMenuLabel>

                      <div className="grid gap-2 px-2 pb-2 sm:grid-cols-2">
                        <TopBarMetric label="Current IP" value={sessionSnapshot.currentIp} />
                        <TopBarMetric
                          label="Active sessions"
                          value={String(sessionSnapshot.activeSessionCount)}
                        />
                        <TopBarMetric
                          label="Last sign-in"
                          value={formatSessionTime(sessionSnapshot.lastLoginAt)}
                        />
                        <TopBarMetric
                          label="Last sign-in IP"
                          value={sessionSnapshot.lastLoginIp || "No record yet"}
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
                        Open command menu
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
                        Sign out other sessions
                      </DropdownMenuItem>
                      <DropdownMenuItem asChild className="rounded-2xl p-0 focus:bg-transparent">
                        <form action={logoutAction} className="w-full">
                          <button
                            type="submit"
                            className="flex w-full items-center gap-2 rounded-2xl px-3 py-2.5 text-sm text-red-600 outline-none transition-colors hover:bg-red-50 dark:hover:bg-red-950/30"
                          >
                            <LogOut className="size-4" />
                            Secure sign out
                          </button>
                        </form>
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </div>
            </div>
          </header>

          <main className="min-w-0 flex-1">
            <div className="flex w-full flex-col gap-5">{children}</div>
          </main>
        </div>
      </SidebarInset>
    </SidebarProvider>
  )
}
