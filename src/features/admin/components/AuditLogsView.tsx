'use client'

import { useCallback, useEffect, useState } from 'react'
import { Button, Card, Message, Table, Tag, Typography } from '@arco-design/web-react'
import { IconRefresh } from '@arco-design/web-react/icon'
import { cmsApi } from '@/features/admin/lib/api'
import type { AuditLog } from '@/features/admin/lib/types'
import { AdminPageHeader } from './AdminPageHeader'

export function AuditLogsView() { const [items, setItems] = useState<AuditLog[]>([]); const [loading, setLoading] = useState(true); const load = useCallback(async () => { setLoading(true); try { setItems((await cmsApi.auditLogs()).items) } catch { Message.error('操作日志加载失败') } finally { setLoading(false) } }, []); useEffect(() => { void load() }, [load]); return <><AdminPageHeader title="操作日志" subtitle="记录登录、内容保存、发布、删除、备份和代码更新等管理员操作" extra={<Button icon={<IconRefresh />} onClick={load}>刷新</Button>} /><Card className="cot-admin-card"><div style={{ overflowX: 'auto' }}><Table rowKey="id" loading={loading} data={items} pagination={false} columns={[{ title: '操作', dataIndex: 'action', render: value => <Typography.Text style={{ fontFamily: 'monospace' }}>{value as string}</Typography.Text> }, { title: '目标', render: (_, item) => <Typography.Text>{(item as AuditLog).targetType} / {(item as AuditLog).targetId}</Typography.Text> }, { title: '结果', dataIndex: 'status', render: value => <Tag color={value === 'success' ? 'green' : 'red'}>{value as string}</Tag> }, { title: '详情', dataIndex: 'details', render: value => value || '—' }, { title: '请求 ID', dataIndex: 'requestId', render: value => <Typography.Text copyable style={{ fontFamily: 'monospace' }}>{value as string}</Typography.Text> }, { title: '时间', dataIndex: 'createdAt', render: value => new Date(value as string).toLocaleString('zh-CN') }]} /></div></Card></> }
