"use server";

import {
  getResolvedMailConfig,
  sendNewSuggestionNotification,
} from "@/server/mailer";
import { assertCommentRateLimit } from "@/features/comments/lib/comment-rate-limit";
import { headers } from "next/headers";
import { db } from "@/server/db";
import { suggestions } from "@/server/db/schema";

export async function sendSuggestionAction(qq: string, content: string) {
  try {
    const config = await getResolvedMailConfig();
    if (!config.enabled) {
      return { success: false, error: "邮件服务未开启" };
    }

    const to = String(config.notifyTo || "").trim();
    if (!to) {
      return { success: false, error: "站长未配置接收邮箱" };
    }

    if (!qq || !/^\d{5,12}$/.test(qq)) {
      return { success: false, error: "请输入正确的 QQ 号" };
    }

    if (!content || content.length < 5 || content.length > 2000) {
      return { success: false, error: "建议内容字数在 5 - 2000 字之间" };
    }

    const requestHeaders = await headers();
    // 获取 IP（简单防刷）
    const xForwardedFor = requestHeaders.get("x-forwarded-for");
    const ipAddress = (
      xForwardedFor
        ? xForwardedFor.split(",")[0]
        : requestHeaders.get("x-real-ip") || "unknown"
    ).trim();

    // 复用评论的限流逻辑防止恶意发送邮件
    const limit = assertCommentRateLimit({
      ipAddress,
      qq,
    });

    if (!limit.allowed) {
      return {
        success: false,
        error: `发送太快了，请等待 ${limit.retryAfterSeconds} 秒后再试`,
      };
    }

    // 保存到数据库
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
  } catch (error: any) {
    console.error("[sendSuggestionAction] Error:", error);
    return { success: false, error: "提交失败，请稍后再试" };
  }
}
