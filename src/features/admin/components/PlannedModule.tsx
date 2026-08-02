'use client'

import { Button, Card, Result } from '@arco-design/web-react'
import Link from 'next/link'
import { AdminPageHeader } from './AdminPageHeader'

export function PlannedModule({ title, description, returnTo = '/admin/dashboard' }: { title: string; description: string; returnTo?: string }) {
  return <><AdminPageHeader title={title} subtitle={description} /><Card className="cot-admin-card"><Result status="info" title="该模块已纳入 CMS 设计" subTitle="第一阶段优先交付文章、分类、标签、站点健康与安全会话。此模块将在下一阶段连接对应的 Go API、后台任务和审计记录。" extra={<Link href={returnTo}><Button type="primary">返回控制台</Button></Link>} /></Card></>
}
