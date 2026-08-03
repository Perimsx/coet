'use client'

import { useEffect, useState } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import { Button, Spinner } from '@/components/ui/heroui-helpers'
import { Dropdown } from '@heroui/react'
import {
  LayoutDashboard,
  BookOpen,
  Settings,
  MessageSquare,
  Activity,
  Menu as MenuIcon,
  LogOut,
  ChevronRight,
  ChevronDown,
  User,
  ShieldCheck,
  X,
  PanelLeftClose,
  PanelLeft,
} from 'lucide-react'
import { cmsApi, CMSApiError, setCSRFToken } from '@/features/admin/lib/api'
import { toast } from '@/shared/hooks/use-toast'

interface NavChild {
  key: string
  label: string
}

interface NavGroup {
  key: string
  label: string
  icon: React.ReactNode
  children: NavChild[]
}

const navigationGroup: NavGroup[] = [
  {
    key: 'content',
    label: '内容管理',
    icon: <BookOpen className="w-4 h-4" />,
    children: [
      { key: '/admin/content/posts', label: '文章' },
      { key: '/admin/content/pages', label: '独立页面' },
      { key: '/admin/content/categories', label: '分类' },
      { key: '/admin/content/tags', label: '标签' },
    ],
  },
  {
    key: 'site',
    label: '站点管理',
    icon: <Settings className="w-4 h-4" />,
    children: [
      { key: '/admin/site/settings', label: '站点设置' },
      { key: '/admin/site/navigation', label: '导航菜单' },
      { key: '/admin/site/friends', label: '友链' },
      { key: '/admin/site/seo', label: 'SEO 设置' },
    ],
  },
  {
    key: 'engagement',
    label: '互动管理',
    icon: <MessageSquare className="w-4 h-4" />,
    children: [
      { key: '/admin/engagement/comments', label: '评论审核' },
      { key: '/admin/engagement/suggestions', label: '留言建议' },
    ],
  },
  {
    key: 'system',
    label: '系统管理',
    icon: <Activity className="w-4 h-4" />,
    children: [
      { key: '/admin/system/health', label: '系统状态' },
      { key: '/admin/system/git', label: '代码更新' },
      { key: '/admin/system/backups', label: '数据库备份' },
      { key: '/admin/system/jobs', label: '后台任务' },
      { key: '/admin/system/logs', label: '操作日志' },
    ],
  },
]

