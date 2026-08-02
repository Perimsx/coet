'use client'

import { useCallback, useEffect, useState } from 'react'
import { RefreshCw, Save, Send, Key, Search } from 'lucide-react'
import {
  Button,
  Card,
  CardBody,
  CardHeader,
  CardFooter,
  Input,
  TextArea,
  Chip,
  Modal,
  ModalHeader,
  ModalBody,
  ModalFooter,
  useDisclosure,
} from '@/components/ui/heroui-helpers'
import { cmsApi } from '@/features/admin/lib/api'
import type { SEOSettings, SystemJob } from '@/features/admin/lib/types'
import { toast } from '@/shared/hooks/use-toast'
import { AdminPageHeader } from './AdminPageHeader'

type SEOForm = Omit<SEOSettings, 'revalidateConfigured' | 'indexNowConfigured' | 'baiduConfigured'>

export function SEOManagementView() {
  const [settings, setSettings] = useState<SEOSettings>()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [job, setJob] = useState<SystemJob>()
  const { isOpen, onOpen, onClose } = useDisclosure()

  const [form, setForm] = useState<SEOForm>({
    title: '',
    description: '',
    keywords: '',
    canonicalUrl: '',
    openGraphImageUrl: '',
    robotsEnabled: true,
    sitemapEnabled: true,
    rssEnabled: true,
    jsonLdEnabled: true,
  })

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const result = await cmsApi.seo()
      setSettings(result)
      setForm({
        title: result.title || '',
        description: result.description || '',
        keywords: result.keywords || '',
        canonicalUrl: result.canonicalUrl || '',
        openGraphImageUrl: result.openGraphImageUrl || '',
        robotsEnabled: result.robotsEnabled ?? true,
        sitemapEnabled: result.sitemapEnabled ?? true,
        rssEnabled: result.rssEnabled ?? true,
        jsonLdEnabled: result.jsonLdEnabled ?? true,
      })
    } catch {
      toast.error('SEO 设置加载失败')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void load()
  }, [load])

  useEffect(() => {
    if (!job || ['succeeded', 'failed'].includes(job.status)) return
    const timer = window.setInterval(
      () => cmsApi.job(job.id).then(setJob).catch(() => window.clearInterval(timer)),
      1200
    )
    return () => window.clearInterval(timer)
  }, [job])

  const save = async () => {
    try {
      setSaving(true)
      const result = await cmsApi.updateSEO(form)
      setSettings(result)
      toast.success('SEO 设置已成功保存')
    } catch {
      toast.error('保存失败，请检查填写参数')
    } finally {
      setSaving(false)
    }
  }

  const start = async (action: 'rebuild' | 'push') => {
    try {
      const result = action === 'rebuild' ? await cmsApi.rebuildSEO() : await cmsApi.pushSEO()
      setJob(result)
      toast.success(action === 'rebuild' ? 'SEO 缓存刷新任务已启动' : '搜索引擎推送任务已启动')
    } catch {
      toast.error(action === 'rebuild' ? '启动失败，请检查环境配置' : '推送失败，请配置 Key')
    } finally {
      onClose()
    }
  }

  return (
    <div className="flex flex-col gap-5">
      <AdminPageHeader
        title="SEO 与收录优化"
        subtitle="集中管理全站 OpenGraph 元数据、Sitemap/Robots 文件与搜索引擎主动推送"
        extra={
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={load}
              className="bg-zinc-100 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300 hover:bg-zinc-200 dark:hover:bg-zinc-700 px-3 py-1.5 rounded-md text-xs font-semibold inline-flex items-center justify-center gap-1.5 whitespace-nowrap shrink-0 border-0 cursor-pointer"
            >
              <RefreshCw className="w-4 h-4 shrink-0" />
              <span>刷新</span>
            </Button>
            <Button
              size="sm"
              onClick={save}
              isDisabled={saving}
              className="bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900 hover:bg-zinc-800 dark:hover:bg-zinc-200 px-3 py-1.5 rounded-md text-xs font-semibold inline-flex items-center justify-center gap-1.5 whitespace-nowrap shrink-0 border-0 cursor-pointer disabled:opacity-50"
            >
              <Save className="w-4 h-4 shrink-0" />
              <span>保存设置</span>
            </Button>
          </div>
        }
      />

      {job && (
        <div className={`p-3 rounded-lg border text-xs flex items-center justify-between ${job.status === 'failed' ? 'bg-rose-50 text-rose-600 border-rose-200' : 'bg-primary/10 text-primary border-primary/20'}`}>
          <div className="flex flex-col gap-0.5">
            <span className="font-semibold">{job.message}</span>
            <span className="text-xs opacity-80">{job.logs || `完成进度: ${job.progress}%`}</span>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-start">
        <Card className="lg:col-span-8 border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 rounded-lg">
          <CardHeader className="font-bold text-sm border-b border-zinc-100 dark:border-zinc-800/60 pb-2.5 flex items-center gap-2">
            <Search className="w-4 h-4 text-primary" />
            <span>搜索与社交分享元数据</span>
          </CardHeader>
          <CardBody className="p-4 flex flex-col gap-4">
            <div className="flex flex-col gap-1">
              <label className="text-xs font-semibold text-zinc-600 dark:text-zinc-300">全局默认 SEO 标题 (Title)</label>
              <Input
                placeholder="例如：序栈 - 程序员的个人技术博客"
                value={form.title}
                onChange={(e) => setForm((p) => ({ ...p, title: e.target.value }))}
              />
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-xs font-semibold text-zinc-600 dark:text-zinc-300">全局默认描述 (Description)</label>
              <TextArea
                placeholder="全站默认摘要与搜索引擎结果描述..."
                rows={3}
                value={form.description}
                onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))}
              />
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-xs font-semibold text-zinc-600 dark:text-zinc-300">默认关键词 (Keywords)</label>
              <Input
                placeholder="例如：Go, React, Next.js, SQLite, 博客"
                value={form.keywords}
                onChange={(e) => setForm((p) => ({ ...p, keywords: e.target.value }))}
              />
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-xs font-semibold text-zinc-600 dark:text-zinc-300">规范 URL (Canonical URL)</label>
              <Input
                placeholder="https://example.com"
                value={form.canonicalUrl}
                onChange={(e) => setForm((p) => ({ ...p, canonicalUrl: e.target.value }))}
              />
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-xs font-semibold text-zinc-600 dark:text-zinc-300">Open Graph 分享海报图 URL</label>
              <Input
                placeholder="https://example.com/og-image.jpg"
                value={form.openGraphImageUrl}
                onChange={(e) => setForm((p) => ({ ...p, openGraphImageUrl: e.target.value }))}
              />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
              <label className="flex items-center justify-between p-2.5 rounded-md border border-zinc-200 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-800/40 cursor-pointer">
                <span className="text-xs font-semibold">自动生成 Robots.txt</span>
                <input
                  type="checkbox"
                  checked={form.robotsEnabled}
                  onChange={(e) => setForm((p) => ({ ...p, robotsEnabled: e.target.checked }))}
                  className="w-4 h-4 rounded text-primary accent-primary"
                />
              </label>
              <label className="flex items-center justify-between p-2.5 rounded-md border border-zinc-200 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-800/40 cursor-pointer">
                <span className="text-xs font-semibold">自动生成 Sitemap.xml</span>
                <input
                  type="checkbox"
                  checked={form.sitemapEnabled}
                  onChange={(e) => setForm((p) => ({ ...p, sitemapEnabled: e.target.checked }))}
                  className="w-4 h-4 rounded text-primary accent-primary"
                />
              </label>
              <label className="flex items-center justify-between p-2.5 rounded-md border border-zinc-200 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-800/40 cursor-pointer">
                <span className="text-xs font-semibold">开启全站 RSS Feed</span>
                <input
                  type="checkbox"
                  checked={form.rssEnabled}
                  onChange={(e) => setForm((p) => ({ ...p, rssEnabled: e.target.checked }))}
                  className="w-4 h-4 rounded text-primary accent-primary"
                />
              </label>
              <label className="flex items-center justify-between p-2.5 rounded-md border border-zinc-200 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-800/40 cursor-pointer">
                <span className="text-xs font-semibold">嵌入结构化 JSON-LD</span>
                <input
                  type="checkbox"
                  checked={form.jsonLdEnabled}
                  onChange={(e) => setForm((p) => ({ ...p, jsonLdEnabled: e.target.checked }))}
                  className="w-4 h-4 rounded text-primary accent-primary"
                />
              </label>
            </div>
          </CardBody>
        </Card>

        <div className="lg:col-span-4 flex flex-col gap-4">
          <Card className="border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 rounded-lg">
            <CardHeader className="font-bold text-sm border-b border-zinc-100 dark:border-zinc-800/60 pb-3 flex items-center gap-2">
              <Key className="w-4 h-4 text-primary" />
              <span>搜索引擎 Key 与推送状态</span>
            </CardHeader>
            <CardBody className="p-4 flex flex-col gap-3.5">
              <div className="flex items-center justify-between text-xs">
                <span className="font-medium text-zinc-600 dark:text-zinc-300">前台 ISR 缓存刷新</span>
                <Chip size="sm" color={settings?.revalidateConfigured ? 'success' : 'warning'}>
                  {settings?.revalidateConfigured ? '已配置' : '未配置'}
                </Chip>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="font-medium text-zinc-600 dark:text-zinc-300">IndexNow 即时推送</span>
                <Chip size="sm" color={settings?.indexNowConfigured ? 'success' : 'default'}>
                  {settings?.indexNowConfigured ? '已配置' : '未配置'}
                </Chip>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="font-medium text-zinc-600 dark:text-zinc-300">百度主动推送 (Token)</span>
                <Chip size="sm" color={settings?.baiduConfigured ? 'success' : 'default'}>
                  {settings?.baiduConfigured ? '已配置' : '未配置'}
                </Chip>
              </div>

              <div className="flex flex-col gap-2 pt-3 border-t border-zinc-100 dark:border-zinc-800/60">
                <Button
                  size="sm"
                  variant="outline"
                  isDisabled={!settings?.revalidateConfigured}
                  onClick={() => start('rebuild')}
                >
                  <RefreshCw className="w-3.5 h-3.5 mr-1" />
                  手动刷新 ISR 缓存
                </Button>
                <Button
                  size="sm"
                  isDisabled={!settings?.indexNowConfigured && !settings?.baiduConfigured}
                  onClick={onOpen}
                >
                  <Send className="w-3.5 h-3.5 mr-1" />
                  主动推送全站 URL
                </Button>
              </div>
            </CardBody>
          </Card>
        </div>
      </div>

      <Modal isOpen={isOpen} onClose={onClose}>
        <ModalHeader>主动推送搜索引擎收录确认</ModalHeader>
        <ModalBody>
          <p className="text-xs text-zinc-600 dark:text-zinc-400 leading-relaxed">
            系统将调用配置的 IndexNow 与百度 API 接口，批量提交已发布文章与独立页面的最新链接，加速搜索引擎抓取。
          </p>
        </ModalBody>
        <ModalFooter>
          <Button size="sm" variant="ghost" onClick={onClose}>
            取消
          </Button>
          <Button size="sm" variant="primary" onClick={() => start('push')}>
            确认推送
          </Button>
        </ModalFooter>
      </Modal>
    </div>
  )
}
