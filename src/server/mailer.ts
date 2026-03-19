import "server-only";

import nodemailer from "nodemailer";
import { getMailSettings } from "./mail-settings";
import { getSiteSettings } from "./site-settings";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const QQ_RE = /^\d{5,12}$/;
const CONNECTION_TIMEOUT_MS = 10_000;
const SOCKET_TIMEOUT_MS = 15_000;

interface MailConfig {
  enabled: boolean;
  host: string;
  port: number;
  secure: boolean;
  user: string;
  pass: string;
  from: string;
  notifyTo: string;
  siteUrl: string;
  ownerQq: string;
  ownerNickname: string;
  siteTitle: string;
  siteDescription: string;
  siteAvatar: string;
  icp: string;
  policeBeian: string;
}

interface NewCommentNotificationPayload {
  postId: string;
  postTitle?: string;
  commenterNickname: string;
  commenterQq: string;
  commenterAvatarUrl?: string;
  commentContent: string;
  commenterIpAddress?: string;
  commenterLocation?: string;
  commenterBrowser?: string;
  commenterOs?: string;
  isReply?: boolean;
  parentNickname?: string;
  parentContent?: string;
  parentAvatarUrl?: string;
}

interface ReplyNotificationPayload {
  qq: string;
  postId: string;
  postTitle?: string;
  parentNickname: string;
  parentContent: string;
  parentAvatarUrl?: string;
  replyContent: string;
  replyAuthorName: string;
  replyAuthorQq?: string;
  replyAuthorAvatarUrl?: string;
  replyAuthorRole: "admin" | "visitor";
}

export interface NewFriendLinkApplicationPayload {
  name: string;
  url: string;
  description?: string;
  qq: string;
}

export interface FriendLinkApprovedPayload {
  name: string;
  url: string;
  qq: string;
}

export interface FriendLinkDeletedPayload {
  name: string;
  url: string;
  qq: string;
  reason?: string;
}

export interface FriendLinkUpdatedPayload {
  name: string;
  url: string;
  qq: string;
}

export interface SuggestionReplyPayload {
  qq: string;
  suggestionContent: string;
  adminReply: string;
}

export interface NewSuggestionNotificationPayload {
  qq: string;
  content: string;
}

interface SendMailPayload {
  to: string;
  subject: string;
  text: string;
  html: string;
}

interface MailInfoRow {
  label: string;
  value: string;
  isHtml?: boolean;
}

interface MailBubbleOptions {
  avatarUrl: string;
  name: string;
  content: string;
  badge?: string;
  align?: "left" | "right";
  tone?: "slate" | "blue" | "green";
}

interface MailShellOptions {
  preheader?: string;
  eyebrow: string;
  title: string;
  intro: string;
  sections: string[];
  ctaLabel?: string;
  ctaUrl?: string;
  footerNote?: string;
}

export interface MailSendResult {
  success: boolean;
  message: string;
  code?: string;
}

let transporterCache: {
  signature: string;
  transporter: nodemailer.Transporter;
} | null = null;
let lastConfigWarningSignature = "";

function normalizeSiteUrl(value: string): string {
  return String(value || "")
    .trim()
    .replace(/\/+$/g, "");
}

export async function getResolvedMailConfig(): Promise<MailConfig> {
  const mailSettings = await getMailSettings();
  let siteUrl = normalizeSiteUrl(mailSettings.siteUrl);
  let siteTitle = "";
  let siteDescription = "";
  let siteAvatar = "";
  let icp = "";
  let policeBeian = "";

  try {
    const siteSettings = await getSiteSettings();
    if (!siteUrl) {
      siteUrl = normalizeSiteUrl(siteSettings.siteUrl || "");
    }
    siteTitle = String(
      siteSettings.title || siteSettings.headerTitle || "",
    ).trim();
    siteDescription = String(
      siteSettings.heroBottomText || siteSettings.description || "",
    ).trim();
    siteAvatar = String(siteSettings.heroAvatar || "").trim();
    icp = String(siteSettings.icp || "").trim();
    policeBeian = String(siteSettings.policeBeian || "").trim();
  } catch {
    // 忽略
  }

  return {
    enabled: mailSettings.enabled,
    host: mailSettings.host,
    port: mailSettings.port,
    secure: mailSettings.secure,
    user: mailSettings.user,
    pass: mailSettings.pass,
    from: normalizeFromField(mailSettings.from, mailSettings.user),
    notifyTo: mailSettings.notifyTo,
    siteUrl,
    ownerQq: String(mailSettings.ownerQq || "").trim(),
    ownerNickname: String(mailSettings.ownerNickname || "").trim(),
    siteTitle,
    siteDescription,
    siteAvatar,
    icp,
    policeBeian,
  };
}

function normalizeFromField(from: string, user: string): string {
  const trimmed = from.trim();
  if (!trimmed) return user;
  if (EMAIL_RE.test(trimmed)) return trimmed;

  const angleMatch = trimmed.match(/<([^>]+)>/);
  if (angleMatch && EMAIL_RE.test(angleMatch[1].trim())) return trimmed;

  if (user && EMAIL_RE.test(user)) return `${trimmed} <${user}>`;
  return user || trimmed;
}

function hasUsableMailConfig(config: MailConfig): boolean {
  return Boolean(
    config.enabled &&
    config.host &&
    config.port > 0 &&
    config.user &&
    config.pass &&
    config.from,
  );
}

function getConfigSignature(config: MailConfig): string {
  return JSON.stringify([
    config.host,
    config.port,
    config.secure,
    config.user,
    config.pass,
    config.from,
  ]);
}

