"use client"

import { useDeferredValue, useState } from "react"
import { CheckCircle2, Link2, Search, Trash2 } from "lucide-react"

import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import techStack from "@/config/tech-stack"
import { getSocialPlatformLabel } from "@/features/content/lib/about-profile"
import {
  Bilibili,
  Bluesky,
  Douyin,
  Facebook,
  Github,
  Instagram,
  Linkedin,
  Mail,
  Mastodon,
  Medium,
  Rss,
  Threads,
  Twitter,
  X,
  Youtube,
  Yuque,
} from "@/features/site/components/social-icons/icons"

const SOCIAL_ICON_COMPONENTS = {
  github: Github,
  twitter: Twitter,
  x: X,
  mail: Mail,
  facebook: Facebook,
  youtube: Youtube,
  linkedin: Linkedin,
  instagram: Instagram,
  medium: Medium,
  mastodon: Mastodon,
  threads: Threads,
  bluesky: Bluesky,
  douyin: Douyin,
  bilibili: Bilibili,
  yuque: Yuque,
  rss: Rss,
} as const

const SOCIAL_ICON_KEYS = [
  "github",
  "twitter",
  "x",
  "mail",
  "facebook",
  "youtube",
  "linkedin",
  "instagram",
  "medium",
  "mastodon",
  "threads",
  "bluesky",
  "douyin",
  "bilibili",
  "yuque",
  "rss",
] as const

type AboutIconPickerProps = {
  mode: "social" | "tech"
  value?: string
  onChange: (value: string) => void
}

type PresetOption = {
  label: string
  value: string
  kind: "social" | "tech"
}

function getDisplayLabel(mode: "social" | "tech", value?: string) {
  if (!value) {
    return mode === "social" ? "跟随平台默认图标" : "跟随技术栈默认图标"
  }

  if (mode === "social" && value.startsWith("social:")) {
    return getSocialPlatformLabel(value.replace(/^social:/, ""))
  }

  const matchedTech = techStack.find((item) => item.icon === value)
  if (matchedTech) {
    return matchedTech.name
  }

  return "自定义图标"
}

function renderOptionPreview(option: PresetOption) {
  if (option.kind === "social") {
    const iconKey = option.value.replace(/^social:/, "") as keyof typeof SOCIAL_ICON_COMPONENTS
    const IconComponent = SOCIAL_ICON_COMPONENTS[iconKey]

    if (!IconComponent) return null
    return <IconComponent style={{ width: 20, height: 20 }} />
  }

  return <img src={option.value} alt={option.label} className="h-5 w-5 object-contain" />
}

function renderValuePreview(mode: "social" | "tech", value?: string) {
  if (!value) {
    return (
      <div className="flex h-11 w-11 items-center justify-center rounded-2xl border border-dashed border-border/70 bg-background/70 text-muted-foreground">
        <Link2 className="size-4" />
      </div>
    )
  }

  if (mode === "social" && value.startsWith("social:")) {
    const iconKey = value.replace(/^social:/, "") as keyof typeof SOCIAL_ICON_COMPONENTS
    const IconComponent = SOCIAL_ICON_COMPONENTS[iconKey]

    if (IconComponent) {
      return (
        <div className="flex h-11 w-11 items-center justify-center rounded-2xl border border-border/70 bg-card text-foreground">
          <IconComponent style={{ width: 20, height: 20 }} />
        </div>
      )
    }
  }

  const label = getDisplayLabel(mode, value)
  return (
    <div className="flex h-11 w-11 items-center justify-center rounded-2xl border border-border/70 bg-card p-2">
      <img src={value} alt={`${label}图标`} className="h-full w-full object-contain" />
    </div>
  )
}

