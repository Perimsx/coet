import "server-only";

import { promises as fs } from "fs";
import path from "path";

export interface MailSettings {
  enabled: boolean;
  provider: string;
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
  updatedAt?: string;
}

export type MailPasswordSource = "env" | "file" | "missing";

export interface MailSettingsSafe extends Omit<MailSettings, "pass"> {
  hasPassword: boolean;
  passwordSource: MailPasswordSource;
  passwordEnvKey: string;
}

const settingsFilePath = path.join(
  process.cwd(),
  "storage",
  "settings",
  "mail-settings.json",
);

export const SMTP_PASSWORD_ENV_KEY = "SMTP_PASS";

const DEFAULT_SETTINGS: MailSettings = {
  enabled: false,
  provider: "qq",
  host: "smtp.qq.com",
  port: 465,
  secure: true,
  user: "",
  pass: "",
  from: "",
  notifyTo: "",
  siteUrl: "",
  ownerQq: "",
  ownerNickname: "",
};

function normalizeText(value: unknown, max = 300): string {
  if (typeof value !== "string") return "";
  return value.trim().slice(0, max);
}

function normalizePort(value: unknown): number {
  const parsed = Number.parseInt(String(value ?? "").trim(), 10);
  if (Number.isFinite(parsed) && parsed > 0 && parsed <= 65535) return parsed;
  return DEFAULT_SETTINGS.port;
}

function normalizeBool(value: unknown, fallback = false): boolean {
  if (typeof value === "boolean") return value;

  const raw = String(value ?? "")
    .trim()
    .toLowerCase();
  if (!raw) return fallback;

  return ["1", "true", "yes", "on"].includes(raw);
}

function normalizeConfig(
  input: Partial<MailSettings> | null | undefined,
): MailSettings {
  const source = input || {};

  return {
    enabled: normalizeBool(source.enabled, DEFAULT_SETTINGS.enabled),
    provider: normalizeText(source.provider, 20) || DEFAULT_SETTINGS.provider,
    host: normalizeText(source.host, 120) || DEFAULT_SETTINGS.host,
    port: normalizePort(source.port),
    secure: normalizeBool(source.secure, DEFAULT_SETTINGS.secure),
    user: normalizeText(source.user, 120),
    pass: normalizeText(source.pass, 120),
    from: normalizeText(source.from, 200),
    notifyTo: normalizeText(source.notifyTo, 120),
    siteUrl: normalizeText(source.siteUrl, 200).replace(/\/+$/g, ""),
    ownerQq: normalizeText(source.ownerQq, 20),
    ownerNickname: normalizeText(source.ownerNickname, 60),
    updatedAt: normalizeText(source.updatedAt, 40) || undefined,
  };
}

function getEnvPassword(): string {
  return normalizeText(process.env[SMTP_PASSWORD_ENV_KEY], 120);
}

function getPasswordSource(filePassword: string): MailPasswordSource {
  if (getEnvPassword()) return "env";
  if (filePassword) return "file";
  return "missing";
}

async function readStoredMailSettings(): Promise<MailSettings> {
  try {
    const raw = await fs.readFile(settingsFilePath, "utf8");
    const parsed = JSON.parse(raw) as Partial<MailSettings>;
    return normalizeConfig(parsed);
  } catch {
    return { ...DEFAULT_SETTINGS };
  }
}

function mergeRuntimePassword(config: MailSettings): MailSettings {
  const envPassword = getEnvPassword();
  return {
    ...config,
    pass: envPassword || config.pass,
  };
}

export async function getMailSettings(): Promise<MailSettings> {
  const stored = await readStoredMailSettings();
  return mergeRuntimePassword(stored);
}

export function toSafeMailSettings(config: MailSettings): MailSettingsSafe {
  const passwordSource = getPasswordSource(normalizeText(config.pass, 120));

  return {
    enabled: config.enabled,
    provider: config.provider,
    host: config.host,
    port: config.port,
    secure: config.secure,
    user: config.user,
    from: config.from,
    notifyTo: config.notifyTo,
    siteUrl: config.siteUrl,
    ownerQq: config.ownerQq,
    ownerNickname: config.ownerNickname,
    updatedAt: config.updatedAt,
    hasPassword: passwordSource !== "missing",
    passwordSource,
    passwordEnvKey: SMTP_PASSWORD_ENV_KEY,
  };
}

export async function getMailSettingsSafe(): Promise<MailSettingsSafe> {
  const stored = await readStoredMailSettings();
  return toSafeMailSettings(mergeRuntimePassword(stored));
}

export async function saveMailSettings(
  input: Partial<MailSettings>,
): Promise<MailSettings> {
  const existing = await readStoredMailSettings();
  const merged = normalizeConfig({
    ...existing,
    ...input,
    pass: "",
    updatedAt: new Date().toISOString(),
  });

  const persisted: Omit<MailSettings, "pass"> = {
    enabled: merged.enabled,
    provider: merged.provider,
    host: merged.host,
    port: merged.port,
    secure: merged.secure,
    user: merged.user,
    from: merged.from,
    notifyTo: merged.notifyTo,
    siteUrl: merged.siteUrl,
    ownerQq: merged.ownerQq,
    ownerNickname: merged.ownerNickname,
    updatedAt: merged.updatedAt,
  };
  const dir = path.dirname(settingsFilePath);

  await fs.mkdir(dir, { recursive: true });
  await fs.writeFile(
    settingsFilePath,
    `${JSON.stringify(persisted, null, 2)}\n`,
    "utf8",
  );

  return mergeRuntimePassword({ ...persisted, pass: "" });
}
