'use client'

import { useCallback, useEffect, useState } from 'react'
import { Plus, Save, Edit, Trash2, Globe, Sparkles, Layout, Share2, Sliders } from 'lucide-react'
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
import type { FriendLink, NavigationItem } from '@/features/admin/lib/types'
import { toast } from '@/shared/hooks/use-toast'
import { siteMetadata, sitePresentationDefaults } from '@/blog.config'
import { AdminPageHeader } from './AdminPageHeader'

const DEFAULT_SETTINGS: Record<string, string> = {
  title: siteMetadata.title || '',
  headerTitle: typeof siteMetadata.headerTitle === 'string' ? siteMetadata.headerTitle : siteMetadata.title || '',
  description: siteMetadata.description || '',
  siteUrl: siteMetadata.siteUrl || '',
  author: siteMetadata.author || '',
  email: siteMetadata.email || '',
  github: siteMetadata.github || '',
  x: siteMetadata.x || '',
  yuque: siteMetadata.yuque || '',
  icp: siteMetadata.icp || '',
  policeBeian: siteMetadata.policeBeian || '',
  siteCreatedAt: (siteMetadata as any).siteCreatedAt || '2025-11-10 00:07:03',
  googleSearchConsole: (siteMetadata as any).googleSearchConsole || '',
  socialBanner: siteMetadata.socialBanner || '',
  heroGreetingPrefix: sitePresentationDefaults.hero.greetingPrefix || '你好，我是',
  heroDisplayName: sitePresentationDefaults.hero.displayName || 'Kerntau',
  heroRole: sitePresentationDefaults.hero.role || '全栈开发者',
  welcomeMessage: sitePresentationDefaults.hero.tagline || '知行合一，缄默前行。',
  heroBottomText: sitePresentationDefaults.hero.bottomText || '落子无悔，下一站见，',
  heroAvatar: sitePresentationDefaults.hero.avatarSrc || '/avatar.png',
  enableSearch: String(sitePresentationDefaults.header.featureFlags.enableSearch),
  enableSuggestion: String(sitePresentationDefaults.header.featureFlags.enableSuggestion),
  enableThemeSwitch: String(sitePresentationDefaults.header.featureFlags.enableThemeSwitch),
  footerPoweredByLabel: sitePresentationDefaults.footer.poweredByLabel || '基于',
  footerPoweredByName: sitePresentationDefaults.footer.poweredByName || '本站系统',
  footerRightsText: sitePresentationDefaults.footer.rightsText || '保留所有权利',
  footerPoliceBadgeIcon: sitePresentationDefaults.footer.policeBadgeIcon || '/static/images/ghs.png',
  friendName: '',
  friendUrl: '',
  friendAvatar: '',
  friendDescription: '',
  indexNowKey: '',
  baiduToken: '',
  baiduSearchConsole: '',
  seoKeywords: '',
}

