"use server";

import { headers } from "next/headers";

import { assertCommentRateLimit } from "@/features/comments/lib/comment-rate-limit";
import { db } from "@/server/db";
import { suggestions } from "@/server/db/schema";
import { sendNewSuggestionNotification } from "@/server/mailer";

export async function sendSuggestionAction(qq: string, content: string) {
  try {
    if (!qq || !/^\d{5,12}$/.test(qq)) {
      return { success: false, error: "请输入正确的 QQ 号" };
    }

    if (!content || content.length < 5 || content.length > 2000) {
      return { success: false, error: "建议内容字数需在 5 到 2000 字之间" };
    }

    const requestHeaders = await headers();
    const xForwardedFor = requestHeaders.get("x-forwarded-for");
    const ipAddress = (
      xForwardedFor
        ? xForwardedFor.split(",")[0]
        : requestHeaders.get("x-real-ip") || "unknown"
    ).trim();

    const limit = assertCommentRateLimit({
      ipAddress,
      qq,
    });

    if (!limit.allowed) {
      return {
        success: false,
        error: `提交过于频繁，请等待 ${limit.retryAfterSeconds} 秒后再试`,
      };
    }

    await db.insert(suggestions).values({
      qq,
      content,
      ipAddress,
      status: "pending",
    });

    sendNewSuggestionNotification({
      qq,
      content,
    }).catch((error) => {
      console.error(
        "[sendSuggestionAction] Suggestion mail notification failed:",
        error,
      );
    });

    return { success: true };
  } catch (error: unknown) {
    console.error("[sendSuggestionAction] Error:", error);
    return { success: false, error: "提交失败，请稍后再试" };
  }
}
