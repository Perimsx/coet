'use client'

import { useCallback, useEffect, useState } from 'react'
import { Alert, Button, Card, Descriptions, Form, Input, Message, Popconfirm, Space, Switch, Tag, Typography } from '@arco-design/web-react'
import { IconRefresh, IconSave, IconSend } from '@arco-design/web-react/icon'
import { cmsApi } from '@/features/admin/lib/api'
import type { SEOSettings, SystemJob } from '@/features/admin/lib/types'
import { AdminPageHeader } from './AdminPageHeader'

type SEOForm = Omit<SEOSettings, 'revalidateConfigured' | 'indexNowConfigured' | 'baiduConfigured'>

export function SEOManagementView() {
  const [form] = Form.useForm<SEOForm>()
  const [settings, setSettings] = useState<SEOSettings>()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [job, setJob] = useState<SystemJob>()
  const load = useCallback(async () => { setLoading(true); try { const result = await cmsApi.seo(); setSettings(result); form.setFieldsValue(result) } catch { Message.error('SEO 设置加载失败') } finally { setLoading(false) } }, [form])
  useEffect(() => { void load() }, [load])
  useEffect(() => { if (!job || ['succeeded', 'failed'].includes(job.status)) return; const timer = window.setInterval(() => cmsApi.job(job.id).then(setJob).catch(() => window.clearInterval(timer)), 1200); return () => window.clearInterval(timer) }, [job])
  const save = async () => { try { setSaving(true); const values = await form.validate(); const result = await cmsApi.updateSEO(values); setSettings(result); Message.success('SEO 设置已保存') } catch { Message.error('保存失败，请检查 URL 与字段长度') } finally { setSaving(false) } }
  const start = async (action: 'rebuild' | 'push') => { try { const result = action === 'rebuild' ? await cmsApi.rebuildSEO() : await cmsApi.pushSEO(); setJob(result); Message.success(action === 'rebuild' ? 'SEO 缓存刷新任务已开始' : '搜索引擎推送任务已开始') } catch { Message.error(action === 'rebuild' ? '无法启动缓存刷新：请确认 Revalidate 配置' : '无法启动推送：请确认 IndexNow 或百度密钥配置') } }
  return <>
    <AdminPageHeader title="SEO 设置" subtitle="管理公开元数据与索引开关；IndexNow、百度和缓存密钥只从服务器环境读取，页面不会回显" extra={<Space><Button icon={<IconRefresh />} onClick={load} loading={loading}>刷新</Button><Button type="primary" icon={<IconSave />} onClick={save} loading={saving}>保存设置</Button></Space>} />
    {job && <Alert type={job.status === 'failed' ? 'error' : 'info'} title={job.message} content={job.logs || `进度 ${job.progress}%`} style={{ marginBottom: 16 }} />}
    <div className="xuzhan-admin-editor-grid"><Card className="xuzhan-admin-card" loading={loading} title="搜索与分享元数据"><Form form={form} layout="vertical"><Form.Item field="title" label="默认 Title"><Input maxLength={70} showWordLimit /></Form.Item><Form.Item field="description" label="默认 Description"><Input.TextArea maxLength={300} showWordLimit autoSize={{ minRows: 3 }} /></Form.Item><Form.Item field="keywords" label="Keywords"><Input maxLength={500} placeholder="Go, SQLite, CMS" /></Form.Item><Form.Item field="canonicalUrl" label="Canonical URL" rules={[{ type: 'url', message: '请输入合法 URL' }]}><Input placeholder="https://blog.example.com" /></Form.Item><Form.Item field="openGraphImageUrl" label="Open Graph 图床链接" rules={[{ type: 'url', message: '请输入合法 URL' }]}><Input placeholder="https://…" /></Form.Item><Form.Item field="robotsEnabled" label="生成 Robots"><Switch /></Form.Item><Form.Item field="sitemapEnabled" label="生成 Sitemap"><Switch /></Form.Item><Form.Item field="rssEnabled" label="生成 RSS"><Switch /></Form.Item><Form.Item field="jsonLdEnabled" label="输出 JSON-LD"><Switch /></Form.Item></Form></Card>
      <Space direction="vertical" size={16} style={{ width: '100%' }}><Card className="xuzhan-admin-card" title="任务与密钥状态"><Descriptions column={1} data={[{ label: '前台缓存刷新', value: <Tag color={settings?.revalidateConfigured ? 'green' : 'orange'}>{settings?.revalidateConfigured ? '已配置' : '未配置'}</Tag> }, { label: 'IndexNow', value: <Tag color={settings?.indexNowConfigured ? 'green' : 'gray'}>{settings?.indexNowConfigured ? '已配置' : '未配置'}</Tag> }, { label: '百度推送', value: <Tag color={settings?.baiduConfigured ? 'green' : 'gray'}>{settings?.baiduConfigured ? '已配置' : '未配置'}</Tag> }]} /><Typography.Paragraph type="secondary" style={{ marginTop: 16 }}>推送任务只发送已发布文章、首页、文章列表与 Sitemap，不会传递草稿或后台数据。</Typography.Paragraph><Space wrap><Button onClick={() => start('rebuild')} disabled={!settings?.revalidateConfigured}>刷新 SEO 缓存</Button><Popconfirm title="提交搜索引擎" content="将向已配置的 IndexNow 和/或百度服务提交公开 URL。" onOk={() => start('push')}><Button icon={<IconSend />} type="primary" disabled={!settings?.indexNowConfigured && !settings?.baiduConfigured}>推送收录</Button></Popconfirm></Space></Card><Card className="xuzhan-admin-card" title="配置说明"><Typography.Paragraph>在 Go 服务环境设置 `CMS_NEXT_REVALIDATE_URL` 与 `CMS_NEXT_REVALIDATE_SECRET` 后，可刷新 Next 缓存。</Typography.Paragraph><Typography.Paragraph>设置 `CMS_INDEXNOW_KEY` 或 `CMS_BAIDU_PUSH_TOKEN` 后才允许提交搜索引擎；密钥不会保存至 SQLite。</Typography.Paragraph></Card></Space></div>
  </>
}
