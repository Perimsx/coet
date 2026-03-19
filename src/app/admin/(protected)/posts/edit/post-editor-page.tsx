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
import {
  AdminPanel,
  AdminPanelBody,
  AdminPanelHeader,
  AdminToolbarMeta,
} from "@/features/admin/components/admin-ui";
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

export default function PostEditorPage({
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
    <div className="min-h-[720px] overflow-hidden rounded-[28px] bg-slate-100/78 shadow-[inset_0_1px_0_rgba(255,255,255,0.9)] ring-1 ring-white/80 dark:bg-slate-900/40 dark:ring-white/10">
      <div className="border-b border-white/70 px-4 py-3 dark:border-white/10">
        <div className="font-mono text-[11px] uppercase tracking-[0.2em] text-muted-foreground">
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
      <AdminPanel className="overflow-hidden bg-[linear-gradient(135deg,rgba(255,255,255,0.94),rgba(240,247,255,0.95))] dark:bg-[linear-gradient(135deg,rgba(15,23,42,0.82),rgba(2,6,23,0.88))]">
        <AdminPanelBody className="relative p-6 md:p-8">
          <div className="pointer-events-none absolute inset-y-0 right-0 hidden w-1/2 bg-[radial-gradient(circle_at_top_right,rgba(37,99,235,0.16),transparent_44%)] lg:block" />
          <div className="relative flex flex-col gap-6 xl:flex-row xl:items-end xl:justify-between">
            <div className="space-y-5">
              <div className="flex flex-wrap items-center gap-2">
                <Button
                  asChild
                  type="button"
                  variant="outline"
                  className="rounded-full border-white/70 bg-white/88 px-4 shadow-sm dark:border-white/10 dark:bg-slate-950/70"
                >
                  <Link href="/admin/posts">
                    <ArrowLeft className="size-4" />
                    返回文章列表
                  </Link>
                </Button>
                <Badge
                  variant="outline"
                  className={
                    value.draft
                      ? "rounded-full border-none bg-amber-500/15 text-amber-700 dark:text-amber-300"
                      : "rounded-full border-none bg-emerald-500/15 text-emerald-700 dark:text-emerald-300"
                  }
                >
                  {value.draft ? "草稿" : "已发布"}
                </Badge>
                <Badge
                  variant="outline"
                  className="rounded-full bg-white/84 dark:bg-slate-950/70"
                >
                  {value.relativePath || "new-post"}
                </Badge>
              </div>
              <div className="space-y-3">
                <div className="font-mono text-[11px] uppercase tracking-[0.22em] text-blue-700 dark:text-sky-300">
                  Article Editor
                </div>
                <h2 className="max-w-4xl font-[family-name:var(--font-admin-display)] text-[2rem] font-extrabold leading-tight tracking-[-0.05em] text-foreground md:text-[2.35rem]">
                  在同一张编辑工作台里完成正文编写、
                  <br className="hidden md:block" />
                  元数据整理与实时预览。
                </h2>
                <p className="max-w-3xl text-sm leading-7 text-muted-foreground">
                  这页延续 Stitch
                  导出的文章编辑器结构：顶部状态清晰、主体专注写作、右侧收纳属性与自动保存提示，同时保留你现有的保存、删除和预览逻辑。
                </p>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <AdminToolbarMeta label="标签" value={`${tagValues.length} 个`} />
              <AdminToolbarMeta
                label="分类"
                value={`${categoryValues.length} 个`}
              />
              <AdminToolbarMeta label="正文" value={`${wordEstimate} 字`} />
              <AdminToolbarMeta
                label="本地草稿"
                value={
                  lastAutosavedAt
                    ? new Date(lastAutosavedAt).toLocaleTimeString("zh-CN")
                    : "未缓存"
                }
              />
              <Button
                type="button"
                variant="outline"
                className="rounded-full border-white/70 bg-white/88 px-4 shadow-sm dark:border-white/10 dark:bg-slate-950/70"
                onClick={() => setMetaCollapsed((current) => !current)}
              >
                {metaCollapsed ? (
                  <PanelRightOpen className="size-4" />
                ) : (
                  <PanelRightClose className="size-4" />
                )}
                {metaCollapsed ? "展开属性栏" : "收起属性栏"}
              </Button>
              <Button
                type="button"
                variant="outline"
                className="rounded-full border-white/70 bg-white/88 px-4 shadow-sm dark:border-white/10 dark:bg-slate-950/70"
                onClick={() => setDeleteOpen(true)}
                disabled={pending}
              >
                <Trash2 className="size-4" />
                删除
              </Button>
              <Button
                type="button"
                className="rounded-full bg-gradient-to-br from-blue-600 to-blue-500 px-5 text-white shadow-[0_18px_36px_rgba(37,99,235,0.22)] hover:from-blue-600 hover:to-blue-600"
                onClick={handleSave}
                disabled={pending}
              >
                <Save className="size-4" />
                保存文章
              </Button>
            </div>
          </div>
        </AdminPanelBody>
      </AdminPanel>

      <div
        className={`grid gap-5 ${
          metaCollapsed ? "" : "xl:grid-cols-[minmax(0,1.45fr)_360px]"
        }`}
      >
        <AdminPanel>
          <AdminPanelHeader
            title="正文编辑台"
            description="主编辑区只保留写作、分屏预览和前台查看，高频操作被压缩成更轻的编辑工具条。"
            actions={
              <div className="flex flex-wrap gap-2">
                <Button
                  type="button"
                  variant={viewMode === "editor" ? "default" : "outline"}
                  className={
                    viewMode === "editor"
                      ? "rounded-full bg-gradient-to-br from-blue-600 to-blue-500 px-4 text-white"
                      : "rounded-full border-white/70 bg-white/88 px-4 shadow-sm dark:border-white/10 dark:bg-slate-950/70"
                  }
                  onClick={() => setViewMode("editor")}
                >
                  仅编辑
                </Button>
                <Button
                  type="button"
                  variant={viewMode === "split" ? "default" : "outline"}
                  className={
                    viewMode === "split"
                      ? "rounded-full bg-gradient-to-br from-blue-600 to-blue-500 px-4 text-white"
                      : "rounded-full border-white/70 bg-white/88 px-4 shadow-sm dark:border-white/10 dark:bg-slate-950/70"
                  }
                  onClick={() => setViewMode("split")}
                >
                  分屏
                </Button>
                <Button
                  type="button"
                  variant={viewMode === "preview" ? "default" : "outline"}
                  className={
                    viewMode === "preview"
                      ? "rounded-full bg-gradient-to-br from-blue-600 to-blue-500 px-4 text-white"
                      : "rounded-full border-white/70 bg-white/88 px-4 shadow-sm dark:border-white/10 dark:bg-slate-950/70"
                  }
                  onClick={() => setViewMode("preview")}
                >
                  仅预览
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  className="rounded-full border-white/70 bg-white/88 px-4 shadow-sm dark:border-white/10 dark:bg-slate-950/70"
                  onClick={handlePreviewOpen}
                >
                  <Eye className="size-4" />
                  前台预览
                </Button>
              </div>
            }
          />
          <AdminPanelBody className="space-y-5">
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
                className="h-12 rounded-[18px] border-white/70 bg-white/90 shadow-sm dark:border-white/10 dark:bg-slate-950/70"
              />
            </div>

            {viewMode === "editor" ? (
              <div className="overflow-hidden rounded-[28px] bg-slate-100/78 shadow-[inset_0_1px_0_rgba(255,255,255,0.9)] ring-1 ring-white/80 dark:bg-slate-900/40 dark:ring-white/10">
                <div className="border-b border-white/70 px-4 py-3 dark:border-white/10">
                  <div className="font-mono text-[11px] uppercase tracking-[0.2em] text-muted-foreground">
                    Source / Markdown
                  </div>
                </div>
                <Textarea
                  rows={28}
                  value={value.content}
                  onChange={(event) => setField("content", event.target.value)}
                  placeholder="开始编写 Markdown 正文"
                  className="min-h-[720px] border-0 bg-transparent font-mono text-sm leading-7 shadow-none focus-visible:ring-0"
                />
              </div>
            ) : viewMode === "preview" ? (
              previewPane
            ) : (
              <div className="grid gap-4 xl:grid-cols-2">
                <div className="overflow-hidden rounded-[28px] bg-slate-100/78 shadow-[inset_0_1px_0_rgba(255,255,255,0.9)] ring-1 ring-white/80 dark:bg-slate-900/40 dark:ring-white/10">
                  <div className="border-b border-white/70 px-4 py-3 dark:border-white/10">
                    <div className="font-mono text-[11px] uppercase tracking-[0.2em] text-muted-foreground">
                      Source / Markdown
                    </div>
                  </div>
                  <Textarea
                    rows={28}
                    value={value.content}
                    onChange={(event) =>
                      setField("content", event.target.value)
                    }
                    placeholder="开始编写 Markdown 正文"
                    className="min-h-[720px] border-0 bg-transparent font-mono text-sm leading-7 shadow-none focus-visible:ring-0"
                  />
                </div>
                {previewPane}
              </div>
            )}
          </AdminPanelBody>
        </AdminPanel>

        {!metaCollapsed ? (
          <div className="space-y-5">
            <AdminPanel>
              <AdminPanelHeader
                title="文章属性"
                description="分类、标签、摘要和发布状态都放在右侧属性栏里，减少编辑正文时的干扰。"
              />
              <AdminPanelBody className="space-y-5">
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
                    className="h-11 rounded-[18px] border-white/70 bg-white/90 shadow-sm dark:border-white/10 dark:bg-slate-950/70"
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
                    className="h-11 rounded-[18px] border-white/70 bg-white/90 shadow-sm dark:border-white/10 dark:bg-slate-950/70"
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
                    onChange={(event) =>
                      setField("summary", event.target.value)
                    }
                    placeholder="为文章写一段摘要"
                    className="rounded-[24px] border-white/70 bg-white/90 shadow-sm dark:border-white/10 dark:bg-slate-950/70"
                  />
                </div>

                <div className="rounded-[26px] bg-slate-100/78 p-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.9)] ring-1 ring-white/80 dark:bg-slate-900/40 dark:ring-white/10">
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
              </AdminPanelBody>
            </AdminPanel>

            <AdminPanel className="overflow-hidden bg-[linear-gradient(135deg,rgba(255,255,255,0.94),rgba(240,247,255,0.95))] dark:bg-[linear-gradient(135deg,rgba(15,23,42,0.82),rgba(2,6,23,0.88))]">
              <AdminPanelBody className="space-y-3 p-5">
                <div className="flex items-center gap-3">
                  <div className="flex size-11 items-center justify-center rounded-[18px] bg-blue-600/12 text-blue-700 dark:bg-blue-500/20 dark:text-sky-200">
                    <Sparkles className="size-4" />
                  </div>
                  <div>
                    <div className="font-[family-name:var(--font-admin-display)] text-lg font-bold tracking-[-0.03em] text-foreground">
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
              </AdminPanelBody>
            </AdminPanel>
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
