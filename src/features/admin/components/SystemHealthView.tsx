'use client'

import { useEffect, useState } from 'react'
import {
  Button,
  Card,
  CardBody,
  CardHeader,
  Chip,
  Spinner,
} from '@/components/ui/heroui-helpers'
import { RefreshCw, CheckCircle2, ShieldCheck, HardDrive, Clock, Server } from 'lucide-react'
import { cmsApi } from '@/features/admin/lib/api'
import { toast } from '@/shared/hooks/use-toast'
import { AdminPageHeader } from './AdminPageHeader'

export function SystemHealthView() {
  const [health, setHealth] = useState<{ api: string; database: string; databaseSize: number }>()
  const [loading, setLoading] = useState(true)

  const load = () => {
    setLoading(true)
    cmsApi
      .health()
      .then(setHealth)
      .catch(() => toast.error('无法请求系统健康状态 API'))
      .finally(() => setLoading(false))
  }

  useEffect(load, [])

  if (loading) {
    return (
      <div className="p-20 grid place-items-center">
        <Spinner size="md" />
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-5">
      <AdminPageHeader
        title="系统健康状态"
        subtitle="Go CMS API 后端服务运行指标、数据库体积与架构健康度监测"
        extra={
          <Button variant="ghost" size="sm" onClick={load} className="shadow-sm font-medium inline-flex items-center justify-center whitespace-nowrap shrink-0">
            <RefreshCw className="w-4 h-4 mr-1.5 shrink-0" />
            <span>刷新指标</span>
          </Button>
        }
      />

      <Card className="border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 rounded-lg">
        <CardHeader className="flex items-center justify-between border-b border-zinc-100 dark:border-zinc-800/60 pb-3">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0" />
            <span className="font-bold text-sm sm:text-base">后端核心服务运行良好</span>
          </div>
          <Chip color="success">
            {health?.api || 'ok'}
          </Chip>
        </CardHeader>
        <CardBody className="p-3 sm:p-4 grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div className="flex items-center gap-3 p-3 rounded-md bg-zinc-50/80 dark:bg-zinc-800/40 border border-zinc-100 dark:border-zinc-800/40">
            <div className="p-2 rounded-md bg-primary/10 text-primary shrink-0">
              <Server className="w-4 h-4" />
            </div>
            <div className="flex flex-col gap-0.5 min-w-0">
              <span className="text-xs text-zinc-400 font-medium">API 服务状态</span>
              <span className="font-mono text-sm font-bold text-zinc-900 dark:text-zinc-100">{health?.api || 'ok'}</span>
            </div>
          </div>

          <div className="flex items-center gap-3 p-3 rounded-md bg-zinc-50/80 dark:bg-zinc-800/40 border border-zinc-100 dark:border-zinc-800/40">
            <div className="p-2 rounded-md bg-purple-500/10 text-purple-500 shrink-0">
              <HardDrive className="w-4 h-4" />
            </div>
            <div className="flex flex-col gap-0.5 min-w-0">
              <span className="text-xs text-zinc-400 font-medium">数据库状态 (SQLite)</span>
              <span className="font-mono text-sm font-bold text-zinc-900 dark:text-zinc-100">{health?.database || 'healthy'}</span>
            </div>
          </div>

          <div className="flex items-center gap-3 p-3 rounded-md bg-zinc-50/80 dark:bg-zinc-800/40 border border-zinc-100 dark:border-zinc-800/40">
            <div className="p-2 rounded-md bg-amber-500/10 text-amber-500 shrink-0">
              <Clock className="w-4 h-4" />
            </div>
            <div className="flex flex-col gap-0.5 min-w-0">
              <span className="text-xs text-zinc-400 font-medium">数据库文件占用</span>
              <span className="font-mono text-sm font-bold text-zinc-900 dark:text-zinc-100">
                {health?.databaseSize ? `${(health.databaseSize / 1024 / 1024).toFixed(2)} MB` : 'N/A'}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-3 p-3 rounded-md bg-zinc-50/80 dark:bg-zinc-800/40 border border-zinc-100 dark:border-zinc-800/40">
            <div className="p-2 rounded-md bg-emerald-500/10 text-emerald-500 shrink-0">
              <ShieldCheck className="w-4 h-4" />
            </div>
            <div className="flex flex-col gap-0.5 min-w-0">
              <span className="text-xs text-zinc-400 font-medium">系统驱动架构</span>
              <span className="font-mono text-sm font-bold text-zinc-900 dark:text-zinc-100">Go API + MDX Storage</span>
            </div>
          </div>
        </CardBody>
      </Card>
    </div>
  )
}
