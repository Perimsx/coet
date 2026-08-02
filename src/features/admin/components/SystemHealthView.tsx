'use client'

import { useEffect, useState } from 'react'
import { Alert, Button, Card, Descriptions, Message, Result, Space, Spin, Tag, Typography } from '@arco-design/web-react'
import { IconRefresh, IconSafe } from '@arco-design/web-react/icon'
import { cmsApi } from '@/features/admin/lib/api'
import { AdminPageHeader } from './AdminPageHeader'

type Health = { api: string; database: string; databaseSize: number }

export function SystemHealthView() {
  const [health, setHealth] = useState<Health>(); const [loading, setLoading] = useState(true); const [error, setError] = useState('')
  const load = async () => { setLoading(true);setError('');try{setHealth(await cmsApi.health())}catch{setError('无法获取系统状态，请确认 Go API 与 SQLite 文件可访问。')}finally{setLoading(false)} }
  useEffect(() => { void load() }, [])
  return <><AdminPageHeader title="系统状态" subtitle="检查 Go API 与 SQLite 运行状态" extra={<Button icon={<IconRefresh />} loading={loading} onClick={load}>重新检查</Button>} />
    {error && <Alert type="error" title={error} style={{ marginBottom: 16 }} />}
    <Card className="cot-admin-card">{loading ? <div style={{ padding: 64, textAlign: 'center' }}><Spin tip="正在检查服务" /></div> : health ? <Descriptions column={1} data={[{ label: 'Go API', value: <Tag color="green"><IconSafe />{health.api}</Tag> }, { label: 'SQLite', value: <Tag color="green"><IconSafe />{health.database}</Tag> }, { label: '数据库大小', value: `${(health.databaseSize / 1024).toFixed(1)} KB` }, { label: '维护说明', value: '备份、恢复、Git 更新将以后台任务形式执行，不会阻塞 Web 请求。' }]} /> : <Result status="error" title="系统状态不可用" subTitle="请检查 Go API 服务后重试。" />}</Card>
  </>
}
