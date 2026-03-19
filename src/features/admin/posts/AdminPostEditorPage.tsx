"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState, useTransition } from "react";
import {
  ArrowLeft,
  Eye,
  PanelRightClose,
  PanelRightOpen,
  Save,
  Sparkles,
  Trash2,
} from "lucide-react";
import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { AdminToolbarMeta } from "@/features/admin/components/admin-ui";
import { ConfirmDialog } from "@/features/admin/components/confirm-dialog";
import HtmlMarkdownContent from "@/features/content/components/HtmlMarkdownContent";
import {
  PostTaxonomyField,
  type PostTaxonomyOption,
} from "@/features/content/components/post-taxonomy-field";
import {
  suggestPostSlug,
  suggestPostSummary,
} from "@/features/content/lib/post-editor-helpers";

import {
  deletePostEditorAction,
  renderMarkdownPreviewAction,
  savePostEditorAction,
} from "@/app/admin/actions";

type EditorValue = {
  relativePath: string;
  title: string;
  slug: string;
  date: string;
  summary: string;
  tags: string;
  categories: string;
  draft: boolean;
  content: string;
};

type CategoryOption = {
  slug: string;
  labelZh: string;
  labelEn?: string;
};

type ViewMode = "editor" | "split" | "preview";

type LocalEditorDraft = EditorValue & {
  savedAt: string;
};

const recentCategoryStorageKey = "admin:post-editor:recent-category";

function splitTokens(input: string) {
  return input
    .split(/[,\n]/)
    .map((item) => item.trim())
    .filter(Boolean);
}

function buildDraftStorageKey(relativePath: string) {
  return `admin:post-draft:${relativePath || "new-post"}`;
}

function normalizeForDraft(value: EditorValue): LocalEditorDraft {
  return {
    ...value,
    savedAt: new Date().toISOString(),
  };
}

function parseLocalEditorDraft(raw: string | null) {
  if (!raw) return null;

  try {
    return JSON.parse(raw) as LocalEditorDraft;
  } catch {
    return null;
  }
}

