"use server";

import { revalidatePath } from "next/cache";
import { headers } from "next/headers";
import {
  createComment,
  getCommentById,
  incrementCommentLikes,
} from "@/features/comments/lib/comments";
import { getCommentClientMeta } from "@/features/comments/lib/comment-client-meta";
import { assertCommentRateLimit } from "@/features/comments/lib/comment-rate-limit";
import { getServerDictionary } from "@/shared/utils/i18n-server";
import {
  sendNewCommentNotification,
  sendReplyNotification,
} from "@/server/mailer";
import { allBlogs } from "contentlayer/generated";

export type SubmitCommentState = {
  success?: boolean;
  error?: string;
  message?: string;
};

export async function submitCommentAction(
  _prevState: SubmitCommentState,
  formData: FormData,
): Promise<SubmitCommentState> {
  const dictionary = await getServerDictionary();
  const postId = formData.get("postId")?.toString().trim() ?? "";
  const qq = formData.get("qq")?.toString().trim() ?? "";
  const authorName = formData.get("nickname")?.toString().trim() ?? "";
  const content = formData.get("content")?.toString().trim() ?? "";
  const parentIdStr = formData.get("parentId")?.toString().trim() ?? "";
  const clientIpAddress =
    formData.get("clientIpAddress")?.toString().trim() ?? "";
  const clientLocation =
    formData.get("clientLocation")?.toString().trim() ?? "";
  const clientUserAgent =
    formData.get("clientUserAgent")?.toString().trim() ?? "";
  const clientBrowser = formData.get("clientBrowser")?.toString().trim() ?? "";
  const clientOs = formData.get("clientOs")?.toString().trim() ?? "";

  if (!postId) {
    return { error: dictionary.actions.invalidPostId };
  }

  if (!/^\d{5,12}$/.test(qq)) {
    return { error: dictionary.actions.invalidQQ };
  }

  if (authorName.length < 2 || authorName.length > 40) {
    return { error: dictionary.actions.invalidName };
  }

  if (content.length < 3 || content.length > 1000) {
    return { error: dictionary.actions.invalidComment };
  }

  const requestHeaders = await headers();
  const clientMeta = await getCommentClientMeta(requestHeaders, {
    ipAddress: clientIpAddress || null,
    location: clientLocation || null,
    userAgent: clientUserAgent || null,
    browser: clientBrowser || null,
    os: clientOs || null,
  });

  const limit = assertCommentRateLimit({
    ipAddress: clientMeta.ipAddress,
    qq,
  });

  if (!limit.allowed) {
    return {
      error: `${dictionary.actions.commentRateLimit} ${limit.retryAfterSeconds} ${dictionary.actions.commentRateLimitSuffix}`,
    };
  }

  const comment = await createComment({
    postId,
    qq,
    avatar: `https://q1.qlogo.cn/g?b=qq&nk=${qq}&s=100`,
    authorName,
    content,
    parentId: parentIdStr ? parseInt(parentIdStr, 10) : undefined,
    status: "approved",
    ipAddress: clientMeta.ipAddress,
    location: clientMeta.location,
    userAgent: clientMeta.userAgent,
    browser: clientMeta.browser,
    os: clientMeta.os,
  });
  if (!comment) {
    return { error: dictionary.actions.commentCreateFailed };
  }
  revalidatePath(`/blog/${postId}`);

  const post = allBlogs.find((p) => p.slug === postId);
  const postTitle = post?.title || postId;
  let parentForNotification: Awaited<ReturnType<typeof getCommentById>> | null =
    null;

  if (parentIdStr) {
    const parentId = parseInt(parentIdStr, 10);
    if (!isNaN(parentId)) {
      const parent = await getCommentById(parentId);
      parentForNotification = parent ?? null;
      if (parent && parent.qq && !parent.isAdmin && parent.qq !== qq) {
        sendReplyNotification({
          postId,
          postTitle,
          qq: parent.qq,
          parentNickname: parent.authorName,
          parentContent: parent.content,
          parentAvatarUrl: parent.avatar || undefined,
          replyContent: content,
          replyAuthorName: authorName,
          replyAuthorQq: qq,
          replyAuthorAvatarUrl: comment.avatar || undefined,
          replyAuthorRole: "visitor",
        }).catch((err) =>
          console.error("[submitCommentAction] Failed to send reply email:", err),
        );
      }
    }
  }

  // 异步通知站长有新评论/回复（不阻塞响应）
  sendNewCommentNotification({
    postId,
    postTitle,
    commenterNickname: authorName,
    commenterQq: qq,
    commenterAvatarUrl: comment.avatar || undefined,
    commentContent: content,
    commenterIpAddress: clientMeta.ipAddress || undefined,
    commenterLocation: clientMeta.location || undefined,
    commenterBrowser: clientMeta.browser || undefined,
    commenterOs: clientMeta.os || undefined,
    isReply: !!parentIdStr,
    parentNickname: parentForNotification?.authorName,
    parentContent: parentForNotification?.content,
    parentAvatarUrl: parentForNotification?.avatar || undefined,
  }).catch((err) =>
    console.error("[submitCommentAction] Failed to notify admin:", err),
  );

  return {
    success: true,
    message: dictionary.actions.commentSubmitted,
  };
}

export async function likeCommentAction(id: number, postId: string) {
  try {
    const success = await incrementCommentLikes(id, postId);
    return { success };
  } catch (error) {
    console.error("Like comment error:", error);
    return { success: false };
  }
}
