'use client'

import { useEffect, useState } from 'react'
import { Plus, Edit, Trash2, FolderTree, Tag as TagIcon } from 'lucide-react'
import {
  Button,
  Card,
  Input,
  TextArea,
  Checkbox,
  Chip,
  Modal,
  ModalHeader,
  ModalBody,
  ModalFooter,
  useDisclosure,
  ConfirmModal,
} from '@/components/ui/heroui-helpers'
import { cmsApi } from '@/features/admin/lib/api'
import type { Category, Tag as CMS_TAG } from '@/features/admin/lib/types'
import { toast } from '@/shared/hooks/use-toast'
import { AdminPageHeader } from './AdminPageHeader'

type Mode = 'categories' | 'tags'

export function TaxonomyView({ mode }: { mode: Mode }) {
  const isCategory = mode === 'categories'
  const [items, setItems] = useState<(Category | CMS_TAG)[]>([])
  const [editing, setEditing] = useState<Category | CMS_TAG | null>(null)
  const { isOpen, onOpen, onClose } = useDisclosure()

  const [formValues, setFormValues] = useState<{
    slug: string
    labelZh: string
    labelEn: string
    name: string
    description: string
    sortOrder: number
    enabled: boolean
  }>({
    slug: '',
    labelZh: '',
    labelEn: '',
    name: '',
    description: '',
    sortOrder: 0,
    enabled: true,
  })

  const load = async () => {
    try {
      setItems(await (isCategory ? cmsApi.categories() : cmsApi.tags()))
    } catch {
      toast.error('数据加载失败')
    }
  }

  useEffect(() => {
    void load()
  }, [isCategory])

  const openModal = (item?: Category | CMS_TAG) => {
    setEditing(item || null)
    if (item) {
      const cat = item as Category
      const tag = item as CMS_TAG
      setFormValues({
        slug: item.slug || '',
        labelZh: cat.labelZh || '',
        labelEn: cat.labelEn || '',
        name: tag.name || '',
        description: item.description || '',
        sortOrder: cat.sortOrder || 0,
        enabled: cat.enabled ?? true,
      })
    } else {
      setFormValues({
        slug: '',
        labelZh: '',
        labelEn: '',
        name: '',
        description: '',
        sortOrder: 0,
        enabled: true,
      })
    }
    onOpen()
  }

  const save = async () => {
    if (!formValues.slug.trim()) {
      toast.error('请输入 Slug')
      return
    }

    try {
      if (isCategory) {
        const payload = {
          slug: formValues.slug,
          labelZh: formValues.labelZh,
          labelEn: formValues.labelEn,
          description: formValues.description,
          sortOrder: formValues.sortOrder,
          enabled: formValues.enabled,
        }
        if (editing) await cmsApi.updateCategory(editing.id, payload)
        else await cmsApi.createCategory(payload)
      } else {
        const payload = {
          slug: formValues.slug,
          name: formValues.name,
          description: formValues.description,
        }
        if (editing) await cmsApi.updateTag(editing.id, payload)
        else await cmsApi.createTag(payload)
      }

      toast.success('配置已成功保存')
      onClose()
      void load()
    } catch {
      toast.error('保存失败，请检查 Slug 是否冲突')
    }
  }

  const [deleteTarget, setDeleteTarget] = useState<Category | CMS_TAG | null>(null)

  const confirmDelete = async () => {
    if (!deleteTarget) return
    try {
      if (isCategory) await cmsApi.deleteCategory(deleteTarget.id)
      else await cmsApi.deleteTag(deleteTarget.id)
      toast.success('已删除')
      void load()
    } catch {
      toast.error(
        isCategory ? '删除分类失败，分类可能仍被文章依赖' : '删除标签失败'
      )
    } finally {
      setDeleteTarget(null)
    }
  }

  return (
    <div className="flex flex-col gap-4">
      <AdminPageHeader
        title={isCategory ? '全站分类' : '文章标签'}
        subtitle={
          isCategory ? '管理中英文分类层级与状态' : '管理文章归档标签与使用关联'
        }
        extra={
          <Button
            variant="primary"
            size="sm"
            onClick={() => openModal()}
          >
            <Plus className="w-4 h-4 shrink-0" />
            <span>新建{isCategory ? '分类' : '标签'}</span>
          </Button>
        }
      />

      <Card className="border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-3 rounded-lg">
        <div className="overflow-x-auto scrollbar-none">
          <table className="w-full text-left text-sm min-w-[520px]">
            <thead>
              <tr className="border-b border-zinc-200 dark:border-zinc-800 text-zinc-500 pb-2">
                <th className="pb-3 font-semibold text-xs">名称 / SLUG</th>
                <th className="pb-3 font-semibold text-xs">关联文章</th>
                {isCategory ? (
                  <th className="pb-3 font-semibold text-xs">启用状态</th>
                ) : (
                  <th className="pb-3 font-semibold text-xs">描述</th>
                )}
                <th className="pb-3 font-semibold text-xs text-right">操作</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800/60">
              {items.length === 0 ? (
                <tr>
                  <td
                    colSpan={4}
                    className="py-8 text-center text-xs text-zinc-400"
                  >
                    暂无{isCategory ? '分类' : '标签'}数据
                  </td>
                </tr>
              ) : (
                items.map((item) => (
                  <tr
                    key={item.id}
                    className="hover:bg-zinc-50/50 dark:hover:bg-zinc-800/30 transition-colors"
                  >
                    <td className="py-2">
                      <div className="flex items-center gap-2.5">
                        <div className="p-1.5 rounded-md bg-zinc-100 dark:bg-zinc-800 shrink-0">
                          {isCategory ? (
                            <FolderTree className="w-3.5 h-3.5 text-emerald-500" />
                          ) : (
                            <TagIcon className="w-3.5 h-3.5 text-purple-500" />
                          )}
                        </div>
                        <div className="flex flex-col gap-0.5">
                          <span className="font-semibold text-sm">
                            {isCategory
                              ? (item as Category).labelZh
                              : (item as CMS_TAG).name}
                          </span>
                          <span className="text-xs font-mono text-zinc-400">
                            {item.slug}
                          </span>
                        </div>
                      </div>
                    </td>
                    <td className="py-3">
                      <Chip size="sm" className="font-mono">
                        {item.postCount || 0} 篇
                      </Chip>
                    </td>
                    {isCategory ? (
                      <td className="py-3">
                        <Chip
                          size="sm"
                          color={
                            (item as Category).enabled ? 'success' : 'default'
                          }
                        >
                          {(item as Category).enabled ? '启用' : '隐藏'}
                        </Chip>
                      </td>
                    ) : (
                      <td className="py-3">
                        <span className="text-xs text-zinc-500 truncate max-w-xs block">
                          {item.description || '无描述'}
                        </span>
                      </td>
                    )}
                    <td className="py-3 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => openModal(item)}
                        >
                          <Edit className="w-4 h-4 text-zinc-600 dark:text-zinc-400" />
                        </Button>
                        <Button
                          size="sm"
                          variant="danger"
                          onClick={() => setDeleteTarget(item)}
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
      </Card>

      <Modal isOpen={isOpen} onClose={onClose}>
        <ModalHeader>
          {editing ? '编辑' : '新建'}
          {isCategory ? '分类' : '标签'}
        </ModalHeader>
        <ModalBody className="flex flex-col gap-3">
          <div className="flex flex-col gap-1">
            <label className="text-xs font-semibold text-zinc-600 dark:text-zinc-300">
              URL 标识 (Slug)
            </label>
            <Input
              required
              placeholder="例如：tech-notes"
              value={formValues.slug}
              onChange={(e) =>
                setFormValues((p) => ({ ...p, slug: e.target.value }))
              }
            />
          </div>
          {isCategory ? (
            <>
              <div className="flex flex-col gap-1">
                <label className="text-xs font-semibold text-zinc-600 dark:text-zinc-300">
                  中文显示名称
                </label>
                <Input
                  required
                  placeholder="例如：技术笔记"
                  value={formValues.labelZh}
                  onChange={(e) =>
                    setFormValues((p) => ({ ...p, labelZh: e.target.value }))
                  }
                />
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-xs font-semibold text-zinc-600 dark:text-zinc-300">
                  英文显示名称
                </label>
                <Input
                  required
                  placeholder="例如：Tech Notes"
                  value={formValues.labelEn}
                  onChange={(e) =>
                    setFormValues((p) => ({ ...p, labelEn: e.target.value }))
                  }
                />
              </div>
              <Checkbox
                checked={formValues.enabled}
                onChange={(checked) =>
                  setFormValues((p) => ({ ...p, enabled: checked }))
                }
                className="flex items-center justify-between pt-1"
              >
                <span className="text-xs font-semibold text-zinc-600 dark:text-zinc-300">
                  启用状态
                </span>
              </Checkbox>
            </>
          ) : (
            <div className="flex flex-col gap-1">
              <label className="text-xs font-semibold text-zinc-600 dark:text-zinc-300">
                标签名称
              </label>
              <Input
                required
                placeholder="例如：React"
                value={formValues.name}
                onChange={(e) =>
                  setFormValues((p) => ({ ...p, name: e.target.value }))
                }
              />
            </div>
          )}
          <div className="flex flex-col gap-1">
            <label className="text-xs font-semibold text-zinc-600 dark:text-zinc-300">
              简短描述
            </label>
            <TextArea
              placeholder="功能或主题分类描述"
              rows={2}
              value={formValues.description}
              onChange={(e) =>
                setFormValues((p) => ({ ...p, description: e.target.value }))
              }
            />
          </div>
        </ModalBody>
        <ModalFooter>
          <Button size="sm" variant="ghost" onClick={onClose}>
            取消
          </Button>
          <Button size="sm" variant="primary" onClick={save}>
            保存
          </Button>
        </ModalFooter>
      </Modal>

      <ConfirmModal
        isOpen={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={confirmDelete}
        title={isCategory ? '确认删除该分类？' : '确认删除该标签？'}
        description={`确定要彻底删除 ${isCategory ? '分类' : '标签'} "${(deleteTarget as Category)?.labelZh || (deleteTarget as CMS_TAG)?.name || deleteTarget?.slug || ''}" 吗？此操作无法撤销。`}
      />
    </div>
  )
}