function warnInvalidConfig(config: MailConfig) {
  const signature = `${config.enabled}:${config.host}:${config.port}:${config.user}:${config.from}`;
  if (!config.enabled || signature === lastConfigWarningSignature) return;
  lastConfigWarningSignature = signature;
  console.warn("[mailer] 邮件通知已启用，但 SMTP 配置不完整，已跳过发送");
}

async function getTransportContext(): Promise<{
  config: MailConfig;
  transporter: nodemailer.Transporter | null;
  error?: string;
}> {
  const config = await getResolvedMailConfig();
  if (!config.enabled) {
    return { config, transporter: null, error: "MAIL_DISABLED" };
  }

  if (!hasUsableMailConfig(config)) {
    warnInvalidConfig(config);
    return { config, transporter: null, error: "INVALID_CONFIG" };
  }

  const signature = getConfigSignature(config);
  if (!transporterCache || transporterCache.signature !== signature) {
    transporterCache = {
      signature,
      transporter: nodemailer.createTransport({
        host: config.host,
        port: config.port,
        secure: config.secure,
        auth: {
          user: config.user,
          pass: config.pass,
        },
        connectionTimeout: CONNECTION_TIMEOUT_MS,
        greetingTimeout: CONNECTION_TIMEOUT_MS,
        socketTimeout: SOCKET_TIMEOUT_MS,
      }),
    };
  }

  return { config, transporter: transporterCache.transporter };
}

