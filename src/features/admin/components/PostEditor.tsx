'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { ArrowLeft, Eye, Save, Send } from 'lucide-react'
import { cmsApi } from '@/features/admin/lib/api'
import type { Category } from '@/features/admin/lib/types'
import { toast } from '@/shared/hooks/use-toast'
import { useAdminHeader } from './AdminShell'
import {
  Button,
  Card,
  CardBody,
  CardHeader,
  Input,
  TextArea,
  Select,
  Spinner,
  DatePicker,
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
  publishedAt?: string
}

export function PostEditor({ postID }: { postID?: string }) {
  const router = useRouter()
  const [loading, setLoading] = useState(Boolean(postID))
  const [saving, setSaving] = useState(false)
  const [categories, setCategories] = useState<Category[]>([])
  const [preview, setPreview] = useState(false)
  const { setHeaderContent } = useAdminHeader()

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
    publishedAt: '',
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
            publishedAt: nextPost.createdAt ? new Date(nextPost.createdAt).toISOString().slice(0, 16) : '',
          })
        }
      })
      .catch(() => toast.error('编辑器数据加载失败'))
      .finally(() => setLoading(false))
  }, [postID])

  useEffect(() => {
    setHeaderContent({
      actions: (
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="xs"
            onClick={() => router.push('/admin/content/posts')}
            className="h-8 shadow-2xs"
          >
            <ArrowLeft className="w-3.5 h-3.5 mr-1" />
            <span>返回列表</span>
          </Button>
          <Button
            variant="ghost"
            size="xs"
            onClick={() => setPreview((v) => !v)}
            className="h-8 shadow-2xs"
          >
            <Eye className="w-3.5 h-3.5 mr-1" />
            <span>{preview ? '编辑' : '预览'}</span>
          </Button>
          <Button
            variant="ghost"
            size="xs"
            isLoading={saving}
            onClick={() => save(false)}
            className="h-8 shadow-2xs"
          >
            <Save className="w-3.5 h-3.5 mr-1" />
            <span>暂存草稿</span>
          </Button>
          <Button
            variant="primary"
            size="xs"
            isLoading={saving}
            onClick={() => save(true)}
            className="h-8 font-semibold shadow-2xs whitespace-nowrap"
          >
            <Send className="w-3.5 h-3.5 mr-1" />
            <span>发布文章</span>
          </Button>
        </div>
      ),
    })
    return () => setHeaderContent({})
  }, [preview, saving, router, setHeaderContent])

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
    <div className="flex flex-col gap-3 text-xs">

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
          <Card className="border border-zinc-200/80 dark:border-zinc-800/80 bg-white dark:bg-zinc-900 rounded-xl shadow-2xs">
            <CardBody className="p-4 flex flex-col gap-5">
              {/* 基本信息 */}
              <div className="flex flex-col gap-3">
                <div className="flex items-center justify-between border-b border-zinc-100 dark:border-zinc-800/60 pb-1.5">
                  <span className="font-bold text-xs text-zinc-900 dark:text-zinc-100">基本信息</span>
                </div>
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
                <DatePicker
                  label="发布时间"
                  placeholder="设定文章发布或定时发布时间..."
                  value={formValues.publishedAt}
                  onChange={(e) => updateField('publishedAt', e.target.value)}
                  aria-label="发布时间"
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
              </div>

              {/* 分类配置 */}
              <div className="flex flex-col gap-3 border-t border-zinc-100 dark:border-zinc-800/60 pt-3">
                <div className="flex items-center justify-between border-b border-zinc-100 dark:border-zinc-800/60 pb-1.5">
                  <span className="font-bold text-xs text-zinc-900 dark:text-zinc-100">分类与归档</span>
                </div>
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
              </div>

              {/* 封面图与 SEO */}
              <div className="flex flex-col gap-3 border-t border-zinc-100 dark:border-zinc-800/60 pt-3">
                <div className="flex items-center justify-between border-b border-zinc-100 dark:border-zinc-800/60 pb-1.5">
                  <span className="font-bold text-xs text-zinc-900 dark:text-zinc-100">封面图与 SEO</span>
                </div>
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
              </div>
            </CardBody>
          </Card>
        </div>
      </div>
    </div>
  )
}
