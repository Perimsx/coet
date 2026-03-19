"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { exec } from "child_process";
import { promisify } from "util";
import { eq } from "drizzle-orm";
import { db } from "@/server/db";
import { adminUsers, type CommentStatus } from "@/server/db/schema";
import {
  clearAdminSession,
  createAdminSession,
  isAdminAuthBypassed,
  requireAdminSession,
} from "@/features/admin/lib/admin-session";
import { DEFAULT_ADMIN_USERNAME } from "@/features/admin/lib/defaults";
import { ADMIN_LOGIN_PATH } from "@/features/admin/lib/routes";
import {
  createComment,
  getAllComments,
  getCommentById,
  removeComment,
  setCommentStatus,
} from "@/features/comments/lib/comments";
import {
  buildAdminCommentThreads,
  type AdminCommentThread,
} from "@/features/admin/lib/comment-threads";
import {
  adminError,
  adminSuccess,
  type AdminMutationResult,
} from "@/features/admin/lib/mutations";
import { getServerDictionary } from "@/shared/utils/i18n-server";
import { hashPassword, verifyPassword } from "@/features/admin/lib/password";
import {
  getMailSettings,
  getMailSettingsSafe,
  saveMailSettings,
  type MailSettings,
} from "@/server/mail-settings";
import { sendTestMail, sendReplyNotification } from "@/server/mailer";
import { allBlogs } from "contentlayer/generated";
import {
  createPostTemplate,
  deletePostFile,
  extractMdxBody,
  getPostEditorData,
  readPostSource,
  savePostEditorData,
  savePostSource,
  type PostEditorRecord,
  type PostFileSummary,
} from "@/features/content/lib/posts";
import {
  getSiteSettings,
  saveSiteSettings,
  type SiteSettings,
} from "@/server/site-settings";
import { saveAboutPageData } from "@/features/content/lib/about-page";
import { renderMarkdownToHtml } from "@/features/content/lib/markdown-renderer";
import {
  getCategoryDefinitions,
  saveCategoryDefinitions,
} from "@/server/category-settings";

const execAsync = promisify(exec);

async function triggerContentlayerBuild() {
  if (process.env.NODE_ENV !== "production") return;
  
  console.log("[AdminActions] Triggering Contentlayer re-indexing...");
  try {
    // 异步执行，不阻塞 UI 响应
    execAsync("npx contentlayer2 build").then(({ stdout, stderr }) => {
      if (stderr) console.error("[ContentlayerBuild] Stderr:", stderr);
      console.log("[ContentlayerBuild] Success:", stdout.slice(0, 100) + "...");
    }).catch(err => {
      console.error("[ContentlayerBuild] Failed:", err);
    });
  } catch (err) {
    console.error("[ContentlayerBuild] Fatal error:", err);
  }
}

export type LoginState = {
  error?: string;
  success?: boolean;
};

export async function loginAction(
  _prevState: LoginState,
  formData: FormData,
): Promise<LoginState> {
  const dictionary = await getServerDictionary();
  const username =
    formData.get("username")?.toString().trim() || DEFAULT_ADMIN_USERNAME;
  const password = formData.get("password")?.toString() ?? "";

  console.log("[loginAction] Attempting login for:", username);

  if (!password) {
    console.log("[loginAction] Missing password");
    return { error: "Please enter the admin password." };
  }

  const user = db
    .select()
    .from(adminUsers)
    .where(eq(adminUsers.username, username))
    .get();
  console.log("[loginAction] User found in DB:", !!user, user?.username);

  if (!user || !verifyPassword(password, user.passwordHash)) {
    console.log("[loginAction] Invalid credentials");
    return { error: dictionary.actions.usernamePasswordInvalid };
  }

  console.log("[loginAction] Session creation starting");
  await createAdminSession({ id: user.id, username: user.username });
  console.log("[loginAction] Success!");

  return { success: true };
}

export async function logoutAction() {
  await clearAdminSession();
  redirect(isAdminAuthBypassed() ? "/admin" : ADMIN_LOGIN_PATH);
}

function buildQqAvatar(qq?: string | null) {
  if (!qq || !/^\d{5,12}$/.test(qq)) return undefined;
  return `https://q1.qlogo.cn/g?b=qq&nk=${qq}&s=100`;
}

