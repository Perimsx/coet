"use client"

import { useEffect, useMemo, useState, useTransition } from "react"
import { Plus, RefreshCw, Save, Trash2 } from "lucide-react"
import { toast } from "sonner"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Textarea } from "@/components/ui/textarea"
import { renderMarkdownPreviewAction, saveAboutPageAction } from "@/app/admin/actions"
import techStack from "@/config/tech-stack"
import {
  AdminPanel,
  AdminPanelBody,
  AdminPanelHeader,
} from "@/features/admin/components/admin-ui"
import AboutProfileShowcase from "@/features/content/components/AboutProfileShowcase"
import {
  type AboutSocialItem,
  type AboutTechItem,
  buildAboutProfileViewModel,
  normalizeAboutSocials,
  normalizeAboutTechStacks,
  readNumber,
  readString,
} from "@/features/content/lib/about-profile"

import AboutIconPicker from "./about/AboutIconPicker"

const SOCIAL_PLATFORM_OPTIONS = [
  { label: "GitHub", value: "github" },
  { label: "Twitter", value: "twitter" },
  { label: "X", value: "x" },
  { label: "邮箱", value: "mail" },
  { label: "LinkedIn", value: "linkedin" },
  { label: "Bluesky", value: "bluesky" },
  { label: "Instagram", value: "instagram" },
  { label: "YouTube", value: "youtube" },
  { label: "Facebook", value: "facebook" },
  { label: "Medium", value: "medium" },
  { label: "Mastodon", value: "mastodon" },
  { label: "Threads", value: "threads" },
  { label: "抖音", value: "douyin" },
  { label: "Bilibili", value: "bilibili" },
  { label: "语雀", value: "yuque" },
] as const

type AboutEditorInitialData = {
  frontmatter: Record<string, unknown>
  content: string
}

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
    content: initialData.content || "",
  }
}

function SectionShell({
  title,
  description,
  action,
  children,
}: {
  title: string
  description: string
  action?: React.ReactNode
  children: React.ReactNode
}) {
  return (
    <AdminPanel>
      <AdminPanelHeader title={title} description={description} actions={action} />
      <AdminPanelBody>{children}</AdminPanelBody>
    </AdminPanel>
  )
}

