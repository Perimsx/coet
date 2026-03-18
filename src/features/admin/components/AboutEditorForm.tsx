'use client'

import { useEffect, useMemo, useState, useTransition } from 'react'
import { DeleteOutlined, PlusOutlined, ReloadOutlined, SaveOutlined } from '@ant-design/icons'
import {
  App,
  Button,
  Card,
  Col,
  Input,
  Row,
  Select,
  Space,
  Switch,
  Tabs,
  Tag,
  Typography,
} from 'antd'
import type { TabsProps } from 'antd'

import { renderMarkdownPreviewAction, saveAboutPageAction } from '@/app/admin/actions'
import techStack from '@/config/tech-stack'
import AboutProfileShowcase from '@/features/content/components/AboutProfileShowcase'
import {
  type AboutSocialItem,
  type AboutTechItem,
  buildAboutProfileViewModel,
  normalizeAboutSocials,
  normalizeAboutTechStacks,
  readNumber,
  readString,
} from '@/features/content/lib/about-profile'

import AboutIconPicker from './about/AboutIconPicker'

const { Paragraph, Text, Title } = Typography
const { TextArea } = Input

const SOCIAL_PLATFORM_OPTIONS = [
  { label: 'GitHub', value: 'github' },
  { label: 'Twitter', value: 'twitter' },
  { label: 'X', value: 'x' },
  { label: '邮箱', value: 'mail' },
  { label: 'LinkedIn', value: 'linkedin' },
  { label: 'Bluesky', value: 'bluesky' },
  { label: 'Instagram', value: 'instagram' },
  { label: 'YouTube', value: 'youtube' },
  { label: 'Facebook', value: 'facebook' },
  { label: 'Medium', value: 'medium' },
  { label: 'Mastodon', value: 'mastodon' },
  { label: 'Threads', value: 'threads' },
  { label: '抖音', value: 'douyin' },
  { label: 'Bilibili', value: 'bilibili' },
  { label: '语雀', value: 'yuque' },
]

type AboutEditorInitialData = {
  frontmatter: Record<string, unknown>
  content: string
}

/**
 * 关于页编辑器状态
 */
type AboutEditorFormState = {
  name: string
  email: string
  avatar: string
  birthYear?: number
  birthMonth?: number
  showBirthday: boolean
  socials: AboutSocialItem[]
  techStacks: AboutTechItem[]
  content: string
}

function createInitialState(initialData: AboutEditorInitialData): AboutEditorFormState {
  const frontmatter = initialData.frontmatter || {}

  return {
    name: readString(frontmatter.name),
    email: readString(frontmatter.email),
    avatar: readString(frontmatter.avatar),
    birthYear: readNumber(frontmatter.birthYear),
    birthMonth: readNumber(frontmatter.birthMonth),
    showBirthday: frontmatter.showBirthday !== false,
    socials: normalizeAboutSocials(frontmatter),
    techStacks: normalizeAboutTechStacks(frontmatter).map((item) => ({
      name: item.name,
      level: item.level,
      icon: item.icon,
    })),
    content: initialData.content || '',
  }
}

function FieldLabel({ label, hint }: { label: string; hint?: string }) {
  return (
    <div className="admin-about-field-label">
      <Text strong>{label}</Text>
      {hint ? <div className="admin-about-field-hint">{hint}</div> : null}
    </div>
  )
}

function ActionButtons({
  onReset,
  onSave,
  savePending,
  saveDisabled,
}: {
  onReset: () => void
  onSave: () => void
  savePending: boolean
  saveDisabled: boolean
}) {
  return (
    <Space wrap>
      <Button icon={<ReloadOutlined />} onClick={onReset} disabled={savePending}>
        恢复最近保存
      </Button>
      <Button
        type="primary"
        icon={<SaveOutlined />}
        onClick={onSave}
        loading={savePending}
        disabled={saveDisabled}
      >
        保存关于页
      </Button>
    </Space>
  )
}

/**
 * 通用区块外壳组件
 */
function SectionShell({
  title,
  description,
  extra,
  children,
}: {
  title: string
  description: string
  extra?: React.ReactNode
  children: React.ReactNode
}) {
  return (
    <Card className="admin-panel-card admin-about-section">
      <div className="admin-about-section-head">
        <div>
          <Title level={4} className="admin-about-section-title">
            {title}
          </Title>
          <Paragraph type="secondary" className="admin-about-section-desc">
            {description}
          </Paragraph>
        </div>
        {extra}
      </div>
      {children}
    </Card>
  )
}

