'use client'

import { useEffect, useState } from 'react'
import { Alert, Card, Grid, Message, Skeleton, Space, Statistic, Typography } from '@arco-design/web-react'
import { IconBook, IconFile, IconTags } from '@arco-design/web-react/icon'
import { cmsApi } from '@/features/admin/lib/api'
import type { DashboardSummary } from '@/features/admin/lib/types'
import { AdminPageHeader } from './AdminPageHeader'

export function DashboardView() {
  const [summary, setSummary] = useState<DashboardSummary>()
  const [error, setError] = useState('')
  const load = () => { setError(''); cmsApi.summary().then(setSummary).catch(() => setError('无法加载仪表盘数据，请检查 CMS API 状态。')) }
  useEffect(load, [])
  const cards = [
    { label: '已发布文章', value: summary?.publishedPosts, icon: <IconBook /> },
    { label: '草稿文章', value: summary?.draftPosts, icon: <IconFile /> },
    { label: '分类', value: summary?.categories, icon: <IconTags /> },
    { label: '标签', value: summary?.tags, icon: <IconTags /> },
  ]
  return <>
    <AdminPageHeader title="仪表盘" subtitle="内容发布与系统状态概览" />
    {error && <Alert type="error" closable title={error} style={{ marginBottom: 16 }} onClose={() => setError('')} />}
    <Grid.Row gutter={16}>
      {cards.map(card => <Grid.Col key={card.label} xs={24} sm={12} xl={6} style={{ marginBottom: 16 }}>
        <Card className="xuzhan-admin-card"><Space direction="vertical" size={8}><Typography.Text type="secondary">{card.icon} {card.label}</Typography.Text>{summary ? <Statistic className="xuzhan-admin-stat-value" value={card.value ?? 0} /> : <Skeleton text={{ rows: 1, width: 80 }} animation />}</Space></Card>
      </Grid.Col>)}
    </Grid.Row>
    <Grid.Row gutter={16}>
      <Grid.Col xs={24} lg={14} style={{ marginBottom: 16 }}><Card className="xuzhan-admin-card" title="开始管理内容"><Typography.Paragraph type="secondary">文章、分类和标签都通过 Go API 与 SQLite 保存。文章发布后，下一阶段会接入前台缓存刷新与 SEO 任务。</Typography.Paragraph></Card></Grid.Col>
      <Grid.Col xs={24} lg={10} style={{ marginBottom: 16 }}><Card className="xuzhan-admin-card" title="工作流"><Typography.Paragraph>1. 新建或编辑 Markdown/MDX 文章</Typography.Paragraph><Typography.Paragraph>2. 保存为草稿并预览</Typography.Paragraph><Typography.Paragraph>3. 发布后由系统任务刷新前台</Typography.Paragraph></Card></Grid.Col>
    </Grid.Row>
  </>
}
