'use client'

import { useCallback, useEffect, useState } from 'react'
import {
  Button,
  Card,
  CardBody,
  CardHeader,
  CardFooter,
  Chip,
} from '@/components/ui/heroui-helpers'
import { RefreshCw, CheckCircle, EyeOff, ShieldAlert, Archive, MessageSquare, Mail } from 'lucide-react'
import { cmsApi } from '@/features/admin/lib/api'
import type { Comment, Suggestion } from '@/features/admin/lib/types'
import { toast } from '@/shared/hooks/use-toast'
import { AdminPageHeader } from './AdminPageHeader'

const commentLabels: Record<Comment['status'], string> = {
  pending: '待审核',
  approved: '已通过',
  hidden: '已隐藏',
  spam: '垃圾评论',
  deleted: '已删除',
}

const suggestionLabels: Record<Suggestion['status'], string> = {
  unread: '未读',
  read: '已读',
  archived: '已归档',
  deleted: '已删除',
}

const statusColor = (status: string): 'success' | 'warning' | 'danger' | 'default' => {
  if (status === 'approved' || status === 'read') return 'success'
  if (status === 'pending' || status === 'unread') return 'warning'
  if (status === 'spam' || status === 'deleted') return 'danger'
  return 'default'
}

export function CommentsView() {
  const [items, setItems] = useState<Comment[]>([])
  const [status, setStatus] = useState<Comment['status']>()
  const [loading, setLoading] = useState(true)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      setItems((await cmsApi.comments(status)).items)
    } catch {
      toast.error('评论加载失败')
    } finally {
      setLoading(false)
    }
  }, [status])

  useEffect(() => {
    void load()
  }, [load])

  const update = async (item: Comment, next: Exclude<Comment['status'], 'pending'>) => {
    try {
      await cmsApi.updateCommentStatus(item.id, next)
      toast.success('评论状态已成功更新')
      void load()
    } catch {
      toast.error('状态更新失败')
    }
  }

  return (
    <div className="flex flex-col gap-5">
      <AdminPageHeader
        title="评论审核"
        subtitle="审核或隐藏前台提交的互动评论；支持全状态过滤"
        extra={
          <Button
            variant="ghost"
            size="sm"
            onClick={load}
            className="inline-flex items-center gap-1.5 whitespace-nowrap shrink-0 shadow-sm font-medium"
          >
            <RefreshCw className="w-4 h-4 shrink-0" />
            <span>刷新数据</span>
          </Button>
        }
      />

      <Card className="border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-sm rounded-2xl">
        <CardBody className="p-4 flex flex-col gap-4">
          <div className="flex items-center justify-between gap-3">
            <select
              value={status || ''}
              onChange={(e) => setStatus(e.target.value as Comment['status'] || undefined)}
              className="w-44 px-3 py-2 rounded-xl text-xs font-semibold border border-zinc-200 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-800/40 focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all"
            >
              <option value="">全部评论状态</option>
              {Object.entries(commentLabels).map(([val, label]) => (
                <option key={val} value={val}>
                  {label}
                </option>
              ))}
            </select>
          </div>

          <div className="overflow-x-auto scrollbar-none">
            <table className="w-full text-left text-sm min-w-[640px]">
              <thead>
                <tr className="border-b border-zinc-200 dark:border-zinc-800 text-zinc-500 pb-2">
                  <th className="pb-3 font-semibold text-xs">评论作者</th>
                  <th className="pb-3 font-semibold text-xs">评论内容</th>
                  <th className="pb-3 font-semibold text-xs">状态</th>
                  <th className="pb-3 font-semibold text-xs">时间</th>
                  <th className="pb-3 font-semibold text-xs text-right">审核操作</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800/60">
                {loading ? (
                  <tr>
                    <td colSpan={5} className="py-8 text-center text-xs text-zinc-400">
                      加载中...
                    </td>
                  </tr>
                ) : items.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="py-8 text-center text-xs text-zinc-400">
                      暂无相关评论
                    </td>
                  </tr>
                ) : (
                  items.map((item) => (
                    <tr key={item.id} className="hover:bg-zinc-50/50 dark:hover:bg-zinc-800/30 transition-colors">
                      <td className="py-3">
                        <div className="flex items-center gap-2.5">
                          <div className="p-2 rounded-xl bg-primary/10 text-primary shrink-0">
                            <MessageSquare className="w-4 h-4" />
                          </div>
                          <div className="flex flex-col gap-0.5">
                            <span className="font-semibold text-sm">{item.authorName}</span>
                            <span className="text-xs text-zinc-400">{item.authorEmail || '未提供邮箱'}</span>
                          </div>
                        </div>
                      </td>
                      <td className="py-3">
                        <p className="text-xs text-zinc-700 dark:text-zinc-300 line-clamp-2 max-w-md leading-relaxed">
                          {item.content}
                        </p>
                      </td>
                      <td className="py-3">
                        <Chip size="sm" color={statusColor(item.status)}>
                          {commentLabels[item.status] || item.status}
                        </Chip>
                      </td>
                      <td className="py-3">
                        <span className="text-xs font-mono text-zinc-400">
                          {new Date(item.createdAt).toLocaleString('zh-CN')}
                        </span>
                      </td>
                      <td className="py-3 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {item.status !== 'approved' && (
                            <Button size="sm" onClick={() => update(item, 'approved')}>
                              <CheckCircle className="w-3.5 h-3.5 mr-1" />
                              通过
                            </Button>
                          )}
                          <Button size="sm" variant="ghost" onClick={() => update(item, 'hidden')}>
                            <EyeOff className="w-3.5 h-3.5 mr-1" />
                            隐藏
                          </Button>
                          <Button size="sm" variant="danger" onClick={() => update(item, 'spam')}>
                            <ShieldAlert className="w-3.5 h-3.5 mr-1" />
                            垃圾
                          </Button>
                        </div>
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

export function SuggestionsView() {
  const [items, setItems] = useState<Suggestion[]>([])
  const [status, setStatus] = useState<Suggestion['status']>()
  const [loading, setLoading] = useState(true)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      setItems((await cmsApi.suggestions(status)).items)
    } catch {
      toast.error('留言加载失败')
    } finally {
      setLoading(false)
    }
  }, [status])

  useEffect(() => {
    void load()
  }, [load])

  const update = async (item: Suggestion, next: Suggestion['status']) => {
    try {
      await cmsApi.updateSuggestionStatus(item.id, next)
      toast.success('留言状态已更新')
      void load()
    } catch {
      toast.error('状态更新失败')
    }
  }

  return (
    <div className="flex flex-col gap-5">
      <AdminPageHeader
        title="留言建议"
        subtitle="查看与处理访客提交的联系信息、功能建议与反馈"
        extra={
          <Button
            variant="ghost"
            size="sm"
            onClick={load}
            className="inline-flex items-center gap-1.5 whitespace-nowrap shrink-0 shadow-sm font-medium"
          >
            <RefreshCw className="w-4 h-4 shrink-0" />
            <span>刷新留言</span>
          </Button>
        }
      />

      <Card className="border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-sm rounded-2xl">
        <CardBody className="p-4 flex flex-col gap-4">
          <div className="flex items-center justify-between gap-3">
            <select
              value={status || ''}
              onChange={(e) => setStatus(e.target.value as Suggestion['status'] || undefined)}
              className="w-44 px-3 py-2 rounded-xl text-xs font-semibold border border-zinc-200 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-800/40 focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all"
            >
              <option value="">全部留言状态</option>
              {Object.entries(suggestionLabels).map(([val, label]) => (
                <option key={val} value={val}>
                  {label}
                </option>
              ))}
            </select>
          </div>

          <div className="overflow-x-auto scrollbar-none">
            <table className="w-full text-left text-sm min-w-[600px]">
              <thead>
                <tr className="border-b border-zinc-200 dark:border-zinc-800 text-zinc-500 pb-2">
                  <th className="pb-3 font-semibold text-xs">联系方式</th>
                  <th className="pb-3 font-semibold text-xs">建议反馈正文</th>
                  <th className="pb-3 font-semibold text-xs">状态</th>
                  <th className="pb-3 font-semibold text-xs">时间</th>
                  <th className="pb-3 font-semibold text-xs text-right">操作</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800/60">
                {loading ? (
                  <tr>
                    <td colSpan={5} className="py-8 text-center text-xs text-zinc-400">
                      加载中...
                    </td>
                  </tr>
                ) : items.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="py-8 text-center text-xs text-zinc-400">
                      暂无相关留言
                    </td>
                  </tr>
                ) : (
                  items.map((item) => (
                    <tr key={item.id} className="hover:bg-zinc-50/50 dark:hover:bg-zinc-800/30 transition-colors">
                      <td className="py-3">
                        <div className="flex items-center gap-2.5">
                          <div className="p-2 rounded-xl bg-amber-500/10 text-amber-500 shrink-0">
                            <Mail className="w-4 h-4" />
                          </div>
                          <span className="font-semibold text-sm font-mono">{item.contact || '匿名访客'}</span>
                        </div>
                      </td>
                      <td className="py-3">
                        <p className="text-xs text-zinc-700 dark:text-zinc-300 line-clamp-2 max-w-md leading-relaxed">
                          {item.content}
                        </p>
                      </td>
                      <td className="py-3">
                        <Chip size="sm" color={statusColor(item.status)}>
                          {suggestionLabels[item.status] || item.status}
                        </Chip>
                      </td>
                      <td className="py-3">
                        <span className="text-xs font-mono text-zinc-400">
                          {new Date(item.createdAt).toLocaleString('zh-CN')}
                        </span>
                      </td>
                      <td className="py-3 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {item.status === 'unread' && (
                            <Button size="sm" onClick={() => update(item, 'read')}>
                              标为已读
                            </Button>
                          )}
                          <Button size="sm" variant="ghost" onClick={() => update(item, 'archived')}>
                            <Archive className="w-3.5 h-3.5 mr-1" />
                            归档
                          </Button>
                        </div>
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
