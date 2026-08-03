'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { ArrowLeft, Eye, Save, Send } from 'lucide-react'
import { cmsApi } from '@/features/admin/lib/api'
import type { Category } from '@/features/admin/lib/types'
import { toast } from '@/shared/hooks/use-toast'
import { AdminPageHeader } from './AdminPageHeader'
import {
  Button,
  Card,
  CardBody,
  CardHeader,
  Input,
  TextArea,
  Select,
  Spinner,
} from '@/components/ui/heroui-helpers'

type EditorValues = {
  title: string
  slug: string
  summary: string
  content: string
  coverUrl: string
  language: 'zh' | 'en'
  categoryId?: string
  tagIds: string[]
  seoTitle: string
  seoDescription: string
}

export function PostEditor({ postID }: { postID?: string }) {
  const router = useRouter()
  const [loading, setLoading] = useState(Boolean(postID))
  const [saving, setSaving] = useState(false)
  const [categories, setCategories] = useState<Category[]>([])
  const [preview, setPreview] = useState(false)

  const [formValues, setFormValues] = useState<EditorValues>({
    title: '',
    slug: '',
    summary: '',
    content: '',
    coverUrl: '',
    language: 'zh',
    categoryId: '',
    tagIds: [],
    seoTitle: '',
    seoDescription: '',
  })

  useEffect(() => {
    Promise.all([
      cmsApi.categories(),
      postID ? cmsApi.post(postID) : Promise.resolve(undefined),
    ])
      .then(([nextCategories, nextPost]) => {
        setCategories(nextCategories)
        if (nextPost) {
          setFormValues({
            title: nextPost.title || '',
            slug: nextPost.slug || '',
            summary: nextPost.summary || '',
            content: nextPost.content || '',
            coverUrl: nextPost.coverUrl || '',
            language: nextPost.language === 'en' ? 'en' : 'zh',
            categoryId: nextPost.categoryId || '',
            tagIds: nextPost.tags.map((t) => t.id),
            seoTitle: nextPost.seoTitle || '',
            seoDescription: nextPost.seoDescription || '',
          })
        }
      })
      .catch(() => toast.error('编辑器数据加载失败'))
      .finally(() => setLoading(false))
  }, [postID])

  const updateField = (field: keyof EditorValues, value: any) => {
    setFormValues((prev) => ({ ...prev, [field]: value }))
  }

  const save = async (publish = false) => {
    if (!formValues.title.trim()) {
      toast.error('请输入文章标题')
      return
    }
    if (!formValues.slug.trim()) {
      toast.error('请输入 URL Slug')
      return
    }
    if (!formValues.content.trim()) {
      toast.error('请输入文章正文内容')
      return
    }

    try {
      setSaving(true)
      const item = postID
        ? await cmsApi.updatePost(postID, formValues)
        : await cmsApi.createPost(formValues)

      if (publish) {
        await cmsApi.publishPost(item.id)
      }

      toast.success(publish ? '文章已成功发布' : '草稿已暂存')
      if (!postID) {
        router.replace(`/admin/content/posts/${item.id}/edit`)
      } else {
      }
    } catch {
      toast.error('保存失败，请检查必填字段与 Slug 冲突')
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="p-20 grid place-items-center">
        <Spinner size="md" />
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-4">
      <AdminPageHeader
        title={postID ? '编辑文章' : '新建文章'}
        subtitle="正文以 Markdown / MDX 格式存储并落盘为文件"
        extra={
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => router.push('/admin/content/posts')}
            >
              <ArrowLeft className="w-4 h-4 mr-1" />
              返回列表
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPreview((v) => !v)}
            >
              <Eye className="w-4 h-4 mr-1" />
              {preview ? '关闭预览' : '预览'}
            </Button>
            <Button
              variant="outline"
              size="sm"
              isLoading={saving}
              onClick={() => save(false)}
            >
              <Save className="w-4 h-4 mr-1" />
              保存草稿
            </Button>
            <Button size="sm" isLoading={saving} onClick={() => save(true)}>
              <Send className="w-4 h-4 mr-1" />
              发布文章
            </Button>
          </div>
        }
      />

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
        <div className="lg:col-span-8 flex flex-col gap-4">
          <Card className="border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 rounded-lg">
            <CardBody className="p-4 flex flex-col gap-3">
              <div className="flex items-center justify-between border-b border-zinc-100 dark:border-zinc-800 pb-2">
                <span className="font-bold text-sm">Markdown / MDX 正文</span>
              </div>
              {!preview ? (
                <TextArea
                  rows={24}
                  placeholder="# 从这里开始写作 Markdown 正文..."
                  value={formValues.content}
                  onChange={(e) => updateField('content', e.target.value)}
                  className="font-mono text-sm leading-relaxed"
                />
              ) : (
                <div className="p-4 min-h-[480px] max-h-[640px] overflow-y-auto rounded-xl bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 font-mono text-sm leading-relaxed whitespace-pre-wrap">
                  {formValues.content || '无正文数据'}
                </div>
              )}
            </CardBody>
          </Card>
        </div>

        <div className="lg:col-span-4 flex flex-col gap-4">
          <Card className="border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 rounded-lg">
            <CardHeader>基本信息</CardHeader>
            <CardBody className="p-4 flex flex-col gap-3">
              <Input
                required
                placeholder="文章标题"
                value={formValues.title}
                onChange={(e) => updateField('title', e.target.value)}
              />
              <Input
                required
                placeholder="article-slug"
                value={formValues.slug}
                onChange={(e) => updateField('slug', e.target.value)}
              />
              <TextArea
                placeholder="文章摘要"
                rows={3}
                value={formValues.summary}
                onChange={(e) => updateField('summary', e.target.value)}
              />
              <Select
                value={formValues.language}
                onChange={(e) => updateField('language', e.target.value)}
                options={[
                  { value: 'zh', label: '中文 (zh)' },
                  { value: 'en', label: 'English (en)' },
                ]}
                aria-label="文章语言"
              />
            </CardBody>
          </Card>

          <Card className="border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 rounded-lg">
            <CardHeader>分类</CardHeader>
            <CardBody className="p-4 flex flex-col gap-3">
              <Select
                value={formValues.categoryId || ''}
                onChange={(e) => updateField('categoryId', e.target.value)}
                options={categories.map((item) => ({
                  value: item.id,
                  label: item.labelZh,
                }))}
                placeholder="选择文章分类"
                aria-label="文章分类"
              />
            </CardBody>
          </Card>

          <Card className="border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 rounded-lg">
            <CardHeader>封面图与 SEO</CardHeader>
            <CardBody className="p-4 flex flex-col gap-3">
              <Input
                placeholder="封面图 URL"
                value={formValues.coverUrl}
                onChange={(e) => updateField('coverUrl', e.target.value)}
              />
              <Input
                placeholder="SEO 标题"
                value={formValues.seoTitle}
                onChange={(e) => updateField('seoTitle', e.target.value)}
              />
              <TextArea
                placeholder="SEO 描述"
                rows={2}
                value={formValues.seoDescription}
                onChange={(e) => updateField('seoDescription', e.target.value)}
              />
            </CardBody>
          </Card>
        </div>
      </div>
    </div>
  )
}
