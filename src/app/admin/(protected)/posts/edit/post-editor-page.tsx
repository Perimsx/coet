"use client"

import Link from "next/link"
import { useRouter } from "next/navigation"
import { useEffect, useMemo, useState, useTransition } from "react"
import {
  ArrowLeft,
  Eye,
  PanelRightClose,
  PanelRightOpen,
  Save,
  Sparkles,
  Trash2,
} from "lucide-react"
import { toast } from "sonner"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Switch } from "@/components/ui/switch"
import { Textarea } from "@/components/ui/textarea"
import {
  AdminPanel,
  AdminPanelBody,
  AdminPanelHeader,
  AdminToolbarMeta,
} from "@/features/admin/components/admin-ui"
import { ConfirmDialog } from "@/features/admin/components/confirm-dialog"
import HtmlMarkdownContent from "@/features/content/components/HtmlMarkdownContent"
import {
  suggestPostSlug,
  suggestPostSummary,
} from "@/features/content/lib/posts"

import {
  deletePostEditorAction,
  renderMarkdownPreviewAction,
  savePostEditorAction,
} from "@/app/admin/actions"

type EditorValue = {
  relativePath: string
  title: string
  slug: string
  date: string
  summary: string
  tags: string
  categories: string
  draft: boolean
  content: string
}

type CategoryOption = {
  slug: string
  labelZh: string
}

type ViewMode = "editor" | "split" | "preview"

type LocalEditorDraft = EditorValue & {
  savedAt: string
}

function splitTokens(input: string) {
  return input
    .split(/[,\n]/)
    .map((item) => item.trim())
    .filter(Boolean)
}

function buildDraftStorageKey(relativePath: string) {
  return `admin:post-draft:${relativePath || "new-post"}`
}

function normalizeForDraft(value: EditorValue): LocalEditorDraft {
  return {
    ...value,
    savedAt: new Date().toISOString(),
  }
}

function stripLocalEditorDraft(raw: string | null) {
  if (!raw) return null

  try {
    return JSON.parse(raw) as LocalEditorDraft
  } catch {
    return null
  }
}

