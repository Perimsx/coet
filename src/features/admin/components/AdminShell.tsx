'use client'

import React, { useEffect, useState, useMemo } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import { Button, Spinner } from '@/components/ui/heroui-helpers'
import { Dropdown } from '@heroui/react'
import {
  LayoutDashboard,
  BookOpen,
  Settings,
  MessageSquare,
  Activity,
  LogOut,
  ChevronRight,
  User,
  ShieldCheck,
  PanelLeftClose,
  PanelLeft,
  RefreshCw,
  Tag,
  FolderTree,
  HelpCircle,
  HardDrive,
  Globe,
  Tags,
  Share2,
  GitBranch,
  ExternalLink,
} from 'lucide-react'
import { cmsApi, CMSApiError, setCSRFToken } from '@/features/admin/lib/api'
import { toast } from '@/shared/hooks/use-toast'

type MenuItem = {
  key: string
  label: string
  icon: React.ReactNode
  badge?: number | string
}

type MenuGroup = {
  groupName: string
  items: MenuItem[]
}

const menuGroups: MenuGroup[] = [
  {
    groupName: '核心视图',
    items: [
      { key: '/admin', label: '控制台概览', icon: <LayoutDashboard className="w-4 h-4" /> },
    ],
  },
  {
    groupName: '内容管理',
    items: [
      { key: '/admin/posts', label: '全站文章', icon: <BookOpen className="w-4 h-4" /> },
      { key: '/admin/taxonomies/categories', label: '分类目录', icon: <FolderTree className="w-4 h-4" /> },
      { key: '/admin/taxonomies/tags', label: '标签索引', icon: <Tags className="w-4 h-4" /> },
    ],
  },
  {
    groupName: '互动与站点',
    items: [
      { key: '/admin/comments', label: '评论审核', icon: <MessageSquare className="w-4 h-4" /> },
      { key: '/admin/feedback', label: '留言建议', icon: <MessageSquare className="w-4 h-4" /> },
      { key: '/admin/site/settings', label: '站点配置', icon: <Settings className="w-4 h-4" /> },
      { key: '/admin/seo', label: 'SEO 推送', icon: <Share2 className="w-4 h-4" /> },
    ],
  },
  {
    groupName: '系统运维',
    items: [
      { key: '/admin/system/health', label: '系统状态', icon: <Activity className="w-4 h-4" /> },
      { key: '/admin/system/git', label: '代码更新', icon: <GitBranch className="w-4 h-4" /> },
      { key: '/admin/system/backups', label: '快照备份', icon: <HardDrive className="w-4 h-4" /> },
      { key: '/admin/system/logs', label: '安全日志', icon: <ShieldCheck className="w-4 h-4" /> },
    ],
  },
]

function AdminUserDropdown({
  onLogout,
  onLogoutAll,
}: {
  onLogout: () => void
  onLogoutAll: () => void
}) {
  return (
    <Dropdown>
      <button
        type="button"
        className="w-full flex items-center justify-between px-2 py-1.5 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800/60 transition-colors cursor-pointer group"
      >
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="w-6 h-6 rounded-full bg-blue-600/10 text-blue-600 dark:text-blue-400 font-bold text-[11px] grid place-items-center shrink-0 border border-blue-500/20">
            A
          </div>
          <div className="flex flex-col text-left min-w-0">
            <span className="font-semibold text-xs text-zinc-800 dark:text-zinc-200 truncate">
              管理员
            </span>
            <span className="text-[10px] text-zinc-400 font-mono truncate">
              Super Admin
            </span>
          </div>
        </div>
        <LogOut className="w-3.5 h-3.5 text-zinc-400 group-hover:text-rose-500 transition-colors shrink-0" />
      </button>
      <Dropdown.Popover className="z-[99] min-w-[160px] overflow-hidden rounded-xl border border-zinc-200/60 dark:border-zinc-800/60 bg-white/95 dark:bg-zinc-900/95 p-1.5 text-zinc-900 dark:text-zinc-100 shadow-xl backdrop-blur-md">
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
            className="flex flex-row items-center gap-2 px-2.5 py-1.5 text-xs rounded-lg cursor-pointer hover:bg-zinc-100 dark:hover:bg-zinc-800/80 transition-colors font-medium"
          >
            <LogOut className="w-3.5 h-3.5 text-zinc-500 shrink-0" />
            <span className="whitespace-nowrap">退出登录</span>
          </Dropdown.Item>
          <Dropdown.Item
            id="logout-all"
            textValue="注销全部会话"
            variant="danger"
            className="flex flex-row items-center gap-2 px-2.5 py-1.5 text-xs rounded-lg cursor-pointer hover:bg-rose-50 text-rose-600 dark:hover:bg-rose-950/40 transition-colors font-medium"
          >
            <ShieldCheck className="w-3.5 h-3.5 text-rose-500 shrink-0" />
            <span className="whitespace-nowrap">注销全部会话</span>
          </Dropdown.Item>
        </Dropdown.Menu>
      </Dropdown.Popover>
    </Dropdown>
  )
}