function SidebarNav({
  pathname,
  collapsed,
  onNavigate,
}: {
  pathname: string
  collapsed: boolean
  onNavigate: (path: string) => void
}) {
  // 分组折叠状态控制
  const [collapsedGroups, setCollapsedGroups] = useState<
    Record<string, boolean>
  >({})

  const toggleGroup = (key: string) => {
    setCollapsedGroups((prev) => ({ ...prev, [key]: !prev[key] }))
  }

  return (
    <div
      className={`flex flex-col gap-5 p-3 transition-all duration-300 ${collapsed ? 'items-center' : ''}`}
    >
      {/* 仪表盘 */}
      <div className="w-full">
        {(() => {
          const isDashboardActive = pathname === '/admin/dashboard'
          return (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onNavigate('/admin/dashboard')}
              title={collapsed ? '仪表盘' : undefined}
              className={`w-full flex items-center ${collapsed ? 'justify-center p-2' : 'justify-start gap-2.5 px-2.5 py-2'} rounded-md text-xs font-medium transition-all active:scale-95 ${
                isDashboardActive
                  ? 'bg-primary/10 text-primary font-semibold'
                  : 'text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800/60'
              }`}
            >
              <LayoutDashboard
                className={`w-4 h-4 shrink-0 ${isDashboardActive ? 'text-primary' : ''}`}
              />
              {!collapsed && <span>仪表盘</span>}
            </Button>
          )
        })()}
      </div>

      {/* 分组列表 */}
      {navigationGroup.map((group) => {
        const isGroupCollapsed = Boolean(collapsedGroups[group.key])

        return (
          <div key={group.key} className="w-full flex flex-col gap-1">
            {/* 分组标题头（支持点击独立折叠分组） */}
            {!collapsed ? (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => toggleGroup(group.key)}
                className="w-full px-2 py-1 flex items-center justify-between text-xs font-semibold text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 uppercase tracking-wider transition-colors"
              >
                <div className="flex items-center gap-2">
                  {group.icon}
                  <span>{group.label}</span>
                </div>
                <ChevronDown
                  className={`w-3.5 h-3.5 transition-transform duration-200 ${isGroupCollapsed ? '-rotate-90' : ''}`}
                />
              </Button>
            ) : (
              <div
                className="w-full flex justify-center py-1 text-zinc-400"
                title={group.label}
              >
                {group.icon}
              </div>
            )}

            {/* 子菜单列表 */}
            {(!isGroupCollapsed || collapsed) && (
              <div
                className={`flex flex-col gap-0.5 ${!collapsed ? 'mt-0.5 pl-1' : ''}`}
              >
                {group.children.map((child) => {
                  const active =
                    pathname === child.key ||
                    pathname.startsWith(`${child.key}/`)
                  return (
                    <Button
                      variant="ghost"
                      size="sm"
                      key={child.key}
                      onClick={() => onNavigate(child.key)}
                      title={collapsed ? child.label : undefined}
                      className={`w-full flex items-center ${collapsed ? 'justify-center p-2' : 'justify-start px-2.5 py-1.5'} rounded-md text-xs font-medium transition-all active:scale-95 ${
                        active
                          ? 'bg-primary/10 text-primary font-semibold'
                          : 'text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800/60'
                      }`}
                    >
                      {!collapsed ? (
                        <div className="flex items-center justify-between w-full">
                          <span>{child.label}</span>
                          {active && (
                            <ChevronRight className="w-3.5 h-3.5 shrink-0 text-primary" />
                          )}
                        </div>
                      ) : (
                        <span
                          className={`w-2 h-2 rounded-full transition-all ${active ? 'bg-primary scale-125' : 'bg-zinc-300 dark:bg-zinc-700'}`}
                        />
                      )}
                    </Button>
                  )
                })}
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}

function AdminUserDropdown({
  onLogout,
  onLogoutAll,
}: {
  onLogout: () => void
  onLogoutAll: () => void
}) {
  return (
    <Dropdown>
      <Button
        variant="outline"
        size="sm"
        className="min-h-11 shrink-0 whitespace-nowrap"
      >
        <User className="w-4 h-4 text-primary shrink-0" />
        <span>管理员</span>
      </Button>
      <Dropdown.Popover className="z-[99] min-w-[160px] overflow-hidden rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-1 text-zinc-900 dark:text-zinc-100 shadow-xl">
        <Dropdown.Menu
          aria-label="管理员会话操作"
          onAction={(key) => {
            if (key === 'logout') onLogout()
            if (key === 'logout-all') onLogoutAll()
          }}
        >
          <Dropdown.Item
            id="logout"
            textValue="退出登录"
            className="flex flex-row items-center gap-2.5 px-3 py-2 text-xs rounded-lg cursor-pointer hover:bg-zinc-100 dark:hover:bg-zinc-800/80 transition-colors"
          >
            <LogOut className="w-4 h-4 text-zinc-500 shrink-0" />
            <span className="whitespace-nowrap font-medium">退出登录</span>
          </Dropdown.Item>
          <Dropdown.Item
            id="logout-all"
            textValue="注销全部会话"
            variant="danger"
            className="flex flex-row items-center gap-2.5 px-3 py-2 text-xs rounded-lg cursor-pointer hover:bg-rose-50 text-rose-600 dark:hover:bg-rose-950/40 transition-colors"
          >
            <ShieldCheck className="w-4 h-4 text-rose-500 shrink-0" />
            <span className="whitespace-nowrap font-medium">注销全部会话</span>
          </Dropdown.Item>
        </Dropdown.Menu>
      </Dropdown.Popover>
    </Dropdown>
  )
}

let cachedCSRFTokenVerified = false

export function AdminShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const router = useRouter()
  const [mobileOpen, setMobileOpen] = useState(false)
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
  const [checking, setChecking] = useState(!cachedCSRFTokenVerified)

  useEffect(() => {
    cmsApi
      .session()
      .then((session) => {
        setCSRFToken(session.csrfToken)
        cachedCSRFTokenVerified = true
      })
      .catch((error) => {
        if (error instanceof CMSApiError && error.code === 40101) {
          cachedCSRFTokenVerified = false
          router.replace('/admin/login')
        } else {
          toast.error('无法连接 CMS API，请确认 Go 服务已启动。')
        }
      })
      .finally(() => setChecking(false))
  }, [router])

  const handleNavigate = (path: string) => {
    setMobileOpen(false)
    router.push(path)
  }

  const logout = async () => {
    try {
      await cmsApi.logout()
      router.replace('/admin/login')
    } catch {
      toast.error('退出登录失败')
    }
  }

  const logoutAll = async () => {
    try {
      await cmsApi.logoutAll()
      router.replace('/admin/login')
      toast.success('已注销所有管理员会话')
    } catch {
      toast.error('注销所有会话失败')
    }
  }

  if (checking) {
    return (
      <div className="grid h-dvh place-items-center bg-zinc-50 dark:bg-zinc-950">
        <Spinner size="md" />
      </div>
    )
  }

  return (
    <div className="xuzhan-admin-shell flex h-dvh overflow-hidden bg-zinc-50 dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100 font-sans">
      {/* 桌面侧边栏（支持折叠/展开） */}
      <aside
        className={`hidden lg:flex flex-col border-r border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 shrink-0 overflow-y-auto transition-all duration-300 ${
          sidebarCollapsed ? 'w-14' : 'w-56'
        }`}
      >
        <div className="flex items-center gap-2.5 px-3.5 h-14 border-b border-zinc-200 dark:border-zinc-800 shrink-0 overflow-hidden">
          <div className="grid w-7 h-7 place-items-center rounded-md bg-primary text-white font-mono text-xs font-bold shrink-0">
            序栈
          </div>
          {!sidebarCollapsed && (
            <span className="font-bold text-sm tracking-tight truncate">
              CMS 控制台
            </span>
          )}
        </div>
        <div className="flex-1 overflow-y-auto">
          <SidebarNav
            pathname={pathname}
            collapsed={sidebarCollapsed}
            onNavigate={handleNavigate}
          />
        </div>
      </aside>

      {/* 移动端 PWA Drawer 侧滑 */}
      {mobileOpen && (
        <div className="fixed inset-0 z-50 flex lg:hidden bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="h-full w-[min(20rem,calc(100vw-1rem))] bg-background pt-[env(safe-area-inset-top)]">
            <div className="flex items-center justify-between px-3.5 h-14 border-b border-zinc-200 dark:border-zinc-800">
              <div className="flex items-center gap-2.5">
                <div className="grid w-7 h-7 place-items-center rounded-md bg-primary text-white font-mono text-xs font-bold">
                  序栈
                </div>
                <span className="font-bold text-sm">CMS 控制台</span>
              </div>
              <Button
                size="sm"
                variant="ghost"
                isIconOnly
                aria-label="关闭侧边导航"
                onClick={() => setMobileOpen(false)}
              >
                <X className="w-4 h-4" />
              </Button>
            </div>
            <div className="flex-1 overflow-y-auto">
              <SidebarNav
                pathname={pathname}
                collapsed={false}
                onNavigate={handleNavigate}
              />
            </div>
          </div>
        </div>
      )}

      {/* 主工作区面板 */}
      <div className="flex-1 flex flex-col min-w-0 h-dvh overflow-hidden">
        <header className="min-h-14 px-3 sm:px-4 flex items-center justify-between border-b border-divider bg-background/95 shrink-0 z-10 pt-[env(safe-area-inset-top)]">
          <div className="flex items-center gap-2">
            {/* 桌面端侧栏折叠按钮 */}
            <Button
              variant="ghost"
              size="sm"
              aria-label={sidebarCollapsed ? '展开侧边栏' : '收起侧边栏'}
              className="hidden min-h-11 min-w-11 lg:flex"
              onClick={() => setSidebarCollapsed((v) => !v)}
            >
              {sidebarCollapsed ? (
                <PanelLeft className="w-4 h-4" />
              ) : (
                <PanelLeftClose className="w-4 h-4" />
              )}
            </Button>

            {/* 移动端菜单唤起按钮 */}
            <Button
              variant="ghost"
              size="sm"
              aria-label="打开侧边导航"
              className="min-h-11 min-w-11 lg:hidden"
              onClick={() => setMobileOpen(true)}
            >
              <MenuIcon className="w-5 h-5" />
            </Button>
          </div>

          <AdminUserDropdown onLogout={logout} onLogoutAll={logoutAll} />
        </header>

        <main className="flex-1 overflow-y-auto bg-background p-3 pb-[max(1.5rem,env(safe-area-inset-bottom))] sm:p-4 lg:p-6">
          <div className="mx-auto w-full max-w-[1440px]">{children}</div>
        </main>
      </div>
    </div>
  )
}
