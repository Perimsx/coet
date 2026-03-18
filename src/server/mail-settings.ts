import 'server-only'

import { promises as fs } from 'fs'
import path from 'path'

// 邮件配置接口
export interface MailSettings {
  enabled: boolean
  provider: string
  host: string
  port: number
  secure: boolean
  user: string
  pass: string
  from: string
  notifyTo: string
  siteUrl: string
  ownerQq: string
  ownerNickname: string
  updatedAt?: string
}

// 安全版本（不含密码）
export interface MailSettingsSafe extends Omit<MailSettings, 'pass'> {
  hasPassword: boolean
}

const settingsFilePath = path.join(process.cwd(), 'storage', 'settings', 'mail-settings.json')

// 默认配置
const DEFAULT_SETTINGS: MailSettings = {
  enabled: false,
  provider: 'qq',
  host: 'smtp.qq.com',
  port: 465,
  secure: true,
  user: '',
  pass: '',
  from: '',
  notifyTo: '',
  siteUrl: '',
  ownerQq: '',
  ownerNickname: '',
}

function normalizeText(value: unknown, max = 300): string {
  if (typeof value !== 'string') return ''
  return value.trim().slice(0, max)
}

function normalizePort(value: unknown): number {
  const parsed = Number.parseInt(String(value ?? '').trim(), 10)
  if (Number.isFinite(parsed) && parsed > 0 && parsed <= 65535) return parsed
  return DEFAULT_SETTINGS.port
}

function normalizeBool(value: unknown, fallback = false): boolean {
  if (typeof value === 'boolean') return value
  const raw = String(value ?? '').trim().toLowerCase()
  if (!raw) return fallback
  return ['1', 'true', 'yes', 'on'].includes(raw)
}

function normalizeConfig(input: Partial<MailSettings> | null | undefined): MailSettings {
  const source = input || {}
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
    siteUrl: normalizeText(source.siteUrl, 200).replace(/\/+$/g, ''),
    ownerQq: normalizeText(source.ownerQq, 20),
    ownerNickname: normalizeText(source.ownerNickname, 60),
    updatedAt: normalizeText(source.updatedAt, 40) || undefined,
  }
}

// 读取完整邮件配置（含密码，仅服务端使用）
export async function getMailSettings(): Promise<MailSettings> {
  try {
    const raw = await fs.readFile(settingsFilePath, 'utf8')
    const parsed = JSON.parse(raw) as Partial<MailSettings>
    return normalizeConfig(parsed)
  } catch {
    return { ...DEFAULT_SETTINGS }
  }
}

// 转为安全版本（不含密码，可返回前端）
export function toSafeMailSettings(config: MailSettings): MailSettingsSafe {
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
    hasPassword: Boolean(config.pass),
  }
}

// 读取安全版本配置
export async function getMailSettingsSafe(): Promise<MailSettingsSafe> {
  return toSafeMailSettings(await getMailSettings())
}

// 保存邮件配置
export async function saveMailSettings(
  input: Partial<MailSettings>,
  options: { keepExistingPassword?: boolean } = {}
): Promise<MailSettings> {
  const existing = await getMailSettings()
  const shouldKeepPassword = options.keepExistingPassword !== false

  // 处理密码：如果前端没传密码，保留现有密码
  let nextPass = existing.pass
  if (Object.prototype.hasOwnProperty.call(input, 'pass')) {
    const incomingPass = normalizeText(input.pass, 120)
    nextPass = incomingPass || (shouldKeepPassword ? existing.pass : '')
  }

  const merged = normalizeConfig({
    ...existing,
    ...input,
    pass: nextPass,
    updatedAt: new Date().toISOString(),
  })

  // 确保目录存在
  const dir = path.dirname(settingsFilePath)
  await fs.mkdir(dir, { recursive: true })
  await fs.writeFile(settingsFilePath, `${JSON.stringify(merged, null, 2)}\n`, 'utf8')

  return merged
}
