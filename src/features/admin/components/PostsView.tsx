'use client'

import { useCallback, useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Plus, Search, RefreshCw, Edit, Trash2, BookOpen, FileText } from 'lucide-react'
import {
  Button,
  Card,
  CardBody,
  Input,
  Chip,
  Modal,
  ModalHeader,
  ModalBody,
  ModalFooter,
  useDisclosure,
  Select,
} from '@/components/ui/heroui-helpers'
import { cmsApi } from '@/features/admin/lib/api'
import type { Pagination, Post } from '@/features/admin/lib/types'
import { toast } from '@/shared/hooks/use-toast'
import { useAdminHeader } from './AdminShell'

const statusMap: Record<Post['status'], { text: string; color: 'default' | 'success' | 'warning' | 'danger' }> = {
  draft: { text: '草稿', color: 'default' },
  published: { text: '已发布', color: 'success' },
  unpublished: { text: '已下线', color: 'warning' },
  trash: { text: '回收站', color: 'danger' },
}

export function PostsView() {
  const router = useRouter()
  const [data, setData] = useState<Pagination<Post>>({ items: [], page: 1, pageSize: 20, total: 0 })
  const [keyword, setKeyword] = useState('')
  const [status, setStatus] = useState<string>('')
  const [loading, setLoading] = useState(true)
  const [deleteTarget, setDeleteTarget] = useState<Post | null>(null)
  const { isOpen, onOpen, onClose } = useDisclosure()
  const { setHeaderContent } = useAdminHeader()

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const query = new URLSearchParams({ page: '1', pageSize: '20' })
      if (keyword) query.set('keyword', keyword)
      if (status) query.set('status', status)
      setData(await cmsApi.posts(`?${query}`))
    } catch {
      toast.error('文章列表加载失败')
    } finally {
      setLoading(false)
    }
  }, [keyword, status])

  useEffect(() => {
    const timer = window.setTimeout(load, 250)
    return () => window.clearTimeout(timer)
  }, [load])

  // 动态将控制功能注入到系统全局最顶部的 Header 导航栏中
  useEffect(() => {
    setHeaderContent({
      titleExtra: (
        <Chip size="sm" color="primary" className="ml-1 font-mono">
          {data.total}
        </Chip>
      ),
      actions: (
        <div className="flex items-center gap-2 flex-1 justify-end max-w-2xl">
          <div className="w-40 sm:w-56">
            <Input
              placeholder="按文章标题或 Slug 搜索..."
              value={keyword}
              onChange={(e: any) => setKeyword(e.target.value)}
              prefix={<Search className="w-3.5 h-3.5 text-zinc-400" />}
              className="w-full"
            />
          </div>
          <Select
            value={status}
            onChange={(e) => setStatus(e.target.value)}
            placeholder="全部发布状态"
            options={[
              { value: 'published', label: '已发布' },
              { value: 'draft', label: '草稿' },
              { value: 'unpublished', label: '已下线' },
              { value: 'trash', label: '回收站' },
            ]}
          />
          <Button
            variant="primary"
            size="xs"
            onClick={() => router.push('/admin/content/posts/new')}
            className="h-7.5 px-3 rounded-lg font-semibold shadow-2xs whitespace-nowrap shrink-0"
          >
            <Plus className="w-3.5 h-3.5 mr-1" />
            <span>撰写新文章</span>
          </Button>
        </div>
      ),
    })

    return () => {
      setHeaderContent({})
    }
  }, [data.total, keyword, status, router, setHeaderContent])

  const confirmTrash = async () => {
    if (!deleteTarget) return
    try {
      await cmsApi.trashPost(deleteTarget.id)
      toast.success('文章已移入回收站')
      load()
    } catch {
      toast.error('删除失败')
    } finally {
      setDeleteTarget(null)
      onClose()
    }
  }

  return (
    <div className="flex flex-col gap-3 text-xs">
      {/* 表格自适应容器：全宽顶格自适应 */}
      <Card className="border border-zinc-200/60 dark:border-zinc-800/60 bg-white dark:bg-zinc-900 shadow-2xs rounded-xl overflow-hidden">
        <CardBody className="p-3">
          <div className="overflow-x-auto scrollbar-none">
            <table className="w-full text-left text-sm min-w-[650px]">
              <thead>
                <tr className="border-b border-zinc-200 dark:border-zinc-800 text-zinc-500 pb-2">
                  <th className="pb-3 font-semibold text-xs">文章标题 / SLUG</th>
                  <th className="pb-3 font-semibold text-xs">发布状态</th>
                  <th className="pb-3 font-semibold text-xs">分类与标签</th>
                  <th className="pb-3 font-semibold text-xs">最后修改时间</th>
                  <th className="pb-3 font-semibold text-xs text-right">管理操作</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800/60">
                {loading ? (
                  <tr>
                    <td colSpan={5} className="py-8 text-center text-xs text-zinc-400">
                      正在加载文章列表...
                    </td>
                  </tr>
                ) : data.items.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="py-8 text-center text-xs text-zinc-400">
                      未找到符合条件的文章
                    </td>
                  </tr>
                ) : (
                  data.items.map((post) => (
                    <tr key={post.id} className="hover:bg-zinc-50/50 dark:hover:bg-zinc-800/30 transition-colors">
                      <td className="py-2.5">
                        <div className="flex items-center gap-2.5">
                          <div className="p-1.5 rounded-lg bg-blue-500/10 text-blue-600 dark:text-blue-400 shrink-0">
                            {post.status === 'published' ? <BookOpen className="w-3.5 h-3.5" /> : <FileText className="w-3.5 h-3.5 text-amber-500" />}
                          </div>
                          <div className="flex flex-col gap-0.5 min-w-0">
                            <Link
                              href={`/admin/content/posts/${post.id}/edit`}
                              className="font-semibold text-xs text-zinc-900 dark:text-zinc-100 hover:text-blue-600 dark:hover:text-blue-400 transition-colors truncate max-w-md"
                            >
                              {post.title}
                            </Link>
                            {post.slug && post.slug !== post.title && (
                              <span className="text-[11px] font-mono text-zinc-400 truncate max-w-xs">
                                /{post.slug}
                              </span>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="py-3">
                        <Chip size="sm" color={statusMap[post.status as Post['status']]?.color || 'default'}>
                          {statusMap[post.status as Post['status']]?.text || post.status}
                        </Chip>
                      </td>
                      <td className="py-3">
                        <div className="flex flex-wrap items-center gap-1.5">
                          <span className="text-xs font-semibold px-2 py-0.5 rounded-lg bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300">
                            {post.categoryName || '未分类'}
                          </span>
                          {post.tags.slice(0, 2).map((tag, idx) => (
                            <Chip key={tag.id || `${tag.name}-${idx}`} size="sm">
                              {tag.name}
                            </Chip>
                          ))}
                        </div>
                      </td>
                      <td className="py-3">
                        <span className="text-xs font-mono text-zinc-400">
                          {new Date(post.updatedAt).toLocaleString('zh-CN')}
                        </span>
                      </td>
                      <td className="py-3 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <Button size="sm" variant="ghost" onClick={() => router.push(`/admin/content/posts/${post.id}/edit`)}>
                            <Edit className="w-4 h-4 text-zinc-600 dark:text-zinc-400" />
                          </Button>
                          <Button
                            size="sm"
                            variant="danger"
                            onClick={() => {
                              setDeleteTarget(post)
                              onOpen()
                            }}
                          >
                            <Trash2 className="w-4 h-4" />
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

      <Modal isOpen={isOpen} onClose={onClose}>
        <ModalHeader>移入回收站确认</ModalHeader>
        <ModalBody>
          <p className="text-xs text-zinc-600 dark:text-zinc-400 leading-relaxed">
            确定要将文章 <strong className="text-zinc-900 dark:text-zinc-100">“{deleteTarget?.title}”</strong> 移入回收站吗？移入后该文章将在前台隐藏，可在回收站中再次恢复。
          </p>
        </ModalBody>
        <ModalFooter>
          <Button variant="outline" size="sm" onClick={onClose}>
            取消
          </Button>
          <Button variant="danger" size="sm" onClick={confirmTrash}>
            确认移入回收站
          </Button>
        </ModalFooter>
      </Modal>
    </div>
  )
}
