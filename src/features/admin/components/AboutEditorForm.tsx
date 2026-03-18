'use client'

import { useEffect, useMemo, useState, useTransition } from 'react'
import { DeleteOutlined, PlusOutlined, ReloadOutlined, SaveOutlined } from '@ant-design/icons'
import { App, Button, Card, Col, Input, Row, Select, Space, Switch, Typography } from 'antd'

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
 * 关于页编辑器状态结构
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
    <div className="mb-2">
      <Text strong>{label}</Text>
      {hint ? (
        <div className="mt-1 text-xs text-muted-foreground">{hint}</div>
      ) : null}
    </div>
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
    <Card className="admin-panel-card">
      <div className="mb-5 flex flex-wrap items-start justify-between gap-3">
        <div>
          <Title level={4} style={{ marginBottom: 4 }}>
            {title}
          </Title>
          <Paragraph type="secondary" style={{ marginBottom: 0 }}>
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
 * 支持 Markdown 编辑、实时预览、技术栈管理及社交媒体链接配置。建议修复错误。
 */
export default function AboutEditorForm({ initialData }: { initialData: AboutEditorInitialData }) {
  const { message } = App.useApp()
  const [savePending, startSave] = useTransition()
  const initialState = useMemo(() => createInitialState(initialData), [initialData])
  const [savedState, setSavedState] = useState(initialState)
  const [formData, setFormData] = useState(initialState)
  const [previewHtml, setPreviewHtml] = useState('')
  const [previewLoading, setPreviewLoading] = useState(false)

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

  const previewProfile = useMemo(() => buildAboutProfileViewModel(formData), [formData])

  const updateField = <K extends keyof AboutEditorFormState>(
    field: K,
    value: AboutEditorFormState[K]
  ) => {
    setFormData((current) => ({ ...current, [field]: value }))
  }

  const updateSocial = (index: number, patch: Partial<AboutSocialItem>) => {
    updateField(
      'socials',
      formData.socials.map((item, currentIndex) =>
        currentIndex === index ? { ...item, ...patch } : item
      )
    )
  }

  const updateTech = (index: number, patch: Partial<AboutTechItem>) => {
    updateField(
      'techStacks',
      formData.techStacks.map((item, currentIndex) =>
        currentIndex === index ? { ...item, ...patch } : item
      )
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
      const payload = new FormData()
      payload.set('name', formData.name)
      payload.set('email', formData.email)
      payload.set('avatar', formData.avatar)
      payload.set('showBirthday', String(formData.showBirthday))
      payload.set('socials', JSON.stringify(formData.socials))
      payload.set('techStacks', JSON.stringify(formData.techStacks))
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

  return (
    <Space orientation="vertical" size={16} style={{ display: 'flex' }}>
      <Card className="admin-panel-card">
        <Row justify="space-between" align="middle" gutter={[16, 16]}>
          <Col xs={24} lg={16}>
            <Title level={3} style={{ marginBottom: 4 }}>
              关于页编辑器
            </Title>
            <Paragraph type="secondary" style={{ marginBottom: 0 }}>
              前台展示和后台预览共用同一套布局模型，头像、社交、技术栈和正文会同步呈现。
            </Paragraph>
          </Col>
          <Col>
            <Space wrap>
              <Button icon={<ReloadOutlined />} onClick={handleReset} disabled={savePending}>
                恢复最近保存
              </Button>
              <Button
                type="primary"
                icon={<SaveOutlined />}
                onClick={handleSave}
                loading={savePending}
              >
                保存关于页
              </Button>
            </Space>
          </Col>
        </Row>
      </Card>

      <Row gutter={[16, 16]} align="top">
        <Col xs={24} xl={9}>
          <div className="xl:sticky xl:top-24">
            <Card
              className="admin-panel-card"
              title="前台实时预览"
              extra={<Text type="secondary">{previewLoading ? '同步中' : '已同步'}</Text>}
            >
              <div className="max-h-[calc(100vh-10rem)] overflow-auto pr-1">
                <AboutProfileShowcase
                  profile={previewProfile}
                  contentHtml={previewHtml}
                  mode="preview"
                />
              </div>
            </Card>
          </div>
        </Col>

        <Col xs={24} xl={15}>
          <Space orientation="vertical" size={16} style={{ display: 'flex' }}>
            <SectionShell
              title="基础资料"
              description="这里决定前台卡片顶部的主信息区，包括头像、称呼和年龄显示方式。"
            >
              <Row gutter={[16, 16]}>
                <Col xs={24} md={12}>
                  <FieldLabel label="姓名 / 昵称" hint="前台标题主文案，建议控制在 2-24 个字内。" />
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
                  <FieldLabel label="显示年龄" hint="关闭后只显示职业信息，不展示年龄。" />
                  <div className="flex min-h-10 items-center">
                    <Switch
                      checked={formData.showBirthday}
                      onChange={(checked) => updateField('showBirthday', checked)}
                    />
                  </div>
                </Col>
              </Row>
            </SectionShell>

            <SectionShell
              title="社交资料"
              description="前台左侧联系区会直接读取这里的数据。图标选择器支持默认平台图标、搜索和自定义 URL。"
              extra={
                <Button
                  type="dashed"
                  icon={<PlusOutlined />}
                  onClick={() =>
                    updateField('socials', [
                      ...formData.socials,
                      { platform: 'github', url: '', icon: '' },
                    ])
                  }
                >
                  添加社交项
                </Button>
              }
            >
              <Space orientation="vertical" size={12} style={{ display: 'flex' }}>
                {formData.socials.length > 0 ? (
                  formData.socials.map((item, index) => (
                    <div
                      key={`${item.platform}-${index}`}
                      className="rounded-2xl border border-border/70 bg-background/70 p-4"
                    >
                      <div className="mb-4 flex items-center justify-between gap-3">
                        <div>
                          <div className="text-sm font-semibold text-foreground">社交项 #{index + 1}</div>
                          <div className="text-xs text-muted-foreground">前台会展示为独立的联系卡片。</div>
                        </div>
                        <Button
                          type="text"
                          danger
                          icon={<DeleteOutlined />}
                          onClick={() =>
                            updateField(
                              'socials',
                              formData.socials.filter((_, currentIndex) => currentIndex !== index)
                            )
                          }
                        />
                      </div>

                      <Row gutter={[12, 12]}>
                        <Col xs={24} md={8}>
                          <FieldLabel label="平台" />
                          <Select
                            showSearch
                            optionFilterProp="label"
                            value={item.platform}
                            onChange={(value) => updateSocial(index, { platform: value })}
                            options={SOCIAL_PLATFORM_OPTIONS}
                          />
                        </Col>
                        <Col xs={24} md={16}>
                          <FieldLabel label="链接" />
                          <Input
                            value={item.url}
                            onChange={(event) => updateSocial(index, { url: event.target.value })}
                            placeholder={item.platform === 'mail' ? 'name@example.com 或 mailto:...' : 'https://...'}
                          />
                        </Col>
                        <Col xs={24}>
                          <FieldLabel label="图标选择器" hint="不选时会自动跟随平台默认图标。" />
                          <AboutIconPicker
                            mode="social"
                            value={item.icon}
                            onChange={(nextValue) => updateSocial(index, { icon: nextValue })}
                          />
                        </Col>
                      </Row>
                    </div>
                  ))
                ) : (
                  <div className="rounded-2xl border border-dashed border-border/70 px-4 py-8 text-center text-sm text-muted-foreground">
                    暂无社交项，点击右上角按钮开始添加。
                  </div>
                )}
              </Space>
            </SectionShell>

            <SectionShell
              title="技术栈"
              description="前台技术栈会展示成紧凑卡片，你可以直接选已有技术，也可以覆盖默认图标。"
              extra={
                <Button
                  type="dashed"
                  icon={<PlusOutlined />}
                  onClick={() =>
                    updateField('techStacks', [...formData.techStacks, { name: 'React', level: '', icon: '' }])
                  }
                >
                  添加技术项
                </Button>
              }
            >
              <Space orientation="vertical" size={12} style={{ display: 'flex' }}>
                {formData.techStacks.length > 0 ? (
                  formData.techStacks.map((item, index) => (
                    <div
                      key={`${item.name}-${index}`}
                      className="rounded-2xl border border-border/70 bg-background/70 p-4"
                    >
                      <div className="mb-4 flex items-center justify-between gap-3">
                        <div>
                          <div className="text-sm font-semibold text-foreground">技术项 #{index + 1}</div>
                          <div className="text-xs text-muted-foreground">可补充熟悉程度，前台会一起显示。</div>
                        </div>
                        <Button
                          type="text"
                          danger
                          icon={<DeleteOutlined />}
                          onClick={() =>
                            updateField(
                              'techStacks',
                              formData.techStacks.filter((_, currentIndex) => currentIndex !== index)
                            )
                          }
                        />
                      </div>

                      <Row gutter={[12, 12]}>
                        <Col xs={24} md={10}>
                          <FieldLabel label="技术名称" />
                          <Select
                            showSearch
                            optionFilterProp="label"
                            value={item.name}
                            onChange={(value) => updateTech(index, { name: value })}
                            options={techStack.map((tech) => ({
                              label: tech.name,
                              value: tech.name,
                            }))}
                          />
                        </Col>
                        <Col xs={24} md={14}>
                          <FieldLabel label="熟悉程度" />
                          <Input
                            value={item.level}
                            onChange={(event) => updateTech(index, { level: event.target.value })}
                            placeholder="例如：主力 / 熟悉 / 长期使用"
                          />
                        </Col>
                        <Col xs={24}>
                          <FieldLabel label="图标选择器" hint="可覆盖默认技术图标，适合自定义品牌或特殊栈图标。" />
                          <AboutIconPicker
                            mode="tech"
                            value={item.icon}
                            onChange={(nextValue) => updateTech(index, { icon: nextValue })}
                          />
                        </Col>
                      </Row>
                    </div>
                  ))
                ) : (
                  <div className="rounded-2xl border border-dashed border-border/70 px-4 py-8 text-center bg-muted/5">
                    <div className="text-sm font-medium text-muted-foreground mb-1">暂无技术栈内容</div>
                    <div className="text-xs text-muted-foreground/60">
                      前台现在会真实反映这里的设置。点击右上角 <b>添加技术项</b> 开始展示。
                    </div>
                  </div>
                )}
              </Space>
            </SectionShell>

            <SectionShell
              title="正文内容"
              description="支持 Markdown，预览会自动同步到左侧，不需要手动切换标签。"
            >
              <TextArea
                rows={20}
                value={formData.content}
                onChange={(event) => updateField('content', event.target.value)}
                placeholder="在这里填写你的个人介绍、项目经历、近期动态等内容。"
              />
              <div className="mt-3 text-xs text-muted-foreground">
                保存后会同时刷新前台关于页和后台编辑器页面；如果首页也复用了这份资料，首页也会同步更新。
              </div>
            </SectionShell>
          </Space>
        </Col>
      </Row>
    </Space>
  )
}
