'use client'

import { useCallback, useEffect, useState } from 'react'
import { Button, Card, Form, Input, Message, Modal, Popconfirm, Space, Table, Tag, Typography } from '@arco-design/web-react'
import { IconDelete, IconEdit, IconPlus, IconRefresh, IconSend } from '@arco-design/web-react/icon'
import { cmsApi } from '@/features/admin/lib/api'
import type { Page } from '@/features/admin/lib/types'
import { AdminPageHeader } from './AdminPageHeader'

type PageInput = Pick<Page, 'title' | 'slug' | 'content' | 'seoTitle' | 'seoDescription'>
const pageStatuses: Record<Page['status'], { text: string; color: 'gray' | 'green' | 'orange' | 'red' }> = {
  draft: { text: '草稿', color: 'gray' }, published: { text: '已发布', color: 'green' }, unpublished: { text: '已下线', color: 'orange' }, trash: { text: '回收站', color: 'red' },
}

export function PagesView() {
  const [items, setItems] = useState<Page[]>([])
  const [loading, setLoading] = useState(true)
  const [visible, setVisible] = useState(false)
  const [editing, setEditing] = useState<Page>()
  const [saving, setSaving] = useState(false)
  const [form] = Form.useForm<PageInput>()
  const load = useCallback(async () => {
    setLoading(true)
    try { setItems((await cmsApi.pages()).items) } catch { Message.error('独立页面加载失败') } finally { setLoading(false) }
  }, [])
  useEffect(() => { void load() }, [load])
  const open = (page?: Page) => { setEditing(page); form.resetFields(); if (page) form.setFieldsValue(page); setVisible(true) }
  const save = async () => {
    try { setSaving(true); const values = await form.validate(); editing ? await cmsApi.updatePage(editing.id, values) : await cmsApi.createPage(values); Message.success('页面已保存'); setVisible(false); void load() } catch { Message.error('保存失败，请检查标题和 Slug 是否重复') } finally { setSaving(false) }
  }
  const changeStatus = async (page: Page, action: 'publish' | 'unpublish' | 'trash') => {
    try { if (action === 'publish') await cmsApi.publishPage(page.id); if (action === 'unpublish') await cmsApi.unpublishPage(page.id); if (action === 'trash') await cmsApi.trashPage(page.id); Message.success(action === 'trash' ? '页面已移入回收站' : action === 'publish' ? '页面已发布' : '页面已下线'); void load() } catch { Message.error('状态更新失败') }
  }
  const columns = [
    { title: '标题', render: (_: unknown, raw: Page) => <Space direction="vertical" size={2}><Typography.Text bold>{raw.title}</Typography.Text><Typography.Text type="secondary" style={{ fontFamily: 'monospace' }}>/{raw.slug}</Typography.Text></Space> },
    { title: '状态', dataIndex: 'status', render: (value: Page['status']) => <Tag color={pageStatuses[value].color}>{pageStatuses[value].text}</Tag> },
    { title: '更新时间', dataIndex: 'updatedAt', render: (value: string) => new Date(value).toLocaleString('zh-CN') },
    { title: '操作', width: 220, render: (_: unknown, page: Page) => <Space><Button type="text" icon={<IconEdit />} aria-label="编辑页面" onClick={() => open(page)} />{page.status !== 'published' && <Button type="text" icon={<IconSend />} onClick={() => changeStatus(page, 'publish')}>发布</Button>}{page.status === 'published' && <Button type="text" onClick={() => changeStatus(page, 'unpublish')}>下线</Button>}<Popconfirm title="移入回收站" content="页面将不再对外显示。" onOk={() => changeStatus(page, 'trash')}><Button type="text" status="danger" icon={<IconDelete />} aria-label="删除页面" /></Popconfirm></Space> },
  ]
  return <>
    <AdminPageHeader title="独立页面" subtitle="管理关于页、隐私政策和版权说明；正文以 Markdown 原文保存至 SQLite" extra={<Button type="primary" icon={<IconPlus />} onClick={() => open()}>新建页面</Button>} />
    <Card className="xuzhan-admin-card"><Space style={{ marginBottom: 16 }}><Button icon={<IconRefresh />} onClick={load}>刷新</Button></Space><div style={{ overflowX: 'auto' }}><Table<Page> rowKey="id" loading={loading} data={items} pagination={false} columns={columns} /></div></Card>
    <Modal title={editing ? '编辑独立页面' : '新建独立页面'} visible={visible} onCancel={() => setVisible(false)} onOk={save} okText="保存" confirmLoading={saving} style={{ width: 760 }} unmountOnExit><Form form={form} layout="vertical"><Form.Item field="title" label="标题" rules={[{ required: true, message: '请输入标题' }]}><Input maxLength={180} /></Form.Item><Form.Item field="slug" label="Slug" rules={[{ required: true, message: '请输入 URL Slug' }, { match: /^[a-z0-9]+(?:[a-z0-9-]*[a-z0-9]+)?$/, message: '仅限小写英文、数字和连字符' }]}><Input placeholder="about" /></Form.Item><Form.Item field="content" label="Markdown 正文" rules={[{ required: true, message: '请输入正文' }]}><Input.TextArea autoSize={{ minRows: 14 }} /></Form.Item><Form.Item field="seoTitle" label="SEO 标题"><Input maxLength={70} /></Form.Item><Form.Item field="seoDescription" label="SEO 描述"><Input.TextArea maxLength={160} showWordLimit autoSize={{ minRows: 3 }} /></Form.Item></Form></Modal>
  </>
}
