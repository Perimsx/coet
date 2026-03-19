"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  useDeferredValue,
  useEffect,
  useMemo,
  useState,
  useTransition,
} from "react";
import {
  CheckCircle2,
  Globe,
  MapPin,
  MessageSquare,
  Monitor,
  RefreshCw,
  Search,
  Send,
  ShieldX,
  Trash2,
} from "lucide-react";
import { toast } from "sonner";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import {
  AdminCountBadge,
  AdminEmptyState,
  AdminPanel,
  AdminPanelBody,
  AdminPanelHeader,
  AdminStatCard,
  AdminToolbar,
} from "@/features/admin/components/admin-ui";
import { ConfirmDialog } from "@/features/admin/components/confirm-dialog";
import type {
  AdminCommentNode,
  AdminCommentThread,
} from "@/features/admin/lib/comment-threads";
import type { AdminMutationResult } from "@/features/admin/lib/mutations";
import {
  formatClientLocation,
  hasKnownClientValue,
} from "@/features/comments/lib/comment-client-display";
import { toProxiedImageSrc } from "@/shared/utils/image-proxy";

import {
  approveCommentAction,
  batchDeleteCommentsAction,
  batchUpdateCommentStatusAction,
  deleteCommentAction,
  rejectCommentAction,
  replyCommentAction,
} from "@/app/admin/actions";

type StatusFilter = "all" | "pending" | "approved" | "rejected";

function formatCommentTime(date: string) {
  return new Date(date).toLocaleString("zh-CN");
}

function stripVersion(value: string | null) {
  if (!value) return "";

  return value
    .replace(/\s+\(.*?\)\s*$/, "")
    .replace(/\s+(?:NT\s+)?\d[\d._]*\s*$/i, "")
    .trim();
}

function getVisitorSecondary(comment: AdminCommentNode) {
  if (comment.qq) return `${comment.qq}@qq.com`;
  if (comment.ipAddress) return comment.ipAddress;
  return "匿名访客";
}

function getThreadStatus(thread: AdminCommentThread) {
  if (thread.root.status === "pending")
    return {
      label: "待审核",
      className: "bg-amber-500/15 text-amber-700 dark:text-amber-300",
    };
  if (thread.root.status === "rejected")
    return {
      label: "已拒绝",
      className: "bg-red-500/15 text-red-700 dark:text-red-300",
    };
  if (thread.adminReplyCount > 0)
    return {
      label: "已回复",
      className: "bg-emerald-500/15 text-emerald-700 dark:text-emerald-300",
    };
  return {
    label: "已通过",
    className: "bg-sky-500/15 text-sky-700 dark:text-sky-300",
  };
}

function applyThreadMutation(
  current: AdminCommentThread[],
  result?: AdminMutationResult<AdminCommentThread>,
) {
  if (!result?.ok) return current;

  let next = current;

  if (result.deletedIds?.length) {
    const deleted = new Set(result.deletedIds);
    next = next.filter((thread) => !deleted.has(thread.id));
  }

  const upserts = [
    ...(result.items ?? []),
    ...(result.item ? [result.item] : []),
  ];
  if (!upserts.length) return next;

  const map = new Map(next.map((thread) => [thread.id, thread]));
  for (const thread of upserts) {
    map.set(thread.id, thread);
  }

  return [...map.values()].sort((left, right) => {
    return (
      new Date(right.lastActivityAt).getTime() -
      new Date(left.lastActivityAt).getTime()
    );
  });
}

