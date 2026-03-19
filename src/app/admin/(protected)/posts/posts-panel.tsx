"use client"

import Link from "next/link"
import { useRouter } from "next/navigation"
import { useDeferredValue, useEffect, useMemo, useState, useTransition } from "react"
import {
  ArrowUpDown,
  Eye,
  FileText,
  PencilLine,
  Plus,
  RefreshCw,
  Search,
  ToggleLeft,
  Trash2,
} from "lucide-react"
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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  AdminEmptyState,
  AdminPagination,
  AdminPanel,
  AdminPanelBody,
  AdminPanelHeader,
  AdminStatCard,
  AdminToolbar,
  AdminToolbarMeta,
} from "@/features/admin/components/admin-ui"
import { ConfirmDialog } from "@/features/admin/components/confirm-dialog"

import {
  deletePostEditorAction,
  getPostEditorAction,
  savePostEditorAction,
} from "@/app/admin/actions"

type PostItem = {
  title: string
  slug: string
  relativePath: string
  absolutePath: string
  updatedAt: string
  date: string
  summary: string
  tags: string[]
  categories: string[]
  draft: boolean
  wordCount: number
}

type SortBy = "date-desc" | "date-asc" | "words-desc" | "title-asc"
type StatusFilter = "all" | "published" | "draft"

type CategoryOption = {
  slug: string
  labelZh: string
}

const PAGE_SIZE = 10

function formatDate(value: string) {
  return new Date(value).toLocaleString("zh-CN", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  })
}

function getCategoryLabel(category: string, options: CategoryOption[]) {
  return (
    options.find((option) => option.slug.toLowerCase() === category.toLowerCase())?.labelZh ||
    category
  )
}