async function getCommentOwnerQq() {
  try {
    const settings = await getMailSettings();
    return settings.ownerQq || undefined;
  } catch {
    return undefined;
  }
}

async function getCommentThreadRootId(commentId: number) {
  let current = await getCommentById(commentId);
  if (!current) return null;

  while (current.parentId) {
    const parent = await getCommentById(current.parentId);
    if (!parent) break;
    current = parent;
  }

  return current.id;
}

async function getAdminCommentThreadsForRoots(rootIds: Iterable<number>) {
  const wanted = new Set<number>(rootIds);
  if (!wanted.size) return [];

  const ownerQq = await getCommentOwnerQq();
  const rows = await getAllComments();
  return buildAdminCommentThreads(rows, ownerQq).filter((thread) =>
    wanted.has(thread.id),
  );
}

async function getAdminCommentThread(rootId: number) {
  const threads = await getAdminCommentThreadsForRoots([rootId]);
  return threads[0] ?? null;
}

export async function approveCommentAction(
  commentId: number,
): Promise<AdminMutationResult<AdminCommentThread>> {
  await requireAdminSession();
  const dictionary = await getServerDictionary();

  const comment = await getCommentById(commentId);
  if (!comment) {
    return adminError(dictionary.actions.commentNotFound, "COMMENT_NOT_FOUND");
  }

  const updated = await setCommentStatus(commentId, "approved");
  revalidatePath("/admin/comments");
  revalidatePath(`/blog/${comment.postId}`);

  const rootId = await getCommentThreadRootId(updated?.id || commentId);
  const thread = rootId ? await getAdminCommentThread(rootId) : null;
  return adminSuccess({ item: thread ?? undefined });
}

export async function rejectCommentAction(
  commentId: number,
): Promise<AdminMutationResult<AdminCommentThread>> {
  await requireAdminSession();
  const dictionary = await getServerDictionary();

  const comment = await getCommentById(commentId);
  if (!comment) {
    return adminError(dictionary.actions.commentNotFound, "COMMENT_NOT_FOUND");
  }

  const updated = await setCommentStatus(commentId, "rejected");
  revalidatePath("/admin/comments");
  revalidatePath(`/blog/${comment.postId}`);

  const rootId = await getCommentThreadRootId(updated?.id || commentId);
  const thread = rootId ? await getAdminCommentThread(rootId) : null;
  return adminSuccess({ item: thread ?? undefined });
}

export async function deleteCommentAction(
  commentId: number,
): Promise<AdminMutationResult> {
  await requireAdminSession();
  const dictionary = await getServerDictionary();

  const comment = await getCommentById(commentId);
  if (!comment) {
    return adminError(dictionary.actions.commentNotFound, "COMMENT_NOT_FOUND");
  }

  const deletedIds = await removeComment(commentId);
  revalidatePath("/admin/comments");
  revalidatePath(`/blog/${comment.postId}`);

  return adminSuccess({ deletedIds });
}

export async function replyCommentAction(
  parentId: number,
  content: string,
): Promise<AdminMutationResult<AdminCommentThread>> {
  const session = await requireAdminSession();
  const dictionary = await getServerDictionary();

  const parent = await getCommentById(parentId);
  if (!parent) {
    return adminError(dictionary.actions.commentNotFound, "COMMENT_NOT_FOUND");
  }

  const normalized = content.trim();
  if (normalized.length < 2 || normalized.length > 1000) {
    return adminError(dictionary.actions.invalidReply, "INVALID_REPLY");
  }

  const settings = await getMailSettings();
  const ownerQq = settings.ownerQq || undefined;
  const ownerNickname = settings.ownerNickname || session.username;

  const reply = await createComment({
    postId: parent.postId,
    parentId: parent.id,
    authorName: ownerNickname,
    avatar: buildQqAvatar(ownerQq),
    content: normalized,
    status: "approved",
    isAdmin: true,
  });

  if (!reply) {
    return adminError(
      dictionary.actions.commentCreateFailed,
      "COMMENT_CREATE_FAILED",
    );
  }

  revalidatePath("/admin/comments");
  revalidatePath(`/blog/${parent.postId}`);

  const post = allBlogs.find((p) => p.slug === parent.postId);
  const postTitle = post?.title || parent.postId;

  // 博主回复后，异步通知被回复的评论者（不阻塞响应）
  if (!parent.isAdmin && parent.qq) {
    sendReplyNotification({
      qq: parent.qq,
      postId: parent.postId,
      postTitle,
      parentNickname: parent.authorName || "访客",
      parentContent: parent.content || "",
      parentAvatarUrl: parent.avatar || undefined,
      replyContent: normalized,
      replyAuthorName: session.username,
      replyAuthorAvatarUrl: reply.avatar || buildQqAvatar(ownerQq),
      replyAuthorRole: "admin",
    }).catch((err) =>
      console.error("[replyCommentAction] Failed to send reply email:", err),
    );
  }

  const rootId = await getCommentThreadRootId(reply.id);
  const thread = rootId ? await getAdminCommentThread(rootId) : null;
  return adminSuccess({ item: thread ?? undefined });
}