function ReplyBubble({ reply }: { reply: AdminCommentNode }) {
  const isAdmin = reply.role === "admin";

  return (
    <div
      className={
        isAdmin
          ? "rounded-[26px] bg-emerald-500/8 p-4 ring-1 ring-emerald-500/20"
          : "rounded-[26px] bg-slate-100/72 p-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.9)] ring-1 ring-white/80 dark:bg-slate-900/40 dark:ring-white/10"
      }
    >
      <div className="flex items-start gap-3">
        {!isAdmin ? (
          <Avatar className="size-9 rounded-2xl">
            <AvatarImage
              src={toProxiedImageSrc(reply.avatarSrc) || undefined}
            />
            <AvatarFallback className="rounded-2xl">
              {(reply.authorName || "U").slice(0, 1).toUpperCase()}
            </AvatarFallback>
          </Avatar>
        ) : null}
        <div className="min-w-0 flex-1 space-y-2">
          <div className="flex flex-wrap items-center gap-2">
            <Badge
              variant="outline"
              className={
                isAdmin
                  ? "rounded-full border-emerald-500/20 bg-emerald-500/10"
                  : "rounded-full"
              }
            >
              {isAdmin
                ? "站长回复"
                : `访客回复 · ${reply.authorName || "访客"}`}
            </Badge>
            <span className="text-xs text-muted-foreground">
              {formatCommentTime(reply.createdAt)}
            </span>
          </div>
          <p className="whitespace-pre-wrap text-sm leading-6 text-foreground">
            {reply.content}
          </p>
        </div>
      </div>
    </div>
  );
}