/**
 * 关于页编辑器主组件 (AboutEditorForm)
 */
export default function AboutEditorForm({ initialData }: { initialData: AboutEditorInitialData }) {
  const { message } = App.useApp()
  const [savePending, startSave] = useTransition()
  const initialState = useMemo(() => createInitialState(initialData), [initialData])
  const [savedState, setSavedState] = useState(initialState)
  const [formData, setFormData] = useState(initialState)
  const [previewHtml, setPreviewHtml] = useState('')
  const [previewLoading, setPreviewLoading] = useState(false)
  const [activeSocialIndex, setActiveSocialIndex] = useState(0)
  const [activeTechIndex, setActiveTechIndex] = useState(0)

  const isDirty = useMemo(
    () => JSON.stringify(formData) !== JSON.stringify(savedState),
    [formData, savedState]
  )
  const hasPreviewContent = Boolean(formData.content.trim())
  const previewStatus = previewLoading
    ? '预览生成中'
    : hasPreviewContent
      ? '预览已同步'
      : '暂无正文'
  const isSaveDisabled = savePending || !formData.name.trim()
  const statusLabel = isDirty ? '存在未保存修改' : '内容已保存'
  const statusColor = isDirty ? 'gold' : 'green'
  const saveHint = formData.name.trim() ? '姓名已填写，可直接保存' : '请先填写姓名再保存'
  const socialCount = formData.socials.length
  const techCount = formData.techStacks.length
  const contentLength = formData.content.trim().length
  const contentSummary = contentLength ? `${contentLength} 字` : '未填写'
  const socialLabelMap = useMemo(
    () => new Map(SOCIAL_PLATFORM_OPTIONS.map((option) => [option.value, option.label])),
    []
  )
  const techOptions = useMemo(
    () => techStack.map((tech) => ({ label: tech.name, value: tech.name })),
    []
  )

  useEffect(() => {
    setSavedState(initialState)
    setFormData(initialState)
  }, [initialState])

  useEffect(() => {
    if (!formData.content.trim()) {
      setPreviewHtml('')
      return
    }

    const timer = setTimeout(async () => {
      setPreviewLoading(true)
      try {
        const result = await renderMarkdownPreviewAction(formData.content)
        setPreviewHtml(result.html)
      } catch {
        message.error('正文预览生成失败')
      } finally {
        setPreviewLoading(false)
      }
    }, 260)

    return () => clearTimeout(timer)
  }, [formData.content, message])

  useEffect(() => {
    if (activeSocialIndex >= formData.socials.length) {
      setActiveSocialIndex(Math.max(0, formData.socials.length - 1))
    }
  }, [activeSocialIndex, formData.socials.length])

  useEffect(() => {
    if (activeTechIndex >= formData.techStacks.length) {
      setActiveTechIndex(Math.max(0, formData.techStacks.length - 1))
    }
  }, [activeTechIndex, formData.techStacks.length])

  const previewProfile = useMemo(() => buildAboutProfileViewModel(formData), [formData])

  const updateField = <K extends keyof AboutEditorFormState>(
    field: K,
    value: AboutEditorFormState[K]
  ) => {
    setFormData((current) => ({ ...current, [field]: value }))
  }

  const updateListItem = <T extends AboutSocialItem | AboutTechItem>(
    field: 'socials' | 'techStacks',
    index: number,
    patch: Partial<T>
  ) => {
    const list = formData[field] as T[]
    updateField(
      field,
      list.map((item, currentIndex) =>
        currentIndex === index ? { ...item, ...patch } : item
      ) as AboutEditorFormState[typeof field]
    )
  }

  const removeListItem = (field: 'socials' | 'techStacks', index: number) => {
    updateField(
      field,
      (formData[field] as AboutSocialItem[] | AboutTechItem[]).filter(
        (_, currentIndex) => currentIndex !== index
      ) as AboutEditorFormState[typeof field]
    )
  }

  const handleReset = () => {
    setFormData(savedState)
    message.success('已恢复到最近一次保存状态')
  }

  const handleSave = () => {
    if (!formData.name.trim()) {
      message.error('姓名不能为空')
      return
    }

    startSave(async () => {
      const sanitizedTechStacks = formData.techStacks.map((item) => ({
        name: item.name,
        icon: item.icon,
      }))
      const payload = new FormData()
      payload.set('name', formData.name)
      payload.set('email', formData.email)
      payload.set('avatar', formData.avatar)
      payload.set('showBirthday', String(formData.showBirthday))
      payload.set('socials', JSON.stringify(formData.socials))
      payload.set('techStacks', JSON.stringify(sanitizedTechStacks))
      payload.set('content', formData.content)

      if (formData.birthYear) payload.set('birthYear', String(formData.birthYear))
      if (formData.birthMonth) payload.set('birthMonth', String(formData.birthMonth))

      const result = await saveAboutPageAction({} as never, payload)
      if (result.error) {
        message.error(result.error)
        return
      }

      setSavedState(formData)
      message.success(result.success || '关于页已保存')
    })
  }

  const getSocialLabel = (value: string) => socialLabelMap.get(value) || value
  const activeSocial = formData.socials[activeSocialIndex]
  const activeTech = formData.techStacks[activeTechIndex]

  const tabItems = useMemo<TabsProps['items']>(
    () => [
      {
        key: 'basic',
        label: '基础资料',
        children: (
          <SectionShell title="基础资料" description="控制前台展示的头像、称呼与年龄信息。">
            <Row gutter={[16, 16]}>
              <Col xs={24} md={12}>
                <FieldLabel label="姓名 / 称呼" hint="前台标题主文案，建议控制在 2-24 个字内。" />
                <Input
                  value={formData.name}
                  onChange={(event) => updateField('name', event.target.value)}
                  placeholder="例如：Chen Guitao"
                />
              </Col>
              <Col xs={24} md={12}>
                <FieldLabel label="头像地址" hint="支持外链或站内静态资源地址。" />
                <Input
                  value={formData.avatar}
                  onChange={(event) => updateField('avatar', event.target.value)}
                  placeholder="https://... 或 /branding/..."
                />
              </Col>
              <Col xs={24} md={12}>
                <FieldLabel label="邮箱" hint="会出现在联系入口里。" />
                <Input
                  value={formData.email}
                  onChange={(event) => updateField('email', event.target.value)}
                  placeholder="name@example.com"
                />
              </Col>
              <Col xs={24} md={8}>
                <FieldLabel label="出生年份" />
                <Input
                  type="number"
                  value={formData.birthYear}
                  onChange={(event) =>
                    updateField(
                      'birthYear',
                      event.target.value ? Number(event.target.value) : undefined
                    )
                  }
                  placeholder="2000"
                />
              </Col>
              <Col xs={24} md={8}>
                <FieldLabel label="出生月份" />
                <Input
                  type="number"
                  min={1}
                  max={12}
                  value={formData.birthMonth}
                  onChange={(event) =>
                    updateField(
                      'birthMonth',
                      event.target.value ? Number(event.target.value) : undefined
                    )
                  }
                  placeholder="10"
                />
              </Col>
              <Col xs={24} md={8}>
                <FieldLabel label="显示年龄" hint="关闭后仅展示职业信息。" />
                <div className="admin-about-inline-switch">
                  <Switch
                    checked={formData.showBirthday}
                    onChange={(checked) => updateField('showBirthday', checked)}
                  />
                </div>
              </Col>
            </Row>
          </SectionShell>
        ),
      },
      {
        key: 'social',
        label: `社交资料 (${socialCount})`,
        children: (
          <SectionShell
            title="社交资料"
            description="列表与编辑区分离，避免纵向堆叠导致页面过长。"
            extra={
              <Button
                type="dashed"
                icon={<PlusOutlined />}
                onClick={() => {
                  const nextIndex = formData.socials.length
                  updateField('socials', [
                    ...formData.socials,
                    { platform: 'github', url: '', icon: '' },
                  ])
                  setActiveSocialIndex(nextIndex)
                }}
              >
                添加社交项
              </Button>
            }
          >
            {formData.socials.length > 0 ? (
              <div className="admin-about-dual">
                <div className="admin-about-list">
                  <div className="admin-about-list-head">
                    <Text strong>社交项列表</Text>
                    <Text type="secondary">{formData.socials.length} 项</Text>
                  </div>
                  <div className="admin-about-list-body">
                    {formData.socials.map((item, index) => (
                      <button
                        key={`${item.platform}-${index}`}
                        type="button"
                        className={`admin-about-list-item${index === activeSocialIndex ? ' is-active' : ''}`}
                        onClick={() => setActiveSocialIndex(index)}
                      >
                        <span className="admin-about-list-title">{getSocialLabel(item.platform)}</span>
                        <span className="admin-about-list-sub">
                          {item.url || '未填写链接'}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>
                <div className="admin-about-editor">
                  <div className="admin-about-editor-head">
                    <div>
                      <div className="admin-about-item-title">
                        社交项 #{activeSocialIndex + 1}
                      </div>
                      <div className="admin-about-item-hint">编辑右侧内容即可更新</div>
                    </div>
                    <Button
                      type="text"
                      danger
                      icon={<DeleteOutlined />}
                      aria-label="删除社交项"
                      onClick={() => removeListItem('socials', activeSocialIndex)}
                    />
                  </div>

                  <Row gutter={[12, 12]}>
                    <Col xs={24} md={8}>
                      <FieldLabel label="平台" />
                      <Select
                        showSearch
                        optionFilterProp="label"
                        value={activeSocial?.platform}
                        onChange={(value) =>
                          updateListItem<AboutSocialItem>('socials', activeSocialIndex, {
                            platform: value,
                          })
                        }
                        options={SOCIAL_PLATFORM_OPTIONS}
                      />
                    </Col>
                    <Col xs={24} md={16}>
                      <FieldLabel label="链接" />
                      <Input
                        value={activeSocial?.url}
                        onChange={(event) =>
                          updateListItem<AboutSocialItem>('socials', activeSocialIndex, {
                            url: event.target.value,
                          })
                        }
                        placeholder={
                          activeSocial?.platform === 'mail'
                            ? 'name@example.com 或 mailto:...'
                            : 'https://...'
                        }
                      />
                    </Col>
                    <Col xs={24}>
                      <FieldLabel label="图标选择器" hint="不选择时会自动跟随平台默认图标。" />
                      <AboutIconPicker
                        mode="social"
                        value={activeSocial?.icon}
                        onChange={(nextValue) =>
                          updateListItem<AboutSocialItem>('socials', activeSocialIndex, {
                            icon: nextValue,
                          })
                        }
                      />
                    </Col>
                  </Row>
                </div>
              </div>
            ) : (
              <div className="admin-about-empty">暂无社交项，点击右上角按钮开始添加。</div>
            )}
          </SectionShell>
        ),
      },
      {
        key: 'tech',
        label: `技术栈 (${techCount})`,
        children: (
          <SectionShell
            title="技术栈"
            description="用列表+详情编辑替代纵向堆叠，减少滚动。"
            extra={
              <Button
                type="dashed"
                icon={<PlusOutlined />}
                onClick={() => {
                  const nextIndex = formData.techStacks.length
                  updateField('techStacks', [
                    ...formData.techStacks,
                    { name: 'React', icon: '' },
                  ])
                  setActiveTechIndex(nextIndex)
                }}
              >
                添加技术项
              </Button>
            }
          >
            {formData.techStacks.length > 0 ? (
              <div className="admin-about-dual">
                <div className="admin-about-list">
                  <div className="admin-about-list-head">
                    <Text strong>技术栈列表</Text>
                    <Text type="secondary">{formData.techStacks.length} 项</Text>
                  </div>
                  <div className="admin-about-list-body">
                    {formData.techStacks.map((item, index) => (
                      <button
                        key={`${item.name}-${index}`}
                        type="button"
                        className={`admin-about-list-item${index === activeTechIndex ? ' is-active' : ''}`}
                        onClick={() => setActiveTechIndex(index)}
                      >
                        <span className="admin-about-list-title">{item.name || '未命名技术'}</span>
                        <span className="admin-about-list-sub">
                          {item.icon ? '已设置自定义图标' : '使用默认图标'}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>
                <div className="admin-about-editor">
                  <div className="admin-about-editor-head">
                    <div>
                      <div className="admin-about-item-title">
                        技术项 #{activeTechIndex + 1}
                      </div>
                      <div className="admin-about-item-hint">更新后前台徽章会同步</div>
                    </div>
                    <Button
                      type="text"
                      danger
                      icon={<DeleteOutlined />}
                      aria-label="删除技术项"
                      onClick={() => removeListItem('techStacks', activeTechIndex)}
                    />
                  </div>

                  <Row gutter={[12, 12]}>
                    <Col xs={24} md={24}>
                      <FieldLabel label="技术名称" />
                      <Select
                        showSearch
                        optionFilterProp="label"
                        value={activeTech?.name}
                        onChange={(value) =>
                          updateListItem<AboutTechItem>('techStacks', activeTechIndex, {
                            name: value,
                          })
                        }
                        options={techOptions}
                      />
                    </Col>
                    <Col xs={24}>
                      <FieldLabel
                        label="图标选择器"
                        hint="可覆盖默认技术图标，适合自定义品牌或特殊徽标。"
                      />
                      <AboutIconPicker
                        mode="tech"
                        value={activeTech?.icon}
                        onChange={(nextValue) =>
                          updateListItem<AboutTechItem>('techStacks', activeTechIndex, {
                            icon: nextValue,
                          })
                        }
                      />
                    </Col>
                  </Row>
                </div>
              </div>
            ) : (
              <div className="admin-about-empty">
                <div className="admin-about-empty-title">暂无技术栈内容</div>
                <div className="admin-about-empty-text">
                  前台会实时反映这里的设置，点击右上角按钮开始添加。                </div>
              </div>
            )}
          </SectionShell>
        ),
      },
      {
        key: 'content',
        label: `正文内容 (${contentSummary})`,
        children: (
          <SectionShell title="正文内容" description="支持 Markdown，保存后同步前台展示。">
            <TextArea
              rows={18}
              value={formData.content}
              onChange={(event) => updateField('content', event.target.value)}
              placeholder="在这里填写你的个人介绍、项目经历、近期动态等内容。"
            />
            <div className="admin-about-helper-text">
              保存后会同步刷新前台关于页与后台预览，若首页复用这份资料也会同步更新。            </div>
          </SectionShell>
        ),
      },
      {
        key: 'preview',
        label: '预览',
        children: (
          <Card className="admin-panel-card admin-about-preview-card">
            <div className="admin-about-preview-head">
              <div>
                <Text strong>实时预览</Text>
                <div className="admin-about-preview-hint">状态：{previewStatus}</div>
              </div>
              <Tag color={statusColor} style={{ marginInlineEnd: 0 }}>
                {statusLabel}
              </Tag>
            </div>
            {hasPreviewContent ? (
              <div className="admin-about-preview-body">
                <AboutProfileShowcase
                  profile={previewProfile}
                  contentHtml={previewHtml}
                  mode="preview"
                />
              </div>
            ) : (
              <div className="admin-about-preview-empty">
                暂无正文预览，填写内容后会自动同步。              </div>
            )}
          </Card>
        ),
      },
    ],
    [
      activeSocial,
      activeSocialIndex,
      activeTech,
      activeTechIndex,
      contentSummary,
      formData.avatar,
      formData.birthMonth,
      formData.birthYear,
      formData.content,
      formData.email,
      formData.name,
      formData.showBirthday,
      formData.socials,
      formData.techStacks,
      getSocialLabel,
      hasPreviewContent,
      previewHtml,
      previewProfile,
      previewStatus,
      socialCount,
      statusColor,
      statusLabel,
      techCount,
      techOptions,
      updateField,
      updateListItem,
    ]
  )

  return (
    <Space orientation="vertical" size={16} style={{ display: 'flex' }} className="admin-about-shell">
      <div className="admin-about-header">
        <div className="admin-about-header-main">
          <Title level={3} className="admin-about-title">
            关于页
          </Title>
          <Paragraph type="secondary" className="admin-about-subtitle">
            统一管理头像、社交、技术栈与正文内容，保存后同步前台展示。          </Paragraph>
          <div className="admin-about-status-row">
            <Tag color={statusColor} style={{ marginInlineEnd: 0 }}>
              {statusLabel}
            </Tag>
            <Text type="secondary">{saveHint}</Text>
          </div>
        </div>
        <div className="admin-about-header-actions">
          <div className="admin-about-header-meta">
            <div>
              <Text type="secondary">预览状态</Text>
              <div className="admin-about-header-strong">{previewStatus}</div>
            </div>
            <div>
              <Text type="secondary">正文长度</Text>
              <div className="admin-about-header-strong">{contentSummary}</div>
            </div>
          </div>
          <ActionButtons
            onReset={handleReset}
            onSave={handleSave}
            savePending={savePending}
            saveDisabled={isSaveDisabled}
          />
        </div>
      </div>

      <Card className="admin-panel-card admin-about-tabs-card">
        <Tabs items={tabItems} className="admin-about-tabs-inline" />
      </Card>
    </Space>
  )
}
