'use client'

import { useCallback, useEffect, useState } from 'react'
import { Button, Card, Message, Select, Space, Table, Tag, Typography } from '@arco-design/web-react'
import { IconRefresh } from '@arco-design/web-react/icon'
import { cmsApi } from '@/features/admin/lib/api'
import type { Comment, Suggestion } from '@/features/admin/lib/types'
import { AdminPageHeader } from './AdminPageHeader'

const commentLabels: Record<Comment['status'], string> = { pending: '待审核', approved: '已通过', hidden: '已隐藏', spam: '垃圾评论', deleted: '已删除' }
const suggestionLabels: Record<Suggestion['status'], string> = { unread: '未读', read: '已读', archived: '已归档', deleted: '已删除' }
const statusColor = (status: string) => status === 'approved' || status === 'read' ? 'green' : status === 'pending' || status === 'unread' ? 'orange' : status === 'spam' || status === 'deleted' ? 'red' : 'gray'

export function CommentsView() {
  const [items, setItems] = useState<Comment[]>([]); const [status, setStatus] = useState<Comment['status']>(); const [loading, setLoading] = useState(true)
  const load = useCallback(async () => { setLoading(true); try { setItems((await cmsApi.comments(status)).items) } catch { Message.error('评论加载失败') } finally { setLoading(false) } }, [status])
  useEffect(() => { void load() }, [load])
  const update = async (item: Comment, next: Exclude<Comment['status'], 'pending'>) => { try { await cmsApi.updateCommentStatus(item.id, next); Message.success('评论状态已更新'); void load() } catch { Message.error('状态更新失败') } }
  const columns = [
    { title: '作者', width: 180, render: (_: unknown, item: Comment) => <Space direction="vertical" size={2}><Typography.Text bold>{item.authorName}</Typography.Text><Typography.Text type="secondary">{item.authorEmail || '未提供邮箱'}</Typography.Text></Space> },
    { title: '评论内容', dataIndex: 'content', render: (value: string) => <Typography.Paragraph ellipsis={{ rows: 2, showTooltip: true }} style={{ marginBottom: 0, minWidth: 260 }}>{value}</Typography.Paragraph> },
    { title: '状态', dataIndex: 'status', render: (value: Comment['status']) => <Tag color={statusColor(value)}>{commentLabels[value]}</Tag> },
    { title: '时间', dataIndex: 'createdAt', render: (value: string) => new Date(value).toLocaleString('zh-CN') },
    { title: '操作', width: 210, render: (_: unknown, item: Comment) => <Space>{item.status !== 'approved' && <Button type="text" onClick={() => update(item, 'approved')}>通过</Button>}<Button type="text" onClick={() => update(item, 'hidden')}>隐藏</Button><Button type="text" status="danger" onClick={() => update(item, 'spam')}>垃圾</Button></Space> },
  ]
  return <><AdminPageHeader title="评论审核" subtitle="审核、隐藏或标记前台提交的评论；默认待审核，不会自动公开" extra={<Button icon={<IconRefresh />} onClick={load}>刷新</Button>} /><Card className="xuzhan-admin-card"><Select allowClear placeholder="全部状态" value={status} onChange={value => setStatus(value as Comment['status'] | undefined)} style={{ width: 150, marginBottom: 16 }} options={Object.entries(commentLabels).map(([value, label]) => ({ value, label }))} /><div style={{ overflowX: 'auto' }}><Table<Comment> rowKey="id" loading={loading} data={items} pagination={false} columns={columns} /></div></Card></>
}

export function SuggestionsView() {
  const [items, setItems] = useState<Suggestion[]>([]); const [status, setStatus] = useState<Suggestion['status']>(); const [loading, setLoading] = useState(true)
  const load = useCallback(async () => { setLoading(true); try { setItems((await cmsApi.suggestions(status)).items) } catch { Message.error('留言加载失败') } finally { setLoading(false) } }, [status])
  useEffect(() => { void load() }, [load])
  const update = async (item: Suggestion, next: Suggestion['status']) => { try { await cmsApi.updateSuggestionStatus(item.id, next); Message.success('留言状态已更新'); void load() } catch { Message.error('状态更新失败') } }
  const columns = [
    { title: '联系方式', dataIndex: 'contact', width: 220, render: (value: string) => value || '未提供' },
    { title: '建议内容', dataIndex: 'content', render: (value: string) => <Typography.Paragraph ellipsis={{ rows: 2, showTooltip: true }} style={{ marginBottom: 0, minWidth: 320 }}>{value}</Typography.Paragraph> },
    { title: '状态', dataIndex: 'status', render: (value: Suggestion['status']) => <Tag color={statusColor(value)}>{suggestionLabels[value]}</Tag> },
    { title: '时间', dataIndex: 'createdAt', render: (value: string) => new Date(value).toLocaleString('zh-CN') },
    { title: '操作', width: 160, render: (_: unknown, item: Suggestion) => <Space>{item.status === 'unread' && <Button type="text" onClick={() => update(item, 'read')}>标为已读</Button>}<Button type="text" onClick={() => update(item, 'archived')}>归档</Button></Space> },
  ]
  return <><AdminPageHeader title="留言建议" subtitle="查看访客的联系信息和建议，标记阅读或归档以保持收件箱清晰" extra={<Button icon={<IconRefresh />} onClick={load}>刷新</Button>} /><Card className="xuzhan-admin-card"><Select allowClear placeholder="全部状态" value={status} onChange={value => setStatus(value as Suggestion['status'] | undefined)} style={{ width: 150, marginBottom: 16 }} options={Object.entries(suggestionLabels).map(([value, label]) => ({ value, label }))} /><div style={{ overflowX: 'auto' }}><Table<Suggestion> rowKey="id" loading={loading} data={items} pagination={false} columns={columns} /></div></Card></>
}
