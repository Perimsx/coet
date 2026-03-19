"use client"

import { useDeferredValue, useEffect, useMemo, useState, useTransition } from "react"
import { Link2, PencilLine, Plus, RefreshCw, Search, Trash2 } from "lucide-react"
import { toast } from "sonner"

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
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
import { Textarea } from "@/components/ui/textarea"
import {
  AdminEmptyState,
  AdminPagination,
  AdminPanel,
  AdminPanelBody,
  AdminPanelHeader,
  AdminStatCard,
  AdminToolbar,
} from "@/features/admin/components/admin-ui"
import { ConfirmDialog } from "@/features/admin/components/confirm-dialog"
import {
  createFriendAction,
  deleteFriendAction,
  updateFriendAction,
} from "@/features/friends/lib/actions"
import type { Friend, NewFriend } from "@/server/db/schema"

type FriendRecord = Omit<Friend, "createdAt" | "updatedAt"> & {
  createdAt: string
  updatedAt: string
}

type FriendDraft = {
  name: string
  url: string
  avatar: string
  description: string
  qq: string
  status: string
  sortOrder: string
}

const PAGE_SIZE = 10

function normalizeFriendRecord(value: Friend): FriendRecord {
  return {
    ...value,
    createdAt: new Date(value.createdAt).toISOString(),
    updatedAt: new Date(value.updatedAt).toISOString(),
  }
}

function sortFriends(items: FriendRecord[]) {
  return [...items].sort((left, right) => {
    if (right.sortOrder !== left.sortOrder) {
      return right.sortOrder - left.sortOrder
    }

    return new Date(right.updatedAt).getTime() - new Date(left.updatedAt).getTime()
  })
}

function createEmptyDraft(): FriendDraft {
  return {
    name: "",
    url: "",
    avatar: "",
    description: "",
    qq: "",
    status: "published",
    sortOrder: "0",
  }
}

function toDraft(friend?: FriendRecord): FriendDraft {
  if (!friend) return createEmptyDraft()

  return {
    name: friend.name,
    url: friend.url,
    avatar: friend.avatar || "",
    description: friend.description || "",
    qq: friend.qq || "",
    status: friend.status,
    sortOrder: String(friend.sortOrder ?? 0),
  }
}

function validateDraft(draft: FriendDraft) {
  if (!draft.name.trim()) return "请输入友链名称。"
  if (!draft.url.trim()) return "请输入友链地址。"

  try {
    new URL(draft.url.trim())
  } catch {
    return "请输入有效的友链 URL。"
  }

  return null
}

