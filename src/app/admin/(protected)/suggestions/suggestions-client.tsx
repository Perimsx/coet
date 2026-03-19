"use client";

import {
  useDeferredValue,
  useEffect,
  useMemo,
  useState,
  useTransition,
} from "react";
import {
  MessageSquare,
  RefreshCw,
  Search,
  Send,
  Settings2,
  Trash2,
} from "lucide-react";
import { toast } from "sonner";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
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
  Suggestion,
  SuggestionReplyTemplate,
  SuggestionStatus,
} from "@/server/db/schema";

import {
  deleteSuggestionAction,
  deleteSuggestionTemplateAction,
  replySuggestionAction,
  saveSuggestionTemplateAction,
  updateSuggestionStatusAction,
} from "./actions";

type StatusFilter = "all" | SuggestionStatus;

function getAvatar(qq: string) {
  return `https://q1.qlogo.cn/g?b=qq&nk=${qq}&s=100`;
}

function getStatusView(status: SuggestionStatus) {
  if (status === "resolved") {
    return {
      label: "已解决",
      className:
        "rounded-full border-none bg-emerald-500/15 text-emerald-700 dark:text-emerald-300",
    };
  }

  if (status === "replied") {
    return {
      label: "已回复",
      className:
        "rounded-full border-none bg-sky-500/15 text-sky-700 dark:text-sky-300",
    };
  }

  if (status === "in_progress") {
    return {
      label: "跟进中",
      className:
        "rounded-full border-none bg-violet-500/15 text-violet-700 dark:text-violet-300",
    };
  }

  return {
    label: "待处理",
    className:
      "rounded-full border-none bg-amber-500/15 text-amber-700 dark:text-amber-300",
  };
}