export default function PostEditorPage({
  initialValue,
  availableCategories = [],
}: {
  initialValue: EditorValue
  availableCategories?: CategoryOption[]
}) {
  const router = useRouter()
  const [pending, startTransition] = useTransition()
  const [value, setValue] = useState(initialValue)
  const [baseline, setBaseline] = useState(initialValue)
  const [viewMode, setViewMode] = useState<ViewMode>("split")
  const [metaCollapsed, setMetaCollapsed] = useState(false)
  const [previewHtml, setPreviewHtml] = useState("")
  const [previewLoading, setPreviewLoading] = useState(false)
  const [deleteOpen, setDeleteOpen] = useState(false)
  const [slugLocked, setSlugLocked] = useState(Boolean(initialValue.slug))
  const [lastAutosavedAt, setLastAutosavedAt] = useState<string | null>(null)

  const categoryValues = useMemo(() => splitTokens(value.categories), [value.categories])
  const tagValues = useMemo(() => splitTokens(value.tags), [value.tags])
  const wordEstimate = useMemo(() => value.content.trim().length, [value.content])
  const draftStorageKey = useMemo(
    () => buildDraftStorageKey(value.relativePath || initialValue.relativePath),
    [initialValue.relativePath, value.relativePath]
  )
  const isDirty = useMemo(
    () =>
      JSON.stringify({
        ...value,
        title: value.title.trim(),
        slug: value.slug.trim(),
        summary: value.summary.trim(),
      }) !==
      JSON.stringify({
        ...baseline,
        title: baseline.title.trim(),
        slug: baseline.slug.trim(),
        summary: baseline.summary.trim(),
      }),
    [baseline, value]
  )

  const setField = <K extends keyof EditorValue>(key: K, nextValue: EditorValue[K]) => {
    setValue((current) => ({ ...current, [key]: nextValue }))
  }

  const buildFormData = () => {
    const formData = new FormData()
    formData.set("relativePath", value.relativePath)
    formData.set("title", value.title)
    formData.set("slug", value.slug)
    formData.set("date", value.date)
    formData.set("summary", value.summary)
    formData.set("tags", value.tags)
    formData.set("categories", value.categories)
    formData.set("content", value.content)
    if (value.draft) formData.set("draft", "true")
    return formData
  }

  useEffect(() => {
    const currentDraft = stripLocalEditorDraft(localStorage.getItem(draftStorageKey))
    if (!currentDraft) return

    let active = true

    void (async () => {
      try {
        const response = await fetch("/api/admin/posts/autosave-restore-check", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            relativePath: value.relativePath || undefined,
            draft: currentDraft,
          }),
        })
        const result = await response.json()
        if (!active || !response.ok || !result.ok || !result.shouldRestore) return

        const confirmed = window.confirm("检测到本地自动保存草稿，是否恢复到编辑器？")
        if (!confirmed) return

        setValue({
          relativePath: currentDraft.relativePath || value.relativePath,
          title: currentDraft.title,
          slug: currentDraft.slug,
          date: currentDraft.date,
          summary: currentDraft.summary,
          tags: currentDraft.tags,
          categories: currentDraft.categories,
          draft: currentDraft.draft,
          content: currentDraft.content,
        })
        setLastAutosavedAt(currentDraft.savedAt)
        toast.success("已恢复本地草稿")
      } catch {
        // Ignore restore check failures to avoid blocking the editor.
      }
    })()

    return () => {
      active = false
    }
  }, [draftStorageKey, value.relativePath])

  useEffect(() => {
    if (slugLocked) return

    setValue((current) => ({
      ...current,
      slug: suggestPostSlug(current.title),
    }))
  }, [slugLocked, value.title])

  useEffect(() => {
    if (viewMode === "editor") return

    const timer = window.setTimeout(async () => {
      setPreviewLoading(true)
      try {
        const result = await renderMarkdownPreviewAction(value.content || "")
        setPreviewHtml(result.html)
      } catch {
        toast.error("预览生成失败，请稍后重试。")
      } finally {
        setPreviewLoading(false)
      }
    }, 260)

    return () => window.clearTimeout(timer)
  }, [value.content, viewMode])

  useEffect(() => {
    const timer = window.setInterval(() => {
      const hasDraftContent =
        Boolean(value.title.trim()) ||
        Boolean(value.summary.trim()) ||
        Boolean(value.content.trim()) ||
        Boolean(value.tags.trim()) ||
        Boolean(value.categories.trim())

      if (!hasDraftContent || !isDirty) return

      localStorage.setItem(draftStorageKey, JSON.stringify(normalizeForDraft(value)))
      setLastAutosavedAt(new Date().toISOString())
    }, 10000)

    return () => window.clearInterval(timer)
  }, [draftStorageKey, isDirty, value])

  const clearDraftCache = (paths: string[]) => {
    for (const path of paths) {
      localStorage.removeItem(buildDraftStorageKey(path))
    }
    localStorage.removeItem(buildDraftStorageKey("new-post"))
  }

  const handleSave = () => {
    startTransition(async () => {
      const result = await savePostEditorAction(buildFormData())
      if (result.error) {
        toast.error(result.error)
        return
      }

      if (result.editor) {
        const nextValue = {
          relativePath: result.editor.relativePath,
          title: result.editor.title,
          slug: result.editor.slug,
          date: result.editor.date.slice(0, 10),
          summary: result.editor.summary,
          tags: result.editor.tags.join(", "),
          categories: result.editor.categories.join(", "),
          draft: result.editor.draft,
          content: result.editor.content,
        }

        setValue(nextValue)
        setBaseline(nextValue)
        setSlugLocked(true)
        clearDraftCache([value.relativePath, result.editor.relativePath].filter(Boolean))

        if (!value.relativePath) {
          router.replace(`/admin/posts/edit?path=${encodeURIComponent(result.editor.relativePath)}`)
        }
      }

      toast.success(result.success || "文章已保存")
      router.refresh()
    })
  }

  const handleDelete = () => {
    if (!value.relativePath) {
      router.push("/admin/posts")
      return
    }

    startTransition(async () => {
      const result = await deletePostEditorAction(value.relativePath)
      if (result.error) {
        toast.error(result.error)
        return
      }

      clearDraftCache([value.relativePath])
      toast.success(result.success || "文章已删除")
      router.push("/admin/posts")
      router.refresh()
    })
  }

  const applySummarySuggestion = () => {
    if (value.summary.trim()) return

    const nextSummary = suggestPostSummary(value.content)
    if (!nextSummary) {
      toast.error("正文内容过少，暂时无法生成摘要")
      return
    }

    setField("summary", nextSummary)
    toast.success("已根据正文生成摘要建议")
  }

  return (
    <div className={metaCollapsed ? "space-y-5" : "space-y-5"}>
      <div className="flex flex-col gap-3 rounded-[28px] border border-border/70 bg-card/80 p-4 shadow-sm lg:flex-row lg:items-center lg:justify-between">
        <div className="flex flex-wrap items-center gap-2">
          <Button asChild type="button" variant="outline" className="rounded-xl">
            <Link href="/admin/posts">
              <ArrowLeft className="size-4" />
              返回文章列表
            </Link>
          </Button>
          <Badge variant={value.draft ? "outline" : "secondary"} className="rounded-full">
            {value.draft ? "草稿" : "已发布"}
          </Badge>
          <Badge variant="outline" className="rounded-full bg-background">
            {value.relativePath || "new-post"}
          </Badge>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <AdminToolbarMeta label="标签" value={`${tagValues.length} 个`} />
          <AdminToolbarMeta label="分类" value={`${categoryValues.length} 个`} />
          <AdminToolbarMeta label="正文长度" value={`${wordEstimate} 字`} />
          <AdminToolbarMeta
            label="本地草稿"
            value={lastAutosavedAt ? new Date(lastAutosavedAt).toLocaleTimeString("zh-CN") : "未缓存"}
          />
          <Button
            type="button"
            variant="outline"
            className="rounded-xl"
            onClick={() => setMetaCollapsed((current) => !current)}
          >
            {metaCollapsed ? <PanelRightOpen className="size-4" /> : <PanelRightClose className="size-4" />}
            {metaCollapsed ? "展开属性栏" : "收起属性栏"}
          </Button>
          <Button
            type="button"
            variant="outline"
            className="rounded-xl"
            onClick={() => setDeleteOpen(true)}
            disabled={pending}
          >
            <Trash2 className="size-4" />
            删除
          </Button>
          <Button
            type="button"
            className="rounded-xl"
            onClick={handleSave}
            disabled={pending}
          >
            <Save className="size-4" />
            保存文章
          </Button>
        </div>
      </div>

      <div className={`grid gap-5 ${metaCollapsed ? "" : "xl:grid-cols-[minmax(0,1.45fr)_360px]"}`}>
        <AdminPanel className={metaCollapsed ? "" : ""}>
          <AdminPanelHeader
            title="正文编辑"
            description="写作区和元数据区彻底分离，预览可单独打开也可分屏查看。"
            actions={
              <div className="flex flex-wrap gap-2">
                <Button
                  type="button"
                  variant={viewMode === "editor" ? "default" : "outline"}
                  className="rounded-xl"
                  onClick={() => setViewMode("editor")}
                >
                  仅编辑
                </Button>
                <Button
                  type="button"
                  variant={viewMode === "split" ? "default" : "outline"}
                  className="rounded-xl"
                  onClick={() => setViewMode("split")}
                >
                  分屏
                </Button>
                <Button
                  type="button"
                  variant={viewMode === "preview" ? "default" : "outline"}
                  className="rounded-xl"
                  onClick={() => setViewMode("preview")}
                >
                  仅预览
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  className="rounded-xl"
                  onClick={() => window.open(`/blog/${value.slug}`, "_blank", "noopener,noreferrer")}
                >
                  <Eye className="size-4" />
                  前台预览
                </Button>
              </div>
            }
          />
          <AdminPanelBody className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">文章标题</label>
              <Input
                value={value.title}
                onChange={(event) => {
                  setField("title", event.target.value)
                  if (!slugLocked) {
                    setField("slug", suggestPostSlug(event.target.value))
                  }
                }}
                placeholder="请输入文章标题"
                className="h-11 rounded-xl"
              />
            </div>

            {viewMode === "editor" ? (
              <Textarea
                rows={28}
                value={value.content}
                onChange={(event) => setField("content", event.target.value)}
                placeholder="开始编写 Markdown 正文"
                className="min-h-[720px] rounded-[24px] border-border/70 bg-muted/10 font-mono text-sm leading-7"
              />
            ) : viewMode === "preview" ? (
              <div className="min-h-[720px] rounded-[24px] border border-border/70 bg-muted/10 p-6">
                {previewLoading ? (
                  <div className="flex h-full min-h-[660px] items-center justify-center text-sm text-muted-foreground">
                    正在生成预览...
                  </div>
                ) : (
                  <div className="prose prose-zinc max-w-none dark:prose-invert">
                    <HtmlMarkdownContent html={previewHtml} />
                  </div>
                )}
              </div>
            ) : (
              <div className="grid gap-4 xl:grid-cols-2">
                <Textarea
                  rows={28}
                  value={value.content}
                  onChange={(event) => setField("content", event.target.value)}
                  placeholder="开始编写 Markdown 正文"
                  className="min-h-[720px] rounded-[24px] border-border/70 bg-muted/10 font-mono text-sm leading-7"
                />
                <div className="min-h-[720px] rounded-[24px] border border-border/70 bg-muted/10 p-6">
                  {previewLoading ? (
                    <div className="flex h-full min-h-[660px] items-center justify-center text-sm text-muted-foreground">
                      正在生成预览...
                    </div>
                  ) : (
                    <div className="prose prose-zinc max-w-none dark:prose-invert">
                      <HtmlMarkdownContent html={previewHtml} />
                    </div>
                  )}
                </div>
              </div>
            )}
          </AdminPanelBody>
        </AdminPanel>

        {!metaCollapsed ? (
          <div className="space-y-5">
            <AdminPanel>
              <AdminPanelHeader
                title="文章属性"
                description="标题和正文在左侧专心写，元数据全部收进右侧属性栏。"
              />
              <AdminPanelBody className="space-y-4">
                <div className="space-y-2">
                  <div className="flex items-center justify-between gap-3">
                    <label className="text-sm font-medium text-foreground">Slug</label>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="h-auto rounded-xl px-2 py-1 text-xs"
                      onClick={() => {
                        setField("slug", suggestPostSlug(value.title))
                        setSlugLocked(false)
                      }}
                    >
                      根据标题生成
                    </Button>
                  </div>
                  <Input
                    value={value.slug}
                    onChange={(event) => {
                      setSlugLocked(true)
                      setField("slug", event.target.value)
                    }}
                    placeholder="article-slug"
                    className="h-10 rounded-xl"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-foreground">发布时间</label>
                  <Input
                    type="date"
                    value={value.date}
                    onChange={(event) => setField("date", event.target.value)}
                    className="h-10 rounded-xl"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-foreground">分类</label>
                  <Textarea
                    rows={4}
                    value={value.categories}
                    onChange={(event) => setField("categories", event.target.value)}
                    placeholder={`多个分类用英文逗号分隔。现有分类：${availableCategories.map((item) => item.labelZh).join("、")}`}
                    className="rounded-2xl"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-foreground">标签</label>
                  <Textarea
                    rows={4}
                    value={value.tags}
                    onChange={(event) => setField("tags", event.target.value)}
                    placeholder="多个标签用英文逗号分隔"
                    className="rounded-2xl"
                  />
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between gap-3">
                    <label className="text-sm font-medium text-foreground">摘要</label>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="h-auto rounded-xl px-2 py-1 text-xs"
                      onClick={applySummarySuggestion}
                    >
                      自动提取建议
                    </Button>
                  </div>
                  <Textarea
                    rows={5}
                    value={value.summary}
                    onChange={(event) => setField("summary", event.target.value)}
                    placeholder="为文章写一段摘要"
                    className="rounded-2xl"
                  />
                </div>

                <div className="rounded-[24px] border border-border/70 bg-muted/20 p-4">
                  <div className="flex items-center justify-between gap-4">
                    <div className="space-y-1">
                      <div className="text-sm font-medium text-foreground">保存为草稿</div>
                      <div className="text-xs leading-6 text-muted-foreground">
                        关闭后文章不会在前台公开展示。
                      </div>
                    </div>
                    <Switch
                      checked={value.draft}
                      onCheckedChange={(checked) => setField("draft", checked)}
                    />
                  </div>
                </div>
              </AdminPanelBody>
            </AdminPanel>

            <AdminPanel className="rounded-[28px] border-border/70 bg-gradient-to-br from-primary/5 via-card to-card">
              <AdminPanelBody className="space-y-3 p-5">
                <div className="flex items-center gap-3">
                  <div className="flex size-10 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                    <Sparkles className="size-4" />
                  </div>
                  <div>
                    <div className="text-sm font-medium text-foreground">自动保存提示</div>
                    <div className="text-xs leading-6 text-muted-foreground">
                      编辑器每 10 秒会把未保存内容缓存到浏览器。本次状态{" "}
                      {isDirty ? "存在未保存修改" : "已和文件同步"}。
                    </div>
                  </div>
                </div>
              </AdminPanelBody>
            </AdminPanel>
          </div>
        ) : null}
      </div>

      <ConfirmDialog
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
        title="确认删除文章"
        description="删除后文件会被直接移除，且不会进入回收站。"
        confirmLabel="确认删除"
        destructive
        confirming={pending}
        onConfirm={handleDelete}
      />
    </div>
  )
}
