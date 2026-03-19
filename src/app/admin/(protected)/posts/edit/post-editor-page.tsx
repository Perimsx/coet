"use client"

import Link from "next/link"
import { useRouter } from "next/navigation"
import { useMemo, useState, useTransition } from "react"
import {
  ArrowLeft,
  Eye,
  FileText,
  Save,
  Sparkles,
  Trash2,
} from "lucide-react"
import { toast } from "sonner"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Switch } from "@/components/ui/switch"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
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

function splitTokens(input: string) {
  return input
    .split(/[,\n]/)
    .map((item) => item.trim())
    .filter(Boolean)
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
  const [activeTab, setActiveTab] = useState<"edit" | "preview">("edit")
  const [previewHtml, setPreviewHtml] = useState("")
  const [previewLoading, setPreviewLoading] = useState(false)
  const [deleteOpen, setDeleteOpen] = useState(false)

  const categoryValues = useMemo(() => splitTokens(value.categories), [value.categories])
  const tagValues = useMemo(() => splitTokens(value.tags), [value.tags])
  const wordEstimate = useMemo(() => value.content.trim().length, [value.content])

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

  const openPreview = async () => {
    setActiveTab("preview")
    setPreviewLoading(true)
    try {
      const result = await renderMarkdownPreviewAction(value.content || "")
      setPreviewHtml(result.html)
    } catch {
      toast.error("预览生成失败，请稍后重试。")
    } finally {
      setPreviewLoading(false)
    }
  }

  const handleSave = () => {
    startTransition(async () => {
      const result = await savePostEditorAction(buildFormData())
      if (result.error) {
        toast.error(result.error)
        return
      }

      if (result.editor) {
        setValue({
          relativePath: result.editor.relativePath,
          title: result.editor.title,
          slug: result.editor.slug,
          date: result.editor.date.slice(0, 10),
          summary: result.editor.summary,
          tags: result.editor.tags.join(", "),
          categories: result.editor.categories.join(", "),
          draft: result.editor.draft,
          content: result.editor.content,
        })

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

      toast.success(result.success || "文章已删除")
      router.push("/admin/posts")
      router.refresh()
    })
  }

  return (
    <div className="space-y-5">
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
            {value.relativePath || "新文章"}
          </Badge>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <AdminToolbarMeta label="标签" value={`${tagValues.length} 个`} />
          <AdminToolbarMeta label="分类" value={`${categoryValues.length} 个`} />
          <AdminToolbarMeta label="正文长度" value={`${wordEstimate} 字`} />
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

      <div className="grid gap-5 xl:grid-cols-[1.6fr_0.9fr]">
        <AdminPanel>
          <AdminPanelHeader
            title="正文编辑"
            description="支持 Markdown 正文编辑与预览，保存后会继续沿用现有内容构建与缓存刷新流程。"
            actions={
              <Button
                type="button"
                variant="outline"
                className="rounded-xl"
                onClick={() => window.open(`/blog/${value.slug}`, "_blank", "noopener,noreferrer")}
              >
                <Eye className="size-4" />
                前台预览
              </Button>
            }
          />
          <AdminPanelBody className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">文章标题</label>
              <Input
                value={value.title}
                onChange={(event) => setField("title", event.target.value)}
                placeholder="请输入文章标题"
                className="h-11 rounded-xl"
              />
            </div>

            <Tabs
              value={activeTab}
              onValueChange={(nextValue) => {
                if (nextValue === "preview") {
                  void openPreview()
                  return
                }

                setActiveTab("edit")
              }}
              className="space-y-4"
            >
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className="rounded-full bg-background">
                    <FileText className="mr-1 size-3.5" />
                    Markdown
                  </Badge>
                  <TabsList className="rounded-xl">
                    <TabsTrigger value="edit" className="rounded-lg">
                      编辑
                    </TabsTrigger>
                    <TabsTrigger value="preview" className="rounded-lg">
                      预览
                    </TabsTrigger>
                  </TabsList>
                </div>
                <div className="text-xs text-muted-foreground">
                  保存时会保留现有分类自动注册逻辑与缓存刷新逻辑
                </div>
              </div>

              <TabsContent value="edit" className="mt-0">
                <Textarea
                  rows={26}
                  value={value.content}
                  onChange={(event) => setField("content", event.target.value)}
                  placeholder="开始编写 Markdown 正文"
                  className="min-h-[640px] rounded-[24px] border-border/70 bg-muted/10 font-mono text-sm leading-7"
                />
              </TabsContent>

              <TabsContent value="preview" className="mt-0">
                <div className="min-h-[640px] rounded-[24px] border border-border/70 bg-muted/10 p-6">
                  {previewLoading ? (
                    <div className="flex h-full min-h-[580px] items-center justify-center text-sm text-muted-foreground">
                      正在生成预览...
                    </div>
                  ) : (
                    <div className="prose prose-zinc max-w-none dark:prose-invert">
                      <HtmlMarkdownContent html={previewHtml} />
                    </div>
                  )}
                </div>
              </TabsContent>
            </Tabs>
          </AdminPanelBody>
        </AdminPanel>

        <div className="space-y-5">
          <AdminPanel>
            <AdminPanelHeader
              title="文章属性"
              description="维持原有前言字段与草稿逻辑，但改为更紧凑的侧边编辑视图。"
            />
            <AdminPanelBody className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">Slug</label>
                <Input
                  value={value.slug}
                  onChange={(event) => setField("slug", event.target.value)}
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
                  placeholder={`可输入多个分类，逗号分隔。已存在分类：${availableCategories.map((item) => item.labelZh).join("、")}`}
                  className="rounded-2xl"
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">标签</label>
                <Textarea
                  rows={4}
                  value={value.tags}
                  onChange={(event) => setField("tags", event.target.value)}
                  placeholder="多个标签使用逗号分隔"
                  className="rounded-2xl"
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">摘要</label>
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
                      关闭后文章将以已发布状态参与前台渲染。
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
                  <div className="text-sm font-medium text-foreground">编辑提示</div>
                  <div className="text-xs leading-6 text-muted-foreground">
                    分类与标签仍按逗号拆分，保存后会继续复用现有 server action 逻辑。
                  </div>
                </div>
              </div>
            </AdminPanelBody>
          </AdminPanel>
        </div>
      </div>

      <ConfirmDialog
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
        title="确认删除文章"
        description="删除后不可恢复，并会同步更新后台列表与前台缓存。"
        confirmLabel="确认删除"
        destructive
        confirming={pending}
        onConfirm={handleDelete}
      />
    </div>
  )
}
