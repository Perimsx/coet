'use client'

import { useCallback, useEffect, useState } from 'react'
import {
  Button,
  Card,
  CardBody,
  Chip,
} from '@/components/ui/heroui-helpers'
import { RefreshCw, Shield } from 'lucide-react'
import { cmsApi } from '@/features/admin/lib/api'
import type { AuditLog } from '@/features/admin/lib/types'
import { toast } from '@/shared/hooks/use-toast'
import { AdminPageHeader } from './AdminPageHeader'

export function AuditLogsView() {
  const [items, setItems] = useState<AuditLog[]>([])
  const [loading, setLoading] = useState(true)

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

  return (
    <div className="flex flex-col gap-5">
      <AdminPageHeader
        title="系统操作日志"
        subtitle="全量记录管理员登录、存储改动、文章发布、删除与版本更新等安全审计日志"
        extra={
          <Button variant="ghost" size="sm" onClick={load}>
            <RefreshCw className="w-4 h-4 mr-1.5 shrink-0" />
            <span>刷新日志</span>
          </Button>
        }
      />

      <Card className="border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 rounded-lg">
        <CardBody className="p-3">
          <div className="overflow-x-auto scrollbar-none">
            <table className="w-full text-left text-sm min-w-[620px]">
              <thead>
                <tr className="border-b border-zinc-200 dark:border-zinc-800 text-zinc-500 pb-2">
                  <th className="pb-3 font-semibold text-xs">操作动作</th>
                  <th className="pb-3 font-semibold text-xs">目标资源</th>
                  <th className="pb-3 font-semibold text-xs">审计结果</th>
                  <th className="pb-3 font-semibold text-xs">详情描述</th>
                  <th className="pb-3 font-semibold text-xs">发生时间</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800/60">
                {loading ? (
                  <tr>
                    <td colSpan={5} className="py-8 text-center text-xs text-zinc-400">
                      正在加载日志...
                    </td>
                  </tr>
                ) : items.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="py-8 text-center text-xs text-zinc-400">
                      暂无审计日志记录
                    </td>
                  </tr>
                ) : (
                  items.map((item) => (
                    <tr key={item.id} className="hover:bg-zinc-50/50 dark:hover:bg-zinc-800/30 transition-colors">
                      <td className="py-3">
                        <div className="flex items-center gap-2">
                          <Shield className="w-3.5 h-3.5 text-primary shrink-0" />
                          <span className="font-mono font-semibold text-xs text-primary">{item.action}</span>
                        </div>
                      </td>
                      <td className="py-3 text-xs font-mono text-zinc-600 dark:text-zinc-300">
                        {item.targetType} / {item.targetId || 'N/A'}
                      </td>
                      <td className="py-3">
                        <Chip size="sm" color={item.status === 'success' ? 'success' : 'danger'}>
                          {item.status === 'success' ? '成功' : '失败'}
                        </Chip>
                      </td>
                      <td className="py-3 text-xs text-zinc-500 max-w-xs truncate">{item.details || '—'}</td>
                      <td className="py-3 text-xs font-mono text-zinc-400">
                        {new Date(item.createdAt).toLocaleString('zh-CN')}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </CardBody>
      </Card>
    </div>
  )
}
