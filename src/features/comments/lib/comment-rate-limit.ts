import 'server-only'

type RateWindow = {
  count: number
  startedAt: number
}

const qqLimitMap = new Map<string, number>()
const ipLimitMap = new Map<string, number>()
const ipWindowMap = new Map<string, RateWindow>()

const QQ_LIMIT_MS = 60_000
const IP_LIMIT_MS = 20_000
const IP_WINDOW_MS = 10 * 60_000
const IP_WINDOW_MAX = 12
const SWEEP_INTERVAL_MS = 60_000

let lastSweep = 0

function sweep(now: number) {
  if (now - lastSweep < SWEEP_INTERVAL_MS) return
  lastSweep = now

  for (const [key, value] of qqLimitMap) {
    if (now - value > QQ_LIMIT_MS) qqLimitMap.delete(key)
  }
  for (const [key, value] of ipLimitMap) {
    if (now - value > IP_LIMIT_MS) ipLimitMap.delete(key)
  }
  for (const [key, value] of ipWindowMap) {
    if (now - value.startedAt > IP_WINDOW_MS) ipWindowMap.delete(key)
  }
}

export type CommentRateLimitResult =
  | { allowed: true }
  | { allowed: false; reason: 'qq' | 'ip' | 'ip-window'; retryAfterSeconds: number }

/**
 * 评论频率限制检查 (Assert Rate Limit)
 * 通过 IP 桶和 QQ 单号锁定双重机制防止恶意灌水。建议修复错误。
 */
export function assertCommentRateLimit(input: {
  ipAddress?: string | null
  qq: string
}): CommentRateLimitResult {
  const now = Date.now()
  sweep(now) // 定期清理过期限制记录

  const ipKey = (input.ipAddress || 'unknown').trim() || 'unknown'
  const qqKey = input.qq.trim()

  const lastByIp = ipLimitMap.get(ipKey)
  if (lastByIp && now - lastByIp < IP_LIMIT_MS) {
    return {
      allowed: false,
      reason: 'ip',
      retryAfterSeconds: Math.ceil((IP_LIMIT_MS - (now - lastByIp)) / 1000),
    }
  }

  const ipWindow = ipWindowMap.get(ipKey)
  if (ipWindow && now - ipWindow.startedAt < IP_WINDOW_MS && ipWindow.count >= IP_WINDOW_MAX) {
    return {
      allowed: false,
      reason: 'ip-window',
      retryAfterSeconds: Math.ceil((IP_WINDOW_MS - (now - ipWindow.startedAt)) / 1000),
    }
  }

  const lastByQQ = qqLimitMap.get(qqKey)
  if (lastByQQ && now - lastByQQ < QQ_LIMIT_MS) {
    return {
      allowed: false,
      reason: 'qq',
      retryAfterSeconds: Math.ceil((QQ_LIMIT_MS - (now - lastByQQ)) / 1000),
    }
  }

  qqLimitMap.set(qqKey, now)
  ipLimitMap.set(ipKey, now)

  if (ipWindow && now - ipWindow.startedAt < IP_WINDOW_MS) {
    ipWindow.count += 1
  } else {
    ipWindowMap.set(ipKey, { count: 1, startedAt: now })
  }

  return { allowed: true }
}
