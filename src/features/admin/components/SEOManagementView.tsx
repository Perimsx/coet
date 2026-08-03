'use client'

import { useCallback, useEffect, useState } from 'react'
import { RefreshCw, Save, Send, Key, Search, Globe } from 'lucide-react'
import {
  Button,
  Card,
  CardBody,
  CardHeader,
  Checkbox,
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
import { useAdminHeader } from './AdminShell'

type SEOForm = Omit<
  SEOSettings,
  'revalidateConfigured' | 'indexNowConfigured' | 'baiduConfigured'
>

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
      () =>
        cmsApi
          .job(job.id)
          .then(setJob)
          .catch(() => window.clearInterval(timer)),
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
      const result =
        action === 'rebuild'
          ? await cmsApi.rebuildSEO()
          : await cmsApi.pushSEO()
      setJob(result)
      toast.success(
        action === 'rebuild'
          ? 'SEO 缓存刷新任务已启动'
          : '搜索引擎推送任务已启动'
      )
    } catch {
      toast.error(
        action === 'rebuild'
          ? '启动失败，请检查环境配置'
          : '推送失败，请配置 Key'
      )
    } finally {
      onClose()
    }
  }

  const { setHeaderContent } = useAdminHeader()

  useEffect(() => {
    setHeaderContent({
      actions: (
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="xs"
            onClick={load}
            className="h-8 shadow-2xs"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          </Button>
          <Button
            variant="primary"
            size="xs"
            onClick={save}
            isLoading={saving}
            className="h-8 font-semibold shadow-2xs whitespace-nowrap"
          >
            <Save className="w-3.5 h-3.5 mr-1" />
            <span>保存 SEO 配置</span>
          </Button>
        </div>
      ),
    })
    return () => setHeaderContent({})
  }, [loading, saving, load, save, setHeaderContent])

  return (
    <div className="flex flex-col gap-3 text-xs">

      {job && (
        <div
          className={`p-3 rounded-lg border text-xs flex items-center justify-between ${job.status === 'failed' ? 'bg-rose-50 text-rose-600 border-rose-200' : 'bg-primary/10 text-primary border-primary/20'}`}
        >
          <div className="flex flex-col gap-0.5">
            <span className="font-semibold">{job.message}</span>
            <span className="text-xs opacity-80">
              {job.logs || `完成进度: ${job.progress}%`}
            </span>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-start">
        <Card className="lg:col-span-8 border border-zinc-200/80 dark:border-zinc-800/80 bg-white dark:bg-zinc-900 rounded-xl shadow-2xs">
          <CardHeader className="px-4 pt-3.5 pb-2.5 font-bold text-xs border-b border-zinc-100 dark:border-zinc-800/60 flex items-center gap-2">
            <Globe className="w-4 h-4 text-blue-600 dark:text-blue-400" />
            <span>搜索与社交分享元数据</span>
          </CardHeader>
          <CardBody className="p-4 flex flex-col gap-4">
            <div className="flex flex-col gap-1">
              <label className="text-xs font-semibold text-zinc-600 dark:text-zinc-300">
                全局默认 SEO 标题 (Title)
              </label>
              <Input
                placeholder="例如：序栈 - 程序员的个人技术博客"
                value={form.title}
                onChange={(e) =>
                  setForm((p) => ({ ...p, title: e.target.value }))
                }
              />
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-xs font-semibold text-zinc-600 dark:text-zinc-300">
                全局默认描述 (Description)
              </label>
              <TextArea
                placeholder="全站默认摘要与搜索引擎结果描述..."
                rows={3}
                value={form.description}
                onChange={(e) =>
                  setForm((p) => ({ ...p, description: e.target.value }))
                }
              />
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-xs font-semibold text-zinc-600 dark:text-zinc-300">
                默认关键词 (Keywords)
              </label>
              <Input
                placeholder="例如：Go, React, Next.js, SQLite, 博客"
                value={form.keywords}
                onChange={(e) =>
                  setForm((p) => ({ ...p, keywords: e.target.value }))
                }
              />
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-xs font-semibold text-zinc-600 dark:text-zinc-300">
                规范 URL (Canonical URL)
              </label>
              <Input
                placeholder="https://example.com"
                value={form.canonicalUrl}
                onChange={(e) =>
                  setForm((p) => ({ ...p, canonicalUrl: e.target.value }))
                }
              />
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-xs font-semibold text-zinc-600 dark:text-zinc-300">
                Open Graph 分享海报图 URL
              </label>
              <Input
                placeholder="https://example.com/og-image.jpg"
                value={form.openGraphImageUrl}
                onChange={(e) =>
                  setForm((p) => ({ ...p, openGraphImageUrl: e.target.value }))
                }
              />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
              <div className="flex items-center justify-between p-3 rounded-xl border border-zinc-200/70 dark:border-zinc-800/70 bg-zinc-50/40 dark:bg-zinc-800/20">
                <span className="text-xs font-medium text-zinc-700 dark:text-zinc-300">
                  自动生成 Robots.txt
                </span>
                <Checkbox
                  checked={form.robotsEnabled}
                  onChange={(checked) =>
                    setForm((p) => ({ ...p, robotsEnabled: checked }))
                  }
                  aria-label="自动生成 Robots.txt"
                />
              </div>
              <div className="flex items-center justify-between p-3 rounded-xl border border-zinc-200/70 dark:border-zinc-800/70 bg-zinc-50/40 dark:bg-zinc-800/20">
                <span className="text-xs font-medium text-zinc-700 dark:text-zinc-300">
                  自动生成 Sitemap.xml
                </span>
                <Checkbox
                  checked={form.sitemapEnabled}
                  onChange={(checked) =>
                    setForm((p) => ({ ...p, sitemapEnabled: checked }))
                  }
                  aria-label="自动生成 Sitemap.xml"
                />
              </div>
              <div className="flex items-center justify-between p-3 rounded-xl border border-zinc-200/70 dark:border-zinc-800/70 bg-zinc-50/40 dark:bg-zinc-800/20">
                <span className="text-xs font-medium text-zinc-700 dark:text-zinc-300">
                  开启全站 RSS Feed
                </span>
                <Checkbox
                  checked={form.rssEnabled}
                  onChange={(checked) =>
                    setForm((p) => ({ ...p, rssEnabled: checked }))
                  }
                  aria-label="开启全站 RSS Feed"
                />
              </div>
              <div className="flex items-center justify-between p-3 rounded-xl border border-zinc-200/70 dark:border-zinc-800/70 bg-zinc-50/40 dark:bg-zinc-800/20">
                <span className="text-xs font-medium text-zinc-700 dark:text-zinc-300">
                  嵌入结构化 JSON-LD
                </span>
                <Checkbox
                  checked={form.jsonLdEnabled}
                  onChange={(checked) =>
                    setForm((p) => ({ ...p, jsonLdEnabled: checked }))
                  }
                  aria-label="嵌入结构化 JSON-LD"
                />
              </div>
            </div>
          </CardBody>
        </Card>

        <div className="lg:col-span-4 flex flex-col gap-4">
          <Card className="border border-zinc-200/80 dark:border-zinc-800/80 bg-white dark:bg-zinc-900 rounded-xl shadow-2xs">
            <CardHeader className="px-4 pt-3.5 pb-2.5 font-bold text-xs border-b border-zinc-100 dark:border-zinc-800/60 flex items-center gap-2">
              <Key className="w-4 h-4 text-blue-600 dark:text-blue-400" />
              <span>搜索引擎 Key 与推送状态</span>
            </CardHeader>
            <CardBody className="p-4 flex flex-col gap-3.5">
              <div className="flex items-center justify-between text-xs">
                <span className="font-medium text-zinc-600 dark:text-zinc-300">
                  前台 ISR 缓存刷新
                </span>
                <Chip
                  size="sm"
                  color={settings?.revalidateConfigured ? 'success' : 'warning'}
                >
                  {settings?.revalidateConfigured ? '已配置' : '未配置'}
                </Chip>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="font-medium text-zinc-600 dark:text-zinc-300">
                  IndexNow 即时推送
                </span>
                <Chip
                  size="sm"
                  color={settings?.indexNowConfigured ? 'success' : 'default'}
                >
                  {settings?.indexNowConfigured ? '已配置' : '未配置'}
                </Chip>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="font-medium text-zinc-600 dark:text-zinc-300">
                  百度主动推送 (Token)
                </span>
                <Chip
                  size="sm"
                  color={settings?.baiduConfigured ? 'success' : 'default'}
                >
                  {settings?.baiduConfigured ? '已配置' : '未配置'}
                </Chip>
              </div>

              <div className="flex flex-col gap-2 pt-3 border-t border-zinc-100 dark:border-zinc-800/60">
                <Button
                  size="xs"
                  variant="ghost"
                  isDisabled={!settings?.revalidateConfigured}
                  onClick={() => start('rebuild')}
                  className="h-8 border border-zinc-200/80 dark:border-zinc-800/80 shadow-2xs font-medium"
                >
                  <RefreshCw className="w-3.5 h-3.5 mr-1 text-blue-600 dark:text-blue-400" />
                  手动刷新 ISR 缓存
                </Button>
                <Button
                  size="xs"
                  variant="primary"
                  isDisabled={
                    !settings?.indexNowConfigured && !settings?.baiduConfigured
                  }
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
            系统将调用配置的 IndexNow 与百度 API
            接口，批量提交已发布文章与独立页面的最新链接，加速搜索引擎抓取。
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