export async function batchUpdateCommentStatusAction(
  commentIds: number[],
  status: CommentStatus,
): Promise<AdminMutationResult<AdminCommentThread>> {
  await requireAdminSession();
  const dictionary = await getServerDictionary();

  const normalized = Array.from(
    new Set(commentIds.filter((id) => Number.isInteger(id) && id > 0)),
  ).slice(0, 500);

  if (!normalized.length) {
    return adminError(
      dictionary.actions.invalidBatchSelection,
      "INVALID_BATCH_SELECTION",
    );
  }

  const affectedRootIds = new Set<number>();
  for (const id of normalized) {
    const comment = await getCommentById(id);
    if (!comment) continue;
    await setCommentStatus(id, status);
    revalidatePath(`/blog/${comment.postId}`);
    const rootId = await getCommentThreadRootId(id);
    if (rootId) affectedRootIds.add(rootId);
  }

  revalidatePath("/admin/comments");
  const items = await getAdminCommentThreadsForRoots(affectedRootIds);
  return adminSuccess({ items });
}

export async function batchDeleteCommentsAction(
  commentIds: number[],
): Promise<AdminMutationResult> {
  await requireAdminSession();
  const dictionary = await getServerDictionary();

  const normalized = Array.from(
    new Set(commentIds.filter((id) => Number.isInteger(id) && id > 0)),
  ).slice(0, 500);

  if (!normalized.length) {
    return adminError(
      dictionary.actions.invalidBatchSelection,
      "INVALID_BATCH_SELECTION",
    );
  }

  const postIds = new Set<string>();
  const deletedIds = new Set<number>();
  for (const id of normalized) {
    const comment = await getCommentById(id);
    if (comment?.postId) postIds.add(comment.postId);
    for (const deletedId of await removeComment(id)) {
      deletedIds.add(deletedId);
    }
  }

  for (const postId of postIds) {
    revalidatePath(`/blog/${postId}`);
  }
  revalidatePath("/admin/comments");
  return adminSuccess({ deletedIds: [...deletedIds] });
}

export type CreatePostState = {
  error?: string;
  success?: string;
  editorUrl?: string;
  relativePath?: string;
  absolutePath?: string;
  title?: string;
  slug?: string;
  updatedAt?: string;
};

export async function createPostAction(
  _prevState: CreatePostState,
  formData: FormData,
): Promise<CreatePostState> {
  await requireAdminSession();
  const dictionary = await getServerDictionary();

  const title = formData.get("title")?.toString().trim() ?? "";
  const tagsInput = formData.get("tags")?.toString().trim() ?? "";
  const categoriesInput = formData.get("categories")?.toString().trim() ?? "";
  if (title.length > 120) {
    return { error: dictionary.actions.postTitleTooLong };
  }

  const normalizeCsv = (value: string) =>
    value
      .split(/[,\n]/)
      .map((item) => item.trim())
      .filter(Boolean)
      .slice(0, 12);

  const post = await createPostTemplate(title, {
    tags: normalizeCsv(tagsInput),
    categories: normalizeCsv(categoriesInput),
  });

  revalidatePath("/admin/posts");
  revalidatePath("/blog");

  return {
    success: `${dictionary.actions.postCreatedPrefix} ${post.relativePath}`,
    editorUrl: post.vscodeUrl,
    relativePath: post.relativePath,
    absolutePath: post.absolutePath,
    title: post.title,
    slug: post.slug,
    updatedAt: new Date().toISOString(),
  };
}

