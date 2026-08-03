'use client'

import { useCallback, useEffect, useState } from 'react'
import {
  Plus,
  Save,
  Edit,
  Trash2,
  Globe,
  Sparkles,
  Layout,
  Share2,
  Sliders,
} from 'lucide-react'
import {
  Button,
  Card,
  CardBody,
  Checkbox,
  Input,
  TextArea,
  Chip,
  Modal,
  ModalHeader,
  ModalBody,
  ModalFooter,
  useDisclosure,
  Switch,
  ConfirmModal,
  DatePicker,
} from '@/components/ui/heroui-helpers'
import { cmsApi } from '@/features/admin/lib/api'
import type { FriendLink, NavigationItem } from '@/features/admin/lib/types'
import { toast } from '@/shared/hooks/use-toast'
import { useAdminHeader } from './AdminShell'

export function SiteSettingsView() {
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [activeTab, setActiveTab] = useState<
    'basic' | 'hero' | 'footer' | 'social' | 'features'
  >('basic')
  const [settings, setSettings] = useState<Record<string, string>>({})

  useEffect(() => {
    cmsApi
      .settings()
      .then((values) => {
        setSettings(values || {})
      })
      .catch(() => {
        toast.error('站点设置加载失败，请确认 CMS API 服务已启动')
        setSettings({})
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

  const { setHeaderContent } = useAdminHeader()

  useEffect(() => {
    setHeaderContent({
      actions: (
        <Button
          variant="primary"
          size="xs"
          onClick={save}
          isLoading={saving}
          className="h-8 font-semibold shadow-2xs whitespace-nowrap"
        >
          <Save className="w-3.5 h-3.5 mr-1" />
          <span>保存全站设置</span>
        </Button>
      ),
    })
    return () => setHeaderContent({})
  }, [save, saving, setHeaderContent])

  return (
    <div className="flex flex-col gap-3 text-xs">

      <div className="flex flex-row items-center gap-1 border-b border-zinc-200 dark:border-zinc-800 pb-2 overflow-x-auto scrollbar-none">
        {tabs.map((tab) => {
          const Icon = tab.icon
          const isActive = activeTab === tab.id
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id)}
              className={`flex flex-row items-center gap-2 px-3.5 py-2 text-xs font-medium rounded-lg cursor-pointer whitespace-nowrap transition-all border-0 outline-none ${
                isActive
                  ? 'bg-blue-50 text-blue-600 dark:bg-blue-950/60 dark:text-blue-400 font-semibold'
                  : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 hover:bg-zinc-100 dark:hover:bg-zinc-800/60'
              }`}
            >
              <Icon className="w-4 h-4 shrink-0" />
              <span>{tab.label}</span>
            </button>
          )
        })}
      </div>

      <Card className="border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 rounded-lg">
        <CardBody className="p-4">
          {loading ? (
            <div className="py-12 text-center text-xs text-zinc-400">
              正在加载站点全量设置...
            </div>
          ) : (
            <div className="flex flex-col gap-6">
              {/* 基础信息 */}
              {activeTab === 'basic' && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="flex flex-col gap-1.5 md:col-span-2">
                    <label className="text-xs font-semibold text-zinc-600 dark:text-zinc-300">
                      站点名称 (Title)
                    </label>
                    <Input
                      placeholder="站点标题"
                      value={settings['title'] || ''}
                      onChange={(e) => updateSetting('title', e.target.value)}
                    />
                  </div>
                  <div className="flex flex-col gap-1.5 md:col-span-2">
                    <label className="text-xs font-semibold text-zinc-600 dark:text-zinc-300">
                      顶部导航标题 (Header Title)
                    </label>
                    <Input
                      placeholder="顶部栏显示的标题"
                      value={settings['headerTitle'] || ''}
                      onChange={(e) =>
                        updateSetting('headerTitle', e.target.value)
                      }
                    />
                  </div>
                  <div className="flex flex-col gap-1.5 md:col-span-2">
                    <label className="text-xs font-semibold text-zinc-600 dark:text-zinc-300">
                      站点描述 (Description)
                    </label>
                    <TextArea
                      rows={3}
                      placeholder="站点描述"
                      value={settings['description'] || ''}
                      onChange={(e) =>
                        updateSetting('description', e.target.value)
                      }
                    />
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-semibold text-zinc-600 dark:text-zinc-300">
                      站点 URL
                    </label>
                    <Input
                      placeholder="https://example.com"
                      value={settings['siteUrl'] || ''}
                      onChange={(e) => updateSetting('siteUrl', e.target.value)}
                    />
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-semibold text-zinc-600 dark:text-zinc-300">
                      站长/作者名称
                    </label>
                    <Input
                      placeholder="作者名称"
                      value={settings['author'] || ''}
                      onChange={(e) => updateSetting('author', e.target.value)}
                    />
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-semibold text-zinc-600 dark:text-zinc-300">
                      联系邮箱
                    </label>
                    <Input
                      type="email"
                      placeholder="name@example.com"
                      value={settings['email'] || ''}
                      onChange={(e) => updateSetting('email', e.target.value)}
                    />
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <DatePicker
                      label="建站时间"
                      placeholder="选择建站时间..."
                      value={settings['siteCreatedAt'] || ''}
                      onChange={(e) =>
                        updateSetting('siteCreatedAt', e.target.value)
                      }
                      aria-label="建站时间"
                    />
                  </div>
                </div>
              )}

              {/* Hero & 首页文案 */}
              {activeTab === 'hero' && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-semibold text-zinc-600 dark:text-zinc-300">
                      问候前缀 (Greeting Prefix)
                    </label>
                    <Input
                      placeholder="例如：你好，我是"
                      value={settings['heroGreetingPrefix'] || ''}
                      onChange={(e) =>
                        updateSetting('heroGreetingPrefix', e.target.value)
                      }
                    />
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-semibold text-zinc-600 dark:text-zinc-300">
                      显示名称 (Display Name)
                    </label>
                    <Input
                      placeholder="例如：Kerntau"
                      value={settings['heroDisplayName'] || ''}
                      onChange={(e) =>
                        updateSetting('heroDisplayName', e.target.value)
                      }
                    />
                  </div>
                  <div className="flex flex-col gap-1.5 md:col-span-2">
                    <label className="text-xs font-semibold text-zinc-600 dark:text-zinc-300">
                      个人角色 / 头衔 (Role)
                    </label>
                    <Input
                      placeholder="例如：全栈开发者"
                      value={settings['heroRole'] || ''}
                      onChange={(e) =>
                        updateSetting('heroRole', e.target.value)
                      }
                    />
                  </div>
                  <div className="flex flex-col gap-1.5 md:col-span-2">
                    <label className="text-xs font-semibold text-zinc-600 dark:text-zinc-300">
                      标语 / Slogan (Welcome Message)
                    </label>
                    <TextArea
                      rows={2}
                      placeholder="例如：知行合一，缄默前行。"
                      value={settings['welcomeMessage'] || ''}
                      onChange={(e) =>
                        updateSetting('welcomeMessage', e.target.value)
                      }
                    />
                  </div>
                  <div className="flex flex-col gap-1.5 md:col-span-2">
                    <label className="text-xs font-semibold text-zinc-600 dark:text-zinc-300">
                      Hero 底部结语 (Bottom Text)
                    </label>
                    <Input
                      placeholder="例如：落子无悔，下一站见，"
                      value={settings['heroBottomText'] || ''}
                      onChange={(e) =>
                        updateSetting('heroBottomText', e.target.value)
                      }
                    />
                  </div>
                  <div className="flex flex-col gap-1.5 md:col-span-2">
                    <label className="text-xs font-semibold text-zinc-600 dark:text-zinc-300">
                      头像图片 URL (Hero Avatar)
                    </label>
                    <Input
                      placeholder="/avatar.png 或完整 URL"
                      value={settings['heroAvatar'] || ''}
                      onChange={(e) =>
                        updateSetting('heroAvatar', e.target.value)
                      }
                    />
                  </div>
                </div>
              )}

              {/* 页脚与备案 */}
              {activeTab === 'footer' && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-semibold text-zinc-600 dark:text-zinc-300">
                      ICP 备案号
                    </label>
                    <Input
                      placeholder="例如：鄂ICP备2025157857号"
                      value={settings['icp'] || ''}
                      onChange={(e) => updateSetting('icp', e.target.value)}
                    />
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-semibold text-zinc-600 dark:text-zinc-300">
                      公安备案号
                    </label>
                    <Input
                      placeholder="例如：鄂公网安备 42018502008592号"
                      value={settings['policeBeian'] || ''}
                      onChange={(e) =>
                        updateSetting('policeBeian', e.target.value)
                      }
                    />
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-semibold text-zinc-600 dark:text-zinc-300">
                      页脚 Powered By 标签
                    </label>
                    <Input
                      placeholder="例如：基于"
                      value={settings['footerPoweredByLabel'] || ''}
                      onChange={(e) =>
                        updateSetting('footerPoweredByLabel', e.target.value)
                      }
                    />
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-semibold text-zinc-600 dark:text-zinc-300">
                      页脚 Powered By 名称
                    </label>
                    <Input
                      placeholder="例如：本站系统"
                      value={settings['footerPoweredByName'] || ''}
                      onChange={(e) =>
                        updateSetting('footerPoweredByName', e.target.value)
                      }
                    />
                  </div>
                  <div className="flex flex-col gap-1.5 md:col-span-2">
                    <label className="text-xs font-semibold text-zinc-600 dark:text-zinc-300">
                      版权文案 (Rights Text)
                    </label>
                    <Input
                      placeholder="例如：保留所有权利"
                      value={settings['footerRightsText'] || ''}
                      onChange={(e) =>
                        updateSetting('footerRightsText', e.target.value)
                      }
                    />
                  </div>
                  <div className="flex flex-col gap-1.5 md:col-span-2">
                    <label className="text-xs font-semibold text-zinc-600 dark:text-zinc-300">
                      公安备案图标 URL
                    </label>
                    <Input
                      placeholder="/static/images/ghs.png"
                      value={settings['footerPoliceBadgeIcon'] || ''}
                      onChange={(e) =>
                        updateSetting('footerPoliceBadgeIcon', e.target.value)
                      }
                    />
                  </div>
                </div>
              )}

              {/* 社交媒体 */}
              {activeTab === 'social' && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-semibold text-zinc-600 dark:text-zinc-300">
                      GitHub 主页 URL
                    </label>
                    <Input
                      placeholder="https://github.com/..."
                      value={settings['github'] || ''}
                      onChange={(e) => updateSetting('github', e.target.value)}
                    />
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-semibold text-zinc-600 dark:text-zinc-300">
                      X (Twitter) 主页 URL
                    </label>
                    <Input
                      placeholder="https://x.com/..."
                      value={settings['x'] || ''}
                      onChange={(e) => updateSetting('x', e.target.value)}
                    />
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-semibold text-zinc-600 dark:text-zinc-300">
                      语雀主页 URL
                    </label>
                    <Input
                      placeholder="https://yuque.com/..."
                      value={settings['yuque'] || ''}
                      onChange={(e) => updateSetting('yuque', e.target.value)}
                    />
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-semibold text-zinc-600 dark:text-zinc-300">
                      Social OpenGraph Banner Image
                    </label>
                    <Input
                      placeholder="/og-image.jpg"
                      value={settings['socialBanner'] || ''}
                      onChange={(e) =>
                        updateSetting('socialBanner', e.target.value)
                      }
                    />
                  </div>
                </div>
              )}

              {/* 功能与 SEO */}
              {activeTab === 'features' && (
                <div className="flex flex-col gap-6">
                  <div className="flex flex-col gap-3">
                    <h4 className="text-xs font-bold text-zinc-500 uppercase tracking-wider">
                      全站功能开关
                    </h4>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      <div className="flex items-center justify-between p-3 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-800/40">
                        <span className="text-xs font-semibold text-zinc-700 dark:text-zinc-300">
                          启用搜索
                        </span>
                        <Switch
                          size="sm"
                          checked={settings['enableSearch'] === 'true'}
                          onChange={(checked) =>
                            updateSetting('enableSearch', String(checked))
                          }
                        />
                      </div>
                      <div className="flex items-center justify-between p-3 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-800/40">
                        <span className="text-xs font-semibold text-zinc-700 dark:text-zinc-300">
                          启用留言弹窗
                        </span>
                        <Switch
                          size="sm"
                          checked={settings['enableSuggestion'] === 'true'}
                          onChange={(checked) =>
                            updateSetting('enableSuggestion', String(checked))
                          }
                        />
                      </div>
                      <div className="flex items-center justify-between p-3 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-800/40">
                        <span className="text-xs font-semibold text-zinc-700 dark:text-zinc-300">
                          启用主题切换
                        </span>
                        <Switch
                          size="sm"
                          checked={settings['enableThemeSwitch'] === 'true'}
                          onChange={(checked) =>
                            updateSetting('enableThemeSwitch', String(checked))
                          }
                        />
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-col gap-3 pt-2">
                    <h4 className="text-xs font-bold text-zinc-500 uppercase tracking-wider">
                      SEO 与搜索引擎验证
                    </h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="flex flex-col gap-1.5 md:col-span-2">
                        <label className="text-xs font-semibold text-zinc-600 dark:text-zinc-300">
                          SEO 默认关键词 (seoKeywords)
                        </label>
                        <Input
                          placeholder="例如：博客, 技术, 全栈, React, Go"
                          value={settings['seoKeywords'] || ''}
                          onChange={(e) =>
                            updateSetting('seoKeywords', e.target.value)
                          }
                        />
                      </div>
                      <div className="flex flex-col gap-1.5">
                        <label className="text-xs font-semibold text-zinc-600 dark:text-zinc-300">
                          Google Search Console HTML 标签/验证 Key
                        </label>
                        <Input
                          placeholder="Google 验证码"
                          value={settings['googleSearchConsole'] || ''}
                          onChange={(e) =>
                            updateSetting('googleSearchConsole', e.target.value)
                          }
                        />
                      </div>
                      <div className="flex flex-col gap-1.5">
                        <label className="text-xs font-semibold text-zinc-600 dark:text-zinc-300">
                          Baidu Search Console 验证 Key
                        </label>
                        <Input
                          placeholder="百度验证码"
                          value={settings['baiduSearchConsole'] || ''}
                          onChange={(e) =>
                            updateSetting('baiduSearchConsole', e.target.value)
                          }
                        />
                      </div>
                      <div className="flex flex-col gap-1.5">
                        <label className="text-xs font-semibold text-zinc-600 dark:text-zinc-300">
                          IndexNow API Key
                        </label>
                        <Input
                          placeholder="IndexNow 密钥"
                          value={settings['indexNowKey'] || ''}
                          onChange={(e) =>
                            updateSetting('indexNowKey', e.target.value)
                          }
                        />
                      </div>
                      <div className="flex flex-col gap-1.5">
                        <label className="text-xs font-semibold text-zinc-600 dark:text-zinc-300">
                          Baidu API Token
                        </label>
                        <Input
                          placeholder="百度主动推送 Token"
                          value={settings['baiduToken'] || ''}
                          onChange={(e) =>
                            updateSetting('baiduToken', e.target.value)
                          }
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

  const [deleteTarget, setDeleteTarget] = useState<FriendLink | null>(null)

  const confirmDelete = async () => {
    if (!deleteTarget) return
    try {
      await cmsApi.deleteFriend(deleteTarget.id)
      toast.success('友链已删除')
      void load()
    } catch {
      toast.error('删除失败')
    } finally {
      setDeleteTarget(null)
    }
  }

  const { setHeaderContent } = useAdminHeader()

  useEffect(() => {
    setHeaderContent({
      titleExtra: (
        <Chip size="sm" color="primary" className="ml-1 font-mono">
          {items.length}
        </Chip>
      ),
      actions: (
        <Button
          variant="primary"
          size="xs"
          onClick={() => openModal()}
          className="h-8 font-semibold shadow-2xs whitespace-nowrap"
        >
          <Plus className="w-3.5 h-3.5 mr-1" />
          <span>新增友链</span>
        </Button>
      ),
    })
    return () => setHeaderContent({})
  }, [items.length, setHeaderContent])

  return (
    <div className="flex flex-col gap-3 text-xs">
      <Card className="border border-zinc-200/60 dark:border-zinc-800/60 bg-white dark:bg-zinc-900 shadow-2xs rounded-xl overflow-hidden">
        <CardBody className="p-3">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-zinc-200 dark:border-zinc-800 text-zinc-500 pb-2">
                  <th className="pb-3 font-semibold text-xs">名称 / URL</th>
                  <th className="pb-3 font-semibold text-xs">分组</th>
                  <th className="pb-3 font-semibold text-xs">状态</th>
                  <th className="pb-3 font-semibold text-xs">排序</th>
                  <th className="pb-3 font-semibold text-xs text-right">操作</th>
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
                  items.map((item, index) => (
                    <tr
                      key={item.id || `friend-${index}`}
                      className="hover:bg-zinc-50/50 dark:hover:bg-zinc-800/30"
                    >
                      <td className="py-3">
                        <div className="flex flex-col gap-0.5">
                          <span className="font-semibold text-sm">
                            {item.name}
                          </span>
                          <span className="text-xs font-mono text-zinc-400 truncate max-w-xs">
                            {item.url}
                          </span>
                        </div>
                      </td>
                      <td className="py-3">{item.groupName || '默认'}</td>
                      <td className="py-3">
                        <Chip
                          size="sm"
                          color={item.enabled ? 'success' : 'default'}
                        >
                          {item.enabled ? '启用' : '隐藏'}
                        </Chip>
                      </td>
                      <td className="py-3">{item.sortOrder}</td>
                      <td className="py-3 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => openModal(item)}
                          >
                            <Edit className="w-4 h-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="danger"
                            onClick={() => setDeleteTarget(item)}
                          >
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
            label="友链名称"
            required
            placeholder="例如：某某的博客"
            value={form.name || ''}
            onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))}
          />
          <Input
            label="站点 URL"
            required
            placeholder="https://..."
            value={form.url || ''}
            onChange={(e) => setForm((p) => ({ ...p, url: e.target.value }))}
          />
          <Input
            label="头像 URL (选填)"
            placeholder="https://..."
            value={form.avatarUrl || ''}
            onChange={(e) =>
              setForm((p) => ({ ...p, avatarUrl: e.target.value }))
            }
          />
          <TextArea
            label="简要描述 (选填)"
            rows={2}
            placeholder="友链站点的一句话介绍"
            value={form.description || ''}
            onChange={(e) =>
              setForm((p) => ({ ...p, description: e.target.value }))
            }
          />
          <Input
            label="所属分组 (选填)"
            placeholder="例如：技术博客"
            value={form.groupName || ''}
            onChange={(e) =>
              setForm((p) => ({ ...p, groupName: e.target.value }))
            }
          />
          <Checkbox
            checked={form.enabled ?? true}
            onChange={(checked) => setForm((p) => ({ ...p, enabled: checked }))}
            className="flex items-center justify-between pt-2"
          >
            <span className="text-sm font-medium">启用显示</span>
          </Checkbox>
        </ModalBody>
        <ModalFooter>
          <Button variant="outline" onClick={onClose}>
            取消
          </Button>
          <Button onClick={save}>保存</Button>
        </ModalFooter>
      </Modal>

      <ConfirmModal
        isOpen={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={confirmDelete}
        title="确认删除该友链？"
        description={`确定要彻底删除友链 "${deleteTarget?.name || ''}" 吗？此操作无法撤销。`}
      />
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
      setItems(data || [])
    } catch {
      toast.error('导航加载失败，请确认 CMS API 服务已启动')
      setItems([])
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
      {
        id: `draft-${Date.now()}`,
        label: '新导航项',
        href: '/',
        sortOrder: value.length,
        enabled: true,
      },
    ])

  const change = (id: string, key: keyof NavigationItem, value: any) =>
    setItems((current) =>
      current.map((item) => (item.id === id ? { ...item, [key]: value } : item))
    )

  const [deleteTargetId, setDeleteTargetId] = useState<string | null>(null)

  const confirmDelete = () => {
    if (deleteTargetId) {
      setItems((current) => current.filter((item) => item.id !== deleteTargetId))
      toast.success('导航项已移除（请点击保存生效）')
    }
    setDeleteTargetId(null)
  }

  const save = async () => {
    try {
      await cmsApi.updateNavigation(items.map(({ children, ...item }) => item))
      toast.success('导航菜单已保存并生效')
      void load()
    } catch {
      toast.error('保存失败')
    }
  }

  const { setHeaderContent } = useAdminHeader()

  useEffect(() => {
    setHeaderContent({
      titleExtra: (
        <Chip size="sm" color="primary" className="ml-1 font-mono">
          {items.length}
        </Chip>
      ),
      actions: (
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="xs"
            onClick={add}
            className="h-8 shadow-2xs whitespace-nowrap"
          >
            <Plus className="w-3.5 h-3.5 mr-1" />
            <span>新增导航项</span>
          </Button>
          <Button
            variant="primary"
            size="xs"
            onClick={save}
            className="h-8 font-semibold shadow-2xs whitespace-nowrap"
          >
            <Save className="w-3.5 h-3.5 mr-1" />
            <span>保存导航</span>
          </Button>
        </div>
      ),
    })
    return () => setHeaderContent({})
  }, [items.length, add, save, setHeaderContent])

  return (
    <div className="flex flex-col gap-3 text-xs">
      <Card className="border border-zinc-200/60 dark:border-zinc-800/60 bg-white dark:bg-zinc-900 shadow-2xs rounded-xl overflow-hidden">
        <CardBody className="p-3">
          <div className="overflow-x-auto scrollbar-none">
            <table className="w-full text-left text-sm min-w-[500px]">
              <thead>
                <tr className="border-b border-zinc-200 dark:border-zinc-800 text-zinc-500 pb-2">
                  <th className="pb-3 font-semibold text-xs">导航显示名称</th>
                  <th className="pb-3 font-semibold text-xs">
                    目标链接 (Href)
                  </th>
                  <th className="pb-3 font-semibold text-xs">启用状态</th>
                  <th className="pb-3 font-semibold text-xs text-right">
                    操作
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800/60">
                {loading ? (
                  <tr>
                    <td
                      colSpan={4}
                      className="py-8 text-center text-xs text-zinc-400"
                    >
                      加载中...
                    </td>
                  </tr>
                ) : items.length === 0 ? (
                  <tr>
                    <td
                      colSpan={4}
                      className="py-8 text-center text-xs text-zinc-400"
                    >
                      暂无导航项
                    </td>
                  </tr>
                ) : (
                  items.map((item, index) => (
                    <tr
                      key={item.id || `nav-${index}`}
                      className="hover:bg-zinc-50/50 dark:hover:bg-zinc-800/30 transition-colors"
                    >
                      <td className="py-2.5 pr-2">
                        <Input
                          value={item.label}
                          onChange={(e) =>
                            change(item.id, 'label', e.target.value)
                          }
                          className="w-full min-w-[120px]"
                        />
                      </td>
                      <td className="py-2.5 pr-2">
                        <Input
                          value={item.href}
                          onChange={(e) =>
                            change(item.id, 'href', e.target.value)
                          }
                          className="w-full min-w-[180px]"
                        />
                      </td>
                      <td className="py-2.5">
                        <Switch
                          size="sm"
                          aria-label={`启用 ${item.label}`}
                          checked={item.enabled}
                          onChange={(checked) =>
                            change(item.id, 'enabled', checked)
                          }
                        />
                      </td>
                      <td className="py-2.5 text-right">
                        <Button
                          size="sm"
                          variant="danger"
                          onClick={() => setDeleteTargetId(item.id)}
                        >
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

      <ConfirmModal
        isOpen={!!deleteTargetId}
        onClose={() => setDeleteTargetId(null)}
        onConfirm={confirmDelete}
        title="确认移除该导航项？"
        description="确定要从菜单列表中移除此导航项吗？（记得点击右上角保存导航生效）"
      />
    </div>
  )
}