export default function FriendsClient({
  initialData,
}: {
  initialData: FriendRecord[]
}) {
  const [friends, setFriends] = useState(initialData)
  const [query, setQuery] = useState("")
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingId, setEditingId] = useState<number | null>(null)
  const [deletingId, setDeletingId] = useState<number | null>(null)
  const [draft, setDraft] = useState<FriendDraft>(createEmptyDraft())
  const [page, setPage] = useState(1)
  const [pending, startTransition] = useTransition()
  const deferredQuery = useDeferredValue(query.trim().toLowerCase())

  useEffect(() => {
    setFriends(sortFriends(initialData))
  }, [initialData])

  useEffect(() => {
    setPage(1)
  }, [deferredQuery])

  const filtered = useMemo(() => {
    if (!deferredQuery) return friends

    return friends.filter((item) =>
      [item.name, item.url, item.description, item.qq]
        .filter(Boolean)
        .join(" ")
        .toLowerCase()
        .includes(deferredQuery)
    )
  }, [deferredQuery, friends])

  const publishedCount = friends.filter((item) => item.status === "published").length
  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE))
  const currentPage = Math.min(page, totalPages)
  const pagedItems = filtered.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE)

  const openDialog = (friend?: FriendRecord) => {
    setEditingId(friend?.id ?? null)
    setDraft(toDraft(friend))
    setDialogOpen(true)
  }

  const saveDraft = () => {
    const error = validateDraft(draft)
    if (error) {
      toast.error(error)
      return
    }

    startTransition(async () => {
      const payload: Partial<NewFriend> = {
        name: draft.name.trim(),
        url: draft.url.trim(),
        avatar: draft.avatar.trim(),
        description: draft.description.trim(),
        qq: draft.qq.trim(),
        status: draft.status as NewFriend["status"],
        sortOrder: Number.parseInt(draft.sortOrder || "0", 10) || 0,
      }

      const result = editingId
        ? await updateFriendAction(editingId, payload)
        : await createFriendAction(payload as NewFriend)

      if (!result.ok) {
        toast.error(result.error)
        return
      }

      if (result.item) {
        const nextRecord = normalizeFriendRecord(result.item)
        setFriends((current) => {
          const exists = current.some((item) => item.id === nextRecord.id)
          return sortFriends(
            exists
              ? current.map((item) => (item.id === nextRecord.id ? nextRecord : item))
              : [nextRecord, ...current]
          )
        })
      }

      setDialogOpen(false)
      setDraft(createEmptyDraft())
      toast.success(editingId ? "友链已更新" : "友链已新增")
    })
  }

  return (
    <div className="space-y-5">
      <section className="grid gap-4 md:grid-cols-3">
        <AdminStatCard title="友链总数" value={friends.length} hint="包含已发布与已隐藏" icon={Link2} />
        <AdminStatCard title="已发布" value={publishedCount} hint="会显示在前台友链页" icon={Plus} />
        <AdminStatCard title="已隐藏" value={friends.length - publishedCount} hint="保留记录但前台不展示" icon={Trash2} />
      </section>

      <AdminPanel>
        <AdminPanelHeader
          title="友链管理"
          description="统一维护友链资料、展示状态与排序。"
          actions={
            <>
              <Button type="button" variant="outline" className="rounded-xl" onClick={() => window.location.reload()}>
                <RefreshCw className="size-4" />
                刷新
              </Button>
              <Button type="button" className="rounded-xl" onClick={() => openDialog()}>
                <Plus className="size-4" />
                新增友链
              </Button>
            </>
          }
        />
        <AdminPanelBody className="space-y-4">
          <AdminToolbar>
            <div className="relative flex-1">
              <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="搜索名称、链接、描述或 QQ"
                className="h-10 rounded-xl pl-9"
              />
            </div>
            <div className="text-sm text-muted-foreground">
              当前显示 <span className="font-semibold text-foreground">{filtered.length}</span> 条记录
            </div>
          </AdminToolbar>

          {filtered.length === 0 ? (
            <AdminEmptyState
              icon={Link2}
              title="暂无友链记录"
              description="可以直接新增一条友链，或者调整搜索词查看已有记录。"
              action={
                <Button type="button" className="rounded-xl" onClick={() => openDialog()}>
                  <Plus className="size-4" />
                  新增友链
                </Button>
              }
            />
          ) : (
            <>
              <div className="hidden lg:block">
                <Table containerClassName="rounded-[28px] border border-border/70">
                  <TableHeader className="bg-muted/25">
                    <TableRow className="hover:bg-transparent">
                      <TableHead className="px-4 py-3">站点</TableHead>
                      <TableHead className="px-4 py-3">链接</TableHead>
                      <TableHead className="px-4 py-3">QQ</TableHead>
                      <TableHead className="px-4 py-3">排序</TableHead>
                      <TableHead className="px-4 py-3">更新时间</TableHead>
                      <TableHead className="px-4 py-3 text-right">操作</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {pagedItems.map((record) => (
                      <TableRow key={record.id}>
                        <TableCell className="px-4 py-4 align-top">
                          <div className="flex items-start gap-3">
                            <Avatar className="size-11 rounded-[18px]">
                              <AvatarImage src={record.avatar || undefined} />
                              <AvatarFallback className="rounded-[18px]">
                                {record.name.slice(0, 1).toUpperCase()}
                              </AvatarFallback>
                            </Avatar>
                            <div className="min-w-0 space-y-2">
                              <div className="flex flex-wrap items-center gap-2">
                                <div className="text-sm font-semibold text-foreground">{record.name}</div>
                                <Badge
                                  variant="outline"
                                  className={
                                    record.status === "published"
                                      ? "rounded-full border-none bg-emerald-500/15 text-emerald-700 dark:text-emerald-300"
                                      : "rounded-full border-none bg-muted text-muted-foreground"
                                  }
                                >
                                  {record.status === "published" ? "已发布" : "已隐藏"}
                                </Badge>
                              </div>
                              <p className="line-clamp-2 max-w-[320px] text-sm leading-6 text-muted-foreground">
                                {record.description || "暂无描述"}
                              </p>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell className="max-w-[280px] px-4 py-4 align-top">
                          <a
                            href={record.url}
                            target="_blank"
                            rel="noreferrer"
                            className="block truncate text-sm text-primary hover:underline"
                          >
                            {record.url}
                          </a>
                        </TableCell>
                        <TableCell className="px-4 py-4 align-top text-sm text-muted-foreground">
                          {record.qq || "未填写"}
                        </TableCell>
                        <TableCell className="px-4 py-4 align-top text-sm font-medium text-foreground">
                          {record.sortOrder}
                        </TableCell>
                        <TableCell className="px-4 py-4 align-top text-sm text-muted-foreground">
                          {new Date(record.updatedAt).toLocaleString("zh-CN")}
                        </TableCell>
                        <TableCell className="px-4 py-4 align-top">
                          <div className="flex justify-end gap-2">
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              className="rounded-xl"
                              onClick={() => openDialog(record)}
                            >
                              <PencilLine className="size-4" />
                              编辑
                            </Button>
                            <Button
                              type="button"
                              variant="destructive"
                              size="sm"
                              className="rounded-xl"
                              onClick={() => setDeletingId(record.id)}
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
                {pagedItems.map((item) => (
                  <AdminPanel key={item.id} className="rounded-[28px]">
                    <AdminPanelBody className="space-y-4 p-5">
                      <div className="flex items-start gap-3">
                        <Avatar className="size-11 rounded-[18px]">
                          <AvatarImage src={item.avatar || undefined} />
                          <AvatarFallback className="rounded-[18px]">
                            {item.name.slice(0, 1).toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <div className="space-y-2">
                          <div className="flex flex-wrap items-center gap-2">
                            <div className="text-sm font-semibold text-foreground">{item.name}</div>
                            <Badge variant="outline" className="rounded-full">
                              {item.status === "published" ? "已发布" : "已隐藏"}
                            </Badge>
                          </div>
                          <div className="text-sm text-muted-foreground">{item.url}</div>
                        </div>
                      </div>
                      <p className="text-sm leading-6 text-muted-foreground">{item.description || "暂无描述"}</p>
                      <div className="flex flex-wrap gap-2 text-xs text-muted-foreground">
                        <Badge variant="outline" className="rounded-full">排序 {item.sortOrder}</Badge>
                        <Badge variant="outline" className="rounded-full">{item.qq || "未填写 QQ"}</Badge>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        <Button type="button" variant="outline" size="sm" className="rounded-xl" onClick={() => openDialog(item)}>
                          <PencilLine className="size-4" />
                          编辑
                        </Button>
                        <Button type="button" variant="destructive" size="sm" className="rounded-xl" onClick={() => setDeletingId(item.id)}>
                          <Trash2 className="size-4" />
                          删除
                        </Button>
                      </div>
                    </AdminPanelBody>
                  </AdminPanel>
                ))}
              </div>

              <AdminPagination page={currentPage} totalPages={totalPages} onPageChange={setPage} />
            </>
          )}
        </AdminPanelBody>
      </AdminPanel>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="rounded-[28px] border-border/70 p-0 sm:max-w-2xl">
          <DialogHeader className="border-b border-border/60 px-6 py-5 text-left">
            <DialogTitle>{editingId ? "编辑友链" : "新增友链"}</DialogTitle>
            <DialogDescription>保存后会继续沿用现有前台刷新与邮件通知逻辑。</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 px-6 py-5 md:grid-cols-2">
            <div className="space-y-2 md:col-span-2">
              <label className="text-sm font-medium text-foreground">名称</label>
              <Input
                value={draft.name}
                onChange={(event) => setDraft((current) => ({ ...current, name: event.target.value }))}
                placeholder="例如：某位朋友的博客"
                className="h-10 rounded-xl"
              />
            </div>
            <div className="space-y-2 md:col-span-2">
              <label className="text-sm font-medium text-foreground">链接</label>
              <Input
                value={draft.url}
                onChange={(event) => setDraft((current) => ({ ...current, url: event.target.value }))}
                placeholder="https://example.com"
                className="h-10 rounded-xl"
              />
            </div>
            <div className="space-y-2 md:col-span-2">
              <label className="text-sm font-medium text-foreground">头像</label>
              <Input
                value={draft.avatar}
                onChange={(event) => setDraft((current) => ({ ...current, avatar: event.target.value }))}
                placeholder="站点头像地址，可选"
                className="h-10 rounded-xl"
              />
            </div>
            <div className="space-y-2 md:col-span-2">
              <label className="text-sm font-medium text-foreground">描述</label>
              <Textarea
                rows={4}
                value={draft.description}
                onChange={(event) => setDraft((current) => ({ ...current, description: event.target.value }))}
                placeholder="一段简洁的站点介绍"
                className="rounded-2xl"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">QQ</label>
              <Input
                value={draft.qq}
                onChange={(event) => setDraft((current) => ({ ...current, qq: event.target.value }))}
                placeholder="用于通过通知"
                className="h-10 rounded-xl"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">状态</label>
              <Select
                value={draft.status}
                onValueChange={(value) => setDraft((current) => ({ ...current, status: value }))}
              >
                <SelectTrigger className="h-10 rounded-xl">
                  <SelectValue placeholder="选择状态" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="published">已发布</SelectItem>
                  <SelectItem value="hidden">已隐藏</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">排序</label>
              <Input
                type="number"
                value={draft.sortOrder}
                onChange={(event) => setDraft((current) => ({ ...current, sortOrder: event.target.value }))}
                className="h-10 rounded-xl"
              />
            </div>
          </div>
          <DialogFooter className="flex-row items-center justify-end gap-2 border-t border-border/60 px-6 py-4">
            <Button type="button" variant="outline" className="rounded-xl" onClick={() => setDialogOpen(false)}>
              取消
            </Button>
            <Button type="button" className="rounded-xl" disabled={pending} onClick={saveDraft}>
              保存
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={Boolean(deletingId)}
        onOpenChange={(open) => {
          if (!open) setDeletingId(null)
        }}
        title="确认删除友链"
        description="删除后不可恢复，并会从前台友链页同步移除。"
        confirmLabel="确认删除"
        destructive
        confirming={pending}
        onConfirm={() => {
          if (!deletingId) return

          startTransition(async () => {
            const result = await deleteFriendAction(deletingId)
            if (!result.ok) {
              toast.error(result.error)
              return
            }

            setFriends((current) => current.filter((item) => !result.deletedIds?.includes(item.id)))
            setDeletingId(null)
            toast.success("友链已删除")
          })
        }}
      />
    </div>
  )
}
