'use client'

import Link from 'next/link'
import { useCallback, useEffect, useState } from 'react'
import { Button, Card, Input, Message, Popconfirm, Select, Space, Table, Tag, Typography } from '@arco-design/web-react'
import { IconDelete, IconEdit, IconPlus, IconRefresh } from '@arco-design/web-react/icon'
import { cmsApi } from '@/features/admin/lib/api'
import type { Pagination, Post } from '@/features/admin/lib/types'
import { AdminPageHeader } from './AdminPageHeader'

const labels: Record<Post['status'], { text: string; color: 'gray' | 'green' | 'orange' | 'red' }> = {
  draft: { text: '草稿', color: 'gray' }, published: { text: '已发布', color: 'green' }, unpublished: { text: '已下线', color: 'orange' }, trash: { text: '回收站', color: 'red' },
}

export function PostsView() {
  const [data, setData] = useState<Pagination<Post>>({ items: [], page: 1, pageSize: 20, total: 0 })
  const [keyword, setKeyword] = useState('')
  const [status, setStatus] = useState<string>()
  const [loading, setLoading] = useState(true)
  const load = useCallback(async () => { setLoading(true); try { const query = new URLSearchParams({ page: '1', pageSize: '20' }); if (keyword) query.set('keyword', keyword); if (status) query.set('status', status); setData(await cmsApi.posts(`?${query}`)) } catch { Message.error('文章列表加载失败') } finally { setLoading(false) } }, [keyword, status])
  useEffect(() => { const timer = window.setTimeout(load, 250); return () => window.clearTimeout(timer) }, [load])
  const trash = async (post: Post) => { try { await cmsApi.trashPost(post.id); Message.success('文章已移入回收站'); load() } catch { Message.error('删除失败') } }
  return <>
    <AdminPageHeader title="文章" subtitle="管理 Markdown / MDX 文章的草稿、发布和回收状态" extra={<Link href="/admin/content/posts/new"><Button type="primary" icon={<IconPlus />}>新建文章</Button></Link>} />
    <Card className="cot-admin-card">
      <Space wrap style={{ marginBottom: 16 }}><Input.Search allowClear placeholder="搜索标题或 Slug" value={keyword} onChange={setKeyword} onSearch={load} style={{ width: 280 }} /><Select allowClear placeholder="全部状态" value={status} onChange={setStatus} style={{ width: 150 }} options={Object.entries(labels).map(([value, item]) => ({ value, label: item.text }))} /><Button icon={<IconRefresh />} onClick={load}>刷新</Button></Space>
      <div style={{ overflowX: 'auto' }}><Table<Post> rowKey="id" loading={loading} data={data.items} pagination={{ current: data.page, pageSize: data.pageSize, total: data.total, showTotal: true }} columns={[
        { title: '标题', dataIndex: 'title', width: 300, render: (_, post) => <Space direction="vertical" size={2}><Link href={`/admin/content/posts/${post.id}/edit`}><Typography.Text bold>{post.title}</Typography.Text></Link><Typography.Text type="secondary" style={{ fontFamily: 'monospace', fontSize: 12 }}>{post.slug}</Typography.Text></Space> },
        { title: '状态', dataIndex: 'status', width: 100, render: status => <Tag color={labels[status as Post['status']].color}>{labels[status as Post['status']].text}</Tag> },
        { title: '分类 / 标签', width: 220, render: (_, post) => <Space wrap><Typography.Text>{post.categoryName || '未分类'}</Typography.Text>{post.tags.slice(0, 2).map(tag => <Tag key={tag.id}>{tag.name}</Tag>)}</Space> },
        { title: '更新时间', dataIndex: 'updatedAt', width: 190, render: value => new Date(value).toLocaleString('zh-CN') },
        { title: '操作', width: 150, fixed: 'right', render: (_, post) => <Space><Link href={`/admin/content/posts/${post.id}/edit`}><Button type="text" icon={<IconEdit />} aria-label="编辑文章" /></Link><Popconfirm focusLock title="移入回收站" content="文章将不再在前台显示，可在后续从回收站恢复。" onOk={() => trash(post)}><Button type="text" status="danger" icon={<IconDelete />} aria-label="移入回收站" /></Popconfirm></Space> },
      ]} /></div>
    </Card>
  </>
}