export default function AboutIconPicker({ mode, value, onChange }: AboutIconPickerProps) {
  const [open, setOpen] = useState(false)
  const [keyword, setKeyword] = useState("")
  const [customValue, setCustomValue] = useState("")
  const deferredKeyword = useDeferredValue(keyword.trim().toLowerCase())

  const presets: PresetOption[] =
    mode === "social"
      ? SOCIAL_ICON_KEYS.map((key) => ({
          label: getSocialPlatformLabel(key),
          value: `social:${key}`,
          kind: "social",
        }))
      : techStack.map((item) => ({
          label: item.name,
          value: item.icon,
          kind: "tech",
        }))

  const filteredPresets = presets.filter((item) =>
    deferredKeyword ? item.label.toLowerCase().includes(deferredKeyword) : true
  )

  const applyCustomValue = () => {
    const nextValue = customValue.trim()
    if (!nextValue) return
    onChange(nextValue)
    setOpen(false)
    setCustomValue("")
  }

  const emptyLabel = mode === "social" ? "点击选择社交图标" : "点击选择技术图标"
  const modalTitle = mode === "social" ? "选择社交图标" : "选择技术图标"
  const presetTitle = mode === "social" ? "内置图标库" : "技术图标库"
  const searchPlaceholder =
    mode === "social"
      ? "搜索平台名称，例如 GitHub / 语雀 / 抖音"
      : "搜索技术栈，例如 React / Next.js / Python"

  return (
    <>
      <button
        type="button"
        onClick={() => {
          setCustomValue(value && !value.startsWith("social:") ? value : "")
          setOpen(true)
        }}
        className="flex w-full items-center justify-between gap-3 rounded-2xl border border-border/70 bg-background/75 px-3 py-3 text-left transition-colors hover:border-primary/40 hover:bg-card"
      >
        <div className="flex min-w-0 items-center gap-3">
          {renderValuePreview(mode, value)}
          <div className="min-w-0">
            <div className="text-sm font-medium text-foreground">{getDisplayLabel(mode, value)}</div>
            <div className="text-xs text-muted-foreground">{emptyLabel}</div>
          </div>
        </div>
        <Link2 className="size-4 text-muted-foreground" />
      </button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-h-[85vh] overflow-y-auto rounded-[28px] border-border/70 p-0 sm:max-w-4xl">
          <DialogHeader className="border-b border-border/60 px-6 py-5 text-left">
            <DialogTitle>{modalTitle}</DialogTitle>
            <DialogDescription>优先使用内置图标，必要时也支持自定义图标链接。</DialogDescription>
          </DialogHeader>

          <div className="space-y-5 px-6 py-5">
            <div className="flex flex-col gap-3 lg:flex-row">
              <div className="relative flex-1">
                <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  value={keyword}
                  onChange={(event) => setKeyword(event.target.value)}
                  placeholder={searchPlaceholder}
                  className="h-10 rounded-xl pl-9"
                />
              </div>
              <Button type="button" className="rounded-xl" onClick={applyCustomValue}>
                <CheckCircle2 className="size-4" />
                使用链接图标
              </Button>
            </div>

            <div className="rounded-[24px] border border-border/70 bg-muted/10 p-4">
              <div className="mb-3 flex items-center justify-between gap-3">
                <div>
                  <div className="text-sm font-semibold text-foreground">自定义图标链接</div>
                  <div className="text-xs text-muted-foreground">
                    输入图标地址后点击右上角按钮即可使用。
                  </div>
                </div>
                {customValue ? (
                  <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    className="rounded-xl"
                    onClick={() => setCustomValue("")}
                  >
                    <Trash2 className="size-4" />
                  </Button>
                ) : null}
              </div>
              <Textarea
                rows={3}
                value={customValue}
                onChange={(event) => setCustomValue(event.target.value)}
                placeholder="https://..."
                className="rounded-2xl"
              />
            </div>

            <div className="rounded-[24px] border border-border/70 bg-muted/10 p-4">
              <div className="mb-3 flex items-center justify-between">
                <div className="text-sm font-semibold text-foreground">{presetTitle}</div>
                <div className="text-xs text-muted-foreground">{filteredPresets.length} 个结果</div>
              </div>
              {filteredPresets.length ? (
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
                  {filteredPresets.map((option) => (
                    <button
                      key={option.value}
                      type="button"
                      onClick={() => {
                        onChange(option.value)
                        setOpen(false)
                      }}
                      className="flex items-center gap-3 rounded-2xl border border-border/70 bg-card px-3 py-3 text-left transition hover:border-primary/40"
                    >
                      <div className="flex size-10 items-center justify-center rounded-2xl bg-background">
                        {renderOptionPreview(option)}
                      </div>
                      <div className="min-w-0">
                        <div className="truncate text-sm font-medium text-foreground">{option.label}</div>
                        <div className="text-xs text-muted-foreground">点击选择</div>
                      </div>
                    </button>
                  ))}
                </div>
              ) : (
                <div className="rounded-2xl border border-dashed border-border/70 bg-background/70 px-4 py-10 text-center text-sm text-muted-foreground">
                  未找到匹配图标
                </div>
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}
