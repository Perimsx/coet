'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Alert, Button, Card, Form, Input, Message, Select, Space, Spin, Switch, Tabs, Typography } from '@arco-design/web-react'
import { IconArrowLeft, IconEye, IconSave, IconSend } from '@arco-design/web-react/icon'
import { cmsApi } from '@/features/admin/lib/api'
import type { Category, Post, Tag } from '@/features/admin/lib/types'
import { AdminPageHeader } from './AdminPageHeader'

type EditorValues = { title: string; slug: string; summary: string; content: string; coverUrl: string; language: 'zh' | 'en'; categoryId?: string; tagIds: string[]; seoTitle: string; seoDescription: string }

export function PostEditor({ postID }: { postID?: string }) {
  const router = useRouter(); const [form] = Form.useForm<EditorValues>(); const [loading, setLoading] = useState(Boolean(postID)); const [saving, setSaving] = useState(false); const [post, setPost] = useState<Post>(); const [categories, setCategories] = useState<Category[]>([]); const [tags, setTags] = useState<Tag[]>([]); const [preview, setPreview] = useState(false)
  useEffect(() => { Promise.all([cmsApi.categories(), cmsApi.tags(), postID ? cmsApi.post(postID) : Promise.resolve(undefined)]).then(([nextCategories, nextTags, nextPost]) => { setCategories(nextCategories);setTags(nextTags);setPost(nextPost);if(nextPost)form.setFieldsValue({ ...nextPost, categoryId: nextPost.categoryId, tagIds: nextPost.tags.map(tag => tag.id) }) }).catch(() => Message.error('编辑器数据加载失败')).finally(() => setLoading(false)) }, [form, postID])
  const save = async (publish = false) => { try { const values = await form.validate();setSaving(true);const item = postID ? await cmsApi.updatePost(postID, values) : await cmsApi.createPost(values);if (publish) await cmsApi.publishPost(item.id);Message.success(publish ? '文章已发布' : '草稿已保存');if(!postID)router.replace(`/admin/content/posts/${item.id}/edit`);else setPost(item) } catch (error) { if (!(error instanceof Error && error.message === 'Validate Error')) Message.error('保存失败，请检查必填字段和 Slug') } finally { setSaving(false) } }
  if (loading) return <div style={{ padding: 80, textAlign: 'center' }}><Spin tip="正在加载编辑器" /></div>
  const previewContent = form.getFieldValue('content') || ''
  return <>
    <AdminPageHeader title={postID ? '编辑文章' : '新建文章'} subtitle="正文以 Markdown / MDX 原文存入 SQLite；图片请直接使用图床链接" extra={<Space><Button icon={<IconArrowLeft />} onClick={() => router.push('/admin/content/posts')}>返回列表</Button><Button icon={<IconEye />} onClick={() => setPreview(value => !value)}>{preview ? '关闭预览' : '预览'}</Button><Button icon={<IconSave />} loading={saving} onClick={() => save(false)}>保存草稿</Button><Button type="primary" icon={<IconSend />} loading={saving} onClick={() => save(true)}>发布</Button></Space>} />
    <Form form={form} layout="vertical" initialValues={{ language: 'zh', tagIds: [] }}>
      <div className="xuzhan-admin-editor-grid">
        <Card className="xuzhan-admin-card"><Tabs defaultActiveTab="content"><Tabs.TabPane key="content" title="正文"><Form.Item field="content" label="Markdown / MDX 正文" rules={[{ required: true, message: '请输入正文内容' }]} required><Input.TextArea className="xuzhan-admin-editor-textarea" placeholder="# 文章标题\n\n从这里开始写作…" autoSize={{ minRows: 24 }} /></Form.Item></Tabs.TabPane><Tabs.TabPane key="preview" title="快速预览"><Typography.Paragraph style={{ whiteSpace: 'pre-wrap', minHeight: 480 }}>{previewContent || '在正文标签页输入内容后，这里会显示原始预览。完整 MDX 渲染预览将在前台内容源接入后提供。'}</Typography.Paragraph></Tabs.TabPane></Tabs>{preview && <Alert type="info" title="预览模式" content="当前显示原始 Markdown 内容；完整 MDX 预览会复用前台渲染管线。" />}</Card>
        <Space direction="vertical" size={16} style={{ width: '100%' }}>
          <Card className="xuzhan-admin-card" title="文章信息"><Form.Item field="title" label="标题" rules={[{ required: true, message: '请输入文章标题' }]} required><Input placeholder="文章标题" maxLength={180} showWordLimit /></Form.Item><Form.Item field="slug" label="Slug" rules={[{ required: true, message: '请输入 URL Slug' }, { match: /^[a-z0-9]+(?:[a-z0-9-]*[a-z0-9]+)?$/, message: '仅限小写英文、数字和连字符' }]} required><Input placeholder="article-slug" /></Form.Item><Form.Item field="summary" label="摘要"><Input.TextArea placeholder="用于文章列表和 SEO 描述" autoSize={{ minRows: 3 }} /></Form.Item><Form.Item field="language" label="语言"><Select options={[{ value: 'zh', label: '中文' }, { value: 'en', label: 'English' }]} /></Form.Item></Card>
          <Card className="xuzhan-admin-card" title="分类与标签"><Form.Item field="categoryId" label="分类"><Select allowClear placeholder="选择分类" options={categories.map(item => ({ value: item.id, label: item.labelZh }))} /></Form.Item><Form.Item field="tagIds" label="标签"><Select mode="multiple" allowClear placeholder="选择标签" options={tags.map(item => ({ value: item.id, label: item.name }))} /></Form.Item></Card>
          <Card className="xuzhan-admin-card" title="封面与 SEO"><Form.Item field="coverUrl" label="封面图链接" rules={[{ type: 'url', message: '请输入合法的图床链接' }]}><Input placeholder="https://…" /></Form.Item><Form.Item field="seoTitle" label="SEO 标题"><Input maxLength={70} /></Form.Item><Form.Item field="seoDescription" label="SEO 描述"><Input.TextArea autoSize={{ minRows: 3 }} maxLength={160} showWordLimit /></Form.Item></Card>
        </Space>
      </div>
    </Form>
  </>
}
