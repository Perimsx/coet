'use client'

import { useCallback, useEffect, useState } from 'react'
import { Plus, RefreshCw, Edit, Trash2, Send, FileText } from 'lucide-react'
import {
  Button,
  Card,
  CardBody,
  CardHeader,
  CardFooter,
  Input,
  TextArea,
  Chip,
  Modal,
  ModalHeader,
  ModalBody,
  ModalFooter,
  useDisclosure,
} from '@/components/ui/heroui-helpers'
import { cmsApi } from '@/features/admin/lib/api'
import type { Page } from '@/features/admin/lib/types'
import { toast } from '@/shared/hooks/use-toast'
import { AdminPageHeader } from './AdminPageHeader'

type PageInput = Pick<Page, 'title' | 'slug' | 'content' | 'seoTitle' | 'seoDescription'>

const pageStatuses: Record<Page['status'], { text: string; color: 'default' | 'success' | 'warning' | 'danger' }> = {
  draft: { text: '草稿', color: 'default' },
  published: { text: '已发布', color: 'success' },
  unpublished: { text: '已下线', color: 'warning' },
  trash: { text: '回收站', color: 'danger' },
}

export function PagesView() {
  const [items, setItems] = useState<Page[]>([])
  const [loading, setLoading] = useState(true)
  const [editing, setEditing] = useState<Page | null>(null)
  const [saving, setSaving] = useState(false)
  const { isOpen, onOpen, onClose } = useDisclosure()

  const [form, setForm] = useState<PageInput>({
    title: '',
    slug: '',
    content: '',
    seoTitle: '',
    seoDescription: '',
  })

  const load = useCallback(async () => {
    setLoading(true)
    try {
      setItems((await cmsApi.pages()).items)
    } catch {
      toast.error('独立页面加载失败')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void load()
  }, [load])

  const openModal = (page?: Page) => {
    setEditing(page || null)
    setForm(
      page
        ? {
            title: page.title || '',
            slug: page.slug || '',
            content: page.content || '',
            seoTitle: page.seoTitle || '',
            seoDescription: page.seoDescription || '',
          }
        : {
            title: '',
            slug: '',
            content: '',
            seoTitle: '',
            seoDescription: '',
          }
    )
    onOpen()
  }

  const save = async () => {
    if (!form.title.trim() || !form.slug.trim() || !form.content.trim()) {
      toast.error('请填写必填的标题、Slug 及正文')
      return
    }

    try {
      setSaving(true)
      if (editing) {
        await cmsApi.updatePage(editing.id, form)
      } else {
        await cmsApi.createPage(form)
      }
      toast.success('页面已成功保存')
      onClose()
      void load()
    } catch {
      toast.error('保存失败，请检查 Slug 是否重复')
    } finally {
      setSaving(false)
    }
  }

  const changeStatus = async (page: Page, action: 'publish' | 'unpublish' | 'trash') => {
    try {
      if (action === 'publish') await cmsApi.publishPage(page.id)
      if (action === 'unpublish') await cmsApi.unpublishPage(page.id)
      if (action === 'trash') await cmsApi.trashPage(page.id)
      toast.success(action === 'trash' ? '页面已移入回收站' : action === 'publish' ? '页面已发布' : '页面已下线')
      void load()
    } catch {
      toast.error('状态更新失败')
    }
  }

  return (
    <div className="flex flex-col gap-5">
      <AdminPageHeader
        title="独立页面"
        subtitle="集中管理关于页、友链说明、隐私政策与自定义独立页面"
        extra={
          <Button
            size="sm"
            onClick={() => openModal()}
            className="bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900 hover:bg-zinc-800 dark:hover:bg-zinc-200 px-3.5 py-2 rounded-xl text-xs font-semibold shadow-sm inline-flex items-center justify-center gap-1.5 whitespace-nowrap shrink-0 border-0 cursor-pointer"
          >
            <Plus className="w-4 h-4 shrink-0" />
            <span>新建页面</span>
          </Button>
        }
      />

      <Card className="border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-sm rounded-2xl">
        <CardBody className="p-4 flex flex-col gap-4">
          <div className="flex items-center justify-between gap-2">
            <Button
              size="sm"
              variant="ghost"
              onClick={load}
              className="inline-flex items-center gap-1.5 whitespace-nowrap shrink-0 shadow-sm"
            >
              <RefreshCw className="w-4 h-4 shrink-0" />
              <span>刷新数据</span>
            </Button>
          </div>

          <div className="overflow-x-auto scrollbar-none">
            <table className="w-full text-left text-sm min-w-[550px]">
              <thead>
                <tr className="border-b border-zinc-200 dark:border-zinc-800 text-zinc-500 pb-2">
                  <th className="pb-3 font-semibold text-xs">页面标题 / SLUG</th>
                  <th className="pb-3 font-semibold text-xs">状态</th>
                  <th className="pb-3 font-semibold text-xs">更新时间</th>
                  <th className="pb-3 font-semibold text-xs text-right">管理操作</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800/60">
                {loading ? (
                  <tr>
                    <td colSpan={4} className="py-8 text-center text-xs text-zinc-400">
                      加载中...
                    </td>
                  </tr>
                ) : items.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="py-8 text-center text-xs text-zinc-400">
                      暂无独立页面数据
                    </td>
                  </tr>
                ) : (
                  items.map((page) => (
                    <tr key={page.id} className="hover:bg-zinc-50/50 dark:hover:bg-zinc-800/30 transition-colors">
                      <td className="py-3">
                        <div className="flex items-center gap-2.5">
                          <div className="p-2 rounded-xl bg-primary/10 text-primary shrink-0">
                            <FileText className="w-4 h-4" />
                          </div>
                          <div className="flex flex-col gap-0.5 min-w-0">
                            <span className="font-semibold text-sm text-zinc-900 dark:text-zinc-100 truncate">{page.title}</span>
                            <span className="text-xs font-mono text-zinc-400">/{page.slug}</span>
                          </div>
                        </div>
                      </td>
                      <td className="py-3">
                        <Chip size="sm" color={pageStatuses[page.status]?.color || 'default'}>
                          {pageStatuses[page.status]?.text || page.status}
                        </Chip>
                      </td>
                      <td className="py-3">
                        <span className="text-xs font-mono text-zinc-400">
                          {new Date(page.updatedAt).toLocaleString('zh-CN')}
                        </span>
                      </td>
                      <td className="py-3 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <Button size="sm" variant="ghost" onClick={() => openModal(page)}>
                            <Edit className="w-4 h-4 text-zinc-600 dark:text-zinc-400" />
                          </Button>
                          {page.status !== 'published' && (
                            <Button size="sm" onClick={() => changeStatus(page, 'publish')}>
                              <Send className="w-3.5 h-3.5 mr-1" />
                              发布
                            </Button>
                          )}
                          {page.status === 'published' && (
                            <Button size="sm" variant="ghost" onClick={() => changeStatus(page, 'unpublish')}>
                              下线
                            </Button>
                          )}
                          <Button size="sm" variant="danger" onClick={() => changeStatus(page, 'trash')}>
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

      <Modal isOpen={isOpen} onClose={onClose} size="2xl">
        <ModalHeader>{editing ? '编辑独立页面' : '新建独立页面'}</ModalHeader>
        <ModalBody className="gap-3">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Input
              label="页面标题"
              placeholder="例如：关于本站"
              value={form.title}
              onChange={(e) => setForm((p) => ({ ...p, title: e.target.value }))}
            />
            <Input
              label="URL 路径 (Slug)"
              placeholder="例如：about"
              value={form.slug}
              onChange={(e) => setForm((p) => ({ ...p, slug: e.target.value }))}
            />
          </div>
          <TextArea
            label="Markdown 正文内容"
            placeholder="请输入 Markdown / MDX 格式的页面正文内容..."
            value={form.content}
            onChange={(e) => setForm((p) => ({ ...p, content: e.target.value }))}
          />
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Input
              label="SEO 标题 (选填)"
              placeholder="SEO 自定义 Title"
              value={form.seoTitle}
              onChange={(e) => setForm((p) => ({ ...p, seoTitle: e.target.value }))}
            />
            <Input
              label="SEO 描述 (选填)"
              placeholder="SEO 自定义 Description"
              value={form.seoDescription}
              onChange={(e) => setForm((p) => ({ ...p, seoDescription: e.target.value }))}
            />
          </div>
        </ModalBody>
        <ModalFooter>
          <Button variant="flat" onClick={onClose}>
            取消
          </Button>
          <Button color="primary" onClick={save} isDisabled={saving}>
            保存页面
          </Button>
        </ModalFooter>
      </Modal>
    </div>
  )
}
