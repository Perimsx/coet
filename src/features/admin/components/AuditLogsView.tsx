'use client'

import { useCallback, useEffect, useState } from 'react'
import {
  Button,
  Card,
  CardBody,
  Chip,
} from '@/components/ui/heroui-helpers'
import {
  RefreshCw,
  Shield,
  UserCheck,
  Database,
  GitBranch,
  Sliders,
  CheckCircle2,
  XCircle,
  Clock3,
} from 'lucide-react'
import { cmsApi } from '@/features/admin/lib/api'
import type { AuditLog } from '@/features/admin/lib/types'
import { toast } from '@/shared/hooks/use-toast'
import { useAdminHeader } from './AdminShell'

function getActionStyle(action: string) {
  if (action.startsWith('auth.')) {
    return {
      icon: UserCheck,
      className: 'text-blue-600 dark:text-blue-400',
    }
  }
  if (action.includes('backup')) {
    return {
      icon: Database,
      className: 'text-purple-600 dark:text-purple-400',
    }
  }
  if (action.includes('git')) {
    return {
      icon: GitBranch,
      className: 'text-amber-600 dark:text-amber-400',
    }
  }
  if (action.startsWith('site.')) {
    return {
      icon: Sliders,
      className: 'text-emerald-600 dark:text-emerald-400',
    }
  }
  return {
    icon: Shield,
    className: 'text-blue-500',
  }
}

export function AuditLogsView() {
  const [items, setItems] = useState<AuditLog[]>([])
  const [loading, setLoading] = useState(true)
  const { setHeaderContent } = useAdminHeader()

  const load = useCallback(async () => {
    setLoading(true)
    try {
      setItems((await cmsApi.auditLogs()).items)
    } catch {
      toast.error('操作日志加载失败')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void load()
  }, [load])

  useEffect(() => {
    setHeaderContent({
      actions: (
        <Button
          variant="ghost"
          size="xs"
          onClick={load}
          className="h-8 shadow-2xs"
        >
          <RefreshCw className={`w-3.5 h-3.5 mr-1 ${loading ? 'animate-spin' : ''}`} />
          <span>刷新日志</span>
        </Button>
      ),
    })
    return () => setHeaderContent({})
  }, [loading, load, setHeaderContent])

  return (
    <div className="flex flex-col gap-3 text-xs">
      <Card className="border border-zinc-200/80 dark:border-zinc-800/80 bg-white dark:bg-zinc-900 rounded-xl shadow-2xs">
        <CardBody className="p-3">
          <div className="overflow-x-auto scrollbar-none">
            <table className="w-full text-left text-xs min-w-[640px]">
              <thead>
                <tr className="border-b border-zinc-100 dark:border-zinc-800/60 text-zinc-500 pb-2">
                  <th className="pb-2.5 px-3 font-semibold">操作动作</th>
                  <th className="pb-2.5 px-3 font-semibold">目标资源</th>
                  <th className="pb-2.5 px-3 font-semibold">审计结果</th>
                  <th className="pb-2.5 px-3 font-semibold">详情描述</th>
                  <th className="pb-2.5 px-3 font-semibold">发生时间</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800/60">
                {loading ? (
                  <tr>
                    <td colSpan={5} className="py-12 text-center text-xs text-zinc-400">
                      正在加载日志...
                    </td>
                  </tr>
                ) : items.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="py-12 text-center text-xs text-zinc-400">
                      暂无审计日志记录
                    </td>
                  </tr>
                ) : (
                  items.map((item) => {
                    const style = getActionStyle(item.action)
                    const IconComponent = style.icon
                    const isSuccess = item.status === 'success'
                    const isPending = item.status === 'accepted'

                    return (
                      <tr
                        key={item.id}
                        className="hover:bg-zinc-50/60 dark:hover:bg-zinc-800/40 transition-colors"
                      >
                        <td className="py-3 px-3">
                          <div className="flex items-center gap-2">
                            <IconComponent className={`w-3.5 h-3.5 ${style.className} shrink-0`} />
                            <span className={`font-mono font-bold text-xs ${style.className}`}>
                              {item.action}
                            </span>
                          </div>
                        </td>
                        <td className="py-3 px-3 font-mono text-[11px]">
                          <span className="bg-zinc-100 dark:bg-zinc-800/60 px-1.5 py-0.5 rounded text-zinc-800 dark:text-zinc-200">
                            {item.targetType}
                          </span>
                          <span className="text-zinc-400 mx-1">/</span>
                          <span className="text-zinc-500 truncate max-w-xs inline-block align-bottom">
                            {item.targetId || 'N/A'}
                          </span>
                        </td>
                        <td className="py-3 px-3">
                          {isSuccess ? (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-bold bg-emerald-50 text-emerald-600 border border-emerald-200/60 dark:bg-emerald-950/50 dark:text-emerald-400 dark:border-emerald-800/40">
                              <CheckCircle2 className="w-3 h-3 shrink-0" />
                              <span>成功</span>
                            </span>
                          ) : isPending ? (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-bold bg-amber-50 text-amber-600 border border-amber-200/60 dark:bg-amber-950/50 dark:text-amber-400 dark:border-amber-800/40">
                              <Clock3 className="w-3 h-3 shrink-0" />
                              <span>处理中</span>
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-bold bg-rose-50 text-rose-600 border border-rose-200/60 dark:bg-rose-950/50 dark:text-rose-400 dark:border-rose-800/40">
                              <XCircle className="w-3 h-3 shrink-0" />
                              <span>失败</span>
                            </span>
                          )}
                        </td>
                        <td
                          className="py-3 px-3 text-xs text-zinc-500 max-w-sm whitespace-pre-wrap break-words"
                          title={item.details || undefined}
                        >
                          {item.details || (isPending ? '任务执行中，等待最终结果' : '—')}
                        </td>
                        <td className="py-3 px-3 text-xs font-mono text-zinc-400 whitespace-nowrap">
                          {new Date(item.createdAt).toLocaleString('zh-CN')}
                        </td>
                      </tr>
                    )
                  })
                )}
              </tbody>
            </table>
          </div>
        </CardBody>
      </Card>
    </div>
  )
}