export type SavePostEditorState = {
  error?: string;
  success?: string;
  previousPath?: string;
  post?: PostFileSummary;
  editor?: PostEditorRecord;
};

function parseCsvFormField(value: FormDataEntryValue | null) {
  return value
    ?.toString()
    .split(/[,\n]/)
    .map((item) => item.trim())
    .filter(Boolean);
}

function parseCheckboxFormField(value: FormDataEntryValue | null) {
  if (!value) return false;
  const normalized = value.toString().trim().toLowerCase();
  return ["true", "1", "on", "yes"].includes(normalized);
}

function getPostSummary(record: PostEditorRecord): PostFileSummary {
  return {
    title: record.title,
    slug: record.slug,
    relativePath: record.relativePath,
    absolutePath: record.absolutePath,
    updatedAt: record.updatedAt,
    date: record.date,
    summary: record.summary,
    tags: record.tags,
    categories: record.categories,
    draft: record.draft,
    wordCount: record.wordCount,
  };
}

function getSlugFromRelativePath(relativePath?: string) {
  if (!relativePath) return "";
  return relativePath.replace(/^blog\//, "").replace(/\.mdx?$/, "");
}

function revalidatePostWorkspace(
  relativePaths: Array<string | undefined>,
  categories?: string[],
) {
  revalidatePath("/", "layout");
  revalidatePath("/admin/posts");
  revalidatePath("/blog");
  revalidatePath("/archive");
  revalidatePath("/tags");

  for (const slug of new Set(
    relativePaths.map((item) => getSlugFromRelativePath(item)).filter(Boolean),
  )) {
    revalidatePath(`/blog/${slug}`);
  }

  // 刷新分类页面缓存，确保分类导航实时更新
  if (categories?.length) {
    for (const cat of categories) {
      revalidatePath(`/blog/category/${cat}`);
    }
  }
}

export async function getPostEditorAction(relativePath: string) {
  await requireAdminSession();
  return getPostEditorData(relativePath);
}

export async function savePostEditorAction(
  formData: FormData,
): Promise<SavePostEditorState> {
  await requireAdminSession();

  const relativePath = formData.get("relativePath")?.toString().trim() ?? "";
  const title = formData.get("title")?.toString().trim() ?? "";

  if (!title) {
    return { error: "请输入文章标题。" };
  }

  try {
    const postCategories = parseCsvFormField(formData.get("categories")) || [];

    const saved = await savePostEditorData({
      relativePath: relativePath || undefined,
      title,
      slug: formData.get("slug")?.toString() ?? "",
      date: formData.get("date")?.toString() ?? "",
      summary: formData.get("summary")?.toString() ?? "",
      tags: parseCsvFormField(formData.get("tags")),
      categories: postCategories,
      draft: parseCheckboxFormField(formData.get("draft")),
      content: formData.get("content")?.toString() ?? "",
    });

    // 自动注册新分类到动态存储
    if (postCategories.length) {
      const existing = await getCategoryDefinitions();
      const existingSlugs = new Set(existing.map((c) => c.slug));
      const newCategories = postCategories.filter(
        (slug) => !existingSlugs.has(slug.toLowerCase()),
      );
      if (newCategories.length) {
        const merged = [
          ...existing,
          ...newCategories.map((slug) => ({
            slug: slug.toLowerCase(),
            labelZh: slug,
            labelEn: slug.charAt(0).toUpperCase() + slug.slice(1),
          })),
        ];
        await saveCategoryDefinitions(merged);
      }
    }

    revalidatePostWorkspace(
      [relativePath || undefined, saved.record.relativePath],
      postCategories,
    );

    return {
      success: relativePath ? "文章已更新。" : "文章已创建。",
      previousPath: saved.previousPath,
      post: getPostSummary(saved.record),
      editor: saved.record,
    };
  } catch (error) {
    return {
      error: error instanceof Error ? error.message : "保存文章失败，请重试。",
    };
  } finally {
    // 无论成功与否（只要文件可能发生了变化），都尝试更新索引
    triggerContentlayerBuild();
  }
}

export async function deletePostEditorAction(relativePath: string) {
  await requireAdminSession();

  try {
    const record = await getPostEditorData(relativePath);
    await deletePostFile(relativePath);
    revalidatePostWorkspace([relativePath]);

    return {
      success: "文章已删除。",
      deletedPath: relativePath,
      deletedSlug: record.slug,
    };
  } catch (error) {
    return {
      error: error instanceof Error ? error.message : "删除文章失败，请重试。",
    };
  } finally {
    triggerContentlayerBuild();
  }
}

export type SaveSiteSettingsState = {
  error?: string;
  success?: string;
};

export async function saveSiteSettingsAction(
  _prevState: SaveSiteSettingsState,
  formData: FormData,
): Promise<SaveSiteSettingsState> {
  await requireAdminSession();

  const next: Partial<SiteSettings> = {
    title: formData.get("title")?.toString() ?? "",
    headerTitle: formData.get("headerTitle")?.toString() ?? "",
    description: formData.get("description")?.toString() ?? "",
    email: formData.get("email")?.toString() ?? "",
    github: formData.get("github")?.toString() ?? "",
    x: formData.get("x")?.toString() ?? "",
    yuque: formData.get("yuque")?.toString() ?? "",
    icp: formData.get("icp")?.toString() ?? "",
    policeBeian: formData.get("policeBeian")?.toString() ?? "",
    siteUrl: formData.get("siteUrl")?.toString() ?? "",
    seoKeywords: formData.get("seoKeywords")?.toString() ?? "",
    socialBanner: formData.get("socialBanner")?.toString() ?? "",
    welcomeMessage: formData.get("welcomeMessage")?.toString() ?? "",
    googleSearchConsole: formData.get("googleSearchConsole")?.toString() ?? "",
    heroGreetingPrefix: formData.get("heroGreetingPrefix")?.toString() ?? "",
    heroDisplayName: formData.get("heroDisplayName")?.toString() ?? "",
    heroRole: formData.get("heroRole")?.toString() ?? "",
    heroBottomText: formData.get("heroBottomText")?.toString() ?? "",
    heroAvatar: formData.get("heroAvatar")?.toString() ?? "",
    enableSearch: formData.get("enableSearch")?.toString() ?? "",
    enableSuggestion: formData.get("enableSuggestion")?.toString() ?? "",
    enableThemeSwitch: formData.get("enableThemeSwitch")?.toString() ?? "",
    footerPoweredByLabel: formData.get("footerPoweredByLabel")?.toString() ?? "",
    footerPoweredByName: formData.get("footerPoweredByName")?.toString() ?? "",
    footerRightsText: formData.get("footerRightsText")?.toString() ?? "",
    footerPoliceBadgeIcon: formData.get("footerPoliceBadgeIcon")?.toString() ?? "",
  };

  await saveSiteSettings(next);
  revalidatePath("/");
  revalidatePath("/about");
  revalidatePath("/blog");
  revalidatePath("/archive");
  revalidatePath("/friends");
  revalidatePath("/projects");
  revalidatePath("/tags");
  revalidatePath("/admin/settings");

  return { success: "站点设置已更新。" };
}

export type ChangeAdminPasswordState = {
  error?: string;
  success?: string;
};

export async function changeAdminPasswordAction(
  _prevState: ChangeAdminPasswordState,
  formData: FormData,
): Promise<ChangeAdminPasswordState> {
  await requireAdminSession();
  const loginUsername = DEFAULT_ADMIN_USERNAME;

  const currentPassword = formData.get("currentPassword")?.toString() ?? "";
  const newPassword = formData.get("newPassword")?.toString() ?? "";
  const confirmPassword = formData.get("confirmPassword")?.toString() ?? "";

  if (!currentPassword || !newPassword || !confirmPassword) {
    return { error: "请填写完整的密码信息。" };
  }

  if (newPassword.length < 6) {
    return { error: "新密码至少需要 6 位。" };
  }

  if (newPassword !== confirmPassword) {
    return { error: "两次输入的新密码不一致。" };
  }

  if (currentPassword === newPassword) {
    return { error: "新密码不能与当前密码相同。" };
  }

  const user = db
    .select()
    .from(adminUsers)
    .where(eq(adminUsers.username, loginUsername))
    .get();

  if (!user) {
    return { error: "未找到管理员账户。" };
  }

  if (!verifyPassword(currentPassword, user.passwordHash)) {
    return { error: "当前密码不正确。" };
  }

  db.update(adminUsers)
    .set({ passwordHash: hashPassword(newPassword) })
    .where(eq(adminUsers.id, user.id))
    .run();

  revalidatePath("/admin/settings");

  return { success: "管理员密码已更新。" };
}

export type SaveAboutPageState = {
  error?: string;
  success?: string;
};

export async function saveAboutPageAction(
  _prevState: SaveAboutPageState,
  formData: FormData,
): Promise<SaveAboutPageState> {
  await requireAdminSession();

  const name = formData.get("name")?.toString().trim() ?? "";
  const content = formData.get("content")?.toString() ?? "";

  const parseJsonArray = (key: string) => {
    try {
      const data = formData.get(key)?.toString();
      return data ? JSON.parse(data) : undefined;
    } catch {
      return undefined;
    }
  };

  const birthYear = parseInt(formData.get("birthYear")?.toString() || "0", 10);
  const birthMonth = parseInt(
    formData.get("birthMonth")?.toString() || "0",
    10,
  );
  const showBirthdayState = formData.get("showBirthday")?.toString();
  const showBirthday = showBirthdayState ? showBirthdayState === "true" : true;

  if (!name) {
    return { error: "请输入您的姓名。" };
  }

  await saveAboutPageData({
    name,
    email: formData.get("email")?.toString() ?? "",
    avatar: formData.get("avatar")?.toString() ?? "",
    birthYear: birthYear || undefined,
    birthMonth: birthMonth || undefined,
    showBirthday,
    socials: parseJsonArray("socials"),
    techStacks: parseJsonArray("techStacks"),
    content,
  });

  revalidatePath("/about");
  revalidatePath("/admin/about");
  return { success: "个人简介页面已更新。" };
}

export async function getPostSourceAction(relativePath: string) {
  await requireAdminSession();
  const source = await readPostSource(relativePath);
  return { source };
}

export async function savePostSourceAction(
  relativePath: string,
  source: string,
) {
  await requireAdminSession();
  await savePostSource(relativePath, source);
  revalidatePath("/blog");
  revalidatePath("/admin/posts");
  return { success: true };
}

export async function renderMarkdownPreviewAction(source: string) {
  await requireAdminSession();
  const body = extractMdxBody(source);
  const html = await renderMarkdownToHtml(body);
  return { html };
}

export async function getSiteSettingsAction() {
  await requireAdminSession();
  return getSiteSettings();
}

export async function getCategoryListAction() {
  await requireAdminSession();
  const categories = await getCategoryDefinitions();
  return categories.map((c) => ({
    slug: c.slug,
    labelZh: c.labelZh,
    labelEn: c.labelEn,
  }));
}

// ============ 邮件配置操作 ============

export async function getMailSettingsAction() {
  await requireAdminSession();
  return getMailSettingsSafe();
}

export type SaveMailSettingsState = {
  error?: string;
  success?: string;
};

export async function saveMailSettingsAction(
  input: Partial<MailSettings>,
): Promise<SaveMailSettingsState> {
  await requireAdminSession();

  try {
    await saveMailSettings(input, { keepExistingPassword: true });
    return { success: "邮件配置已保存。" };
  } catch (err) {
    return { error: err instanceof Error ? err.message : "保存邮件配置失败。" };
  }
}

export type SendTestMailState = {
  error?: string;
  success?: string;
};

export async function sendTestMailAction(
  to: string,
): Promise<SendTestMailState> {
  await requireAdminSession();

  const target = to.trim();
  if (!target) {
    return { error: "请输入测试收件邮箱。" };
  }

  const result = await sendTestMail(target);
  if (!result.success) {
    return { error: result.message || "测试邮件发送失败。" };
  }

  return { success: `测试邮件已发送至 ${target}` };
}

