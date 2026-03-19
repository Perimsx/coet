"use client"

import Link from "next/link"
import { useRouter } from "next/navigation"
import { useDeferredValue, useEffect, useMemo, useState, useTransition } from "react"
import {
  Eye,
  FileText,
  Layers3,
  PencilLine,
  Plus,
  RefreshCw,
  Save,
  Search,
  Trash2,
  Upload,
} from "lucide-react"
import { toast } from "sonner"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
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
import { useAdminShellStore } from "@/features/admin/components/admin-shell-store"
import { ConfirmDialog } from "@/features/admin/components/confirm-dialog"

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

type SavedView = {
  id: number
  name: string
  query: string
  category: string
  status: string
  sortBy: string
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

async function runBatchMutation(input: {
  operation: "publish" | "draft" | "delete" | "update-categories" | "update-tags"
  relativePaths: string[]
  categories?: string[]
  tags?: string[]
}) {
  const response = await fetch("/api/admin/posts/batch", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(input),
  })

  const result = await response.json()
  if (!response.ok || !result.ok) {
    throw new Error(result.error || "批量操作失败")
  }

  return result.result as {
    total: number
    successCount: number
    failureCount: number
  }
}

export default function PostsPanel({
  posts,
  categoryOptions = [],
}: {
  posts: PostItem[]
  categoryOptions?: CategoryOption[]
}) {
  const router = useRouter()
  const selectedPaths = useAdminShellStore((state) => state.bulkPostSelection)
  const setSelectedPaths = useAdminShellStore((state) => state.setBulkPostSelection)

  const [items, setItems] = useState(posts)
  const [query, setQuery] = useState("")
  const [categoryFilter, setCategoryFilter] = useState("all")
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all")
  const [sortBy, setSortBy] = useState<SortBy>("date-desc")
  const [page, setPage] = useState(1)
  const [pending, startTransition] = useTransition()
  const [deleteTargets, setDeleteTargets] = useState<string[]>([])
  const [savedViews, setSavedViews] = useState<SavedView[]>([])
  const deferredQuery = useDeferredValue(query.trim().toLowerCase())

  useEffect(() => {
    setItems(posts)
  }, [posts])

  useEffect(() => {
    setPage(1)
  }, [deferredQuery, categoryFilter, sortBy, statusFilter])

  useEffect(() => {
    void (async () => {
      try {
        const response = await fetch("/api/admin/posts/views")
        const result = await response.json()
        if (!response.ok || !result.ok) return
        setSavedViews(result.items)
      } catch {
        // Ignore saved-view bootstrap failures.
      }
    })()
  }, [])

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

  const currentViewState = {
    query,
    category: categoryFilter,
    status: statusFilter,
    sortBy,
  }

  const allFilteredPaths = filteredItems.map((item) => item.relativePath)
  const allFilteredSelected =
    allFilteredPaths.length > 0 &&
    allFilteredPaths.every((path) => selectedPaths.includes(path))

  const resetView = () => {
    setQuery("")
    setCategoryFilter("all")
    setStatusFilter("all")
    setSortBy("date-desc")
    setPage(1)
  }

  const toggleSelection = (relativePath: string, checked: boolean) => {
    setSelectedPaths(
      checked
        ? [...new Set([...selectedPaths, relativePath])]
        : selectedPaths.filter((path) => path !== relativePath)
    )
  }

  const applySavedView = (value: string) => {
    const view = savedViews.find((item) => String(item.id) === value)
    if (!view) return
    setQuery(view.query || "")
    setCategoryFilter(view.category || "all")
    setStatusFilter((view.status as StatusFilter) || "all")
    setSortBy((view.sortBy as SortBy) || "date-desc")
    setPage(1)
  }

  const handleSaveCurrentView = () => {
    const nextName = window.prompt("为当前筛选视图命名", "")
    if (!nextName?.trim()) return

    startTransition(async () => {
      try {
        const response = await fetch("/api/admin/posts/views", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            name: nextName.trim(),
            state: currentViewState,
          }),
        })
        const result = await response.json()

        if (!response.ok || !result.ok) {
          toast.error("保存视图失败")
          return
        }

        setSavedViews((current) => {
          const next = current.filter((item) => item.id !== result.item.id)
          return [result.item, ...next]
        })
        toast.success("筛选视图已保存")
      } catch {
        toast.error("保存视图失败")
      }
    })
  }

  const handleDeleteView = (id: number) => {
    startTransition(async () => {
      try {
        const response = await fetch(`/api/admin/posts/views?id=${id}`, {
          method: "DELETE",
        })
        const result = await response.json()
        if (!response.ok || !result.ok) {
          toast.error("删除视图失败")
          return
        }

        setSavedViews((current) => current.filter((item) => item.id !== id))
        toast.success("筛选视图已删除")
      } catch {
        toast.error("删除视图失败")
      }
    })
  }

  const handleBatchAction = (
    operation: "publish" | "draft" | "delete" | "update-categories" | "update-tags"
  ) => {
    if (!selectedPaths.length) return

    startTransition(async () => {
      try {
        if (operation === "delete") {
          setDeleteTargets(selectedPaths)
          return
        }

        if (operation === "update-categories") {
          const raw = window.prompt("输入新的分类，多个分类用英文逗号分隔", "")
          if (raw === null) return
          const categories = raw
            .split(",")
            .map((item) => item.trim())
            .filter(Boolean)

          const result = await runBatchMutation({
            operation,
            relativePaths: selectedPaths,
            categories,
          })
          setSelectedPaths([])
          router.refresh()
          toast.success(`批量改分类完成：成功 ${result.successCount} 篇`)
          return
        }

        if (operation === "update-tags") {
          const raw = window.prompt("输入新的标签，多个标签用英文逗号分隔", "")
          if (raw === null) return
          const tags = raw
            .split(",")
            .map((item) => item.trim())
            .filter(Boolean)

          const result = await runBatchMutation({
            operation,
            relativePaths: selectedPaths,
            tags,
          })
          setSelectedPaths([])
          router.refresh()
          toast.success(`批量改标签完成：成功 ${result.successCount} 篇`)
          return
        }

        const result = await runBatchMutation({
          operation,
          relativePaths: selectedPaths,
        })

        setSelectedPaths([])
        router.refresh()
        toast.success(`批量操作完成：成功 ${result.successCount} 篇`)
      } catch (error) {
        toast.error(error instanceof Error ? error.message : "批量操作失败")
      }
    })
  }

  const confirmDelete = () => {
    const targets = deleteTargets.length ? deleteTargets : selectedPaths
    if (!targets.length) return

    startTransition(async () => {
      try {
        const result = await runBatchMutation({
          operation: "delete",
          relativePaths: targets,
        })

        setDeleteTargets([])
        setSelectedPaths([])
        router.refresh()
        toast.success(`删除完成：成功 ${result.successCount} 篇`)
      } catch (error) {
        toast.error(error instanceof Error ? error.message : "删除失败")
      }
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
          icon={Upload}
        />
        <AdminStatCard
          title="总字数"
          value={totalWords}
          hint="用于评估内容储备和维护规模"
          icon={Layers3}
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
          title="文章管理中心"
          description="组合筛选、保存视图和批量操作都收在这里，底层仍然直接操作 Markdown 文件。"
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
            <div className="flex flex-1 flex-col gap-3">
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
                      <SelectItem value="date-desc">最新发布时间</SelectItem>
                      <SelectItem value="date-asc">最早发布时间</SelectItem>
                      <SelectItem value="words-desc">字数从高到低</SelectItem>
                      <SelectItem value="title-asc">标题 A-Z</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="flex flex-col gap-3 md:flex-row md:items-center">
                <Select onValueChange={applySavedView}>
                  <SelectTrigger className="h-10 rounded-xl md:w-[260px]">
                    <SelectValue placeholder="加载已保存视图" />
                  </SelectTrigger>
                  <SelectContent>
                    {savedViews.length ? (
                      savedViews.map((item) => (
                        <SelectItem key={item.id} value={String(item.id)}>
                          {item.name}
                        </SelectItem>
                      ))
                    ) : (
                      <SelectItem value="__empty" disabled>
                        暂无已保存视图
                      </SelectItem>
                    )}
                  </SelectContent>
                </Select>

                <div className="flex flex-wrap items-center gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    className="rounded-xl"
                    disabled={pending}
                    onClick={handleSaveCurrentView}
                  >
                    <Save className="size-4" />
                    保存当前视图
                  </Button>
                  {savedViews[0] ? (
                    <Button
                      type="button"
                      variant="outline"
                      className="rounded-xl"
                      disabled={pending}
                      onClick={() => handleDeleteView(savedViews[0].id)}
                    >
                      删除最新视图
                    </Button>
                  ) : null}
                  <Button type="button" variant="outline" className="rounded-xl" onClick={resetView}>
                    重置视图
                  </Button>
                </div>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <AdminToolbarMeta label="已发布" value={`${publishedCount} 篇`} />
              <AdminToolbarMeta label="草稿" value={`${draftCount} 篇`} />
              <AdminToolbarMeta label="已选" value={`${selectedPaths.length} 篇`} />
            </div>
          </AdminToolbar>

          {selectedPaths.length > 0 ? (
            <div className="flex flex-col gap-3 rounded-[24px] border border-border/70 bg-muted/20 p-4 lg:flex-row lg:items-center lg:justify-between">
              <div className="text-sm text-foreground">
                当前已选 <span className="font-semibold">{selectedPaths.length}</span> 篇文章
              </div>
              <div className="flex flex-wrap gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="rounded-xl"
                  disabled={pending}
                  onClick={() => handleBatchAction("publish")}
                >
                  批量发布
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="rounded-xl"
                  disabled={pending}
                  onClick={() => handleBatchAction("draft")}
                >
                  批量转草稿
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="rounded-xl"
                  disabled={pending}
                  onClick={() => handleBatchAction("update-categories")}
                >
                  批量改分类
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="rounded-xl"
                  disabled={pending}
                  onClick={() => handleBatchAction("update-tags")}
                >
                  批量改标签
                </Button>
                <Button
                  type="button"
                  variant="destructive"
                  size="sm"
                  className="rounded-xl"
                  disabled={pending}
                  onClick={() => setDeleteTargets(selectedPaths)}
                >
                  批量删除
                </Button>
              </div>
            </div>
          ) : null}

          {filteredItems.length === 0 ? (
            <AdminEmptyState
              icon={FileText}
              title="没有匹配的文章"
              description="尝试调整筛选条件，或直接新建一篇文章开始写作。"
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
                      <TableHead className="w-14 px-4 py-3">
                        <Checkbox
                          checked={allFilteredSelected}
                          onCheckedChange={(checked) =>
                            setSelectedPaths(
                              checked ? Array.from(new Set([...selectedPaths, ...allFilteredPaths])) : []
                            )
                          }
                        />
                      </TableHead>
                      <TableHead className="px-4 py-3">文章</TableHead>
                      <TableHead className="px-4 py-3">分类</TableHead>
                      <TableHead className="px-4 py-3">更新时间</TableHead>
                      <TableHead className="px-4 py-3">字数</TableHead>
                      <TableHead className="px-4 py-3 text-right">操作</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {pagedItems.map((record) => (
                      <TableRow key={record.relativePath}>
                        <TableCell className="px-4 py-4 align-top">
                          <Checkbox
                            checked={selectedPaths.includes(record.relativePath)}
                            onCheckedChange={(checked) =>
                              toggleSelection(record.relativePath, Boolean(checked))
                            }
                          />
                        </TableCell>
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
                          {formatDate(record.updatedAt)}
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
                              variant="destructive"
                              size="sm"
                              className="rounded-xl"
                              disabled={pending}
                              onClick={() => setDeleteTargets([record.relativePath])}
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
                      <div className="flex items-start gap-3">
                        <Checkbox
                          checked={selectedPaths.includes(record.relativePath)}
                          onCheckedChange={(checked) =>
                            toggleSelection(record.relativePath, Boolean(checked))
                          }
                        />
                        <div className="min-w-0 flex-1 space-y-2">
                          <div className="flex flex-wrap items-center gap-2">
                            <div className="text-base font-semibold text-foreground">{record.title}</div>
                            <Badge variant={record.draft ? "outline" : "secondary"} className="rounded-full">
                              {record.draft ? "草稿" : "已发布"}
                            </Badge>
                          </div>
                          <div className="text-xs text-muted-foreground">{record.relativePath}</div>
                          <p className="text-sm leading-6 text-muted-foreground">
                            {record.summary || "暂无摘要"}
                          </p>
                        </div>
                      </div>

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
                          variant="destructive"
                          size="sm"
                          className="rounded-xl"
                          disabled={pending}
                          onClick={() => setDeleteTargets([record.relativePath])}
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
        open={deleteTargets.length > 0}
        onOpenChange={(open) => {
          if (!open) setDeleteTargets([])
        }}
        title="确认删除文章"
        description={`即将硬删除 ${deleteTargets.length} 篇文章，删除后文件会直接移除且无法恢复。`}
        confirmLabel="确认删除"
        destructive
        confirming={pending}
        onConfirm={confirmDelete}
      />
    </div>
  )
}