export default function SuggestionsClient({
  initialData,
  templates: initialTemplates,
}: {
  initialData: Suggestion[];
  templates: SuggestionReplyTemplate[];
}) {
  const [data, setData] = useState(initialData);
  const [templates, setTemplates] = useState(initialTemplates);
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [replyDialogOpen, setReplyDialogOpen] = useState(false);
  const [templateDialogOpen, setTemplateDialogOpen] = useState(false);
  const [selectedSuggestion, setSelectedSuggestion] =
    useState<Suggestion | null>(null);
  const [replyContent, setReplyContent] = useState("");
  const [replyStatus, setReplyStatus] = useState<SuggestionStatus>("replied");
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [templateDraft, setTemplateDraft] = useState({
    id: 0,
    title: "",
    content: "",
  });
  const [pending, startTransition] = useTransition();
  const deferredQuery = useDeferredValue(query.trim().toLowerCase());

  useEffect(() => {
    setData(initialData);
  }, [initialData]);

  useEffect(() => {
    setTemplates(initialTemplates);
  }, [initialTemplates]);

  const filtered = useMemo(() => {
    return data.filter((item) => {
      if (statusFilter !== "all" && item.status !== statusFilter) {
        return false;
      }

      if (!deferredQuery) return true;

      return [item.qq, item.content, item.adminReply, item.assignee]
        .filter(Boolean)
        .join(" ")
        .toLowerCase()
        .includes(deferredQuery);
    });
  }, [data, deferredQuery, statusFilter]);

  const stats = useMemo(
    () => ({
      total: data.length,
      pending: data.filter((item) => item.status === "pending").length,
      inProgress: data.filter((item) => item.status === "in_progress").length,
      resolved: data.filter((item) => item.status === "resolved").length,
    }),
    [data],
  );

  const openReplyDialog = (item: Suggestion) => {
    setSelectedSuggestion(item);
    setReplyContent(item.adminReply || "");
    setReplyStatus(item.status === "resolved" ? "resolved" : "replied");
    setReplyDialogOpen(true);
  };

  const handleStatusChange = (item: Suggestion, status: SuggestionStatus) => {
    startTransition(async () => {
      const result = await updateSuggestionStatusAction(item.id, status);
      if (!result.ok) {
        toast.error(result.error);
        return;
      }

      setData((current) =>
        current.map((entry) =>
          entry.id === item.id ? result.item || entry : entry,
        ),
      );
      toast.success("建议状态已更新");
    });
  };

  const handleSaveTemplate = () => {
    startTransition(async () => {
      const result = await saveSuggestionTemplateAction({
        id: templateDraft.id || undefined,
        title: templateDraft.title,
        content: templateDraft.content,
      });
      if (!result.ok) {
        toast.error(result.error);
        return;
      }

      if (result.item) {
        setTemplates((current) => {
          const next = current.filter((item) => item.id !== result.item?.id);
          return [result.item!, ...next];
        });
      }

      setTemplateDraft({ id: 0, title: "", content: "" });
      toast.success("模板已保存");
    });
  };

  return (
    <div className="space-y-6">
      <AdminPanel className="overflow-hidden bg-[linear-gradient(135deg,rgba(255,255,255,0.94),rgba(240,247,255,0.95))] dark:bg-[linear-gradient(135deg,rgba(15,23,42,0.82),rgba(2,6,23,0.88))]">
        <AdminPanelBody className="relative p-6 md:p-8">
          <div className="pointer-events-none absolute inset-y-0 right-0 hidden w-1/2 bg-[radial-gradient(circle_at_top_right,rgba(37,99,235,0.16),transparent_44%)] lg:block" />
          <div className="relative flex flex-col gap-6 xl:flex-row xl:items-end xl:justify-between">
            <div className="space-y-5">
              <div className="font-mono text-[11px] uppercase tracking-[0.22em] text-blue-700 dark:text-sky-300">
                Feedback Inbox
              </div>
              <div className="space-y-3">
                <h2 className="max-w-4xl font-[family-name:var(--font-admin-display)] text-[2rem] font-extrabold leading-tight tracking-[-0.05em] text-foreground md:text-[2.35rem]">
                  用更清晰的收件箱视图管理建议、
                  <br className="hidden md:block" />
                  回复模板和处理状态。
                </h2>
                <p className="max-w-3xl text-sm leading-7 text-muted-foreground">
                  这里保留原有的工单回复与模板逻辑，只把列表层级、动作入口和状态呈现改成更贴近
                  Stitch 导出的后台语言。
                </p>
              </div>
              <div className="flex flex-wrap gap-2">
                <AdminCountBadge value={stats.total} label="建议" />
                <AdminCountBadge value={stats.pending} label="待处理" />
                <AdminCountBadge value={stats.inProgress} label="跟进中" />
                <AdminCountBadge value={stats.resolved} label="已解决" />
              </div>
            </div>

            <Button
              type="button"
              variant="outline"
              className="rounded-full border-white/70 bg-white/88 px-5 shadow-sm dark:border-white/10 dark:bg-slate-950/70"
              onClick={() => setTemplateDialogOpen(true)}
            >
              <Settings2 className="size-4" />
              回复模板
            </Button>
          </div>
        </AdminPanelBody>
      </AdminPanel>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <AdminStatCard
          title="建议总数"
          value={stats.total}
          hint="全部访客反馈工单"
          icon={MessageSquare}
        />
        <AdminStatCard
          title="待处理"
          value={stats.pending}
          hint="需要尽快分派或回复"
          icon={Search}
        />
        <AdminStatCard
          title="跟进中"
          value={stats.inProgress}
          hint="正在处理的问题与需求"
          icon={RefreshCw}
        />
        <AdminStatCard
          title="已解决"
          value={stats.resolved}
          hint="处理完成并可归档"
          icon={Send}
        />
      </section>

      <AdminPanel>
        <AdminPanelHeader
          title="建议收件箱"
          description="按工单流转建议状态，并在回复时直接插入常用模板。"
          actions={
            <Button
              type="button"
              variant="outline"
              className="rounded-full border-white/70 bg-white/88 px-4 shadow-sm dark:border-white/10 dark:bg-slate-950/70"
              onClick={() => setTemplateDialogOpen(true)}
            >
              <Settings2 className="size-4" />
              回复模板
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
                  placeholder="搜索 QQ、建议内容、回复或负责人"
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
                  <SelectItem value="pending">待处理</SelectItem>
                  <SelectItem value="in_progress">跟进中</SelectItem>
                  <SelectItem value="replied">已回复</SelectItem>
                  <SelectItem value="resolved">已解决</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="text-sm text-muted-foreground">
              当前显示{" "}
              <span className="font-semibold text-foreground">
                {filtered.length}
              </span>{" "}
              条建议
            </div>
          </AdminToolbar>

          {filtered.length === 0 ? (
            <AdminEmptyState
              icon={MessageSquare}
              title="暂无匹配建议"
              description="可以切换状态筛选或清空搜索词重新查看。"
            />
          ) : (
            <div className="space-y-4">
              {filtered.map((item) => {
                const statusView = getStatusView(item.status);
                return (
                  <AdminPanel key={item.id} className="overflow-hidden">
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
                              <div className="text-base font-semibold text-foreground">
                                {item.qq}
                              </div>
                              <Badge
                                variant="outline"
                                className={statusView.className}
                              >
                                {statusView.label}
                              </Badge>
                              {item.assignee ? (
                                <Badge
                                  variant="outline"
                                  className="rounded-full bg-white/84 dark:bg-slate-950/70"
                                >
                                  负责人 {item.assignee}
                                </Badge>
                              ) : null}
                            </div>
                            <div className="text-sm text-muted-foreground">
                              {item.qq}@qq.com
                            </div>
                            <div className="text-xs text-muted-foreground">
                              最近更新{" "}
                              {new Date(
                                item.updatedAt || item.createdAt,
                              ).toLocaleString("zh-CN")}
                            </div>
                          </div>
                        </div>

                        <div className="flex flex-wrap items-center gap-2">
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            className="rounded-full border-white/70 bg-white/88 px-4 shadow-sm dark:border-white/10 dark:bg-slate-950/70"
                            disabled={pending || item.status === "in_progress"}
                            onClick={() =>
                              handleStatusChange(item, "in_progress")
                            }
                          >
                            跟进中
                          </Button>
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            className="rounded-full border-white/70 bg-white/88 px-4 shadow-sm dark:border-white/10 dark:bg-slate-950/70"
                            onClick={() => openReplyDialog(item)}
                          >
                            <Send className="size-4" />
                            回复
                          </Button>
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            className="rounded-full border-white/70 bg-white/88 px-4 shadow-sm dark:border-white/10 dark:bg-slate-950/70"
                            disabled={pending || item.status === "resolved"}
                            onClick={() => handleStatusChange(item, "resolved")}
                          >
                            设为已解决
                          </Button>
                          <Button
                            type="button"
                            variant="destructive"
                            size="sm"
                            className="rounded-full px-4"
                            onClick={() => setDeletingId(item.id)}
                          >
                            <Trash2 className="size-4" />
                            删除
                          </Button>
                        </div>
                      </div>

                      <div className="rounded-[26px] bg-slate-100/72 p-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.9)] ring-1 ring-white/80 dark:bg-slate-900/40 dark:ring-white/10">
                        <div className="mb-2 text-sm font-medium text-foreground">
                          访客建议
                        </div>
                        <p className="whitespace-pre-wrap text-sm leading-7 text-foreground">
                          {item.content}
                        </p>
                      </div>

                      {item.adminReply ? (
                        <div className="rounded-[26px] bg-sky-500/6 p-4 ring-1 ring-sky-500/20">
                          <div className="mb-2 text-sm font-medium text-foreground">
                            最近回复
                          </div>
                          <p className="whitespace-pre-wrap text-sm leading-7 text-foreground">
                            {item.adminReply}
                          </p>
                        </div>
                      ) : null}
                    </AdminPanelBody>
                  </AdminPanel>
                );
              })}
            </div>
          )}
        </AdminPanelBody>
      </AdminPanel>

      <Dialog
        open={replyDialogOpen}
        onOpenChange={(open) => {
          setReplyDialogOpen(open);
          if (!open) {
            setSelectedSuggestion(null);
            setReplyContent("");
          }
        }}
      >
        <DialogContent className="rounded-[28px] border-border/70 p-0 sm:max-w-3xl">
          <DialogHeader className="border-b border-border/60 px-6 py-5 text-left">
            <DialogTitle>回复访客建议</DialogTitle>
            <DialogDescription>
              模板、回复内容和结果状态都在这里一次完成。
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 px-6 py-5">
            <div className="rounded-[24px] border border-border/60 bg-muted/20 p-4">
              <div className="mb-2 text-sm font-medium text-foreground">
                原始建议
              </div>
              <p className="whitespace-pre-wrap text-sm leading-6 text-muted-foreground">
                {selectedSuggestion?.content}
              </p>
            </div>

            {templates.length ? (
              <div className="space-y-2">
                <div className="text-sm font-medium text-foreground">
                  快捷模板
                </div>
                <div className="flex flex-wrap gap-2">
                  {templates.map((template) => (
                    <Button
                      key={template.id}
                      type="button"
                      variant="outline"
                      size="sm"
                      className="rounded-full"
                      onClick={() => setReplyContent(template.content)}
                    >
                      {template.title}
                    </Button>
                  ))}
                </div>
              </div>
            ) : null}

            <div className="grid gap-4 md:grid-cols-[1fr_180px]">
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">
                  回复内容
                </label>
                <Textarea
                  rows={8}
                  value={replyContent}
                  onChange={(event) => setReplyContent(event.target.value)}
                  placeholder="请输入回复内容"
                  className="rounded-2xl"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">
                  回复后状态
                </label>
                <Select
                  value={replyStatus}
                  onValueChange={(value) =>
                    setReplyStatus(value as SuggestionStatus)
                  }
                >
                  <SelectTrigger className="h-10 rounded-xl">
                    <SelectValue placeholder="选择状态" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="replied">已回复</SelectItem>
                    <SelectItem value="resolved">已解决</SelectItem>
                    <SelectItem value="in_progress">跟进中</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
          <DialogFooter className="flex-row items-center justify-end gap-2 border-t border-border/60 px-6 py-4">
            <Button
              type="button"
              variant="outline"
              className="rounded-xl"
              onClick={() => setReplyDialogOpen(false)}
            >
              取消
            </Button>
            <Button
              type="button"
              className="rounded-xl"
              disabled={pending || !selectedSuggestion || !replyContent.trim()}
              onClick={() => {
                if (!selectedSuggestion || !replyContent.trim()) return;

                startTransition(async () => {
                  const result = await replySuggestionAction(
                    selectedSuggestion.id,
                    replyContent.trim(),
                    replyStatus,
                  );
                  if (!result.ok) {
                    toast.error(result.error);
                    return;
                  }

                  setData((current) =>
                    current.map((item) =>
                      item.id === selectedSuggestion.id
                        ? result.item || item
                        : item,
                    ),
                  );
                  setReplyDialogOpen(false);
                  toast.success("建议回复已发送");
                });
              }}
            >
              <Send className="size-4" />
              发送回复
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={templateDialogOpen} onOpenChange={setTemplateDialogOpen}>
        <DialogContent className="rounded-[28px] border-border/70 p-0 sm:max-w-3xl">
          <DialogHeader className="border-b border-border/60 px-6 py-5 text-left">
            <DialogTitle>回复模板管理</DialogTitle>
            <DialogDescription>
              把高频话术收成模板，回复时可以一键插入。
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-5 px-6 py-5 lg:grid-cols-[280px_1fr]">
            <div className="space-y-3 rounded-[24px] border border-border/70 bg-muted/10 p-3">
              {templates.length ? (
                templates.map((template) => (
                  <button
                    key={template.id}
                    type="button"
                    className="flex w-full flex-col rounded-2xl border border-border/60 bg-background/80 px-3 py-3 text-left transition hover:border-primary/20"
                    onClick={() =>
                      setTemplateDraft({
                        id: template.id,
                        title: template.title,
                        content: template.content,
                      })
                    }
                  >
                    <span className="text-sm font-medium text-foreground">
                      {template.title}
                    </span>
                    <span className="mt-1 line-clamp-2 text-xs text-muted-foreground">
                      {template.content}
                    </span>
                  </button>
                ))
              ) : (
                <div className="rounded-2xl border border-dashed border-border/70 px-3 py-8 text-center text-sm text-muted-foreground">
                  暂无模板
                </div>
              )}
            </div>

            <div className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">
                  模板标题
                </label>
                <Input
                  value={templateDraft.title}
                  onChange={(event) =>
                    setTemplateDraft((current) => ({
                      ...current,
                      title: event.target.value,
                    }))
                  }
                  placeholder="例如：感谢反馈"
                  className="h-10 rounded-xl"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">
                  模板内容
                </label>
                <Textarea
                  rows={8}
                  value={templateDraft.content}
                  onChange={(event) =>
                    setTemplateDraft((current) => ({
                      ...current,
                      content: event.target.value,
                    }))
                  }
                  placeholder="输入常用回复内容"
                  className="rounded-2xl"
                />
              </div>
              <div className="flex flex-wrap gap-2">
                <Button
                  type="button"
                  className="rounded-xl"
                  disabled={pending}
                  onClick={handleSaveTemplate}
                >
                  保存模板
                </Button>
                {templateDraft.id ? (
                  <Button
                    type="button"
                    variant="outline"
                    className="rounded-xl"
                    disabled={pending}
                    onClick={() =>
                      startTransition(async () => {
                        const result = await deleteSuggestionTemplateAction(
                          templateDraft.id,
                        );
                        if (!result.ok) {
                          toast.error(result.error);
                          return;
                        }

                        setTemplates((current) =>
                          current.filter(
                            (item) => item.id !== templateDraft.id,
                          ),
                        );
                        setTemplateDraft({ id: 0, title: "", content: "" });
                        toast.success("模板已删除");
                      })
                    }
                  >
                    删除模板
                  </Button>
                ) : null}
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={Boolean(deletingId)}
        onOpenChange={(open) => {
          if (!open) setDeletingId(null);
        }}
        title="确认删除建议"
        description="删除后会从后台永久移除，无法恢复。"
        confirmLabel="确认删除"
        destructive
        confirming={pending}
        onConfirm={() => {
          if (!deletingId) return;

          startTransition(async () => {
            const result = await deleteSuggestionAction(deletingId);
            if (!result.ok) {
              toast.error(result.error);
              return;
            }

            setData((current) =>
              current.filter((item) => !result.deletedIds?.includes(item.id)),
            );
            setDeletingId(null);
            toast.success("建议已删除");
          });
        }}
      />
    </div>
  );
}