export function escapeHtml(value: string): string {
  return String(value || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function truncateText(value: string, max = 180): string {
  const compact = String(value || "")
    .replace(/\s+/g, " ")
    .trim();
  if (compact.length <= max) return compact;
  return `${compact.slice(0, Math.max(0, max - 1))}…`;
}

function buildUrl(pathname: string, siteUrl: string): string {
  const normalizedPath = pathname.startsWith("/") ? pathname : `/${pathname}`;
  return siteUrl ? `${siteUrl}${normalizedPath}` : normalizedPath;
}

function renderLink(label: string, url: string): string {
  const safeLabel = escapeHtml(label);
  const safeUrl = escapeHtml(url);
  if (/^https?:\/\//i.test(url)) {
    return `<a href="${safeUrl}" target="_blank" rel="noopener noreferrer">${safeLabel}</a>`;
  }
  return `<code>${safeUrl}</code>`;
}

function isValidEmail(value: string): boolean {
  return EMAIL_RE.test(String(value || "").trim());
}

function deriveQqEmail(qq: string): string {
  const normalized = String(qq || "").trim();
  if (!QQ_RE.test(normalized)) return "";
  return `${normalized}@qq.com`;
}

function isValidQq(value: string): boolean {
  return QQ_RE.test(String(value || "").trim());
}

function getSiteBrand(config: MailConfig): string {
  return config.siteTitle || config.ownerNickname || "本站";
}

function getCopyrightName(config: MailConfig): string {
  return getSiteBrand(config);
}

function renderMultiline(value: string): string {
  return escapeHtml(String(value || "").trim())
    .replace(/\r\n/g, "\n")
    .replace(/\r/g, "\n")
    .replace(/\n/g, "<br/>");
}

function buildAvatarUrl(name: string, qq?: string): string {
  if (qq && isValidQq(qq)) {
    return `https://q1.qlogo.cn/g?b=qq&nk=${qq}&s=100`;
  }

  const fallbackName = String(name || "U").trim() || "U";
  return `https://ui-avatars.com/api/?name=${encodeURIComponent(fallbackName)}&size=80&background=e8eefc&color=1d4ed8`;
}

function renderSection(innerHtml: string): string {
  return `<tr><td style="padding:0 20px 14px;">${innerHtml}</td></tr>`;
}

function renderInfoTable(rows: MailInfoRow[]): string {
  const rendered = rows
    .filter((row) => String(row.value || "").trim())
    .map((row, index) => {
      const content = row.isHtml ? row.value : escapeHtml(row.value);
      const borderTop = index === 0 ? "" : "border-top:1px solid #e2e8f0;";
      return `
        <tr>
          <td style="width:100px;padding:12px;font-size:12px;line-height:1.5;color:#64748b;font-weight:500;${borderTop}">${escapeHtml(row.label)}</td>
          <td style="padding:12px;font-size:14px;line-height:1.6;color:#1e293b;${borderTop}">${content}</td>
        </tr>
      `;
    })
    .join("");

  return `
    <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:20px;border:1px solid #e2e8f0;border-radius:10px;background:#f8fafc;overflow:hidden;">
      ${rendered}
    </table>
  `;
}

function renderQuoteBlock(
  label: string,
  content: string,
  accent = "#3b82f6",
): string {
  return `
    <div style="padding:16px 20px;background:#f8fafc;border-left:5px solid ${accent};border-radius:0 12px 12px 0;margin-bottom:18px;">
      <p style="margin:0 0 10px;font-size:12px;line-height:1.2;color:#64748b;font-weight:700;text-transform:uppercase;letter-spacing:0.05em;">${escapeHtml(label)}</p>
      <div style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Arial,sans-serif;font-size:14px;line-height:1.65;color:#334155;word-break:break-word;white-space:pre-wrap;text-align:justify;text-justify:inter-ideograph;">${renderMultiline(content)}</div>
    </div>
  `;
}

function renderBadge(
  text: string,
  tone: "blue" | "green" | "gold" = "blue",
): string {
  const palette = {
    blue: {
      bg: "#dbeafe",
      border: "#bfdbfe",
      color: "#1e40af",
    },
    green: {
      bg: "#dcfce7",
      border: "#bbf7d0",
      color: "#166534",
    },
    gold: {
      bg: "#fef3c7",
      border: "#fde68a",
      color: "#92400e",
    },
  }[tone];

  return `
    <span style="display:inline-block;padding:2px 8px;border-radius:999px;background:${palette.bg};font-size:11px;line-height:1;color:${palette.color};font-weight:700;vertical-align:middle;text-transform:uppercase;">
      ${escapeHtml(text)}
    </span>
  `;
}

function renderBubbleSection(innerHtml: string): string {
  return `<tr><td style="padding:0 20px 8px;">${innerHtml}</td></tr>`;
}

function renderMessageBubble(options: MailBubbleOptions): string {
  const align = options.align || "left";
  const tone = options.tone || "slate";
  const palette = {
    slate: { bg: "#f8fafc", border: "#cbd5e1", text: "#334155" },
    blue: { bg: "#eff6ff", border: "#bfdbfe", text: "#1e40af" },
    green: { bg: "#f0fdf4", border: "#bbf7d0", text: "#166534" },
  }[tone];

  const avatar = escapeHtml(options.avatarUrl);
  const safeName = escapeHtml(options.name);
  const badgeText = options.badge || "";

  const avatarSize = 44;
  const borderRadius =
    align === "left" ? "4px 18px 18px 18px" : "18px 4px 18px 18px";

  // 构建名字和勋章行
  const nameLine =
    align === "left"
      ? `
      <div style="margin-bottom:6px;">
        <span style="font-size:15px;color:#64748b;font-weight:700;line-height:1.2;">${safeName}</span>
        ${badgeText ? `<span style="margin-left:6px;">${renderBadge(badgeText, tone === "green" ? "green" : "blue")}</span>` : ""}
      </div>
    `
      : `
      <div style="margin-bottom:6px;">
        ${badgeText ? `<span style="margin-right:6px;">${renderBadge(badgeText, tone === "green" ? "green" : "blue")}</span>` : ""}
        <span style="font-size:15px;color:#64748b;font-weight:700;line-height:1.2;">${safeName}</span>
      </div>
    `;

  // 统一所有文本为左侧对齐
  const bubbleTable = `
    <table cellpadding="0" cellspacing="0" align="${align}" style="width:auto;max-width:340px;border-collapse:separate;margin-${align === "left" ? "right" : "left"}:auto;">
      <tr>
        <td align="left" style="padding:12px 18px;background:${palette.bg};border:1px solid ${palette.border};border-radius:${borderRadius};text-align:left;">
          <div style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Arial,sans-serif;font-size:15px;line-height:1.7;color:${palette.text};word-break:break-word;overflow-wrap:anywhere;white-space:pre-wrap;text-align:justify;text-justify:inter-ideograph;hyphens:auto;">${renderMultiline(options.content)}</div>
        </td>
      </tr>
    </table>
  `;

  const avatarTag = `<img src="${avatar}" width="${avatarSize}" height="${avatarSize}" style="display:block;width:${avatarSize}px;height:${avatarSize}px;border-radius:50%;object-fit:cover;background:#f1f5f9;" alt="" />`;

  if (align === "right") {
    return `
      <table width="100%" cellpadding="0" cellspacing="0" style="margin:20px 0;">
        <tr>
          <td align="right" style="vertical-align:top;padding-right:12px;">
            ${nameLine}
            ${bubbleTable}
          </td>
          <td width="${avatarSize}" style="vertical-align:top;padding-top:2px;">
            ${avatarTag}
          </td>
        </tr>
      </table>
    `;
  }

  return `
    <table width="100%" cellpadding="0" cellspacing="0" style="margin:20px 0;">
      <tr>
        <td width="${avatarSize}" style="vertical-align:top;padding-top:2px;">
          ${avatarTag}
        </td>
        <td align="left" style="vertical-align:top;padding-left:12px;">
          ${nameLine}
          ${bubbleTable}
        </td>
      </tr>
    </table>
  `;
}

function renderActionButton(label: string, url: string): string {
  return `
    <a href="${escapeHtml(url)}" style="display:inline-block;padding:12px 32px;border-radius:8px;background:#1e293b;color:#ffffff;font-size:14px;line-height:1.2;font-weight:600;text-decoration:none;box-shadow:0 1px 2px rgba(0,0,0,0.05);">
      ${escapeHtml(label)}
    </a>
  `;
}

function renderFooterMeta(config: MailConfig): string {
  const items = [config.icp, config.policeBeian].filter(Boolean);
  if (!items.length) return "";

  const rendered = items
    .map(
      (item) => `<span style="white-space:nowrap;">${escapeHtml(item)}</span>`,
    )
    .join('<span style="margin:0 6px;color:#cbd5e1;">·</span>');

  return `
    <p style="margin:6px 0 0;font-size:11px;line-height:1.6;color:#94a3b8;word-break:keep-all;">
      ${rendered}
    </p>
  `;
}

function renderMailShell(
  config: MailConfig,
  options: MailShellOptions,
): string {
  const preheader = escapeHtml(options.preheader || options.title);
  const footerNote = options.footerNote
    ? `<p style="margin:0 0 8px;font-size:12px;line-height:1.6;color:#64748b;font-weight:500;">${renderMultiline(options.footerNote)}</p>`
    : "";
  const cta =
    options.ctaLabel && options.ctaUrl
      ? renderSection(`
        <div style="padding-top:2px;text-align:center;">
          ${renderActionButton(options.ctaLabel, options.ctaUrl)}
        </div>
      `)
      : "";

  return `
    <div style="margin:0;padding:0;background-color:#f3f4f6;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;">
      <div style="display:none;max-height:0;overflow:hidden;opacity:0;color:transparent;">
        ${preheader}
      </div>
      <table width="100%" cellpadding="0" cellspacing="0" style="padding:24px 14px;">
        <tr>
          <td align="center">
            <table width="100%" cellpadding="0" cellspacing="0" style="max-width:500px;">
              <tr>
                <td style="border:1px solid #e5e7eb;border-radius:10px;background:#fff;overflow:hidden;">
                  <table width="100%" cellpadding="0" cellspacing="0">
                    <tr>
                      <td style="padding:24px 20px 10px;">
                        <p style="margin:0 0 6px;font-size:12px;line-height:1.4;color:#64748b;">
                          ${escapeHtml(options.eyebrow)}
                        </p>
                        <h1 style="margin:0 0 10px;font-size:18px;line-height:1.35;color:#0f172a;font-weight:600;">
                          ${escapeHtml(options.title)}
                        </h1>
                        <p style="margin:0;font-size:14px;line-height:1.65;color:#334155;">
                          ${renderMultiline(options.intro)}
                        </p>
                      </td>
                    </tr>
                    ${options.sections.join("")}
                    ${cta}
                    <tr>
                      <td style="padding:16px 20px;border-top:1px solid #e2e8f0;text-align:center;">
                        ${footerNote}
                        <p style="margin:4px 0 0;font-size:11px;line-height:1.6;color:#94a3b8;">
                          &copy; ${new Date().getFullYear()} ${escapeHtml(getCopyrightName(config))} 版权所有
                        </p>
                        ${renderFooterMeta(config)}
                      </td>
                    </tr>
                  </table>
                </td>
              </tr>
            </table>
          </td>
        </tr>
      </table>
    </div>
  `;
}

export async function sendMail(
  payload: SendMailPayload,
): Promise<MailSendResult> {
  const to = String(payload.to || "").trim();
  if (!isValidEmail(to)) {
    return {
      success: false,
      message: "收件邮箱格式不正确",
      code: "INVALID_TO",
    };
  }

  const { config, transporter, error } = await getTransportContext();
  if (error === "MAIL_DISABLED") {
    return { success: false, message: "邮件通知未启用", code: error };
  }
  if (!transporter) {
    return {
      success: false,
      message: "SMTP 配置不完整，请检查后台基础配置与 .env 中的 SMTP_PASS",
      code: error || "INVALID_CONFIG",
    };
  }

  try {
    await transporter.sendMail({
      from: config.from,
      to,
      subject: payload.subject,
      text: payload.text,
      html: payload.html,
    });
    return { success: true, message: "发送成功" };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "邮件发送失败";
    console.error("[mailer] 发送邮件失败:", err);
    return {
      success: false,
      message,
      code: "MAIL_SEND_FAILED",
    };
  }
}

export async function sendTestMail(to: string): Promise<MailSendResult> {
  const config = await getResolvedMailConfig();
  const target = String(to || "").trim();
  const siteUrl = config.siteUrl || "(未配置)";
  const brandName = getSiteBrand(config);

  return await sendMail({
    to: target,
    subject: `【测试】${brandName} 邮件通知`,
    text: [
      `您好，这是一封来自 ${brandName} 的测试邮件。`,
      "",
      "如果您收到此邮件，说明邮件通知已配置成功。",
      "",
      `SMTP 主机：${config.host || "(未配置)"}`,
      `发件身份：${config.from || "(未配置)"}`,
      `站点地址：${siteUrl}`,
    ].join("\n"),
    html: renderMailShell(config, {
      preheader: "测试邮件发送成功",
      eyebrow: "邮件配置测试",
      title: "邮件通知已配置成功",
      intro:
        "您好，这是一封测试邮件。如果您已经收到它，说明当前 SMTP 配置可以正常完成投递。",
      sections: [
        renderSection(
          renderInfoTable([
            { label: "SMTP", value: config.host || "(未配置)" },
            { label: "发件身份", value: config.from || "(未配置)" },
            {
              label: "站点地址",
              value: renderLink(siteUrl, siteUrl),
              isHtml: true,
            },
          ]),
        ),
      ],
      ctaLabel: /^https?:\/\//i.test(siteUrl) ? "访问站点" : undefined,
      ctaUrl: /^https?:\/\//i.test(siteUrl) ? siteUrl : undefined,
      footerNote: config.siteDescription || "系统测试邮件，收到即代表配置成功",
    }),
  });
}

export async function sendNewCommentNotification(
  payload: NewCommentNotificationPayload,
): Promise<boolean> {
  const config = await getResolvedMailConfig();
  if (!config.enabled) return false;

  const to = String(config.notifyTo || "").trim();
  if (!isValidEmail(to)) return false;

  const postLabel = payload.postTitle || payload.postId;
  const postUrl = buildUrl(
    `/blog/${encodeURIComponent(payload.postId)}#comments-section`,
    config.siteUrl,
  );
  const adminUrl = buildUrl("/admin/comments", config.siteUrl);
  const commentSnippet = truncateText(payload.commentContent, 240);
  const parentSnippet = truncateText(payload.parentContent || "", 180);
  const commenterName = payload.commenterNickname || "访客";
  const commenterAvatarUrl =
    payload.commenterAvatarUrl ||
    buildAvatarUrl(commenterName, payload.commenterQq);
  const parentName = String(payload.parentNickname || "").trim() || "原评论";
  const parentAvatarUrl = payload.parentAvatarUrl || buildAvatarUrl(parentName);
  const kindLabel = payload.isReply ? "新回复通知" : "新评论通知";
  const detailRows: MailInfoRow[] = [
    { label: "内容类型", value: payload.isReply ? "回复" : "评论" },
    { label: "访客", value: commenterName },
    { label: "QQ", value: payload.commenterQq || "未提供" },
    ...(payload.isReply && payload.parentNickname
      ? [{ label: "回复对象", value: parentName }]
      : []),
    ...(payload.commenterLocation || payload.commenterIpAddress
      ? [
          {
            label: "位置 / IP",
            value: [payload.commenterLocation, payload.commenterIpAddress]
              .filter(Boolean)
              .join(" / "),
          },
        ]
      : []),
    ...(payload.commenterBrowser || payload.commenterOs
      ? [
          {
            label: "设备",
            value: [payload.commenterBrowser, payload.commenterOs]
              .filter(Boolean)
              .join(" / "),
          },
        ]
      : []),
    {
      label: "文章",
      value: renderLink(postLabel, postUrl),
      isHtml: true,
    },
  ];
  const threadSections =
    payload.isReply && parentSnippet
      ? [
          renderBubbleSection(
            renderMessageBubble({
              avatarUrl: parentAvatarUrl,
              name: parentName,
              content: parentSnippet,
              align: "right",
              tone: "slate",
            }),
          ),
          renderBubbleSection(
            renderMessageBubble({
              avatarUrl: commenterAvatarUrl,
              name: commenterName,
              badge: "新回复",
              content: commentSnippet,
              tone: "blue",
            }),
          ),
        ]
      : [
          renderBubbleSection(
            renderMessageBubble({
              avatarUrl: commenterAvatarUrl,
              name: commenterName,
              content: commentSnippet,
              tone: "slate",
            }),
          ),
        ];

  const result = await sendMail({
    to,
    subject: `【${payload.isReply ? "新回复" : "新评论"}】${postLabel}`,
    text: [
      `文章《${postLabel}》收到了一条${payload.isReply ? "新回复" : "新评论"}。`,
      "",
      `访客：${commenterName}`,
      `QQ：${payload.commenterQq || "未提供"}`,
      `内容：${commentSnippet}`,
      "",
      `查看文章：${postUrl}`,
      `后台处理：${adminUrl}`,
    ].join("\n"),
    html: renderMailShell(config, {
      preheader: `文章《${postLabel}》收到了一条${payload.isReply ? "新回复" : "新评论"}`,
      eyebrow: kindLabel,
      title: `《${postLabel}》有新的互动`,
      intro: payload.isReply
        ? `${commenterName} 回复了 ${parentName}`
        : `收到一条新的访客评论`,
      sections: [renderSection(renderInfoTable(detailRows)), ...threadSections],
      ctaLabel: "前往后台处理",
      ctaUrl: adminUrl,
      footerNote: "站点访客互动通知，请及时查看",
    }),
  });

  return result.success;
}

export async function sendReplyNotification(
  payload: ReplyNotificationPayload,
): Promise<boolean> {
  const config = await getResolvedMailConfig();
  if (!config.enabled) return false;

  const to = deriveQqEmail(payload.qq);
  if (!to) return false;

  const postLabel = payload.postTitle || payload.postId;
  const postUrl = buildUrl(
    `/blog/${encodeURIComponent(payload.postId)}#comments-section`,
    config.siteUrl,
  );
  const parentSnippet = truncateText(payload.parentContent, 220);
  const replySnippet = truncateText(payload.replyContent, 240);
  const isAdminReply = payload.replyAuthorRole === "admin";
  const authorName = isAdminReply
    ? config.ownerNickname ||
      String(payload.replyAuthorName || "").trim() ||
      "站长"
    : String(payload.replyAuthorName || "").trim() || "访客";
  const authorAvatarUrl =
    payload.replyAuthorAvatarUrl ||
    buildAvatarUrl(
      authorName,
      isAdminReply ? config.ownerQq : payload.replyAuthorQq,
    );
  const selfName = String(payload.parentNickname || "").trim() || "你";
  const selfAvatarUrl =
    payload.parentAvatarUrl || buildAvatarUrl(selfName, payload.qq);
  const eyebrow = isAdminReply ? "站长回复" : "访客回复";
  const footerNote = isAdminReply
    ? "感谢造访，期待您的再次互动"
    : "互动是连接的开始，快去看看更多讨论吧";
  const summaryTitle = isAdminReply ? "收到站长回复" : "收到访客回复";
  const summaryIntro = `《${postLabel}》`;

  const result = await sendMail({
    to,
    subject: `【回复】${authorName} 回复了你的评论`,
    text: [
      `${authorName} 回复了你在《${postLabel}》下的评论。`,
      "",
      "你之前的留言：",
      parentSnippet,
      "",
      `${isAdminReply ? "站长回复" : `${authorName} 回复`}：`,
      replySnippet,
      "",
      `查看完整对话：${postUrl}`,
    ].join("\n"),
    html: renderMailShell(config, {
      preheader: `《${postLabel}》下有新回复`,
      eyebrow,
      title: summaryTitle,
      intro: summaryIntro,
      sections: [
        renderBubbleSection(
          renderMessageBubble({
            avatarUrl: selfAvatarUrl,
            name: selfName,
            content: parentSnippet,
            align: "right",
            tone: "slate",
          }),
        ),
        renderBubbleSection(
          renderMessageBubble({
            avatarUrl: authorAvatarUrl,
            name: authorName,
            badge: isAdminReply ? "站长" : "访客",
            content: replySnippet,
            tone: isAdminReply ? "blue" : "slate",
          }),
        ),
      ],
      ctaLabel: "查看完整对话",
      ctaUrl: postUrl,
      footerNote,
    }),
  });

  return result.success;
}

export async function sendNewFriendLinkApplicationNotification(
  payload: NewFriendLinkApplicationPayload,
): Promise<boolean> {
  const { config, error } = await getTransportContext();
  if (error || !config.enabled) return false;

  const to = String(config.notifyTo || "").trim();
  if (!isValidEmail(to)) return false;

  const adminUrl = buildUrl("/admin/friends", config.siteUrl);
  const applicantAvatarUrl = buildAvatarUrl(payload.name, payload.qq);

  const result = await sendMail({
    to,
    subject: `【新友链申请】${payload.name}`,
    text: [
      `收到来自 ${payload.name} 的友链申请。`,
      "",
      `网站名称：${payload.name}`,
      `网站链接：${payload.url}`,
      `网站描述：${payload.description || "无"}`,
      `联系 QQ：${payload.qq}`,
      "",
      `请前往后台审批：${adminUrl}`,
    ].join("\n"),
    html: renderMailShell(config, {
      preheader: `收到来自 ${payload.name} 的友链申请`,
      eyebrow: "新友链申请",
      title: "有新的友链申请待处理",
      intro: `${payload.name} 刚刚提交了友链申请，下面是申请信息汇总。`,
      sections: [
        renderBubbleSection(
          renderMessageBubble({
            avatarUrl: applicantAvatarUrl,
            name: payload.name,
            badge: "申请站点",
            content: payload.description || "申请者没有填写站点描述。",
            tone: "green",
          }),
        ),
        renderSection(
          renderInfoTable([
            { label: "站点名称", value: payload.name },
            {
              label: "站点链接",
              value: renderLink(payload.url, payload.url),
              isHtml: true,
            },
            { label: "联系 QQ", value: payload.qq },
            {
              label: "后台入口",
              value: renderLink("前往友链管理", adminUrl),
              isHtml: true,
            },
          ]),
        ),
      ],
      ctaLabel: "前往后台审核",
      ctaUrl: adminUrl,
      footerNote: "收到新的友链申请，请及时审阅",
    }),
  });

  return result.success;
}

export async function sendFriendLinkApprovedNotification(
  payload: FriendLinkApprovedPayload,
): Promise<boolean> {
  const { config, error } = await getTransportContext();
  if (error || !config.enabled) return false;

  const to = deriveQqEmail(payload.qq);
  if (!to) return false;

  const siteName = getSiteBrand(config);
  const myFriendsUrl = buildUrl("/friends", config.siteUrl);
  const adminAvatarUrl = buildAvatarUrl(siteName, config.ownerQq);

  const result = await sendMail({
    to,
    subject: `【友链通过】您的友链申请已通过审核 - ${siteName}`,
    text: [
      `您好，${payload.name}！`,
      `您在 ${siteName} 提交的友链申请已通过审核并成功添加。`,
      "",
      `您的网站：${payload.url}`,
      `友链页面：${myFriendsUrl}`,
      "",
      "感谢交流，欢迎常来常往。",
    ].join("\n"),
    html: renderMailShell(config, {
      preheader: `你的友链申请已通过 ${siteName} 的审核`,
      eyebrow: "友链审核通过",
      title: "你的友链申请已通过审核",
      intro: `你好，${payload.name}。你的站点已经加入 ${siteName} 的友链页面，感谢这次交换链接。`,
      sections: [
        renderBubbleSection(
          renderMessageBubble({
            avatarUrl: adminAvatarUrl,
            name: siteName,
            badge: "已通过",
            content: `已经把你的站点 ${payload.name} 收录进友链页面啦，之后也欢迎常来看看。`,
            tone: "green",
          }),
        ),
        renderSection(
          renderInfoTable([
            {
              label: "你的站点",
              value: renderLink(payload.url, payload.url),
              isHtml: true,
            },
          ]),
        ),
        renderSection(`
          <div style="margin-top:16px;margin-bottom:8px;font-size:13px;color:#64748b;font-weight:600;">本站信息 (互换)</div>
          <div style="padding:16px;background:#f8fafc;border:1px dashed #cbd5e1;border-radius:12px;">
            <table width="100%" cellpadding="0" cellspacing="0" style="border:1px solid #e2e8f0;border-radius:12px;background:#ffffff;overflow:hidden;border-collapse:separate;">
              <tr>
                <td width="64" align="center" style="padding:10px 0;background:#f8fafc;border-right:1px solid #e2e8f0;font-size:12px;font-weight:600;color:#64748b;vertical-align:middle;">名称</td>
                <td style="padding:10px 16px;font-family:ui-monospace,SFMono-Regular,Menlo,Monaco,Consolas,'Liberation Mono','Courier New',monospace;font-size:13px;color:#334155;">${config.siteTitle || "本站"}</td>
              </tr>
              <tr>
                <td width="64" align="center" style="padding:10px 0;background:#f8fafc;border-top:1px solid #e2e8f0;border-right:1px solid #e2e8f0;font-size:12px;font-weight:600;color:#64748b;vertical-align:middle;">介绍</td>
                <td style="padding:10px 16px;border-top:1px solid #e2e8f0;font-size:13px;color:#334155;line-height:1.5;">${config.siteDescription || "欢迎来到我的站点"}</td>
              </tr>
              <tr>
                <td width="64" align="center" style="padding:10px 0;background:#f8fafc;border-top:1px solid #e2e8f0;border-right:1px solid #e2e8f0;font-size:12px;font-weight:600;color:#64748b;vertical-align:middle;">网址</td>
                <td style="padding:10px 16px;border-top:1px solid #e2e8f0;font-family:ui-monospace,SFMono-Regular,Menlo,Monaco,Consolas,'Liberation Mono','Courier New',monospace;font-size:13px;color:#334155;">${config.siteUrl || "(未配置)"}</td>
              </tr>
              <tr>
                <td width="64" align="center" style="padding:10px 0;background:#f8fafc;border-top:1px solid #e2e8f0;border-right:1px solid #e2e8f0;font-size:12px;font-weight:600;color:#64748b;vertical-align:middle;">头像</td>
                <td style="padding:10px 16px;border-top:1px solid #e2e8f0;font-family:ui-monospace,SFMono-Regular,Menlo,Monaco,Consolas,'Liberation Mono','Courier New',monospace;font-size:13px;color:#334155;word-break:break-all;">${config.siteAvatar || "(未配置)"}</td>
              </tr>
            </table>
            <div style="margin-top:8px;font-size:11px;color:#94a3b8;font-weight:500;">提示：您可以直接复制上方信息添加到您的友链墙</div>
          </div>
        `),
        renderSection(
          renderInfoTable([
            {
              label: "友链页面",
              value: renderLink("查看友链墙", myFriendsUrl),
              isHtml: true,
            },
          ]),
        ),
      ],
      ctaLabel: "去看看友链墙",
      ctaUrl: myFriendsUrl,
      footerNote: "友谊长存，信息变更请随时联系",
    }),
  });

  return result.success;
}

export async function sendNewSuggestionNotification(
  payload: NewSuggestionNotificationPayload,
): Promise<boolean> {
  const config = await getResolvedMailConfig();
  if (!config.enabled) return false;

  const to = String(config.notifyTo || "").trim();
  if (!isValidEmail(to)) return false;

  const adminUrl = buildUrl("/admin/suggestions", config.siteUrl);
  const avatarUrl = buildAvatarUrl(`QQ ${payload.qq}`, payload.qq);
  const suggestionSnippet = truncateText(payload.content, 300);

  const result = await sendMail({
    to,
    subject: `【新建议】来自网站访客 (QQ: ${payload.qq})`,
    text: [
      `收到来自 QQ ${payload.qq} 的新建议。`,
      "",
      `内容：${suggestionSnippet}`,
      "",
      `后台管理：${adminUrl}`,
    ].join("\n"),
    html: renderMailShell(config, {
      preheader: `收到来自 QQ ${payload.qq} 的新建议`,
      eyebrow: "访客建议通知",
      title: "有新的访客建议待查看",
      intro:
        "访客刚刚提交了一条新的建议，你可以直接前往后台查看并决定是否回复。",
      sections: [
        renderSection(
          renderInfoTable([
            { label: "访客 QQ", value: payload.qq },
            {
              label: "后台入口",
              value: renderLink("打开建议管理", adminUrl),
              isHtml: true,
            },
          ]),
        ),
        renderBubbleSection(
          renderMessageBubble({
            avatarUrl,
            name: `QQ ${payload.qq}`,
            content: suggestionSnippet,
            tone: "slate",
          }),
        ),
      ],
      ctaLabel: "前往后台处理",
      ctaUrl: adminUrl,
      footerNote: "收到访客建议反馈，请及时处理",
    }),
  });

  return result.success;
}

export async function sendFriendLinkDeletedNotification(
  payload: FriendLinkDeletedPayload,
): Promise<boolean> {
  const { config, error } = await getTransportContext();
  if (error || !config.enabled) return false;

  const to = deriveQqEmail(payload.qq);
  if (!to) return false;

  const siteName = getSiteBrand(config);
  const adminAvatarUrl = buildAvatarUrl(siteName, config.ownerQq);

  const result = await sendMail({
    to,
    subject: `【友链变动】关于您在 ${siteName} 的链接情况`,
    text: [
      `您好，${payload.name}。`,
      `由于友链状态调整，您的站点已暂时从 ${siteName} 友链墙下线。`,
      payload.reason ? `原因：${payload.reason}` : "",
      "",
      "如果需要恢复展示，欢迎重新联系站长处理。",
    ]
      .filter(Boolean)
      .join("\n"),
    html: renderMailShell(config, {
      preheader: `关于您在 ${siteName} 的友链变动通知`,
      eyebrow: "友链下线通知",
      title: "友链状态已更新",
      intro: `你好，${payload.name}。抱歉通知您，您的站点链接因故已从 ${siteName} 暂时撤下，下面是相关说明。`,
      sections: [
        renderBubbleSection(
          renderMessageBubble({
            avatarUrl: adminAvatarUrl,
            name: siteName,
            content:
              payload.reason ||
              "当前友链状态已调整，公开展示已暂时移除。如需恢复，欢迎随时联系站长处理。",
            tone: "slate",
          }),
        ),
      ],
      footerNote: "互换友链重在连接，期待您的站点重回巅峰",
    }),
  });

  return result.success;
}

export async function sendFriendLinkUpdatedNotification(
  payload: FriendLinkUpdatedPayload,
): Promise<boolean> {
  const { config, error } = await getTransportContext();
  if (error || !config.enabled) return false;

  const to = deriveQqEmail(payload.qq);
  if (!to) return false;

  const siteName = getSiteBrand(config);
  const myFriendsUrl = buildUrl("/friends", config.siteUrl);
  const adminAvatarUrl = buildAvatarUrl(siteName, config.ownerQq);

  const result = await sendMail({
    to,
    subject: `【友链更新】您的站点信息在 ${siteName} 已同步更新`,
    text: [
      `您好，${payload.name}。`,
      `您在 ${siteName} 的友链信息已根据最新变动进行了同步更新。`,
      "",
      `查看详情：${myFriendsUrl}`,
    ].join("\n"),
    html: renderMailShell(config, {
      preheader: `您的友链信息由于变动已由 ${siteName} 同步更新`,
      eyebrow: "信息同步成功",
      title: "友链信息已更新",
      intro: `你好，${payload.name}。我们在巡检中注意到您的站点信息有变动，或者收到了您的修正请求，目前已同步至 ${siteName}。`,
      sections: [
        renderBubbleSection(
          renderMessageBubble({
            avatarUrl: adminAvatarUrl,
            name: siteName,
            badge: "已同步",
            content: "已经把您的最新站点信息更新到友链页面啦，请知悉",
            tone: "blue",
          }),
        ),
        renderSection(
          renderInfoTable([{ label: "更新对象", value: payload.name }]),
        ),
        renderSection(`
          <div style="margin-top:16px;margin-bottom:8px;font-size:13px;color:#64748b;font-weight:600;">最新本站信息</div>
          <div style="padding:16px;background:#f8fafc;border:1px dashed #cbd5e1;border-radius:12px;">
            <table width="100%" cellpadding="0" cellspacing="0" style="border:1px solid #e2e8f0;border-radius:12px;background:#ffffff;overflow:hidden;border-collapse:separate;">
              <tr>
                <td width="64" align="center" style="padding:10px 0;background:#f8fafc;border-right:1px solid #e2e8f0;font-size:12px;font-weight:600;color:#64748b;vertical-align:middle;">名称</td>
                <td style="padding:10px 16px;font-family:ui-monospace,SFMono-Regular,Menlo,Monaco,Consolas,'Liberation Mono','Courier New',monospace;font-size:13px;color:#334155;">${config.siteTitle || "本站"}</td>
              </tr>
              <tr>
                <td width="64" align="center" style="padding:10px 0;background:#f8fafc;border-top:1px solid #e2e8f0;border-right:1px solid #e2e8f0;font-size:12px;font-weight:600;color:#64748b;vertical-align:middle;">介绍</td>
                <td style="padding:10px 16px;border-top:1px solid #e2e8f0;font-size:13px;color:#334155;line-height:1.5;">${config.siteDescription || "欢迎来到我的站点"}</td>
              </tr>
              <tr>
                <td width="64" align="center" style="padding:10px 0;background:#f8fafc;border-top:1px solid #e2e8f0;border-right:1px solid #e2e8f0;font-size:12px;font-weight:600;color:#64748b;vertical-align:middle;">网址</td>
                <td style="padding:10px 16px;border-top:1px solid #e2e8f0;font-family:ui-monospace,SFMono-Regular,Menlo,Monaco,Consolas,'Liberation Mono','Courier New',monospace;font-size:13px;color:#334155;">${config.siteUrl || "(未配置)"}</td>
              </tr>
              <tr>
                <td width="64" align="center" style="padding:10px 0;background:#f8fafc;border-top:1px solid #e2e8f0;border-right:1px solid #e2e8f0;font-size:12px;font-weight:600;color:#64748b;vertical-align:middle;">头像</td>
                <td style="padding:10px 16px;border-top:1px solid #e2e8f0;font-family:ui-monospace,SFMono-Regular,Menlo,Monaco,Consolas,'Liberation Mono','Courier New',monospace;font-size:13px;color:#334155;word-break:break-all;">${config.siteAvatar || "(未配置)"}</td>
              </tr>
            </table>
          </div>
        `),
        renderSection(
          renderInfoTable([
            {
              label: "友链入口",
              value: renderLink("查看友链墙", myFriendsUrl),
              isHtml: true,
            },
          ]),
        ),
      ],
      ctaLabel: "去看看变动",
      ctaUrl: myFriendsUrl,
      footerNote: "信息同步旨在维护更好的互联体验",
    }),
  });

  return result.success;
}

export async function sendSuggestionReplyNotification(
  payload: SuggestionReplyPayload,
): Promise<boolean> {
  const { config, error } = await getTransportContext();
  if (error || !config.enabled) return false;

  const to = deriveQqEmail(payload.qq);
  if (!to) return false;

  const siteName = getSiteBrand(config);
  const adminAvatarUrl = buildAvatarUrl(siteName, config.ownerQq);
  const suggestionSnippet = truncateText(payload.suggestionContent, 260);
  const replySnippet = truncateText(payload.adminReply, 300);
  const siteUrl = config.siteUrl || "";

  const result = await sendMail({
    to,
    subject: `【回复】关于您在 ${siteName} 提交的建议`,
    text: [
      `您好，感谢您在 ${siteName} 提交建议。`,
      "",
      "您的建议：",
      suggestionSnippet,
      "",
      "站长回复：",
      replySnippet,
      "",
      siteUrl ? `站点地址：${siteUrl}` : "",
    ]
      .filter(Boolean)
      .join("\n"),
    html: renderMailShell(config, {
      preheader: `关于你在 ${siteName} 提交建议的回复`,
      eyebrow: "建议回复通知",
      title: "站长已经回复了你的建议",
      intro: `感谢你对 ${siteName} 的关注和反馈，下面是你提交的建议以及站长的回复内容。`,
      sections: [
        renderSection(
          renderQuoteBlock("你的建议", suggestionSnippet, "#38bdf8"),
        ),
        renderBubbleSection(
          renderMessageBubble({
            avatarUrl: adminAvatarUrl,
            name: siteName,
            badge: "站长回复",
            content: replySnippet,
            tone: "blue",
          }),
        ),
      ],
      ctaLabel: /^https?:\/\//i.test(siteUrl) ? "回到站点看看" : undefined,
      ctaUrl: /^https?:\/\//i.test(siteUrl) ? siteUrl : undefined,
      footerNote: "感谢反馈，您的参与让这里更美好",
    }),
  });

  return result.success;
}