function ThreadCard({
  thread,
  checked,
  pending,
  onToggleSelect,
  onApprove,
  onReject,
  onReply,
  onDelete,
}: {
  thread: AdminCommentThread;
  checked: boolean;
  pending: boolean;
  onToggleSelect: (checked: boolean) => void;
  onApprove: () => void;
  onReject: () => void;
  onReply: () => void;
  onDelete: () => void;
}) {
  const root = thread.root;
  const status = getThreadStatus(thread);

  return (
    <AdminPanel className="overflow-hidden">
      <AdminPanelBody className="space-y-5 p-5">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div className="flex min-w-0 items-start gap-3">
            <Checkbox
              checked={checked}
              onCheckedChange={(value) => onToggleSelect(Boolean(value))}
              className="mt-2"
            />
            <Avatar className="size-12 rounded-[20px]">
              <AvatarImage
                src={toProxiedImageSrc(root.avatarSrc) || undefined}
              />
              <AvatarFallback className="rounded-[20px]">
                {(root.authorName || "U").slice(0, 1).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <div className="min-w-0 space-y-2">
              <div className="flex flex-wrap items-center gap-2">
                <div className="text-base font-semibold text-foreground">
                  {root.authorName}
                </div>
                <Badge
                  variant="outline"
                  className={`rounded-full border-none ${status.className}`}
                >
                  {status.label}
                </Badge>
                <span className="text-xs text-muted-foreground">
                  {formatCommentTime(root.createdAt)}
                </span>
              </div>
              <div className="text-sm text-muted-foreground">
                {getVisitorSecondary(root)}
              </div>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="rounded-full border-white/70 bg-white/88 px-4 shadow-sm dark:border-white/10 dark:bg-slate-950/70"
              disabled={pending || root.status === "approved"}
              onClick={onApprove}
            >
              <CheckCircle2 className="size-4" />
              通过
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="rounded-full border-white/70 bg-white/88 px-4 shadow-sm dark:border-white/10 dark:bg-slate-950/70"
              disabled={pending || root.status === "rejected"}
              onClick={onReject}
            >
              <ShieldX className="size-4" />
              拒绝
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="rounded-full border-white/70 bg-white/88 px-4 shadow-sm dark:border-white/10 dark:bg-slate-950/70"
              disabled={pending}
              onClick={onReply}
            >
              <Send className="size-4" />
              回复
            </Button>
            <Button
              type="button"
              variant="destructive"
              size="sm"
              className="rounded-full px-4"
              disabled={pending}
              onClick={onDelete}
            >
              <Trash2 className="size-4" />
              删除
            </Button>
          </div>
        </div>

        <div className="rounded-[26px] bg-slate-100/72 p-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.9)] ring-1 ring-white/80 dark:bg-slate-900/40 dark:ring-white/10">
          <p className="whitespace-pre-wrap text-sm leading-7 text-foreground">
            {root.content}
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          <Badge
            variant="outline"
            className="rounded-full bg-white/84 dark:bg-slate-950/70"
          >
            <Link
              href={`/blog/${root.postId}`}
              target="_blank"
              className="inline-flex items-center gap-1"
            >
              <Globe className="size-3.5" />
              {root.postId}
            </Link>
          </Badge>
          <Badge
            variant="outline"
            className="rounded-full bg-white/84 dark:bg-slate-950/70"
          >
            <MapPin className="mr-1 size-3.5" />
            {formatClientLocation(root.location) || "位置未知"} /{" "}
            {root.ipAddress || "未知 IP"}
          </Badge>
          {hasKnownClientValue(root.os) ? (
            <Badge
              variant="outline"
              className="rounded-full bg-white/84 dark:bg-slate-950/70"
            >
              <Monitor className="mr-1 size-3.5" />
              {stripVersion(root.os)}
            </Badge>
          ) : null}
          {hasKnownClientValue(root.browser) ? (
            <Badge
              variant="outline"
              className="rounded-full bg-white/84 dark:bg-slate-950/70"
            >
              <Globe className="mr-1 size-3.5" />
              {stripVersion(root.browser)}
            </Badge>
          ) : null}
        </div>

        <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
          <Badge
            variant="outline"
            className="rounded-full bg-white/84 dark:bg-slate-950/70"
          >
            访客回复 {thread.visitorReplyCount}
          </Badge>
          <Badge
            variant="outline"
            className="rounded-full bg-white/84 dark:bg-slate-950/70"
          >
            站长回复 {thread.adminReplyCount}
          </Badge>
        </div>

        {thread.replies.length > 0 ? (
          <div className="space-y-3">
            {thread.replies.map((reply) => (
              <ReplyBubble key={reply.id} reply={reply} />
            ))}
          </div>
        ) : null}
      </AdminPanelBody>
    </AdminPanel>
  );
}

export default function CommentsTable({
  initialThreads,
}: {
  initialThreads: AdminCommentThread[];
}) {
  const router = useRouter();
  const [threads, setThreads] = useState(initialThreads);
  const [pending, startTransition] = useTransition();
  const [replying, setReplying] = useState<AdminCommentThread | null>(null);
  const [replyContent, setReplyContent] = useState("");
  const [deleting, setDeleting] = useState<AdminCommentThread | null>(null);
  const [batchDeleting, setBatchDeleting] = useState(false);
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [query, setQuery] = useState("");
  const [selectedThreadIds, setSelectedThreadIds] = useState<number[]>([]);
  const deferredQuery = useDeferredValue(query.trim().toLowerCase());

  useEffect(() => {
    setThreads(initialThreads);
  }, [initialThreads]);

  const filteredThreads = useMemo(() => {
    return threads.filter((thread) => {
      if (statusFilter !== "all" && thread.root.status !== statusFilter) {
        return false;
      }

      if (!deferredQuery) return true;

      const haystack = [
        thread.root.authorName,
        thread.root.content,
        thread.root.postId,
        thread.root.ipAddress,
        ...thread.replies.map(
          (reply) => `${reply.authorName} ${reply.content}`,
        ),
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      return haystack.includes(deferredQuery);
    });
  }, [deferredQuery, statusFilter, threads]);

  const stats = useMemo(
    () => ({
      total: threads.length,
      pending: threads.filter((thread) => thread.root.status === "pending")
        .length,
      approved: threads.filter((thread) => thread.root.status === "approved")
        .length,
      rejected: threads.filter((thread) => thread.root.status === "rejected")
        .length,
    }),
    [threads],
  );

  const handleMutation = (
    action: () => Promise<AdminMutationResult<AdminCommentThread>>,
    successMessage: string,
    after?: () => void,
  ) => {
    startTransition(async () => {
      try {
        const result = await action();
        if (!result.ok) {
          toast.error(result.error);
          return;
        }

        setThreads((current) => applyThreadMutation(current, result));
        after?.();
        toast.success(result.message || successMessage);
      } catch (error) {
        console.error(error);
        toast.error("操作失败，请稍后重试。");
      }
    });
  };

  const handleBatchStatus = (status: "approved" | "rejected") => {
    handleMutation(
      () => batchUpdateCommentStatusAction(selectedThreadIds, status),
      status === "approved" ? "已批量通过选中评论" : "已批量拒绝选中评论",
      () => setSelectedThreadIds([]),
    );
  };

  const allFilteredIds = filteredThreads.map((thread) => thread.id);
  const isAllSelected =
    allFilteredIds.length > 0 &&
    allFilteredIds.every((id) => selectedThreadIds.includes(id));

  return (
    <div className="space-y-6">
      <AdminPanel className="overflow-hidden bg-[linear-gradient(135deg,rgba(255,255,255,0.94),rgba(240,247,255,0.95))] dark:bg-[linear-gradient(135deg,rgba(15,23,42,0.82),rgba(2,6,23,0.88))]">
        <AdminPanelBody className="relative p-6 md:p-8">
          <div className="pointer-events-none absolute inset-y-0 right-0 hidden w-1/2 bg-[radial-gradient(circle_at_top_right,rgba(37,99,235,0.16),transparent_44%)] lg:block" />
          <div className="relative flex flex-col gap-6 xl:flex-row xl:items-end xl:justify-between">
            <div className="space-y-5">
              <div className="font-mono text-[11px] uppercase tracking-[0.22em] text-blue-700 dark:text-sky-300">
                Comment Workbench
              </div>
              <div className="space-y-3">
                <h2 className="max-w-4xl font-[family-name:var(--font-admin-display)] text-[2rem] font-extrabold leading-tight tracking-[-0.05em] text-foreground md:text-[2.35rem]">
                  在线程视角里完成审核、回复与访客环境复查，
                  <br className="hidden md:block" />
                  减少在细碎评论之间来回切页。
                </h2>
                <p className="max-w-3xl text-sm leading-7 text-muted-foreground">
                  当前页面保持线程级审核逻辑不变，只把信息层次、批量动作和线程卡片调整成更接近
                  Stitch 导出的后台工作台样式。
                </p>
              </div>
              <div className="flex flex-wrap gap-2">
                <AdminCountBadge value={stats.total} label="线程" />
                <AdminCountBadge value={stats.pending} label="待审核" />
                <AdminCountBadge value={stats.approved} label="已通过" />
                <AdminCountBadge
                  value={selectedThreadIds.length}
                  label="已选中"
                />
              </div>
            </div>

            <Button
              type="button"
              variant="outline"
              className="rounded-full border-white/70 bg-white/88 px-5 shadow-sm dark:border-white/10 dark:bg-slate-950/70"
              disabled={pending}
              onClick={() => router.refresh()}
            >
              <RefreshCw
                className={pending ? "size-4 animate-spin" : "size-4"}
              />
              刷新审核队列
            </Button>
          </div>
        </AdminPanelBody>
      </AdminPanel>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <AdminStatCard
          title="评论线程"
          value={stats.total}
          hint="按根评论聚合展示"
          icon={MessageSquare}
        />
        <AdminStatCard
          title="待审核"
          value={stats.pending}
          hint="优先处理待审评论"
          icon={Search}
        />
        <AdminStatCard
          title="已通过"
          value={stats.approved}
          hint="审核通过后前台可见"
          icon={CheckCircle2}
        />
        <AdminStatCard
          title="已拒绝"
          value={stats.rejected}
          hint="用于屏蔽无效与垃圾评论"
          icon={ShieldX}
        />
      </section>

      <AdminPanel>
        <AdminPanelHeader
          title="评论审核"
          description="支持线程级浏览、批量审核、站长回复和访客环境信息复查。"
          actions={
            <Button
              type="button"
              variant="outline"
              className="rounded-full border-white/70 bg-white/88 px-4 shadow-sm dark:border-white/10 dark:bg-slate-950/70"
              disabled={pending}
              onClick={() => router.refresh()}
            >
              <RefreshCw
                className={pending ? "size-4 animate-spin" : "size-4"}
              />
              刷新
            </Button>
          }
        />
        <AdminPanelBody className="space-y-5">
          <AdminToolbar className="items-start gap-4">
            <div className="flex flex-1 flex-col gap-3 lg:flex-row">
              <div className="relative flex-1">
                <Search className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                  placeholder="搜索评论内容、访客名称、文章 ID 或 IP"
                  className="h-11 rounded-[18px] border-white/70 bg-white/88 pl-10 shadow-sm dark:border-white/10 dark:bg-slate-950/70"
                />
              </div>
              <Select
                value={statusFilter}
                onValueChange={(value) =>
                  setStatusFilter(value as StatusFilter)
                }
              >
                <SelectTrigger className="h-11 rounded-[18px] border-white/70 bg-white/88 shadow-sm lg:w-[180px] dark:border-white/10 dark:bg-slate-950/70">
                  <SelectValue placeholder="全部状态" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">全部状态</SelectItem>
                  <SelectItem value="pending">待审核</SelectItem>
                  <SelectItem value="approved">已通过</SelectItem>
                  <SelectItem value="rejected">已拒绝</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <label className="flex items-center gap-2 rounded-full border-white/70 bg-white/88 px-4 py-2 text-sm text-foreground shadow-sm dark:border-white/10 dark:bg-slate-950/70">
                <Checkbox
                  checked={isAllSelected}
                  onCheckedChange={(checked) => {
                    if (checked) {
                      setSelectedThreadIds((current) => [
                        ...new Set([...current, ...allFilteredIds]),
                      ]);
                    } else {
                      setSelectedThreadIds((current) =>
                        current.filter((id) => !allFilteredIds.includes(id)),
                      );
                    }
                  }}
                />
                全选当前筛选结果
              </label>
            </div>
          </AdminToolbar>

          {selectedThreadIds.length > 0 ? (
            <div className="flex flex-col gap-4 rounded-[28px] bg-[linear-gradient(135deg,rgba(239,246,255,0.92),rgba(255,255,255,0.96))] p-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.92)] ring-1 ring-white/80 dark:bg-[linear-gradient(135deg,rgba(15,23,42,0.65),rgba(2,6,23,0.78))] dark:ring-white/10 lg:flex-row lg:items-center lg:justify-between">
              <div className="space-y-1">
                <div className="font-mono text-[11px] uppercase tracking-[0.18em] text-blue-700 dark:text-sky-300">
                  Batch Review
                </div>
                <div className="text-sm text-foreground">
                  已选中{" "}
                  <span className="font-semibold">
                    {selectedThreadIds.length}
                  </span>{" "}
                  条评论线程
                </div>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="rounded-full border-white/70 bg-white/88 px-4 shadow-sm dark:border-white/10 dark:bg-slate-950/70"
                  disabled={pending}
                  onClick={() => handleBatchStatus("approved")}
                >
                  <CheckCircle2 className="size-4" />
                  批量通过
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="rounded-full border-white/70 bg-white/88 px-4 shadow-sm dark:border-white/10 dark:bg-slate-950/70"
                  disabled={pending}
                  onClick={() => handleBatchStatus("rejected")}
                >
                  <ShieldX className="size-4" />
                  批量拒绝
                </Button>
                <Button
                  type="button"
                  variant="destructive"
                  size="sm"
                  className="rounded-full px-4"
                  disabled={pending}
                  onClick={() => setBatchDeleting(true)}
                >
                  <Trash2 className="size-4" />
                  批量删除
                </Button>
              </div>
            </div>
          ) : null}

          {filteredThreads.length === 0 ? (
            <AdminEmptyState
              icon={MessageSquare}
              title="没有匹配的评论线程"
              description="当前筛选条件下没有评论记录，可以尝试清空搜索词或切换审核状态。"
            />
          ) : (
            <div className="space-y-4">
              {filteredThreads.map((thread) => (
                <ThreadCard
                  key={thread.id}
                  thread={thread}
                  checked={selectedThreadIds.includes(thread.id)}
                  pending={pending}
                  onToggleSelect={(checked) => {
                    setSelectedThreadIds((current) =>
                      checked
                        ? [...current, thread.id]
                        : current.filter((id) => id !== thread.id),
                    );
                  }}
                  onApprove={() =>
                    handleMutation(
                      () => approveCommentAction(thread.root.id),
                      "评论已通过",
                    )
                  }
                  onReject={() =>
                    handleMutation(
                      () => rejectCommentAction(thread.root.id),
                      "评论已拒绝",
                    )
                  }
                  onReply={() => {
                    setReplying(thread);
                    setReplyContent("");
                  }}
                  onDelete={() => setDeleting(thread)}
                />
              ))}
            </div>
          )}
        </AdminPanelBody>
      </AdminPanel>

      <Dialog
        open={Boolean(replying)}
        onOpenChange={(open) => {
          if (!open) {
            setReplying(null);
            setReplyContent("");
          }
        }}
      >
        <DialogContent className="rounded-[30px] border-white/70 bg-white/96 p-0 shadow-[0_24px_60px_rgba(37,99,235,0.15)] backdrop-blur-xl dark:border-white/10 dark:bg-slate-950/92 sm:max-w-2xl">
          <DialogHeader className="border-b border-white/70 px-6 py-5 text-left dark:border-white/10">
            <DialogTitle>站长回复</DialogTitle>
            <DialogDescription>
              回复将延用现有邮件通知与评论线程回写逻辑。
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 px-6 py-5">
            <div className="rounded-[24px] bg-slate-100/72 p-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.9)] ring-1 ring-white/80 dark:bg-slate-900/40 dark:ring-white/10">
              <div className="mb-2 text-sm font-medium text-foreground">
                原评论
              </div>
              <p className="whitespace-pre-wrap text-sm leading-6 text-muted-foreground">
                {replying?.root.content}
              </p>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">
                回复内容
              </label>
              <Textarea
                rows={6}
                value={replyContent}
                onChange={(event) => setReplyContent(event.target.value)}
                placeholder="请输入站长回复内容"
                className="rounded-[24px] border-white/70 bg-white/90 shadow-sm dark:border-white/10 dark:bg-slate-950/70"
              />
            </div>
          </div>
          <DialogFooter className="flex-row items-center justify-end gap-2 border-t border-white/70 px-6 py-4 dark:border-white/10">
            <Button
              type="button"
              variant="outline"
              className="rounded-full border-white/70 bg-white/88 px-4 shadow-sm dark:border-white/10 dark:bg-slate-950/70"
              onClick={() => {
                setReplying(null);
                setReplyContent("");
              }}
            >
              取消
            </Button>
            <Button
              type="button"
              className="rounded-full bg-gradient-to-br from-blue-600 to-blue-500 px-5 text-white shadow-[0_18px_36px_rgba(37,99,235,0.22)] hover:from-blue-600 hover:to-blue-600"
              disabled={pending || !replyContent.trim()}
              onClick={() => {
                if (!replying || !replyContent.trim()) return;
                handleMutation(
                  () =>
                    replyCommentAction(replying.root.id, replyContent.trim()),
                  "回复已发送",
                  () => {
                    setReplying(null);
                    setReplyContent("");
                  },
                );
              }}
            >
              <Send className="size-4" />
              发送回复
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={Boolean(deleting)}
        onOpenChange={(open) => {
          if (!open) setDeleting(null);
        }}
        title="确认删除评论线程"
        description="删除后该线程下的所有回复都会一并删除，且无法恢复。"
        confirmLabel="确认删除"
        destructive
        confirming={pending}
        onConfirm={() => {
          if (!deleting) return;
          handleMutation(
            () => deleteCommentAction(deleting.root.id),
            "评论线程已删除",
            () => setDeleting(null),
          );
        }}
      />

      <ConfirmDialog
        open={batchDeleting}
        onOpenChange={setBatchDeleting}
        title="确认批量删除"
        description={`将删除当前选中的 ${selectedThreadIds.length} 条评论线程及其全部回复。`}
        confirmLabel="确认删除"
        destructive
        confirming={pending}
        onConfirm={() => {
          handleMutation(
            () => batchDeleteCommentsAction(selectedThreadIds),
            "选中的评论线程已删除",
            () => {
              setSelectedThreadIds([]);
              setBatchDeleting(false);
            },
          );
        }}
      />
    </div>
  );
}