export function SiteSettingsView() {
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [activeTab, setActiveTab] = useState<'basic' | 'hero' | 'footer' | 'social' | 'features'>('basic')
  const [settings, setSettings] = useState<Record<string, string>>({})

  useEffect(() => {
    cmsApi
      .settings()
      .then((values) => {
        const merged = { ...DEFAULT_SETTINGS }
        if (values && typeof values === 'object') {
          Object.keys(values).forEach((k) => {
            if (values[k] !== undefined && values[k] !== null && values[k] !== '') {
              merged[k] = values[k]
            }
          })
        }
        setSettings(merged)
      })
      .catch(() => {
        toast.error('站点设置加载失败，已载入前台默认配置')
        setSettings(DEFAULT_SETTINGS)
      })
      .finally(() => setLoading(false))
  }, [])

  const updateSetting = (key: string, value: string) => {
    setSettings((prev) => ({ ...prev, [key]: value }))
  }

  const save = async () => {
    try {
      setSaving(true)
      await cmsApi.updateSettings(settings)
      toast.success('站点设置已更新并同步落盘')
    } catch {
      toast.error('保存失败，请检查填写参数')
    } finally {
      setSaving(false)
    }
  }

  const tabs = [
    { id: 'basic', label: '基础信息', icon: Globe },
    { id: 'hero', label: 'Hero & 首页文案', icon: Sparkles },
    { id: 'footer', label: '页脚与备案', icon: Layout },
    { id: 'social', label: '社交媒体', icon: Share2 },
    { id: 'features', label: '功能与 SEO', icon: Sliders },
  ] as const

  return (
    <div className="flex flex-col gap-5">
      <AdminPageHeader
        title="站点设置"
        subtitle="管理全站基础配置、Hero 展现、备案信息与功能开关（数据与前台完全同步）"
        extra={
          <Button
            size="sm"
            onClick={save}
            isDisabled={saving}
            className="bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900 hover:bg-zinc-800 dark:hover:bg-zinc-200 px-3.5 py-2 rounded-xl text-xs font-semibold shadow-sm inline-flex items-center justify-center gap-1.5 whitespace-nowrap shrink-0 border-0 cursor-pointer disabled:opacity-50"
          >
            <Save className="w-4 h-4 shrink-0" />
            <span>保存全站设置</span>
          </Button>
        }
      />

      {/* 响应式 Tab 切换栏 */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none border-b border-zinc-200 dark:border-zinc-800">
        {tabs.map((tab) => {
          const Icon = tab.icon
          const isActive = activeTab === tab.id
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-3.5 py-2 text-xs font-semibold rounded-xl whitespace-nowrap transition-all ${
                isActive
                  ? 'bg-primary text-white shadow-sm'
                  : 'text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800/60'
              }`}
            >
              <Icon className="w-4 h-4" />
              <span>{tab.label}</span>
            </button>
          )
        })}
      </div>

      <Card className="border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-sm rounded-2xl">
        <CardBody className="p-4 lg:p-6">
          {loading ? (
            <div className="py-12 text-center text-xs text-zinc-400">正在加载站点全量设置...</div>
          ) : (
            <div className="flex flex-col gap-6">
              {/* 基础信息 */}
              {activeTab === 'basic' && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="flex flex-col gap-1.5 md:col-span-2">
                    <label className="text-xs font-semibold text-zinc-600 dark:text-zinc-300">站点名称 (Title)</label>
                    <Input
                      placeholder="站点标题"
                      value={settings['title'] || ''}
                      onChange={(e) => updateSetting('title', e.target.value)}
                    />
                  </div>
                  <div className="flex flex-col gap-1.5 md:col-span-2">
                    <label className="text-xs font-semibold text-zinc-600 dark:text-zinc-300">顶部导航标题 (Header Title)</label>
                    <Input
                      placeholder="顶部栏显示的标题"
                      value={settings['headerTitle'] || ''}
                      onChange={(e) => updateSetting('headerTitle', e.target.value)}
                    />
                  </div>
                  <div className="flex flex-col gap-1.5 md:col-span-2">
                    <label className="text-xs font-semibold text-zinc-600 dark:text-zinc-300">站点描述 (Description)</label>
                    <TextArea
                      rows={3}
                      placeholder="站点描述"
                      value={settings['description'] || ''}
                      onChange={(e) => updateSetting('description', e.target.value)}
                    />
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-semibold text-zinc-600 dark:text-zinc-300">站点 URL</label>
                    <Input
                      placeholder="https://example.com"
                      value={settings['siteUrl'] || ''}
                      onChange={(e) => updateSetting('siteUrl', e.target.value)}
                    />
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-semibold text-zinc-600 dark:text-zinc-300">站长/作者名称</label>
                    <Input
                      placeholder="作者名称"
                      value={settings['author'] || ''}
                      onChange={(e) => updateSetting('author', e.target.value)}
                    />
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-semibold text-zinc-600 dark:text-zinc-300">联系邮箱</label>
                    <Input
                      type="email"
                      placeholder="name@example.com"
                      value={settings['email'] || ''}
                      onChange={(e) => updateSetting('email', e.target.value)}
                    />
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-semibold text-zinc-600 dark:text-zinc-300">建站时间</label>
                    <Input
                      placeholder="YYYY-MM-DD HH:mm:ss"
                      value={settings['siteCreatedAt'] || ''}
                      onChange={(e) => updateSetting('siteCreatedAt', e.target.value)}
                    />
                  </div>
                </div>
              )}

              {/* Hero & 首页文案 */}
              {activeTab === 'hero' && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-semibold text-zinc-600 dark:text-zinc-300">问候前缀 (Greeting Prefix)</label>
                    <Input
                      placeholder="例如：你好，我是"
                      value={settings['heroGreetingPrefix'] || ''}
                      onChange={(e) => updateSetting('heroGreetingPrefix', e.target.value)}
                    />
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-semibold text-zinc-600 dark:text-zinc-300">显示名称 (Display Name)</label>
                    <Input
                      placeholder="例如：Kerntau"
                      value={settings['heroDisplayName'] || ''}
                      onChange={(e) => updateSetting('heroDisplayName', e.target.value)}
                    />
                  </div>
                  <div className="flex flex-col gap-1.5 md:col-span-2">
                    <label className="text-xs font-semibold text-zinc-600 dark:text-zinc-300">个人角色 / 头衔 (Role)</label>
                    <Input
                      placeholder="例如：全栈开发者"
                      value={settings['heroRole'] || ''}
                      onChange={(e) => updateSetting('heroRole', e.target.value)}
                    />
                  </div>
                  <div className="flex flex-col gap-1.5 md:col-span-2">
                    <label className="text-xs font-semibold text-zinc-600 dark:text-zinc-300">标语 / Slogan (Welcome Message)</label>
                    <TextArea
                      rows={2}
                      placeholder="例如：知行合一，缄默前行。"
                      value={settings['welcomeMessage'] || ''}
                      onChange={(e) => updateSetting('welcomeMessage', e.target.value)}
                    />
                  </div>
                  <div className="flex flex-col gap-1.5 md:col-span-2">
                    <label className="text-xs font-semibold text-zinc-600 dark:text-zinc-300">Hero 底部结语 (Bottom Text)</label>
                    <Input
                      placeholder="例如：落子无悔，下一站见，"
                      value={settings['heroBottomText'] || ''}
                      onChange={(e) => updateSetting('heroBottomText', e.target.value)}
                    />
                  </div>
                  <div className="flex flex-col gap-1.5 md:col-span-2">
                    <label className="text-xs font-semibold text-zinc-600 dark:text-zinc-300">头像图片 URL (Hero Avatar)</label>
                    <Input
                      placeholder="/avatar.png 或完整 URL"
                      value={settings['heroAvatar'] || ''}
                      onChange={(e) => updateSetting('heroAvatar', e.target.value)}
                    />
                  </div>
                </div>
              )}

              {/* 页脚与备案 */}
              {activeTab === 'footer' && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-semibold text-zinc-600 dark:text-zinc-300">ICP 备案号</label>
                    <Input
                      placeholder="例如：鄂ICP备2025157857号"
                      value={settings['icp'] || ''}
                      onChange={(e) => updateSetting('icp', e.target.value)}
                    />
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-semibold text-zinc-600 dark:text-zinc-300">公安备案号</label>
                    <Input
                      placeholder="例如：鄂公网安备 42018502008592号"
                      value={settings['policeBeian'] || ''}
                      onChange={(e) => updateSetting('policeBeian', e.target.value)}
                    />
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-semibold text-zinc-600 dark:text-zinc-300">页脚 Powered By 标签</label>
                    <Input
                      placeholder="例如：基于"
                      value={settings['footerPoweredByLabel'] || ''}
                      onChange={(e) => updateSetting('footerPoweredByLabel', e.target.value)}
                    />
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-semibold text-zinc-600 dark:text-zinc-300">页脚 Powered By 名称</label>
                    <Input
                      placeholder="例如：本站系统"
                      value={settings['footerPoweredByName'] || ''}
                      onChange={(e) => updateSetting('footerPoweredByName', e.target.value)}
                    />
                  </div>
                  <div className="flex flex-col gap-1.5 md:col-span-2">
                    <label className="text-xs font-semibold text-zinc-600 dark:text-zinc-300">版权文案 (Rights Text)</label>
                    <Input
                      placeholder="例如：保留所有权利"
                      value={settings['footerRightsText'] || ''}
                      onChange={(e) => updateSetting('footerRightsText', e.target.value)}
                    />
                  </div>
                  <div className="flex flex-col gap-1.5 md:col-span-2">
                    <label className="text-xs font-semibold text-zinc-600 dark:text-zinc-300">公安备案图标 URL</label>
                    <Input
                      placeholder="/static/images/ghs.png"
                      value={settings['footerPoliceBadgeIcon'] || ''}
                      onChange={(e) => updateSetting('footerPoliceBadgeIcon', e.target.value)}
                    />
                  </div>
                </div>
              )}

              {/* 社交媒体 */}
              {activeTab === 'social' && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-semibold text-zinc-600 dark:text-zinc-300">GitHub 主页 URL</label>
                    <Input
                      placeholder="https://github.com/..."
                      value={settings['github'] || ''}
                      onChange={(e) => updateSetting('github', e.target.value)}
                    />
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-semibold text-zinc-600 dark:text-zinc-300">X (Twitter) 主页 URL</label>
                    <Input
                      placeholder="https://x.com/..."
                      value={settings['x'] || ''}
                      onChange={(e) => updateSetting('x', e.target.value)}
                    />
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-semibold text-zinc-600 dark:text-zinc-300">语雀主页 URL</label>
                    <Input
                      placeholder="https://yuque.com/..."
                      value={settings['yuque'] || ''}
                      onChange={(e) => updateSetting('yuque', e.target.value)}
                    />
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-semibold text-zinc-600 dark:text-zinc-300">Social OpenGraph Banner Image</label>
                    <Input
                      placeholder="/og-image.jpg"
                      value={settings['socialBanner'] || ''}
                      onChange={(e) => updateSetting('socialBanner', e.target.value)}
                    />
                  </div>
                </div>
              )}

              {/* 功能与 SEO */}
              {activeTab === 'features' && (
                <div className="flex flex-col gap-6">
                  <div className="flex flex-col gap-3">
                    <h4 className="text-xs font-bold text-zinc-500 uppercase tracking-wider">全站功能开关</h4>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      <label className="flex items-center justify-between p-3 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-800/40 cursor-pointer">
                        <span className="text-xs font-semibold">启用搜索</span>
                        <input
                          type="checkbox"
                          checked={settings['enableSearch'] === 'true'}
                          onChange={(e) => updateSetting('enableSearch', String(e.target.checked))}
                          className="w-4 h-4 rounded text-primary"
                        />
                      </label>
                      <label className="flex items-center justify-between p-3 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-800/40 cursor-pointer">
                        <span className="text-xs font-semibold">启用留言弹窗</span>
                        <input
                          type="checkbox"
                          checked={settings['enableSuggestion'] === 'true'}
                          onChange={(e) => updateSetting('enableSuggestion', String(e.target.checked))}
                          className="w-4 h-4 rounded text-primary"
                        />
                      </label>
                      <label className="flex items-center justify-between p-3 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-800/40 cursor-pointer">
                        <span className="text-xs font-semibold">启用主题切换</span>
                        <input
                          type="checkbox"
                          checked={settings['enableThemeSwitch'] === 'true'}
                          onChange={(e) => updateSetting('enableThemeSwitch', String(e.target.checked))}
                          className="w-4 h-4 rounded text-primary"
                        />
                      </label>
                    </div>
                  </div>

                  <div className="flex flex-col gap-3 pt-2">
                    <h4 className="text-xs font-bold text-zinc-500 uppercase tracking-wider">SEO 与搜索引擎验证</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="flex flex-col gap-1.5 md:col-span-2">
                        <label className="text-xs font-semibold text-zinc-600 dark:text-zinc-300">SEO 默认关键词 (seoKeywords)</label>
                        <Input
                          placeholder="例如：博客, 技术, 全栈, React, Go"
                          value={settings['seoKeywords'] || ''}
                          onChange={(e) => updateSetting('seoKeywords', e.target.value)}
                        />
                      </div>
                      <div className="flex flex-col gap-1.5">
                        <label className="text-xs font-semibold text-zinc-600 dark:text-zinc-300">Google Search Console HTML 标签/验证 Key</label>
                        <Input
                          placeholder="Google 验证码"
                          value={settings['googleSearchConsole'] || ''}
                          onChange={(e) => updateSetting('googleSearchConsole', e.target.value)}
                        />
                      </div>
                      <div className="flex flex-col gap-1.5">
                        <label className="text-xs font-semibold text-zinc-600 dark:text-zinc-300">Baidu Search Console 验证 Key</label>
                        <Input
                          placeholder="百度验证码"
                          value={settings['baiduSearchConsole'] || ''}
                          onChange={(e) => updateSetting('baiduSearchConsole', e.target.value)}
                        />
                      </div>
                      <div className="flex flex-col gap-1.5">
                        <label className="text-xs font-semibold text-zinc-600 dark:text-zinc-300">IndexNow API Key</label>
                        <Input
                          placeholder="IndexNow 密钥"
                          value={settings['indexNowKey'] || ''}
                          onChange={(e) => updateSetting('indexNowKey', e.target.value)}
                        />
                      </div>
                      <div className="flex flex-col gap-1.5">
                        <label className="text-xs font-semibold text-zinc-600 dark:text-zinc-300">Baidu API Token</label>
                        <Input
                          placeholder="百度主动推送 Token"
                          value={settings['baiduToken'] || ''}
                          onChange={(e) => updateSetting('baiduToken', e.target.value)}
                        />
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </CardBody>
      </Card>
    </div>
  )
}

export function FriendsView() {
  const [items, setItems] = useState<FriendLink[]>([])
  const [editing, setEditing] = useState<FriendLink | null>(null)
  const { isOpen, onOpen, onClose } = useDisclosure()

  const [form, setForm] = useState<{
    name: string
    url: string
    avatarUrl?: string
    description?: string
    groupName?: string
    sortOrder?: number
    enabled?: boolean
  }>({
    name: '',
    url: '',
    avatarUrl: '',
    description: '',
    groupName: '',
    sortOrder: 0,
    enabled: true,
  })

  const load = useCallback(async () => {
    try {
      setItems(await cmsApi.friends())
    } catch {
      toast.error('友链加载失败')
    }
  }, [])

  useEffect(() => {
    void load()
  }, [load])

  const openModal = (item?: FriendLink) => {
    setEditing(item || null)
    setForm(
      item || {
        name: '',
        url: '',
        avatarUrl: '',
        description: '',
        groupName: '',
        sortOrder: 0,
        enabled: true,
      }
    )
    onOpen()
  }

  const save = async () => {
    if (!form.name.trim() || !form.url.trim()) {
      toast.error('请填写友链名称与 URL')
      return
    }
    try {
      if (editing) {
        await cmsApi.updateFriend(editing.id, form as any)
      } else {
        await cmsApi.createFriend(form as any)
      }
      toast.success('友链已成功保存')
      onClose()
      void load()
    } catch {
      toast.error('保存友链失败')
    }
  }

  const remove = async (item: FriendLink) => {
    try {
      await cmsApi.deleteFriend(item.id)
      toast.success('友链已删除')
      void load()
    } catch {
      toast.error('删除失败')
    }
  }

  return (
    <div className="flex flex-col gap-4">
      <AdminPageHeader
        title="友链"
        subtitle="管理友情链接、头像与全站展现状态"
        extra={
          <Button onClick={() => openModal()}>
            <Plus className="w-4 h-4 mr-1" />
            新增友链
          </Button>
        }
      />

      <Card className="border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-sm">
        <CardBody className="p-4">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-zinc-200 dark:border-zinc-800 text-zinc-500 pb-2">
                  <th className="pb-3 font-medium">名称 / URL</th>
                  <th className="pb-3 font-medium">分组</th>
                  <th className="pb-3 font-medium">状态</th>
                  <th className="pb-3 font-medium">排序</th>
                  <th className="pb-3 font-medium text-right">操作</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800/60">
                {items.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="py-8 text-center text-zinc-400">
                      暂无友链数据
                    </td>
                  </tr>
                ) : (
                  items.map((item) => (
                    <tr key={item.id} className="hover:bg-zinc-50/50 dark:hover:bg-zinc-800/30">
                      <td className="py-3">
                        <div className="flex flex-col gap-0.5">
                          <span className="font-semibold text-sm">{item.name}</span>
                          <span className="text-xs font-mono text-zinc-400 truncate max-w-xs">{item.url}</span>
                        </div>
                      </td>
                      <td className="py-3">{item.groupName || '默认'}</td>
                      <td className="py-3">
                        <Chip size="sm" color={item.enabled ? 'success' : 'default'}>
                          {item.enabled ? '启用' : '隐藏'}
                        </Chip>
                      </td>
                      <td className="py-3">{item.sortOrder}</td>
                      <td className="py-3 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <Button size="sm" variant="ghost" onClick={() => openModal(item)}>
                            <Edit className="w-4 h-4" />
                          </Button>
                          <Button size="sm" variant="danger" onClick={() => remove(item)}>
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </CardBody>
      </Card>

      <Modal isOpen={isOpen} onClose={onClose}>
        <ModalHeader>{editing ? '编辑友链' : '新增友链'}</ModalHeader>
        <ModalBody>
          <Input
            required
            placeholder="名称"
            value={form.name || ''}
            onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))}
          />
          <Input
            required
            placeholder="站点 URL (https://...)"
            value={form.url || ''}
            onChange={(e) => setForm((p) => ({ ...p, url: e.target.value }))}
          />
          <Input
            placeholder="头像 URL (https://...)"
            value={form.avatarUrl || ''}
            onChange={(e) => setForm((p) => ({ ...p, avatarUrl: e.target.value }))}
          />
          <TextArea
            rows={2}
            placeholder="描述"
            value={form.description || ''}
            onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))}
          />
          <Input
            placeholder="分组"
            value={form.groupName || ''}
            onChange={(e) => setForm((p) => ({ ...p, groupName: e.target.value }))}
          />
          <div className="flex items-center justify-between pt-2">
            <span className="text-sm font-medium">启用显示</span>
            <input
              type="checkbox"
              checked={form.enabled ?? true}
              onChange={(e) => setForm((p) => ({ ...p, enabled: e.target.checked }))}
              className="w-4 h-4 rounded text-primary"
            />
          </div>
        </ModalBody>
        <ModalFooter>
          <Button variant="outline" onClick={onClose}>
            取消
          </Button>
          <Button onClick={save}>保存</Button>
        </ModalFooter>
      </Modal>
    </div>
  )
}

export function NavigationView() {
  const [items, setItems] = useState<NavigationItem[]>([])
  const [loading, setLoading] = useState(true)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const data = await cmsApi.navigation()
      if (data && data.length > 0) {
        setItems(data)
      } else {
        // 如果后端没有自定义导航，使用 blog.config.ts 中的默认前台导航
        const defaultNavs: NavigationItem[] = (sitePresentationDefaults.navigation?.links || []).map((link, idx) => ({
          id: `nav-${idx}`,
          label: link.title,
          href: link.href,
          sortOrder: idx,
          enabled: true,
        }))
        setItems(defaultNavs)
      }
    } catch {
      toast.error('导航加载失败，已载入默认导航')
      const defaultNavs: NavigationItem[] = (sitePresentationDefaults.navigation?.links || []).map((link, idx) => ({
        id: `nav-${idx}`,
        label: link.title,
        href: link.href,
        sortOrder: idx,
        enabled: true,
      }))
      setItems(defaultNavs)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void load()
  }, [load])

  const add = () =>
    setItems((value) => [
      ...value,
      { id: `draft-${Date.now()}`, label: '新导航项', href: '/', sortOrder: value.length, enabled: true },
    ])

  const change = (id: string, key: keyof NavigationItem, value: any) =>
    setItems((current) => current.map((item) => (item.id === id ? { ...item, [key]: value } : item)))

  const remove = (id: string) => setItems((current) => current.filter((item) => item.id !== id))

  const save = async () => {
    try {
      await cmsApi.updateNavigation(items.map(({ children, ...item }) => item))
      toast.success('导航菜单已保存并生效')
      void load()
    } catch {
      toast.error('保存失败')
    }
  }

  return (
    <div className="flex flex-col gap-4">
      <AdminPageHeader
        title="导航菜单"
        subtitle="编辑全站顶级与子级导航菜单（数据与前台同步）"
        extra={
          <div className="flex items-center gap-2">
            <Button variant="outline" onClick={add} size="sm">
              <Plus className="w-4 h-4 mr-1" />
              新增导航项
            </Button>
            <Button onClick={save} size="sm">
              <Save className="w-4 h-4 mr-1" />
              保存导航
            </Button>
          </div>
        }
      />

      <Card className="border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-sm rounded-2xl">
        <CardBody className="p-4">
          <div className="overflow-x-auto scrollbar-none">
            <table className="w-full text-left text-sm min-w-[500px]">
              <thead>
                <tr className="border-b border-zinc-200 dark:border-zinc-800 text-zinc-500 pb-2">
                  <th className="pb-3 font-semibold text-xs">导航显示名称</th>
                  <th className="pb-3 font-semibold text-xs">目标链接 (Href)</th>
                  <th className="pb-3 font-semibold text-xs">启用状态</th>
                  <th className="pb-3 font-semibold text-xs text-right">操作</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800/60">
                {loading ? (
                  <tr>
                    <td colSpan={4} className="py-8 text-center text-xs text-zinc-400">
                      加载中...
                    </td>
                  </tr>
                ) : items.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="py-8 text-center text-xs text-zinc-400">
                      暂无导航项
                    </td>
                  </tr>
                ) : (
                  items.map((item) => (
                    <tr key={item.id} className="hover:bg-zinc-50/50 dark:hover:bg-zinc-800/30 transition-colors">
                      <td className="py-2.5 pr-2">
                        <Input
                          value={item.label}
                          onChange={(e) => change(item.id, 'label', e.target.value)}
                          className="w-full min-w-[120px]"
                        />
                      </td>
                      <td className="py-2.5 pr-2">
                        <Input
                          value={item.href}
                          onChange={(e) => change(item.id, 'href', e.target.value)}
                          className="w-full min-w-[180px]"
                        />
                      </td>
                      <td className="py-2.5">
                        <input
                          type="checkbox"
                          checked={item.enabled}
                          onChange={(e) => change(item.id, 'enabled', e.target.checked)}
                          className="w-4 h-4 rounded text-primary accent-primary cursor-pointer"
                        />
                      </td>
                      <td className="py-2.5 text-right">
                        <Button size="sm" variant="danger" onClick={() => remove(item.id)}>
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </CardBody>
      </Card>
    </div>
  )
}
