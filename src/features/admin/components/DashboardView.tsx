'use client'

import { useEffect, useState } from 'react'
import {
  Button,
  Card,
  CardBody,
  CardHeader,
  Skeleton,
} from '@/components/ui/heroui-helpers'
import { BookOpen, FileText, FolderTree, Tag as TagIcon, Sparkles, AlertCircle, MessageSquare, Users, PenTool, Settings, Activity, ArrowRight } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { cmsApi } from '@/features/admin/lib/api'
import type { DashboardSummary } from '@/features/admin/lib/types'
import { AdminPageHeader } from './AdminPageHeader'

export function DashboardView() {
  const router = useRouter()
  const [summary, setSummary] = useState<DashboardSummary>()
  const [error, setError] = useState('')

  const load = () => {
    setError('')
    cmsApi
      .summary()
      .then(setSummary)
      .catch(() => setError('无法加载仪表盘数据，请确认后端 CMS API 服务已启动。'))
  }

  useEffect(load, [])

  const cards = [
    { label: '已发布文章', value: summary?.publishedPosts, icon: <BookOpen className="w-5 h-5 text-primary" />, color: 'from-blue-500/10 to-indigo-500/5' },
    { label: '草稿文章', value: summary?.draftPosts, icon: <FileText className="w-5 h-5 text-amber-500" />, color: 'from-amber-500/10 to-orange-500/5' },
    { label: '分类数量', value: summary?.categories, icon: <FolderTree className="w-5 h-5 text-emerald-500" />, color: 'from-emerald-500/10 to-teal-500/5' },
    { label: '标签总数', value: summary?.tags, icon: <TagIcon className="w-5 h-5 text-purple-500" />, color: 'from-purple-500/10 to-pink-500/5' },
  ]

  const quickActions = [
    { label: '撰写新文章', icon: PenTool, href: '/admin/content/posts?create=true', color: 'text-primary' },
    { label: '评论审核', icon: MessageSquare, href: '/admin/engagement/comments', color: 'text-amber-500' },
    { label: '站点设置', icon: Settings, href: '/admin/site/settings', color: 'text-emerald-500' },
    { label: '系统状态', icon: Activity, href: '/admin/system/health', color: 'text-purple-500' },
  ]

  return (
    <div className="flex flex-col gap-6">
      <AdminPageHeader
        title="控制台仪表盘"
        subtitle="内容发布、全站数据统计与离线存储架构概览"
        extra={
          <Button size="sm" onClick={() => router.push('/admin/content/posts')} className="shadow-sm font-medium">
            <PenTool className="w-4 h-4 mr-1.5" />
            文章管理
          </Button>
        }
      />

      {error && (
        <div className="p-4 rounded-2xl bg-danger-50 dark:bg-danger-950/40 text-danger border border-danger-200 dark:border-danger-900 text-xs flex items-center gap-2.5">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* 4 维统计指标卡片 Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {cards.map((card) => (
          <Card key={card.label} className="border border-zinc-200/80 dark:border-zinc-800/80 bg-white dark:bg-zinc-900 shadow-sm rounded-2xl overflow-hidden hover:border-zinc-300 dark:hover:border-zinc-700 transition-all">
            <CardBody className="p-4 flex items-center justify-between">
              <div className="flex flex-col gap-1">
                <span className="text-xs font-semibold text-zinc-500 dark:text-zinc-400">{card.label}</span>
                {summary ? (
                  <span className="text-2xl sm:text-3xl font-bold font-mono tracking-tight text-zinc-900 dark:text-zinc-100">
                    {card.value ?? 0}
                  </span>
                ) : (
                  <Skeleton className="h-8 w-16 rounded-xl" />
                )}
              </div>
              <div className="p-3 rounded-2xl bg-zinc-100 dark:bg-zinc-800/80 shrink-0">{card.icon}</div>
            </CardBody>
          </Card>
        ))}
      </div>

      {/* 快捷操作区 */}
      <div className="flex flex-col gap-3">
        <h3 className="text-xs font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">快捷管理通道</h3>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {quickActions.map((action) => {
            const Icon = action.icon
            return (
              <button
                key={action.label}
                onClick={() => router.push(action.href)}
                className="flex items-center justify-between p-3.5 rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 hover:bg-zinc-50 dark:hover:bg-zinc-800/50 transition-all active:scale-[0.98] group shadow-sm"
              >
                <div className="flex items-center gap-2.5">
                  <Icon className={`w-4 h-4 ${action.color}`} />
                  <span className="text-xs font-semibold text-zinc-800 dark:text-zinc-200">{action.label}</span>
                </div>
                <ArrowRight className="w-3.5 h-3.5 text-zinc-400 group-hover:translate-x-0.5 transition-transform" />
              </button>
            )
          })}
        </div>
      </div>

      {/* 底部 架构与流程 */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        <Card className="lg:col-span-7 border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-sm rounded-2xl">
          <CardHeader className="flex items-center gap-2 font-bold text-sm border-b border-zinc-100 dark:border-zinc-800/60 pb-3">
            <Sparkles className="w-4 h-4 text-primary" />
            <span>离线文件与交互存储</span>
          </CardHeader>
          <CardBody className="p-4 text-xs text-zinc-600 dark:text-zinc-400 leading-relaxed space-y-2">
            <p>
              本系统采用前后台深度集成的 MDX 与 JSON 存储机制。文章、分类、标签与全站设置统一沉淀为可版本的 Git 离线文件。
            </p>
            <p className="text-zinc-500">
              评论与管理员审计日志持久化于轻量级本地 SQLite 中，兼顾了无缝的离线编辑体验与强大的动态交互能力。
            </p>
          </CardBody>
        </Card>

        <Card className="lg:col-span-5 border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-sm rounded-2xl">
          <CardHeader className="font-bold text-sm border-b border-zinc-100 dark:border-zinc-800/60 pb-3">标准发布流程</CardHeader>
          <CardBody className="p-4 flex flex-col gap-2.5 text-xs text-zinc-600 dark:text-zinc-400">
            <div className="flex items-start gap-2">
              <span className="grid w-5 h-5 place-items-center rounded-full bg-primary/10 text-primary font-mono text-[10px] font-bold shrink-0">1</span>
              <span>撰写 MDX 正文，支持代码高亮与自定义标签</span>
            </div>
            <div className="flex items-start gap-2">
              <span className="grid w-5 h-5 place-items-center rounded-full bg-primary/10 text-primary font-mono text-[10px] font-bold shrink-0">2</span>
              <span>在编辑器中进行实时双栏渲染与格式校验</span>
            </div>
            <div className="flex items-start gap-2">
              <span className="grid w-5 h-5 place-items-center rounded-full bg-primary/10 text-primary font-mono text-[10px] font-bold shrink-0">3</span>
              <span>发布文章，自动更新数据盘与前台缓存</span>
            </div>
          </CardBody>
        </Card>
      </div>
    </div>
  )
}