export default function PostsPanel({
  posts,
  categoryOptions = [],
}: {
  posts: PostItem[]
  categoryOptions?: CategoryOption[]
}) {
  const router = useRouter()
  const [items, setItems] = useState(posts)
  const [query, setQuery] = useState("")
  const [categoryFilter, setCategoryFilter] = useState("all")
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all")
  const [sortBy, setSortBy] = useState<SortBy>("date-desc")
  const [page, setPage] = useState(1)
  const [pending, startTransition] = useTransition()
  const [postToDelete, setPostToDelete] = useState<PostItem | null>(null)
  const deferredQuery = useDeferredValue(query.trim().toLowerCase())

  useEffect(() => {
    setItems(posts)
  }, [posts])

  useEffect(() => {
    setPage(1)
  }, [deferredQuery, categoryFilter, sortBy, statusFilter])

  const filteredItems = useMemo(() => {
    const list = items.filter((item) => {
      const matchesKeyword =
        !deferredQuery ||
        item.title.toLowerCase().includes(deferredQuery) ||
        item.slug.toLowerCase().includes(deferredQuery) ||
        item.tags.some((tag) => tag.toLowerCase().includes(deferredQuery))

      const matchesCategory =
        categoryFilter === "all" || item.categories.includes(categoryFilter)
      const matchesStatus =
        statusFilter === "all" ||
        (statusFilter === "draft" ? item.draft : !item.draft)

      return matchesKeyword && matchesCategory && matchesStatus
    })

    return [...list].sort((left, right) => {
      if (sortBy === "date-asc") {
        return new Date(left.date).getTime() - new Date(right.date).getTime()
      }

      if (sortBy === "words-desc") {
        return right.wordCount - left.wordCount
      }

      if (sortBy === "title-asc") {
        return left.title.localeCompare(right.title, "zh-CN")
      }

      return new Date(right.date).getTime() - new Date(left.date).getTime()
    })
  }, [categoryFilter, deferredQuery, items, sortBy, statusFilter])

  const totalPages = Math.max(1, Math.ceil(filteredItems.length / PAGE_SIZE))
  const currentPage = Math.min(page, totalPages)
  const pagedItems = filteredItems.slice(
    (currentPage - 1) * PAGE_SIZE,
    currentPage * PAGE_SIZE
  )

  const publishedCount = items.filter((item) => !item.draft).length
  const draftCount = items.filter((item) => item.draft).length
  const totalWords = items.reduce((sum, item) => sum + item.wordCount, 0)

  const resetView = () => {
    setQuery("")
    setCategoryFilter("all")
    setStatusFilter("all")
    setSortBy("date-desc")
    setPage(1)
  }

  const toggleStatus = (post: PostItem) => {
    startTransition(async () => {
      try {
        const editor = await getPostEditorAction(post.relativePath)
        const formData = new FormData()
        formData.set("relativePath", editor.relativePath)
        formData.set("title", editor.title)
        formData.set("slug", editor.slug)
        formData.set("date", editor.date)
        formData.set("summary", editor.summary)
        formData.set("tags", editor.tags.join(", "))
        formData.set("categories", editor.categories.join(", "))
        formData.set("draft", String(!editor.draft))
        formData.set("content", editor.content)

        const result = await savePostEditorAction(formData)
        if (result.error) {
          toast.error(result.error)
          return
        }

        if (result.post) {
          setItems((current) =>
            current.map((item) =>
              item.relativePath === post.relativePath ? result.post || item : item
            )
          )
        }

        toast.success(post.draft ? "文章已发布" : "文章已转为草稿")
      } catch {
        toast.error("状态切换失败，请稍后重试。")
      }
    })
  }

  const handleDelete = () => {
    if (!postToDelete) return

    startTransition(async () => {
      const result = await deletePostEditorAction(postToDelete.relativePath)
      if (result.error) {
        toast.error(result.error)
        return
      }

      setItems((current) =>
        current.filter((item) => item.relativePath !== postToDelete.relativePath)
      )
      setPostToDelete(null)
      toast.success("文章已删除")
    })
  }

  return (
    <div className="space-y-5">
      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <AdminStatCard
          title="文章总数"
          value={items.length}
          hint={`当前筛选命中 ${filteredItems.length} 篇`}
          icon={FileText}
        />
        <AdminStatCard
          title="已发布"
          value={publishedCount}
          hint={`草稿 ${draftCount} 篇`}
          icon={PencilLine}
        />
        <AdminStatCard
          title="总字数"
          value={totalWords}
          hint="用于衡量内容储备"
          icon={ArrowUpDown}
        />
        <AdminStatCard
          title="当前页"
          value={`${currentPage}/${totalPages}`}
          hint={`每页 ${PAGE_SIZE} 篇`}
          icon={Search}
        />
      </section>

      <AdminPanel>
        <AdminPanelHeader
          title="文章管理"
          description="在高密度视图中集中处理搜索、筛选、排序、发布状态与编辑入口。"
          actions={
            <>
              <Button
                type="button"
                variant="outline"
                className="rounded-xl"
                disabled={pending}
                onClick={() => router.refresh()}
              >
                <RefreshCw className={pending ? "size-4 animate-spin" : "size-4"} />
                刷新
              </Button>
              <Button asChild className="rounded-xl">
                <Link href="/admin/posts/edit?new=1">
                  <Plus className="size-4" />
                  新建文章
                </Link>
              </Button>
            </>
          }
        />
        <AdminPanelBody className="space-y-4">
          <AdminToolbar>
            <div className="flex flex-1 flex-col gap-3 lg:flex-row">
              <div className="relative flex-1">
                <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                  placeholder="搜索标题、Slug 或标签"
                  className="h-10 rounded-xl pl-9"
                />
              </div>
              <div className="grid gap-3 sm:grid-cols-3 lg:w-[520px]">
                <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                  <SelectTrigger className="h-10 rounded-xl">
                    <SelectValue placeholder="全部分类" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">全部分类</SelectItem>
                    {categoryOptions.map((item) => (
                      <SelectItem key={item.slug} value={item.slug}>
                        {item.labelZh}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <Select
                  value={statusFilter}
                  onValueChange={(value) => setStatusFilter(value as StatusFilter)}
                >
                  <SelectTrigger className="h-10 rounded-xl">
                    <SelectValue placeholder="全部状态" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">全部状态</SelectItem>
                    <SelectItem value="published">已发布</SelectItem>
                    <SelectItem value="draft">草稿</SelectItem>
                  </SelectContent>
                </Select>

                <Select value={sortBy} onValueChange={(value) => setSortBy(value as SortBy)}>
                  <SelectTrigger className="h-10 rounded-xl">
                    <SelectValue placeholder="排序方式" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="date-desc">最新发布</SelectItem>
                    <SelectItem value="date-asc">最早发布</SelectItem>
                    <SelectItem value="words-desc">字数最多</SelectItem>
                    <SelectItem value="title-asc">标题 A-Z</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <AdminToolbarMeta label="已发布" value={`${publishedCount} 篇`} />
              <AdminToolbarMeta label="草稿" value={`${draftCount} 篇`} />
              <Button type="button" variant="outline" className="rounded-xl" onClick={resetView}>
                重置视图
              </Button>
            </div>
          </AdminToolbar>

          {filteredItems.length === 0 ? (
            <AdminEmptyState
              icon={FileText}
              title="没有匹配的文章"
              description="尝试调整搜索词、分类或状态筛选，或者直接创建一篇新文章。"
              action={
                <Button asChild className="rounded-xl">
                  <Link href="/admin/posts/edit?new=1">
                    <Plus className="size-4" />
                    新建文章
                  </Link>
                </Button>
              }
            />
          ) : (
            <>
              <div className="hidden lg:block">
                <Table containerClassName="rounded-[28px] border border-border/70">
                  <TableHeader className="bg-muted/25">
                    <TableRow className="hover:bg-transparent">
                      <TableHead className="px-4 py-3">文章</TableHead>
                      <TableHead className="px-4 py-3">分类</TableHead>
                      <TableHead className="px-4 py-3">发布时间</TableHead>
                      <TableHead className="px-4 py-3">字数</TableHead>
                      <TableHead className="px-4 py-3 text-right">操作</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {pagedItems.map((record) => (
                      <TableRow key={record.relativePath}>
                        <TableCell className="px-4 py-4 align-top">
                          <div className="space-y-3">
                            <div className="flex flex-wrap items-center gap-2">
                              <Link
                                href={`/admin/posts/edit?path=${encodeURIComponent(record.relativePath)}`}
                                className="text-sm font-semibold text-foreground transition-colors hover:text-primary"
                              >
                                {record.title}
                              </Link>
                              <Badge
                                variant={record.draft ? "outline" : "secondary"}
                                className="rounded-full"
                              >
                                {record.draft ? "草稿" : "已发布"}
                              </Badge>
                            </div>
                            <p className="line-clamp-2 max-w-[520px] text-sm leading-6 text-muted-foreground">
                              {record.summary || "暂无摘要"}
                            </p>
                            <div className="flex flex-wrap gap-2">
                              {record.tags.slice(0, 4).map((tag) => (
                                <Badge key={tag} variant="outline" className="rounded-full px-2.5 py-0.5">
                                  #{tag}
                                </Badge>
                              ))}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell className="px-4 py-4 align-top">
                          <div className="flex flex-wrap gap-2">
                            {record.categories.length ? (
                              record.categories.map((category) => (
                                <Badge key={category} variant="outline" className="rounded-full bg-background">
                                  {getCategoryLabel(category, categoryOptions)}
                                </Badge>
                              ))
                            ) : (
                              <span className="text-sm text-muted-foreground">未分类</span>
                            )}
                          </div>
                        </TableCell>
                        <TableCell className="px-4 py-4 align-top text-sm text-muted-foreground">
                          {formatDate(record.date)}
                        </TableCell>
                        <TableCell className="px-4 py-4 align-top text-sm font-medium text-foreground">
                          {record.wordCount.toLocaleString("zh-CN")}
                        </TableCell>
                        <TableCell className="px-4 py-4 align-top">
                          <div className="flex justify-end gap-2">
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              className="rounded-xl"
                              onClick={() =>
                                router.push(
                                  `/admin/posts/edit?path=${encodeURIComponent(record.relativePath)}`
                                )
                              }
                            >
                              <PencilLine className="size-4" />
                              编辑
                            </Button>
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              className="rounded-xl"
                              onClick={() =>
                                window.open(`/blog/${record.slug}`, "_blank", "noopener,noreferrer")
                              }
                            >
                              <Eye className="size-4" />
                              预览
                            </Button>
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              className="rounded-xl"
                              disabled={pending}
                              onClick={() => toggleStatus(record)}
                            >
                              <ToggleLeft className="size-4" />
                              {record.draft ? "发布" : "转草稿"}
                            </Button>
                            <Button
                              type="button"
                              variant="destructive"
                              size="sm"
                              className="rounded-xl"
                              disabled={pending}
                              onClick={() => setPostToDelete(record)}
                            >
                              <Trash2 className="size-4" />
                              删除
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              <div className="grid gap-3 lg:hidden">
                {pagedItems.map((record) => (
                  <AdminPanel key={record.relativePath} className="rounded-[28px]">
                    <AdminPanelBody className="space-y-4 p-5">
                      <div className="flex flex-wrap items-start justify-between gap-3">
                        <div className="space-y-2">
                          <div className="flex flex-wrap items-center gap-2">
                            <div className="text-base font-semibold text-foreground">{record.title}</div>
                            <Badge variant={record.draft ? "outline" : "secondary"} className="rounded-full">
                              {record.draft ? "草稿" : "已发布"}
                            </Badge>
                          </div>
                          <div className="text-xs text-muted-foreground">{record.relativePath}</div>
                        </div>
                        <Badge variant="outline" className="rounded-full bg-background">
                          {record.wordCount.toLocaleString("zh-CN")} 字
                        </Badge>
                      </div>
                      <p className="text-sm leading-6 text-muted-foreground">
                        {record.summary || "暂无摘要"}
                      </p>
                      <div className="flex flex-wrap gap-2">
                        {record.categories.length ? (
                          record.categories.map((category) => (
                            <Badge key={category} variant="outline" className="rounded-full">
                              {getCategoryLabel(category, categoryOptions)}
                            </Badge>
                          ))
                        ) : (
                          <Badge variant="outline" className="rounded-full">
                            未分类
                          </Badge>
                        )}
                      </div>
                      <div className="flex flex-wrap gap-2">
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          className="rounded-xl"
                          onClick={() =>
                            router.push(
                              `/admin/posts/edit?path=${encodeURIComponent(record.relativePath)}`
                            )
                          }
                        >
                          <PencilLine className="size-4" />
                          编辑
                        </Button>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          className="rounded-xl"
                          onClick={() =>
                            window.open(`/blog/${record.slug}`, "_blank", "noopener,noreferrer")
                          }
                        >
                          <Eye className="size-4" />
                          预览
                        </Button>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          className="rounded-xl"
                          disabled={pending}
                          onClick={() => toggleStatus(record)}
                        >
                          <ToggleLeft className="size-4" />
                          {record.draft ? "发布" : "转草稿"}
                        </Button>
                        <Button
                          type="button"
                          variant="destructive"
                          size="sm"
                          className="rounded-xl"
                          disabled={pending}
                          onClick={() => setPostToDelete(record)}
                        >
                          <Trash2 className="size-4" />
                          删除
                        </Button>
                      </div>
                    </AdminPanelBody>
                  </AdminPanel>
                ))}
              </div>

              <AdminPagination
                page={currentPage}
                totalPages={totalPages}
                onPageChange={setPage}
              />
            </>
          )}
        </AdminPanelBody>
      </AdminPanel>

      <ConfirmDialog
        open={Boolean(postToDelete)}
        onOpenChange={(open) => {
          if (!open) setPostToDelete(null)
        }}
        title="确认删除文章"
        description={`删除后不可恢复，确定要删除《${postToDelete?.title || "未命名文章"}》吗？`}
        confirmLabel="确认删除"
        destructive
        confirming={pending}
        onConfirm={handleDelete}
      />
    </div>
  )
}