export default function AboutEditorForm({ initialData }: { initialData: AboutEditorInitialData }) {
  const [savePending, startSave] = useTransition()
  const initialState = useMemo(() => createInitialState(initialData), [initialData])
  const [savedState, setSavedState] = useState(initialState)
  const [formData, setFormData] = useState(initialState)
  const [previewHtml, setPreviewHtml] = useState("")
  const [previewLoading, setPreviewLoading] = useState(false)
  const [activeSocialIndex, setActiveSocialIndex] = useState(0)
  const [activeTechIndex, setActiveTechIndex] = useState(0)

  const isDirty = useMemo(
    () => JSON.stringify(formData) !== JSON.stringify(savedState),
    [formData, savedState]
  )
  const hasPreviewContent = Boolean(formData.content.trim())
  const previewStatus = previewLoading ? "正在生成" : hasPreviewContent ? "已同步" : "暂无正文"
  const isSaveDisabled = savePending || !formData.name.trim()
  const statusLabel = isDirty ? "存在未保存修改" : "内容已同步"
  const statusTone = isDirty
    ? "rounded-full border-none bg-amber-500/15 text-amber-700 dark:text-amber-300"
    : "rounded-full border-none bg-emerald-500/15 text-emerald-700 dark:text-emerald-300"
  const socialCount = formData.socials.length
  const techCount = formData.techStacks.length
  const contentLength = formData.content.trim().length
  const contentSummary = contentLength ? `${contentLength} 字` : "未填写"
  const socialLabelMap = useMemo(
    () => new Map<string, string>(SOCIAL_PLATFORM_OPTIONS.map((option) => [option.value, option.label])),
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
      setPreviewHtml("")
      return
    }

    const timer = setTimeout(async () => {
      setPreviewLoading(true)
      try {
        const result = await renderMarkdownPreviewAction(formData.content)
        setPreviewHtml(result.html)
      } catch {
        toast.error("正文预览生成失败")
      } finally {
        setPreviewLoading(false)
      }
    }, 260)

    return () => clearTimeout(timer)
  }, [formData.content])

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
    field: "socials" | "techStacks",
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

  const removeListItem = (field: "socials" | "techStacks", index: number) => {
    updateField(
      field,
      (formData[field] as AboutSocialItem[] | AboutTechItem[]).filter(
        (_, currentIndex) => currentIndex !== index
      ) as AboutEditorFormState[typeof field]
    )
  }

  const handleReset = () => {
    setFormData(savedState)
    toast.success("已恢复到最近一次保存状态")
  }

  const handleSave = () => {
    if (!formData.name.trim()) {
      toast.error("姓名不能为空")
      return
    }

    startSave(async () => {
      const sanitizedTechStacks = formData.techStacks.map((item) => ({
        name: item.name,
        icon: item.icon,
      }))
      const payload = new FormData()
      payload.set("name", formData.name)
      payload.set("email", formData.email)
      payload.set("avatar", formData.avatar)
      payload.set("showBirthday", String(formData.showBirthday))
      payload.set("socials", JSON.stringify(formData.socials))
      payload.set("techStacks", JSON.stringify(sanitizedTechStacks))
      payload.set("content", formData.content)

      if (formData.birthYear) payload.set("birthYear", String(formData.birthYear))
      if (formData.birthMonth) payload.set("birthMonth", String(formData.birthMonth))

      const result = await saveAboutPageAction({} as never, payload)
      if (result.error) {
        toast.error(result.error)
        return
      }

      setSavedState(formData)
      toast.success(result.success || "关于页已保存")
    })
  }

  const getSocialLabel = (value: string) => socialLabelMap.get(value) || value
  const activeSocial = formData.socials[activeSocialIndex]
  const activeTech = formData.techStacks[activeTechIndex]

  return (
    <div className="space-y-5">
      <AdminPanel className="overflow-hidden rounded-[32px] border-border/70 bg-gradient-to-br from-card via-card to-primary/5">
        <AdminPanelBody className="flex flex-col gap-5 p-6 lg:flex-row lg:items-start lg:justify-between">
          <div className="space-y-3">
            <Badge variant="outline" className={statusTone}>
              {statusLabel}
            </Badge>
            <div className="space-y-2">
              <h2 className="text-2xl font-semibold tracking-tight text-foreground">关于页编辑器</h2>
              <p className="max-w-2xl text-sm leading-6 text-muted-foreground">
                统一管理头像、社交、技术栈与正文内容，保存后会同步前台关于页展示。
              </p>
            </div>
          </div>

          <div className="flex flex-col gap-3 lg:items-end">
            <div className="flex flex-wrap gap-2">
              <Badge variant="outline" className="rounded-full bg-background">
                社交 {socialCount}
              </Badge>
              <Badge variant="outline" className="rounded-full bg-background">
                技术栈 {techCount}
              </Badge>
              <Badge variant="outline" className="rounded-full bg-background">
                正文 {contentSummary}
              </Badge>
            </div>
            <div className="flex flex-wrap gap-2">
              <Button type="button" variant="outline" className="rounded-xl" disabled={savePending} onClick={handleReset}>
                <RefreshCw className="size-4" />
                恢复最近保存
              </Button>
              <Button type="button" className="rounded-xl" disabled={isSaveDisabled} onClick={handleSave}>
                <Save className="size-4" />
                保存关于页
              </Button>
            </div>
          </div>
        </AdminPanelBody>
      </AdminPanel>

      <Tabs defaultValue="basic" className="space-y-5">
        <TabsList className="flex h-auto flex-wrap rounded-2xl bg-muted/35 p-1">
          <TabsTrigger value="basic" className="rounded-xl">基础资料</TabsTrigger>
          <TabsTrigger value="social" className="rounded-xl">社交资料</TabsTrigger>
          <TabsTrigger value="tech" className="rounded-xl">技术栈</TabsTrigger>
          <TabsTrigger value="content" className="rounded-xl">正文内容</TabsTrigger>
          <TabsTrigger value="preview" className="rounded-xl">实时预览</TabsTrigger>
        </TabsList>

        <TabsContent value="basic" className="mt-0">
          <SectionShell title="基础资料" description="控制前台展示的头像、称呼、邮箱与年龄信息。">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">姓名 / 称呼</label>
                <Input
                  value={formData.name}
                  onChange={(event) => updateField("name", event.target.value)}
                  placeholder="例如：Chen Guitao"
                  className="h-10 rounded-xl"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">头像地址</label>
                <Input
                  value={formData.avatar}
                  onChange={(event) => updateField("avatar", event.target.value)}
                  placeholder="https://... 或 /branding/..."
                  className="h-10 rounded-xl"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">邮箱</label>
                <Input
                  value={formData.email}
                  onChange={(event) => updateField("email", event.target.value)}
                  placeholder="name@example.com"
                  className="h-10 rounded-xl"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">出生年份</label>
                <Input
                  type="number"
                  value={formData.birthYear || ""}
                  onChange={(event) =>
                    updateField("birthYear", event.target.value ? Number(event.target.value) : undefined)
                  }
                  placeholder="2000"
                  className="h-10 rounded-xl"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">出生月份</label>
                <Input
                  type="number"
                  min={1}
                  max={12}
                  value={formData.birthMonth || ""}
                  onChange={(event) =>
                    updateField("birthMonth", event.target.value ? Number(event.target.value) : undefined)
                  }
                  placeholder="10"
                  className="h-10 rounded-xl"
                />
              </div>
              <div className="rounded-[24px] border border-border/70 bg-muted/20 p-4">
                <div className="flex items-center justify-between gap-4">
                  <div className="space-y-1">
                    <div className="text-sm font-medium text-foreground">显示年龄</div>
                    <div className="text-xs leading-6 text-muted-foreground">
                      关闭后只展示个人信息，不显示年龄文案。
                    </div>
                  </div>
                  <Switch
                    checked={formData.showBirthday}
                    onCheckedChange={(checked) => updateField("showBirthday", checked)}
                  />
                </div>
              </div>
            </div>
          </SectionShell>
        </TabsContent>

        <TabsContent value="social" className="mt-0">
          <SectionShell
            title="社交资料"
            description="左侧选择条目，右侧编辑平台、链接与图标。"
            action={
              <Button
                type="button"
                variant="outline"
                className="rounded-xl"
                onClick={() => {
                  const nextIndex = formData.socials.length
                  updateField("socials", [...formData.socials, { platform: "github", url: "", icon: "" }])
                  setActiveSocialIndex(nextIndex)
                }}
              >
                <Plus className="size-4" />
                添加社交项
              </Button>
            }
          >
            {formData.socials.length > 0 ? (
              <div className="grid gap-4 lg:grid-cols-[280px_1fr]">
                <div className="space-y-3 rounded-[24px] border border-border/70 bg-muted/10 p-3">
                  {formData.socials.map((item, index) => (
                    <button
                      key={`${item.platform}-${index}`}
                      type="button"
                      className={`flex w-full flex-col rounded-2xl border px-3 py-3 text-left transition ${
                        index === activeSocialIndex
                          ? "border-primary/30 bg-primary/5"
                          : "border-border/60 bg-background/80 hover:border-primary/20"
                      }`}
                      onClick={() => setActiveSocialIndex(index)}
                    >
                      <span className="text-sm font-medium text-foreground">{getSocialLabel(item.platform)}</span>
                      <span className="mt-1 truncate text-xs text-muted-foreground">{item.url || "未填写链接"}</span>
                    </button>
                  ))}
                </div>

                <div className="space-y-4 rounded-[24px] border border-border/70 bg-muted/10 p-4">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <div className="text-sm font-medium text-foreground">社交项 #{activeSocialIndex + 1}</div>
                      <div className="text-xs text-muted-foreground">编辑右侧内容即可同步更新</div>
                    </div>
                    <Button
                      type="button"
                      variant="destructive"
                      size="sm"
                      className="rounded-xl"
                      onClick={() => removeListItem("socials", activeSocialIndex)}
                    >
                      <Trash2 className="size-4" />
                      删除
                    </Button>
                  </div>

                  <div className="grid gap-4 md:grid-cols-[220px_1fr]">
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-foreground">平台</label>
                      <Select
                        value={activeSocial?.platform}
                        onValueChange={(value) =>
                          updateListItem<AboutSocialItem>("socials", activeSocialIndex, { platform: value })
                        }
                      >
                        <SelectTrigger className="h-10 rounded-xl">
                          <SelectValue placeholder="选择平台" />
                        </SelectTrigger>
                        <SelectContent>
                          {SOCIAL_PLATFORM_OPTIONS.map((option) => (
                            <SelectItem key={option.value} value={option.value}>
                              {option.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-foreground">链接</label>
                      <Input
                        value={activeSocial?.url || ""}
                        onChange={(event) =>
                          updateListItem<AboutSocialItem>("socials", activeSocialIndex, { url: event.target.value })
                        }
                        placeholder={activeSocial?.platform === "mail" ? "name@example.com 或 mailto:..." : "https://..."}
                        className="h-10 rounded-xl"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium text-foreground">图标选择</label>
                    <AboutIconPicker
                      mode="social"
                      value={activeSocial?.icon}
                      onChange={(nextValue) =>
                        updateListItem<AboutSocialItem>("socials", activeSocialIndex, { icon: nextValue })
                      }
                    />
                  </div>
                </div>
              </div>
            ) : (
              <div className="rounded-[24px] border border-dashed border-border/70 bg-muted/10 px-4 py-10 text-center text-sm text-muted-foreground">
                暂无社交项目，点击右上角按钮开始添加。
              </div>
            )}
          </SectionShell>
        </TabsContent>

        <TabsContent value="tech" className="mt-0">
          <SectionShell
            title="技术栈"
            description="维护前台展示的技术徽章和自定义图标。"
            action={
              <Button
                type="button"
                variant="outline"
                className="rounded-xl"
                onClick={() => {
                  const nextIndex = formData.techStacks.length
                  updateField("techStacks", [...formData.techStacks, { name: "React", icon: "" }])
                  setActiveTechIndex(nextIndex)
                }}
              >
                <Plus className="size-4" />
                添加技术项
              </Button>
            }
          >
            {formData.techStacks.length > 0 ? (
              <div className="grid gap-4 lg:grid-cols-[280px_1fr]">
                <div className="space-y-3 rounded-[24px] border border-border/70 bg-muted/10 p-3">
                  {formData.techStacks.map((item, index) => (
                    <button
                      key={`${item.name}-${index}`}
                      type="button"
                      className={`flex w-full flex-col rounded-2xl border px-3 py-3 text-left transition ${
                        index === activeTechIndex
                          ? "border-primary/30 bg-primary/5"
                          : "border-border/60 bg-background/80 hover:border-primary/20"
                      }`}
                      onClick={() => setActiveTechIndex(index)}
                    >
                      <span className="text-sm font-medium text-foreground">{item.name || "未命名技术"}</span>
                      <span className="mt-1 text-xs text-muted-foreground">
                        {item.icon ? "已配置自定义图标" : "使用默认图标"}
                      </span>
                    </button>
                  ))}
                </div>

                <div className="space-y-4 rounded-[24px] border border-border/70 bg-muted/10 p-4">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <div className="text-sm font-medium text-foreground">技术项 #{activeTechIndex + 1}</div>
                      <div className="text-xs text-muted-foreground">更新后前台技术徽章会同步变化</div>
                    </div>
                    <Button
                      type="button"
                      variant="destructive"
                      size="sm"
                      className="rounded-xl"
                      onClick={() => removeListItem("techStacks", activeTechIndex)}
                    >
                      <Trash2 className="size-4" />
                      删除
                    </Button>
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium text-foreground">技术名称</label>
                    <Select
                      value={activeTech?.name}
                      onValueChange={(value) =>
                        updateListItem<AboutTechItem>("techStacks", activeTechIndex, { name: value })
                      }
                    >
                      <SelectTrigger className="h-10 rounded-xl">
                        <SelectValue placeholder="选择技术栈" />
                      </SelectTrigger>
                      <SelectContent>
                        {techOptions.map((option) => (
                          <SelectItem key={option.value} value={option.value}>
                            {option.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium text-foreground">图标选择</label>
                    <AboutIconPicker
                      mode="tech"
                      value={activeTech?.icon}
                      onChange={(nextValue) =>
                        updateListItem<AboutTechItem>("techStacks", activeTechIndex, { icon: nextValue })
                      }
                    />
                  </div>
                </div>
              </div>
            ) : (
              <div className="rounded-[24px] border border-dashed border-border/70 bg-muted/10 px-4 py-10 text-center text-sm text-muted-foreground">
                暂无技术栈内容，点击右上角按钮开始添加。
              </div>
            )}
          </SectionShell>
        </TabsContent>

        <TabsContent value="content" className="mt-0">
          <SectionShell title="正文内容" description="支持 Markdown，保存后会同步前台关于页展示。">
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">正文</label>
              <Textarea
                rows={18}
                value={formData.content}
                onChange={(event) => updateField("content", event.target.value)}
                placeholder="在这里填写你的个人介绍、项目经历、近期动态等内容。"
                className="min-h-[520px] rounded-[24px] font-mono text-sm leading-7"
              />
            </div>
          </SectionShell>
        </TabsContent>

        <TabsContent value="preview" className="mt-0">
          <SectionShell title="实时预览" description={`状态：${previewStatus}`}>
            {hasPreviewContent ? (
              <AboutProfileShowcase profile={previewProfile} contentHtml={previewHtml} mode="preview" />
            ) : (
              <div className="rounded-[24px] border border-dashed border-border/70 bg-muted/10 px-4 py-10 text-center text-sm text-muted-foreground">
                暂无正文预览，填写内容后会自动同步。
              </div>
            )}
          </SectionShell>
        </TabsContent>
      </Tabs>
    </div>
  )
}
