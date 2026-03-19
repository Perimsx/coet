"use client"

import { useDeferredValue, useEffect, useMemo, useState, useTransition } from "react"
import { MessageSquare, RefreshCw, Search, Send, Trash2 } from "lucide-react"
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
import { Textarea } from "@/components/ui/textarea"
import {
  AdminEmptyState,
  AdminPanel,
  AdminPanelBody,
  AdminPanelHeader,
  AdminStatCard,
  AdminToolbar,
} from "@/features/admin/components/admin-ui"
import { ConfirmDialog } from "@/features/admin/components/confirm-dialog"
import type { Suggestion } from "@/server/db/schema"

import { deleteSuggestionAction, replySuggestionAction } from "./actions"

function getAvatar(qq: string) {
  return `https://q1.qlogo.cn/g?b=qq&nk=${qq}&s=100`
}

export default function SuggestionsClient({
  initialData,
}: {
  initialData: Suggestion[]
}) {
  const [data, setData] = useState(initialData)
  const [query, setQuery] = useState("")
  const [replyDialogOpen, setReplyDialogOpen] = useState(false)
  const [selectedSuggestion, setSelectedSuggestion] = useState<Suggestion | null>(null)
  const [replyContent, setReplyContent] = useState("")
  const [deletingId, setDeletingId] = useState<number | null>(null)
  const [pending, startTransition] = useTransition()
  const deferredQuery = useDeferredValue(query.trim().toLowerCase())

  useEffect(() => {
    setData(initialData)
  }, [initialData])

  const filtered = useMemo(() => {
    if (!deferredQuery) return data

    return data.filter((item) =>
      [item.qq, item.content, item.adminReply]
        .filter(Boolean)
        .join(" ")
        .toLowerCase()
        .includes(deferredQuery)
    )
  }, [data, deferredQuery])

  const repliedCount = data.filter((item) => item.status === "replied").length

  return (
    <div className="space-y-5">
      <section className="grid gap-4 md:grid-cols-3">
        <AdminStatCard title="建议总数" value={data.length} hint="包含待处理与已回复" icon={MessageSquare} />
        <AdminStatCard title="已回复" value={repliedCount} hint="已写入管理员回复内容" icon={Send} />
        <AdminStatCard title="待处理" value={data.length - repliedCount} hint="建议优先处理近期提交" icon={Search} />
      </section>

      <AdminPanel>
        <AdminPanelHeader
          title="建议管理"
          description="查看访客建议、补充站长回复，并沿用现有邮件通知能力。"
          actions={
            <Button type="button" variant="outline" className="rounded-xl" disabled={pending} onClick={() => window.location.reload()}>
              <RefreshCw className={pending ? "size-4 animate-spin" : "size-4"} />
              刷新
            </Button>
          }
        />
        <AdminPanelBody className="space-y-4">
          <AdminToolbar>
            <div className="relative flex-1">
              <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="搜索 QQ、建议内容或站长回复"
                className="h-10 rounded-xl pl-9"
              />
            </div>
            <div className="text-sm text-muted-foreground">
              当前显示 <span className="font-semibold text-foreground">{filtered.length}</span> 条建议
            </div>
          </AdminToolbar>

          {filtered.length === 0 ? (
            <AdminEmptyState
              icon={MessageSquare}
              title="暂无匹配建议"
              description="当前搜索词下没有找到建议记录，可以清空搜索后再查看。"
            />
          ) : (
            <div className="space-y-4">
              {filtered.map((item) => (
                <AdminPanel key={item.id} className="rounded-[30px]">
                  <AdminPanelBody className="space-y-5 p-5">
                    <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                      <div className="flex items-start gap-3">
                        <Avatar className="size-12 rounded-[20px]">
                          <AvatarImage src={getAvatar(item.qq)} />
                          <AvatarFallback className="rounded-[20px]">
                            {item.qq.slice(0, 1)}
                          </AvatarFallback>
                        </Avatar>
                        <div className="space-y-2">
                          <div className="flex flex-wrap items-center gap-2">
                            <div className="text-base font-semibold text-foreground">{item.qq}</div>
                            <Badge
                              variant="outline"
                              className={
                                item.status === "replied"
                                  ? "rounded-full border-none bg-emerald-500/15 text-emerald-700 dark:text-emerald-300"
                                  : "rounded-full border-none bg-amber-500/15 text-amber-700 dark:text-amber-300"
                              }
                            >
                              {item.status === "replied" ? "已回复" : "待处理"}
                            </Badge>
                          </div>
                          <div className="text-sm text-muted-foreground">{item.qq}@qq.com</div>
                          <div className="text-xs text-muted-foreground">
                            {new Date(item.updatedAt || item.createdAt).toLocaleString("zh-CN")}
                          </div>
                        </div>
                      </div>

                      <div className="flex flex-wrap items-center gap-2">
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          className="rounded-xl"
                          onClick={() => {
                            setSelectedSuggestion(item)
                            setReplyContent(item.adminReply || "")
                            setReplyDialogOpen(true)
                          }}
                        >
                          <Send className="size-4" />
                          回复
                        </Button>
                        <Button
                          type="button"
                          variant="destructive"
                          size="sm"
                          className="rounded-xl"
                          onClick={() => setDeletingId(item.id)}
                        >
                          <Trash2 className="size-4" />
                          删除
                        </Button>
                      </div>
                    </div>

                    <div className="rounded-[24px] border border-border/60 bg-muted/20 p-4">
                      <div className="mb-2 text-sm font-medium text-foreground">访客建议</div>
                      <p className="whitespace-pre-wrap text-sm leading-7 text-foreground">{item.content}</p>
                    </div>

                    {item.adminReply ? (
                      <div className="rounded-[24px] border border-emerald-500/20 bg-emerald-500/5 p-4">
                        <div className="mb-2 text-sm font-medium text-foreground">站长回复</div>
                        <p className="whitespace-pre-wrap text-sm leading-7 text-foreground">{item.adminReply}</p>
                      </div>
                    ) : null}
                  </AdminPanelBody>
                </AdminPanel>
              ))}
            </div>
          )}
        </AdminPanelBody>
      </AdminPanel>

      <Dialog
        open={replyDialogOpen}
        onOpenChange={(open) => {
          setReplyDialogOpen(open)
          if (!open) {
            setSelectedSuggestion(null)
            setReplyContent("")
          }
        }}
      >
        <DialogContent className="rounded-[28px] border-border/70 p-0 sm:max-w-2xl">
          <DialogHeader className="border-b border-border/60 px-6 py-5 text-left">
            <DialogTitle>回复访客建议</DialogTitle>
            <DialogDescription>保存后将继续使用现有邮件通知逻辑发送回复提醒。</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 px-6 py-5">
            <div className="rounded-[24px] border border-border/60 bg-muted/20 p-4">
              <div className="mb-2 text-sm font-medium text-foreground">原始建议</div>
              <p className="whitespace-pre-wrap text-sm leading-6 text-muted-foreground">
                {selectedSuggestion?.content}
              </p>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">回复内容</label>
              <Textarea
                rows={6}
                value={replyContent}
                onChange={(event) => setReplyContent(event.target.value)}
                placeholder="请输入回复内容"
                className="rounded-2xl"
              />
            </div>
          </div>
          <DialogFooter className="flex-row items-center justify-end gap-2 border-t border-border/60 px-6 py-4">
            <Button type="button" variant="outline" className="rounded-xl" onClick={() => setReplyDialogOpen(false)}>
              取消
            </Button>
            <Button
              type="button"
              className="rounded-xl"
              disabled={pending || !selectedSuggestion || !replyContent.trim()}
              onClick={() => {
                if (!selectedSuggestion || !replyContent.trim()) return

                startTransition(async () => {
                  const result = await replySuggestionAction(
                    selectedSuggestion.id,
                    replyContent.trim()
                  )
                  if (!result.ok) {
                    toast.error(result.error)
                    return
                  }

                  setData((current) =>
                    current.map((item) =>
                      item.id === selectedSuggestion.id ? result.item || item : item
                    )
                  )
                  setReplyDialogOpen(false)
                  toast.success("建议回复已发送")
                })
              }}
            >
              <Send className="size-4" />
              发送回复
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={Boolean(deletingId)}
        onOpenChange={(open) => {
          if (!open) setDeletingId(null)
        }}
        title="确认删除建议"
        description="删除后不可恢复，该建议会从后台列表中永久移除。"
        confirmLabel="确认删除"
        destructive
        confirming={pending}
        onConfirm={() => {
          if (!deletingId) return

          startTransition(async () => {
            const result = await deleteSuggestionAction(deletingId)
            if (!result.ok) {
              toast.error(result.error)
              return
            }

            setData((current) => current.filter((item) => !result.deletedIds?.includes(item.id)))
            setDeletingId(null)
            toast.success("建议已删除")
          })
        }}
      />
    </div>
  )
}
