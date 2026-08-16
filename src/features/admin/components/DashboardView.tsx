'use client'

import { useCallback, useEffect, useState } from 'react'
import {
  Button,
  Card,
  Chip,
  Skeleton,
} from '@/components/ui/heroui-helpers'
import {
  BookOpen,
  FileText,
  FolderTree,
  Tag as TagIcon,
  MessageSquare,
  PenTool,
  Activity,
  ArrowRight,
  Database,
  ShieldCheck,
  RefreshCw,
  Plus,
  Cpu,
} from 'lucide-react'
import { useRouter } from 'next/navigation'
import { cmsApi } from '@/features/admin/lib/api'
import type {
  AuditLog,
  Comment,
  DashboardSummary,
  GitStatus,
  Post,
} from '@/features/admin/lib/types'

export function DashboardView() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [summary, setSummary] = useState<DashboardSummary>()
  const [recentPosts, setRecentPosts] = useState<Post[]>([])
  const [recentComments, setRecentComments] = useState<Comment[]>([])
  const [recentLogs, setRecentLogs] = useState<AuditLog[]>([])
  const [health, setHealth] = useState<{ api: string; database: string; databaseSize: number }>()
  const [gitStatus, setGitStatus] = useState<GitStatus>()

  const loadAllData = useCallback(async () => {
    setLoading(true)
    try {
      const [summaryRes, postsRes, commentsRes, logsRes, healthRes, gitRes] =
        await Promise.all([
          cmsApi.summary().catch(() => undefined),
          cmsApi.posts('?page=1&pageSize=6').catch(() => ({ items: [], total: 0, page: 1, pageSize: 6 })),
          cmsApi.comments().catch(() => ({ items: [], total: 0, page: 1, pageSize: 3 })),
          cmsApi.auditLogs().catch(() => ({ items: [], total: 0 })),
          cmsApi.health().catch(() => undefined),
          cmsApi.gitStatus().catch(() => undefined),
        ])

      setSummary(summaryRes)
      setRecentPosts(postsRes.items)
      setRecentComments(commentsRes.items)
      setRecentLogs(logsRes.items.slice(0, 4))
      setHealth(healthRes)
      setGitStatus(gitRes)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    let ignore = false
    async function fetchData() {
      try {
        const [summaryRes, postsRes, commentsRes, logsRes, healthRes, gitRes] =
          await Promise.all([
            cmsApi.summary().catch(() => undefined),
            cmsApi.posts('?page=1&pageSize=6').catch(() => ({ items: [], total: 0, page: 1, pageSize: 6 })),
            cmsApi.comments().catch(() => ({ items: [], total: 0, page: 1, pageSize: 3 })),
            cmsApi.auditLogs().catch(() => ({ items: [], total: 0 })),
            cmsApi.health().catch(() => undefined),
            cmsApi.gitStatus().catch(() => undefined),
          ])

        if (ignore) return
        setSummary(summaryRes)
        setRecentPosts(postsRes.items)
        setRecentComments(commentsRes.items)
        setRecentLogs(logsRes.items.slice(0, 4))
        setHealth(healthRes)
        setGitStatus(gitRes)
      } finally {
        if (!ignore) setLoading(false)
      }
    }

    void fetchData()
    return () => {
      ignore = true
    }
  }, [])

  const publishedCount = summary?.publishedPosts ?? 0
  const draftCount = summary?.draftPosts ?? 0
  const totalPosts = publishedCount + draftCount
  const publishRatio = totalPosts ? Math.round((publishedCount / totalPosts) * 100) : 100
  const dbSizeMb = health?.databaseSize ? (health.databaseSize / 1024 / 1024).toFixed(2) : '0'

  return (
    <div className="flex flex-col gap-3 text-xs">
      {/* 1. 顶级像素级状态控制 Bar */}
      <div className="p-3 rounded-xl border border-zinc-200/60 dark:border-zinc-800/60 bg-white/90 dark:bg-zinc-900/90 backdrop-blur-md flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-2xs">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-blue-500/10 dark:bg-blue-500/20 text-blue-600 dark:text-blue-400 grid place-items-center shrink-0">
            <Cpu className="w-4 h-4" />
          </div>
          <div className="flex flex-col gap-0.5">
            <div className="flex items-center gap-2">
              <span className="font-bold text-xs text-zinc-900 dark:text-zinc-100">
                序栈 CMS 控制中心
              </span>
              <span className="px-1.5 py-0.5 rounded-md bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-[10px] font-semibold border border-emerald-500/20 flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                Go Engine Healthy
              </span>
            </div>
            <div className="flex items-center gap-3 text-[11px] text-zinc-400 font-mono">
              <span>DB: {dbSizeMb} MB</span>
              <span>•</span>
              <span>Branch: {gitStatus?.branch || 'main'}</span>
              <span>•</span>
              <span>Commit: {gitStatus?.commit ? gitStatus.commit.slice(0, 7) : 'HEAD'}</span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <Button variant="ghost" size="xs" onClick={loadAllData} isDisabled={loading} className="h-7 text-[11px]">
            <RefreshCw className={`w-3 h-3 mr-1 ${loading ? 'animate-spin' : ''}`} />
            刷新
          </Button>
          <Button size="xs" variant="primary" onClick={() => router.push('/admin/content/posts/new')} className="h-7 text-[11px] font-semibold">
            <Plus className="w-3.5 h-3.5 mr-1" />
            撰写文章
          </Button>
        </div>
      </div>

      {/* 2. 4 维复合精细数据卡片矩阵 */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        {/* 卡片 1: 已发布文章 + 可视化进度条 */}
        <div className="p-3.5 rounded-xl border border-zinc-200/60 dark:border-zinc-800/60 bg-white dark:bg-zinc-900 shadow-2xs flex flex-col justify-between gap-3">
          <div className="flex items-center justify-between">
            <span className="font-semibold text-zinc-500 text-[11px] uppercase tracking-wider">
              已发布文章
            </span>
            <div className="p-1.5 rounded-md bg-blue-500/10 text-blue-600 dark:text-blue-400">
              <BookOpen className="w-3.5 h-3.5" />
            </div>
          </div>
          <div>
            <div className="flex items-baseline justify-between">
              <span className="text-2xl font-extrabold font-mono text-zinc-900 dark:text-zinc-100 tracking-tight">
                {loading ? <Skeleton className="h-7 w-12" /> : publishedCount}
              </span>
              <span className="text-[11px] font-semibold text-blue-600 dark:text-blue-400 font-mono">
                {publishRatio}% 发布率
              </span>
            </div>
            {/* 微型进度条 */}
            <div className="w-full h-1.5 bg-zinc-100 dark:bg-zinc-800 rounded-full mt-2 overflow-hidden">
              <div
                className="h-full bg-blue-500 rounded-full transition-all duration-500"
                style={{ width: `${publishRatio}%` }}
              />
            </div>
          </div>
        </div>

        {/* 卡片 2: 草稿箱 */}
        <div className="p-3.5 rounded-xl border border-zinc-200/60 dark:border-zinc-800/60 bg-white dark:bg-zinc-900 shadow-2xs flex flex-col justify-between gap-3">
          <div className="flex items-center justify-between">
            <span className="font-semibold text-zinc-500 text-[11px] uppercase tracking-wider">
              草稿箱存量
            </span>
            <div className="p-1.5 rounded-md bg-amber-500/10 text-amber-600 dark:text-amber-400">
              <FileText className="w-3.5 h-3.5" />
            </div>
          </div>
          <div>
            <div className="flex items-baseline justify-between">
              <span className="text-2xl font-extrabold font-mono text-zinc-900 dark:text-zinc-100 tracking-tight">
                {loading ? <Skeleton className="h-7 w-12" /> : draftCount}
              </span>
              <span className="text-[11px] text-amber-500 font-medium">待离线校验</span>
            </div>
            <div className="w-full h-1.5 bg-zinc-100 dark:bg-zinc-800 rounded-full mt-2 overflow-hidden">
              <div
                className="h-full bg-amber-500 rounded-full transition-all duration-500"
                style={{ width: `${totalPosts ? (draftCount / totalPosts) * 100 : 0}%` }}
              />
            </div>
          </div>
        </div>

        {/* 卡片 3: 分类目录 */}
        <div className="p-3.5 rounded-xl border border-zinc-200/60 dark:border-zinc-800/60 bg-white dark:bg-zinc-900 shadow-2xs flex flex-col justify-between gap-3">
          <div className="flex items-center justify-between">
            <span className="font-semibold text-zinc-500 text-[11px] uppercase tracking-wider">
              全站分类
            </span>
            <div className="p-1.5 rounded-md bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
              <FolderTree className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-2xl font-extrabold font-mono text-zinc-900 dark:text-zinc-100 tracking-tight">
              {loading ? <Skeleton className="h-7 w-12" /> : summary?.categories ?? 0}
            </span>
            <Button size="xs" variant="ghost" onClick={() => router.push('/admin/content/categories')} className="text-[11px] h-6 px-2">
              分类管理
            </Button>
          </div>
        </div>

        {/* 卡片 4: 标签索引 */}
        <div className="p-3.5 rounded-xl border border-zinc-200/60 dark:border-zinc-800/60 bg-white dark:bg-zinc-900 shadow-2xs flex flex-col justify-between gap-3">
          <div className="flex items-center justify-between">
            <span className="font-semibold text-zinc-500 text-[11px] uppercase tracking-wider">
              聚合标签
            </span>
            <div className="p-1.5 rounded-md bg-purple-500/10 text-purple-600 dark:text-purple-400">
              <TagIcon className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-2xl font-extrabold font-mono text-zinc-900 dark:text-zinc-100 tracking-tight">
              {loading ? <Skeleton className="h-7 w-12" /> : summary?.tags ?? 0}
            </span>
            <Button size="xs" variant="ghost" onClick={() => router.push('/admin/content/tags')} className="text-[11px] h-6 px-2">
              标签管理
            </Button>
          </div>
        </div>
      </div>

      {/* 3. 紧凑精细双栏数据区域 */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-3 items-start">
        {/* 左侧 (7/12): 最近更新文章表 + 4 按钮通道 */}
        <div className="lg:col-span-7 flex flex-col gap-3">
          <Card className="border border-zinc-200/60 dark:border-zinc-800/60 bg-white dark:bg-zinc-900 rounded-xl overflow-hidden shadow-2xs">
            <div className="px-3.5 py-2.5 border-b border-zinc-100 dark:border-zinc-800/60 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <BookOpen className="w-3.5 h-3.5 text-blue-500" />
                <span className="font-bold text-xs text-zinc-900 dark:text-zinc-100">
                  最近更新文章矩阵
                </span>
              </div>
              <Button
                variant="ghost"
                size="xs"
                onClick={() => router.push('/admin/content/posts')}
                className="text-[11px] h-6 text-zinc-500 hover:text-zinc-900"
              >
                查看全部 <ArrowRight className="w-3 h-3 ml-1" />
              </Button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-zinc-100 dark:border-zinc-800 text-zinc-400 bg-zinc-50/50 dark:bg-zinc-800/30 text-[11px]">
                    <th className="py-2 px-3.5 font-semibold">文章标题</th>
                    <th className="py-2 px-3.5 font-semibold">状态</th>
                    <th className="py-2 px-3.5 font-semibold">分类</th>
                    <th className="py-2 px-3.5 font-semibold">更新日期</th>
                    <th className="py-2 px-3.5 font-semibold text-right">操作</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800/50">
                  {loading ? (
                    <tr>
                      <td colSpan={5} className="py-6 text-center text-zinc-400 text-xs">
                        读取中...
                      </td>
                    </tr>
                  ) : recentPosts.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="py-6 text-center text-zinc-400 text-xs">
                        暂无文章
                      </td>
                    </tr>
                  ) : (
                    recentPosts.map((post) => (
                      <tr
                        key={post.id}
                        className="hover:bg-zinc-50/70 dark:hover:bg-zinc-800/40 transition-colors"
                      >
                        <td className="py-2 px-3.5">
                          <span className="font-semibold text-zinc-900 dark:text-zinc-100 line-clamp-1">
                            {post.title}
                          </span>
                        </td>
                        <td className="py-2 px-3.5">
                          <Chip
                            size="sm"
                            color={post.status === 'published' ? 'success' : 'warning'}
                          >
                            {post.status === 'published' ? '已发布' : '草稿'}
                          </Chip>
                        </td>
                        <td className="py-2 px-3.5 text-zinc-500 font-medium">
                          {post.categoryName || '未分类'}
                        </td>
                        <td className="py-2 px-3.5 font-mono text-zinc-400 text-[11px]">
                          {new Date(post.updatedAt).toLocaleDateString('zh-CN')}
                        </td>
                        <td className="py-2 px-3.5 text-right">
                          <Button
                            variant="ghost"
                            size="xs"
                            onClick={() => router.push(`/admin/content/posts/${post.id}/edit`)}
                            className="h-6 px-2 text-[11px]"
                          >
                            编辑
                          </Button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </Card>

          {/* 4 快捷入口超精细按键 */}
          <div className="grid grid-cols-4 gap-2">
            <button
              type="button"
              onClick={() => router.push('/admin/content/posts/new')}
              className="p-2.5 rounded-xl border border-zinc-200/60 dark:border-zinc-800/60 bg-white dark:bg-zinc-900 hover:bg-blue-50 dark:hover:bg-blue-950/40 transition-all flex items-center justify-center gap-1.5 text-xs font-semibold text-zinc-800 dark:text-zinc-200 group cursor-pointer shadow-2xs"
            >
              <PenTool className="w-3.5 h-3.5 text-blue-500" />
              <span>撰写文章</span>
            </button>
            <button
              type="button"
              onClick={() => router.push('/admin/engagement/comments')}
              className="p-2.5 rounded-xl border border-zinc-200/60 dark:border-zinc-800/60 bg-white dark:bg-zinc-900 hover:bg-amber-50 dark:hover:bg-amber-950/40 transition-all flex items-center justify-center gap-1.5 text-xs font-semibold text-zinc-800 dark:text-zinc-200 group cursor-pointer shadow-2xs"
            >
              <MessageSquare className="w-3.5 h-3.5 text-amber-500" />
              <span>互动审核</span>
            </button>
            <button
              type="button"
              onClick={() => router.push('/admin/site/seo')}
              className="p-2.5 rounded-xl border border-zinc-200/60 dark:border-zinc-800/60 bg-white dark:bg-zinc-900 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 transition-all flex items-center justify-center gap-1.5 text-xs font-semibold text-zinc-800 dark:text-zinc-200 group cursor-pointer shadow-2xs"
            >
              <Activity className="w-3.5 h-3.5 text-emerald-500" />
              <span>SEO 推送</span>
            </button>
            <button
              type="button"
              onClick={() => router.push('/admin/system/backups')}
              className="p-2.5 rounded-xl border border-zinc-200/60 dark:border-zinc-800/60 bg-white dark:bg-zinc-900 hover:bg-purple-50 dark:hover:bg-purple-950/40 transition-all flex items-center justify-center gap-1.5 text-xs font-semibold text-zinc-800 dark:text-zinc-200 group cursor-pointer shadow-2xs"
            >
              <Database className="w-3.5 h-3.5 text-purple-500" />
              <span>快照备份</span>
            </button>
          </div>
        </div>

        {/* 右侧 (5/12): 互动评论队列与安全审计 */}
        <div className="lg:col-span-5 flex flex-col gap-3">
          {/* 最新互动与评论队列 */}
          <Card className="border border-zinc-200/60 dark:border-zinc-800/60 bg-white dark:bg-zinc-900 rounded-xl shadow-2xs">
            <div className="px-3.5 py-2.5 border-b border-zinc-100 dark:border-zinc-800/60 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <MessageSquare className="w-3.5 h-3.5 text-amber-500" />
                <span className="font-bold text-xs text-zinc-900 dark:text-zinc-100">
                  最新互动与评论队列
                </span>
              </div>
              <Button
                variant="ghost"
                size="xs"
                onClick={() => router.push('/admin/engagement/comments')}
                className="text-[11px] h-6"
              >
                审核面板
              </Button>
            </div>
            <div className="p-3 flex flex-col gap-2 text-xs">
              {loading ? (
                <div className="py-4 text-center text-zinc-400 text-xs">读取评论...</div>
              ) : recentComments.length === 0 ? (
                <div className="py-4 text-center text-zinc-400 text-xs">暂无未处理评论</div>
              ) : (
                recentComments.map((comment) => (
                  <div
                    key={comment.id}
                    className="p-2 rounded-lg bg-zinc-50/80 dark:bg-zinc-800/40 border border-zinc-100 dark:border-zinc-800/50 flex flex-col gap-1"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-zinc-900 dark:text-zinc-100 text-[11px]">
                        {comment.authorName}
                      </span>
                      <Chip
                        size="sm"
                        color={comment.status === 'approved' ? 'success' : 'warning'}
                      >
                        {comment.status === 'approved' ? '已通过' : '待审核'}
                      </Chip>
                    </div>
                    <p className="text-zinc-500 line-clamp-1 text-[11px]">
                      {comment.content}
                    </p>
                  </div>
                ))
              )}
            </div>
          </Card>

          {/* 实时安全审计终端 */}
          <Card className="border border-zinc-200/60 dark:border-zinc-800/60 bg-white dark:bg-zinc-900 rounded-xl shadow-2xs">
            <div className="px-3.5 py-2.5 border-b border-zinc-100 dark:border-zinc-800/60 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
                <span className="font-bold text-xs text-zinc-900 dark:text-zinc-100">
                  实时安全审计动态
                </span>
              </div>
              <Button
                variant="ghost"
                size="xs"
                onClick={() => router.push('/admin/system/logs')}
                className="text-[11px] h-6"
              >
                日志
              </Button>
            </div>
            <div className="p-3 flex flex-col gap-2 text-xs">
              {loading ? (
                <div className="py-4 text-center text-zinc-400 text-xs">读取日志...</div>
              ) : recentLogs.length === 0 ? (
                <div className="py-4 text-center text-zinc-400 text-xs">暂无审计日志</div>
              ) : (
                recentLogs.map((log) => (
                  <div
                    key={log.id}
                    className="flex items-center justify-between gap-2 pb-1.5 border-b border-zinc-100 dark:border-zinc-800/60 last:border-0 last:pb-0 text-[11px]"
                  >
                    <div className="flex items-center gap-2 min-w-0 flex-1">
                      <span className="font-mono font-bold text-primary shrink-0">
                        {log.action}
                      </span>
                      <span className="text-zinc-500 truncate">
                        {log.targetType}: {log.details || '成功'}
                      </span>
                    </div>
                    <span className="font-mono text-zinc-400 shrink-0 text-[10px]">
                      {new Date(log.createdAt).toLocaleTimeString('zh-CN', {
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </span>
                  </div>
                ))
              )}
            </div>
          </Card>
        </div>
      </div>
    </div>
  )
}