export default function AdminPostEditorPage({
  initialValue,
  availableCategories = [],
}: {
  initialValue: EditorValue;
  availableCategories?: CategoryOption[];
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [value, setValue] = useState(initialValue);
  const [baseline, setBaseline] = useState(initialValue);
  const [viewMode, setViewMode] = useState<ViewMode>("split");
  const [metaCollapsed, setMetaCollapsed] = useState(false);
  const [previewHtml, setPreviewHtml] = useState("");
  const [previewLoading, setPreviewLoading] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [slugLocked, setSlugLocked] = useState(Boolean(initialValue.slug));
  const [lastAutosavedAt, setLastAutosavedAt] = useState<string | null>(null);
  const [recentCategory, setRecentCategory] = useState<string | null>(null);

  const categoryValues = useMemo(
    () => splitTokens(value.categories),
    [value.categories],
  );
  const tagValues = useMemo(() => splitTokens(value.tags), [value.tags]);
  const wordEstimate = useMemo(
    () => value.content.trim().length,
    [value.content],
  );
  const draftStorageKey = useMemo(
    () => buildDraftStorageKey(value.relativePath || initialValue.relativePath),
    [initialValue.relativePath, value.relativePath],
  );
  const categoryOptions = useMemo<PostTaxonomyOption[]>(
    () =>
      availableCategories.map((item) => ({
        label: item.labelZh || item.slug,
        value: item.slug,
        keywords: [item.slug, item.labelEn || ""].filter(Boolean),
      })),
    [availableCategories],
  );
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
    [baseline, value],
  );

  const setField = <K extends keyof EditorValue>(
    key: K,
    nextValue: EditorValue[K],
  ) => {
    setValue((current) => ({ ...current, [key]: nextValue }));
  };

  const setTokenField = (key: "tags" | "categories", nextTokens: string[]) => {
    setField(key, nextTokens.join(", "));
  };

  const persistRecentCategory = (nextCategory: string) => {
    const trimmed = nextCategory.trim();
    if (!trimmed) return;

    localStorage.setItem(recentCategoryStorageKey, trimmed);
    setRecentCategory(trimmed);
  };

  const buildFormData = () => {
    const formData = new FormData();
    formData.set("relativePath", value.relativePath);
    formData.set("title", value.title);
    formData.set("slug", value.slug);
    formData.set("date", value.date);
    formData.set("summary", value.summary);
    formData.set("tags", value.tags);
    formData.set("categories", value.categories);
    formData.set("content", value.content);
    if (value.draft) formData.set("draft", "true");
    return formData;
  };

  useEffect(() => {
    const currentDraft = parseLocalEditorDraft(
      localStorage.getItem(draftStorageKey),
    );
    if (!currentDraft) return;

    let active = true;

    void (async () => {
      try {
        const response = await fetch(
          "/api/admin/posts/autosave-restore-check",
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              relativePath: value.relativePath || undefined,
              draft: currentDraft,
            }),
          },
        );
        const result = await response.json();
        if (!active || !response.ok || !result.ok || !result.shouldRestore)
          return;

        const confirmed = window.confirm(
          "检测到本地自动保存草稿，是否恢复到编辑器？",
        );
        if (!confirmed) return;

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
        });
        setLastAutosavedAt(currentDraft.savedAt);
        toast.success("已恢复本地草稿");
      } catch {
        // Ignore restore check failures to avoid blocking the editor.
      }
    })();

    return () => {
      active = false;
    };
  }, [draftStorageKey, value.relativePath]);

  useEffect(() => {
    const stored = localStorage.getItem(recentCategoryStorageKey)?.trim();
    if (!stored) return;

    setRecentCategory(stored);
    if (initialValue.relativePath) return;

    setValue((current) =>
      current.categories.trim()
        ? current
        : {
            ...current,
            categories: stored,
          },
    );
  }, [initialValue.relativePath]);

  useEffect(() => {
    if (slugLocked) return;

    setValue((current) => ({
      ...current,
      slug: suggestPostSlug(current.title),
    }));
  }, [slugLocked, value.title]);

  useEffect(() => {
    if (viewMode === "editor") return;

    const timer = window.setTimeout(async () => {
      setPreviewLoading(true);
      try {
        const result = await renderMarkdownPreviewAction(value.content || "");
        setPreviewHtml(result.html);
      } catch {
        toast.error("预览生成失败，请稍后重试");
      } finally {
        setPreviewLoading(false);
      }
    }, 260);

    return () => window.clearTimeout(timer);
  }, [value.content, viewMode]);

  useEffect(() => {
    const timer = window.setInterval(() => {
      const hasDraftContent =
        Boolean(value.title.trim()) ||
        Boolean(value.summary.trim()) ||
        Boolean(value.content.trim()) ||
        Boolean(value.tags.trim()) ||
        Boolean(value.categories.trim());

      if (!hasDraftContent || !isDirty) return;

      localStorage.setItem(
        draftStorageKey,
        JSON.stringify(normalizeForDraft(value)),
      );
      setLastAutosavedAt(new Date().toISOString());
    }, 10000);

    return () => window.clearInterval(timer);
  }, [draftStorageKey, isDirty, value]);

  const clearDraftCache = (paths: string[]) => {
    for (const path of paths) {
      localStorage.removeItem(buildDraftStorageKey(path));
    }
    localStorage.removeItem(buildDraftStorageKey("new-post"));
  };

  const handleSave = () => {
    startTransition(async () => {
      const result = await savePostEditorAction(buildFormData());
      if (result.error) {
        toast.error(result.error);
        return;
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
        };

        setValue(nextValue);
        setBaseline(nextValue);
        setSlugLocked(true);
        clearDraftCache(
          [value.relativePath, result.editor.relativePath].filter(Boolean),
        );

        if (result.editor.categories.length) {
          persistRecentCategory(
            result.editor.categories[result.editor.categories.length - 1],
          );
        }

        if (!value.relativePath) {
          router.replace(
            `/admin/posts/edit?path=${encodeURIComponent(result.editor.relativePath)}`,
          );
        }
      }

      toast.success(result.success || "文章已保存");
      router.refresh();
    });
  };

  const handleDelete = () => {
    if (!value.relativePath) {
      router.push("/admin/posts");
      return;
    }

    startTransition(async () => {
      const result = await deletePostEditorAction(value.relativePath);
      if (result.error) {
        toast.error(result.error);
        return;
      }

      clearDraftCache([value.relativePath]);
      toast.success(result.success || "文章已删除");
      router.push("/admin/posts");
      router.refresh();
    });
  };

  const handlePreviewOpen = () => {
    const nextSlug = value.slug.trim() || suggestPostSlug(value.title);
    if (!nextSlug) {
      toast.error("请先填写标题或 Slug");
      return;
    }

    window.open(`/blog/${nextSlug}`, "_blank", "noopener,noreferrer");
  };

  const applySummarySuggestion = () => {
    if (value.summary.trim()) return;

    const nextSummary = suggestPostSummary(value.content);
    if (!nextSummary) {
      toast.error("正文内容过少，暂时无法生成摘要");
      return;
    }

    setField("summary", nextSummary);
    toast.success("已根据正文生成摘要建议");
  };

  const previewPane = (
    <div className="min-h-[720px] overflow-hidden rounded-xl border bg-card">
      <div className="border-b bg-muted/40 px-4 py-3">
        <div className="font-mono text-xs text-muted-foreground">
          Live Preview
        </div>
      </div>
      <div className="p-6">
        {previewLoading ? (
          <div className="flex h-full min-h-[660px] items-center justify-center text-sm text-muted-foreground">
            正在生成预览...
          </div>
        ) : previewHtml ? (
          <div className="prose prose-zinc max-w-none dark:prose-invert">
            <HtmlMarkdownContent html={previewHtml} />
          </div>
        ) : (
          <div className="flex h-full min-h-[660px] items-center justify-center text-sm text-muted-foreground">
            输入正文后将在这里显示实时预览
          </div>
        )}
      </div>
    </div>
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold tracking-tight">
              {value.relativePath ? "编辑文章" : "新建文章"}
            </h1>
            <Badge
              variant="secondary"
              className={
                value.draft
                  ? "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400"
                  : "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400"
              }
            >
              {value.draft ? "草稿" : "已发布"}
            </Badge>
          </div>
          <div className="mt-2 flex items-center gap-2 text-sm text-muted-foreground">
            <Link
              href="/admin/posts"
              className="hover:text-foreground transition-colors"
            >
              <ArrowLeft className="mr-1 inline-block size-3.5" />
              返回
            </Link>
            <span>/</span>
            <span className="font-medium text-foreground">
              {value.relativePath || "new-post"}
            </span>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <AdminToolbarMeta label="字数" value={`${wordEstimate} 字`} />
          <AdminToolbarMeta
            label="本地缓存"
            value={
              lastAutosavedAt
                ? new Date(lastAutosavedAt).toLocaleTimeString("zh-CN")
                : "未缓存"
            }
          />
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => setMetaCollapsed((current) => !current)}
          >
            {metaCollapsed ? (
              <PanelRightOpen className="mr-2 size-4" />
            ) : (
              <PanelRightClose className="mr-2 size-4" />
            )}
            {metaCollapsed ? "展开属性" : "收起属性"}
          </Button>
          {value.relativePath && (
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setDeleteOpen(true)}
              disabled={pending}
            >
              <Trash2 className="mr-2 size-4" />
              删除
            </Button>
          )}
          <Button
            type="button"
            size="sm"
            onClick={handleSave}
            disabled={pending}
          >
            <Save className="mr-2 size-4" />
            保存文章
          </Button>
        </div>
      </div>

      <div
        className={`grid gap-6 ${
          metaCollapsed ? "" : "xl:grid-cols-[minmax(0,1.45fr)_360px]"
        }`}
      >
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold">正文编辑台</h2>
            <div className="flex flex-wrap gap-2">
              <Button
                type="button"
                variant={viewMode === "editor" ? "default" : "outline"}
                size="sm"
                className={viewMode === "editor" ? "rounded-xl" : "rounded-xl"}
                onClick={() => setViewMode("editor")}
              >
                仅编辑
              </Button>
              <Button
                type="button"
                variant={viewMode === "split" ? "default" : "outline"}
                size="sm"
                className={viewMode === "split" ? "rounded-xl" : "rounded-xl"}
                onClick={() => setViewMode("split")}
              >
                分屏
              </Button>
              <Button
                type="button"
                variant={viewMode === "preview" ? "default" : "outline"}
                size="sm"
                className={viewMode === "preview" ? "rounded-xl" : "rounded-xl"}
                onClick={() => setViewMode("preview")}
              >
                仅预览
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="rounded-xl px-3"
                onClick={handlePreviewOpen}
              >
                <Eye className="mr-2 size-4" />
                前台预览
              </Button>
            </div>
          </div>

          <div className="space-y-4">
            <div className="space-y-2">
              <label className="font-mono text-[11px] uppercase tracking-[0.18em] text-muted-foreground">
                文章标题
              </label>
              <Input
                value={value.title}
                onChange={(event) => {
                  setField("title", event.target.value);
                  if (!slugLocked) {
                    setField("slug", suggestPostSlug(event.target.value));
                  }
                }}
                placeholder="请输入文章标题"
                className="h-10 border bg-background"
              />
            </div>

            {viewMode === "editor" ? (
              <div className="overflow-hidden rounded-xl border bg-card">
                <div className="border-b bg-muted/40 px-4 py-3">
                  <div className="font-mono text-xs text-muted-foreground">
                    Markdown
                  </div>
                </div>
                <Textarea
                  rows={28}
                  value={value.content}
                  onChange={(event) => setField("content", event.target.value)}
                  placeholder="开始编写 Markdown 正文..."
                  className="min-h-[720px] rounded-none border-0 bg-transparent font-mono text-sm leading-7 shadow-none focus-visible:ring-0"
                />
              </div>
            ) : viewMode === "preview" ? (
              previewPane
            ) : (
              <div className="grid gap-4 xl:grid-cols-2">
                <div className="overflow-hidden rounded-xl border bg-card">
                  <div className="border-b bg-muted/40 px-4 py-3">
                    <div className="font-mono text-xs text-muted-foreground">
                      Markdown
                    </div>
                  </div>
                  <Textarea
                    rows={28}
                    value={value.content}
                    onChange={(event) =>
                      setField("content", event.target.value)
                    }
                    placeholder="开始编写 Markdown 正文..."
                    className="min-h-[720px] rounded-none border-0 bg-transparent font-mono text-sm leading-7 shadow-none focus-visible:ring-0"
                  />
                </div>
                {previewPane}
              </div>
            )}
          </div>
        </div>

        {!metaCollapsed ? (
          <div className="space-y-4">
            <h2 className="text-lg font-semibold">文章属性</h2>
            <div className="space-y-5">
              <div className="space-y-2">
                <div className="flex items-center justify-between gap-3">
                  <label className="font-mono text-[11px] uppercase tracking-[0.18em] text-muted-foreground">
                    路径别名
                  </label>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="h-auto rounded-full px-2 py-1 text-xs"
                    onClick={() => {
                      setField("slug", suggestPostSlug(value.title));
                      setSlugLocked(false);
                    }}
                  >
                    根据标题生成
                  </Button>
                </div>
                <Input
                  value={value.slug}
                  onChange={(event) => {
                    setSlugLocked(true);
                    setField("slug", event.target.value);
                  }}
                  placeholder="wen-zhang-bie-ming"
                  className="h-10 border bg-background"
                />
              </div>

              <div className="space-y-2">
                <label className="font-mono text-[11px] uppercase tracking-[0.18em] text-muted-foreground">
                  发布时间
                </label>
                <Input
                  type="date"
                  value={value.date}
                  onChange={(event) => setField("date", event.target.value)}
                  className="h-10 border bg-background"
                />
              </div>

              <PostTaxonomyField
                label="分类"
                placeholder="搜索分类后回车选中，也支持直接输入新分类"
                helperText={
                  availableCategories.length
                    ? `可搜索现有分类：${availableCategories
                        .slice(0, 6)
                        .map((item) => item.labelZh || item.slug)
                        .join("、")}`
                    : "输入分类名称后按回车添加"
                }
                tokens={categoryValues}
                options={categoryOptions}
                recentToken={recentCategory}
                onTokensChange={(nextTokens) =>
                  setTokenField("categories", nextTokens)
                }
                onTokenCommit={persistRecentCategory}
              />

              <PostTaxonomyField
                label="标签"
                placeholder="输入标签后回车添加，支持 #标签名"
                helperText="输入标签后按回车添加，重复标签会自动提示"
                tokens={tagValues}
                allowHashPrefix
                onTokensChange={(nextTokens) =>
                  setTokenField("tags", nextTokens)
                }
              />

              <div className="space-y-2">
                <div className="flex items-center justify-between gap-3">
                  <label className="font-mono text-[11px] uppercase tracking-[0.18em] text-muted-foreground">
                    摘要
                  </label>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="h-auto rounded-full px-2 py-1 text-xs"
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
                  className="border bg-background"
                />
              </div>

              <div className="rounded-xl border bg-card p-4 shadow-sm">
                <div className="flex items-center justify-between gap-4">
                  <div className="space-y-1">
                    <div className="text-sm font-medium text-foreground">
                      保存为草稿
                    </div>
                    <div className="text-xs leading-6 text-muted-foreground">
                      开启后文章不会在前台公开展示。
                    </div>
                  </div>
                  <Switch
                    checked={value.draft}
                    onCheckedChange={(checked) => setField("draft", checked)}
                  />
                </div>
              </div>

              <div className="rounded-xl border bg-blue-50/50 dark:bg-blue-900/10 p-4 shadow-sm">
                <div className="flex items-center gap-2 mb-1 text-sm font-medium text-blue-700 dark:text-blue-400">
                  <Sparkles className="size-4" />
                  自动保存提示
                </div>
                <div className="text-xs leading-6 text-muted-foreground">
                  编辑器每 10 秒会将未保存内容缓存到浏览器。
                  {isDirty
                    ? " 当前存在未保存修改。"
                    : " 当前内容已与文件同步。"}
                </div>
              </div>
            </div>
          </div>
        ) : null}
      </div>

      <ConfirmDialog
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
        title="确认删除文章"
        description="删除后文章文件会被直接移除，且不会进入回收站。"
        confirmLabel="确认删除"
        destructive
        confirming={pending}
        onConfirm={handleDelete}
      />
    </div>
  );
}
