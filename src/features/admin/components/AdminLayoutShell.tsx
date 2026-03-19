"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useMemo, useState, useTransition } from "react";
import {
  ArrowUpRight,
  Command,
  Expand,
  FileText,
  LayoutDashboard,
  LogOut,
  Monitor,
  ShieldCheck,
} from "lucide-react";
import { toast } from "sonner";

import { logoutAction } from "@/app/admin/actions";
import { cn } from "@/components/lib/utils";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
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
  SidebarTrigger,
} from "@/components/ui/sidebar";
import ThemeToggle from "@/features/admin/components/ThemeToggle";
import { AdminCommandPalette } from "@/features/admin/components/AdminCommandPalette";
import { useAdminShellStore } from "@/features/admin/components/admin-shell-store";
import {
  getAdminCommandItems,
  getAdminNavigationGroups,
  resolveAdminNavigationKey,
} from "@/features/admin/lib/navigation";

type SessionSnapshot = {
  currentIp: string;
  currentDevice: string;
  lastLoginAt: string | null;
  lastLoginIp: string | null;
  activeSessionCount: number;
};

function formatSessionTime(value: string | null) {
  if (!value) return "暂无记录";

  return new Date(value).toLocaleString("zh-CN", {
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function getInitials(username: string) {
  return (username || "Admin")
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part.charAt(0).toUpperCase())
    .join("");
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
  ];

  return actions.filter((item) => item.visible);
}

function TopBarMetric({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-col">
      <div className="text-[11px] uppercase tracking-wider text-muted-foreground">
        {label}
      </div>
      <div className="mt-0.5 text-sm font-medium text-foreground">{value}</div>
    </div>
  );
}

export function AdminLayoutShell({
  children,
  username,
  siteTitle,
  sessionSnapshot,
}: {
  children: React.ReactNode;
  username: string;
  siteTitle: string;
  sessionSnapshot: SessionSnapshot;
}) {
  const pathname = usePathname();
  const selectedKey = resolveAdminNavigationKey(pathname);
  const setCommandPaletteOpen = useAdminShellStore(
    (state) => state.setCommandPaletteOpen,
  );
  const [fullscreen, setFullscreen] = useState(false);
  const [logoutAllPending, startLogoutAllTransition] = useTransition();

  const navGroups = useMemo(() => getAdminNavigationGroups(), []);
  const commandItems = useMemo(
    () => getAdminCommandItems(navGroups),
    [navGroups],
  );
  const flatNavItems = useMemo(
    () => navGroups.flatMap((group) => group.items),
    [navGroups],
  );
  const activeNav =
    flatNavItems.find((item) => item.key === selectedKey) ?? flatNavItems[0];
  const quickActions = buildQuickActions(selectedKey);

  useEffect(() => {
    const handleFullscreenChange = () => {
      setFullscreen(Boolean(document.fullscreenElement));
    };

    document.addEventListener("fullscreenchange", handleFullscreenChange);
    return () =>
      document.removeEventListener("fullscreenchange", handleFullscreenChange);
  }, []);

  const toggleFullscreen = async () => {
    try {
      if (document.fullscreenElement) {
        await document.exitFullscreen();
        return;
      }

      await document.documentElement.requestFullscreen();
    } catch {
      toast.error("当前环境不支持全屏模式");
    }
  };

  const handleLogoutAll = () => {
    startLogoutAllTransition(async () => {
      try {
        const response = await fetch("/api/admin/auth/logout-all", {
          method: "POST",
        });

        if (!response.ok) {
          toast.error("退出其他会话失败");
          return;
        }

        window.location.href = "/admin";
      } catch {
        toast.error("退出其他会话失败");
      }
    });
  };

  return (
    <SidebarProvider
      suppressHydrationWarning
      defaultOpen
      className="bg-background text-foreground"
    >
      <AdminCommandPalette items={commandItems} />

      <Sidebar
        variant="sidebar"
        collapsible="offcanvas"
        className="border-r border-border bg-sidebar text-sidebar-foreground"
      >
        <SidebarHeader className="flex h-16 shrink-0 items-center border-b px-4">
          <div className="flex w-full items-center gap-3 overflow-hidden">
            <div className="flex size-7 shrink-0 items-center justify-center rounded-md bg-primary text-primary-foreground">
              <span className="text-xs font-bold leading-none">
                {siteTitle.charAt(0).toUpperCase()}
              </span>
            </div>
            <div className="flex flex-col min-w-0">
              <span className="truncate text-sm font-semibold tracking-tight">
                {siteTitle}
              </span>
              <span className="truncate text-xs text-muted-foreground">
                Admin Mode
              </span>
            </div>
          </div>
        </SidebarHeader>

        <SidebarContent className="py-2">
          {navGroups.map((group) => (
            <SidebarGroup key={group.id} className="px-3 py-2">
              <SidebarGroupLabel className="mb-1 px-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                {group.label}
              </SidebarGroupLabel>
              <SidebarGroupContent>
                <SidebarMenu>
                  {group.items.map((item) => {
                    const Icon = item.icon;
                    const active = item.key === selectedKey;

                    return (
                      <SidebarMenuItem key={item.key}>
                        <SidebarMenuButton
                          asChild
                          isActive={active}
                          tooltip={item.label}
                          className={cn(
                            "h-9 w-full justify-start rounded-md px-3 text-sm transition-colors",
                            active
                              ? "bg-secondary text-secondary-foreground font-medium"
                              : "text-muted-foreground hover:bg-secondary/50 hover:text-foreground",
                          )}
                        >
                          <Link
                            href={item.href}
                            className="flex items-center gap-3"
                          >
                            <Icon className="size-4 shrink-0" />
                            <span className="truncate">{item.label}</span>
                          </Link>
                        </SidebarMenuButton>
                      </SidebarMenuItem>
                    );
                  })}
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>
          ))}
        </SidebarContent>

        <SidebarFooter className="shrink-0 space-y-2 border-t p-4">
          <Button
            type="button"
            variant="ghost"
            className="h-9 w-full justify-start text-muted-foreground hover:bg-secondary/50 hover:text-foreground"
            onClick={() => setCommandPaletteOpen(true)}
          >
            <Command className="mr-3 size-4 shrink-0" />
            <span className="text-sm">命令面板</span>
            <span className="ml-auto rounded border bg-muted px-1.5 py-0.5 text-[10px] tracking-widest text-muted-foreground">
              ⌘K
            </span>
          </Button>
          <Button
            asChild
            variant="ghost"
            className="h-9 w-full justify-start text-muted-foreground hover:bg-secondary/50 hover:text-foreground"
          >
            <Link href="/" target="_blank">
              <ArrowUpRight className="mr-3 size-4 shrink-0" />
              <span className="text-sm">查看前台</span>
            </Link>
          </Button>
        </SidebarFooter>
      </Sidebar>

      <SidebarInset className="flex flex-1 flex-col min-w-0 bg-background/50">
        <header className="sticky top-0 z-30 flex h-16 shrink-0 items-center gap-4 border-b bg-background/95 px-4 backdrop-blur supports-[backdrop-filter]:bg-background/80 sm:gap-6 sm:px-6">
          <SidebarTrigger className="-ml-2 h-8 w-8 text-muted-foreground hover:bg-muted" />

          <div className="flex flex-1 items-center gap-4 min-w-0">
            <h1 className="truncate text-lg font-semibold tracking-tight text-foreground">
              {activeNav.label}
            </h1>
          </div>

          <div className="flex items-center gap-2 sm:gap-3">
            {quickActions.map((action) => {
              const Icon = action.icon;
              return (
                <Button
                  key={action.href}
                  asChild
                  size="sm"
                  variant={action.primary ? "default" : "outline"}
                  className="hidden h-8 lg:flex"
                >
                  <Link href={action.href}>
                    <Icon className="mr-1.5 size-3.5" />
                    {action.label}
                  </Link>
                </Button>
              );
            })}

            <ThemeToggle />

            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="hidden h-8 w-8 sm:flex"
              onClick={toggleFullscreen}
              aria-label={fullscreen ? "退出全屏" : "进入全屏"}
            >
              <Expand className="size-4 text-muted-foreground" />
            </Button>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 rounded-full border border-border"
                >
                  <Avatar className="size-8">
                    <AvatarFallback className="bg-primary/10 text-xs font-semibold text-primary">
                      {getInitials(username)}
                    </AvatarFallback>
                  </Avatar>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-64 p-2 rounded-xl">
                <DropdownMenuLabel className="font-normal px-2 py-1.5 flex flex-col gap-1">
                  <div className="text-sm font-semibold">{username}</div>
                  <div className="text-xs text-muted-foreground truncate">
                    设备: {sessionSnapshot.currentDevice}
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <div className="grid grid-cols-2 gap-3 px-2 py-2">
                  <TopBarMetric
                    label="Active"
                    value={String(sessionSnapshot.activeSessionCount)}
                  />
                  <TopBarMetric
                    label="Current IP"
                    value={sessionSnapshot.currentIp}
                  />
                  <TopBarMetric
                    label="Last Login"
                    value={formatSessionTime(sessionSnapshot.lastLoginAt)}
                  />
                </div>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  className="cursor-pointer rounded-lg mb-1"
                  onSelect={(e) => {
                    e.preventDefault();
                    setCommandPaletteOpen(true);
                  }}
                >
                  <Command className="mr-2 size-4" /> 命令面板
                </DropdownMenuItem>
                <DropdownMenuItem
                  className="cursor-pointer rounded-lg mb-1"
                  onSelect={(e) => {
                    e.preventDefault();
                    handleLogoutAll();
                  }}
                  disabled={logoutAllPending}
                >
                  <Monitor className="mr-2 size-4" /> 退出其他会话
                </DropdownMenuItem>
                <DropdownMenuItem
                  asChild
                  className="cursor-pointer rounded-lg text-destructive focus:bg-destructive/10 focus:text-destructive"
                >
                  <form action={logoutAction} className="w-full m-0 p-0">
                    <button
                      type="submit"
                      className="flex w-full items-center outline-none"
                    >
                      <LogOut className="mr-2 size-4" /> 安全退出
                    </button>
                  </form>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </header>

        <main className="flex-1 w-full p-6 lg:p-8">
          <div className="flex w-full flex-col gap-6">{children}</div>
        </main>
      </SidebarInset>
    </SidebarProvider>
  );
}