let cachedCSRFTokenVerified = false

interface AdminHeaderContent {
  titleExtra?: React.ReactNode
  actions?: React.ReactNode
}

interface AdminHeaderContextType {
  setHeaderContent: React.Dispatch<React.SetStateAction<AdminHeaderContent>>
}

export const AdminHeaderContext = React.createContext<AdminHeaderContextType>({
  setHeaderContent: () => {},
})

export function useAdminHeader() {
  return React.useContext(AdminHeaderContext)
}

export function AdminShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const router = useRouter()
  const [checking, setChecking] = useState(!cachedCSRFTokenVerified)
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
  const [headerContent, setHeaderContent] = useState<AdminHeaderContent>({})

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

  // 寻找当前面页面对应的标题路径
  const currentPageItem = menuGroups
    .flatMap((g) => g.items)
    .find((item) => pathname === item.key || pathname.startsWith(`${item.key}/`))

  const contextValue = useMemo(() => ({ setHeaderContent }), [])

  return (
    <AdminHeaderContext.Provider value={contextValue}>
      <div className="xuzhan-admin-shell flex h-dvh overflow-hidden bg-zinc-50 dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100 font-sans">
        {/* 极简通透单列 Sidebar (180px) */}
        <aside
          className={`flex flex-col justify-between border-r border-zinc-200/60 dark:border-zinc-800/60 bg-white/90 dark:bg-zinc-900/90 backdrop-blur-md shrink-0 overflow-hidden transition-all duration-300 ${
            sidebarCollapsed ? 'w-12' : 'w-48'
          }`}
        >
          {/* 顶部 Logo 标识 */}
          <div className="flex flex-col">
            <div className="px-3.5 h-11 flex items-center justify-between border-b border-zinc-100 dark:border-zinc-800/60 shrink-0">
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="w-6 h-6 rounded-lg bg-blue-600 text-white font-mono text-xs font-bold grid place-items-center shrink-0 shadow-xs">
                  序
                </div>
                {!sidebarCollapsed && (
                  <span className="font-extrabold text-xs tracking-tight text-zinc-900 dark:text-zinc-100 truncate">
                    序栈 CMS
                  </span>
                )}
              </div>
              <button
                type="button"
                onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
                className="p-1 rounded text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
                title={sidebarCollapsed ? '展开菜单' : '收起菜单'}
              >
                {sidebarCollapsed ? (
                  <PanelLeft className="w-3.5 h-3.5" />
                ) : (
                  <PanelLeftClose className="w-3.5 h-3.5" />
                )}
              </button>
            </div>

            {/* 单列菜单组 */}
            <div className="p-2 flex flex-col gap-3 overflow-y-auto max-h-[calc(100dvh-115px)]">
              {menuGroups.map((group) => (
                <div key={group.groupName} className="flex flex-col gap-1">
                  {!sidebarCollapsed && (
                    <span className="px-2 text-[10px] font-bold text-zinc-400 uppercase tracking-widest">
                      {group.groupName}
                    </span>
                  )}
                  {group.items.map((item) => {
                    const active = pathname === item.key || pathname.startsWith(`${item.key}/`)
                    return (
                      <button
                        key={item.key}
                        type="button"
                        onClick={() => handleNavigate(item.key)}
                        title={sidebarCollapsed ? item.label : undefined}
                        className={`relative w-full flex items-center ${
                          sidebarCollapsed ? 'justify-center p-2' : 'justify-between pl-3 pr-2 py-1.5'
                        } rounded-md text-xs transition-all duration-150 cursor-pointer outline-none focus:outline-none focus-visible:outline-none border-0 ${
                          active
                            ? 'text-blue-600 dark:text-blue-400 font-bold bg-blue-50/40 dark:bg-blue-950/20'
                            : 'text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100/70 dark:hover:bg-zinc-800/40 hover:text-zinc-900 dark:hover:text-zinc-100'
                        }`}
                      >
                        {active && (
                          <span className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-4 bg-blue-600 dark:bg-blue-400 rounded-r-full" />
                        )}
                        <div className="flex items-center gap-2.5 min-w-0">
                          <span className={`shrink-0 ${active ? 'text-blue-600 dark:text-blue-400 font-bold' : ''}`}>
                            {item.icon}
                          </span>
                          {!sidebarCollapsed && <span className="truncate">{item.label}</span>}
                        </div>
                        {!sidebarCollapsed && item.badge && (
                          <span className="px-1.5 py-0.2 rounded bg-rose-500/20 text-rose-600 dark:text-rose-400 text-[9px] font-bold">
                            {item.badge}
                          </span>
                        )}
                      </button>
                    )
                  })}
                </div>
              ))}
            </div>
          </div>

          {/* 底部管理员 Dropdown */}
          {!sidebarCollapsed && (
            <div className="p-2 border-t border-zinc-100 dark:border-zinc-800/60">
              <AdminUserDropdown onLogout={logout} onLogoutAll={logoutAll} />
            </div>
          )}
        </aside>

        {/* 主工作区面板 */}
        <div className="flex-1 flex flex-col min-w-0 h-dvh overflow-hidden">
          {/* 清爽顶级 Header 面包屑与动态嵌入动作栏 */}
          <header className="h-12 px-4 flex items-center justify-between gap-3 border-b border-zinc-200/60 dark:border-zinc-800/60 bg-white/90 dark:bg-zinc-900/90 backdrop-blur-md shrink-0 z-10">
            <div className="flex items-center gap-2 text-xs shrink-0 py-1">
              <span className="text-zinc-400">后台</span>
              <span className="text-zinc-300 dark:text-zinc-700">/</span>
              <span className="font-bold text-zinc-900 dark:text-zinc-100">
                {currentPageItem?.label || '控制台概览'}
              </span>
              {headerContent.titleExtra}
            </div>

            <div className="flex flex-1 items-center justify-end gap-2 min-w-0 h-full py-1">
              {headerContent.actions}
              <div className="h-4 w-px bg-zinc-200 dark:bg-zinc-800 mx-0.5 shrink-0 hidden sm:block" />
              <div className="flex items-center gap-1 shrink-0">
                <button
                  type="button"
                  onClick={() => router.refresh()}
                  className="p-1.5 text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
                  title="刷新页面"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                </button>
                <button
                  type="button"
                  onClick={() => window.open('/', '_blank')}
                  className="p-1.5 text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
                  title="预览博客前台"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </header>

          {/* 主内容区 */}
          <main className="flex-1 overflow-y-auto bg-zinc-50/50 dark:bg-zinc-950 p-3.5">
            {checking ? (
              <div className="grid h-full place-items-center">
                <Spinner size="md" />
              </div>
            ) : (
              <div className="mx-auto w-full max-w-[1440px]">{children}</div>
            )}
          </main>
        </div>
      </div>
    </AdminHeaderContext.Provider>
  )
}

