import crypto from 'crypto'
import { and, desc, eq, gt, isNull } from 'drizzle-orm'
import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import { db } from '@/server/db'
import {
  adminLoginAttempts,
  adminRefreshTokens,
  adminSecurityEvents,
  type AdminSecurityEventType,
  type AdminSessionDevice,
} from '@/server/db/schema'
import { getAdminRequestContext } from '@/features/admin/lib/request-context'
import { getAdminLoginPath } from '@/features/admin/lib/routes'

const ADMIN_ACCESS_COOKIE_NAME = 'admin_access_token'
const ADMIN_REFRESH_COOKIE_NAME = 'admin_refresh_token'
const ACCESS_TOKEN_LIFETIME_MS = 1000 * 60 * 20
const REFRESH_TOKEN_LIFETIME_MS = 1000 * 60 * 60 * 24 * 14
const LOGIN_RATE_LIMIT_WINDOW_MS = 1000 * 60 * 15
const LOGIN_RATE_LIMIT_MAX_FAILURES = 5
const LOGIN_RATE_LIMIT_BLOCK_MS = 1000 * 60 * 15
const DEV_BYPASS_USERNAME = 'Admin'

type JwtTokenKind = 'access' | 'refresh'

type AdminJwtPayload = {
  sub: number
  username: string
  sid: string
  jti: string
  type: JwtTokenKind
  iat: number
  exp: number
}

export type AdminSession = {
  userId: number
  username: string
  sessionId: string
  exp: number
  issuedAt: number
}

export type AdminSessionSnapshot = {
  currentIp: string
  currentDevice: AdminSessionDevice
  lastLoginAt: string | null
  lastLoginIp: string | null
  activeSessionCount: number
}

function isTruthy(value: string | undefined) {
  if (!value) return false
  return value === '1' || value.toLowerCase() === 'true' || value.toLowerCase() === 'yes'
}

function isFalsy(value: string | undefined) {
  if (!value) return false
  return value === '0' || value.toLowerCase() === 'false' || value.toLowerCase() === 'no'
}

export function isAdminAuthBypassed() {
  const flag = process.env.ADMIN_BYPASS_LOGIN
  if (isTruthy(flag)) return true
  if (isFalsy(flag)) return false
  return false
}

function getSessionSecret() {
  return process.env.ADMIN_SESSION_SECRET ?? 'change-this-admin-session-secret'
}

function base64UrlEncode(value: string) {
  return Buffer.from(value).toString('base64url')
}

function base64UrlDecode(value: string) {
  return Buffer.from(value, 'base64url').toString('utf8')
}

function createJwtSignature(unsignedToken: string) {
  return crypto.createHmac('sha256', getSessionSecret()).update(unsignedToken).digest('base64url')
}

function encodeJwt(payload: AdminJwtPayload) {
  const header = base64UrlEncode(JSON.stringify({ alg: 'HS256', typ: 'JWT' }))
  const body = base64UrlEncode(JSON.stringify(payload))
  const unsignedToken = `${header}.${body}`
  return `${unsignedToken}.${createJwtSignature(unsignedToken)}`
}

function decodeJwt(token: string, expectedType: JwtTokenKind) {
  const [header, body, signature] = token.split('.')
  if (!header || !body || !signature) return null

  const unsignedToken = `${header}.${body}`
  const expectedSignature = createJwtSignature(unsignedToken)
  const signatureBuffer = Buffer.from(signature)
  const expectedBuffer = Buffer.from(expectedSignature)

  if (signatureBuffer.length !== expectedBuffer.length) {
    return null
  }

  if (!crypto.timingSafeEqual(signatureBuffer, expectedBuffer)) {
    return null
  }

  try {
    const payload = JSON.parse(base64UrlDecode(body)) as AdminJwtPayload
    if (payload.type !== expectedType) return null
    if (payload.exp <= Date.now()) return null
    return payload
  } catch {
    return null
  }
}

function hashRefreshToken(token: string) {
  return crypto.createHash('sha256').update(token).digest('hex')
}

function createTokenPayload(input: {
  userId: number
  username: string
  sessionId: string
  type: JwtTokenKind
  expiresInMs: number
}) {
  const issuedAt = Date.now()
  return {
    sub: input.userId,
    username: input.username,
    sid: input.sessionId,
    jti: crypto.randomUUID(),
    type: input.type,
    iat: issuedAt,
    exp: issuedAt + input.expiresInMs,
  } satisfies AdminJwtPayload
}

async function clearAuthCookies() {
  const cookieStore = await cookies()

  for (const name of [ADMIN_ACCESS_COOKIE_NAME, ADMIN_REFRESH_COOKIE_NAME]) {
    cookieStore.set(name, '', {
      httpOnly: true,
      sameSite: 'lax',
      secure: process.env.NODE_ENV === 'production',
      path: '/',
      expires: new Date(0),
    })
  }
}

async function writeAuthCookies(accessToken: string, accessExp: number, refreshToken: string, refreshExp: number) {
  const cookieStore = await cookies()

  cookieStore.set(ADMIN_ACCESS_COOKIE_NAME, accessToken, {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    expires: new Date(accessExp),
  })

  cookieStore.set(ADMIN_REFRESH_COOKIE_NAME, refreshToken, {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    expires: new Date(refreshExp),
  })
}

async function readCookieToken(name: string) {
  const cookieStore = await cookies()
  return cookieStore.get(name)?.value || null
}

async function recordSecurityEvent(input: {
  userId?: number | null
  type: AdminSecurityEventType
  ipAddress?: string | null
  userAgent?: string | null
  detail?: string
}) {
  db.insert(adminSecurityEvents)
    .values({
      userId: input.userId ?? null,
      type: input.type,
      ipAddress: input.ipAddress ?? null,
      userAgent: input.userAgent ?? null,
      detail: input.detail?.slice(0, 1000) || null,
      createdAt: new Date(),
    })
    .run()
}

function buildAttemptKey(username: string, ipAddress: string) {
  return `${username.toLowerCase()}::${ipAddress}`
}

export async function getAdminLoginRateLimit(username: string) {
  const context = await getAdminRequestContext()
  const attemptKey = buildAttemptKey(username, context.ipAddress)
  const current = db
    .select()
    .from(adminLoginAttempts)
    .where(eq(adminLoginAttempts.attemptKey, attemptKey))
    .get()

  const now = Date.now()
  if (!current?.blockedUntil || current.blockedUntil.getTime() <= now) {
    return { blocked: false as const, retryAfterMs: 0, ipAddress: context.ipAddress }
  }

  return {
    blocked: true as const,
    retryAfterMs: current.blockedUntil.getTime() - now,
    ipAddress: context.ipAddress,
  }
}

export async function registerAdminLoginFailure(username: string) {
  const context = await getAdminRequestContext()
  const attemptKey = buildAttemptKey(username, context.ipAddress)
  const now = new Date()
  const existing = db
    .select()
    .from(adminLoginAttempts)
    .where(eq(adminLoginAttempts.attemptKey, attemptKey))
    .get()

  const shouldResetWindow =
    !existing?.firstFailedAt ||
    now.getTime() - existing.firstFailedAt.getTime() > LOGIN_RATE_LIMIT_WINDOW_MS

  const nextFailCount = shouldResetWindow ? 1 : (existing?.failCount ?? 0) + 1
  const blockedUntil =
    nextFailCount >= LOGIN_RATE_LIMIT_MAX_FAILURES
      ? new Date(now.getTime() + LOGIN_RATE_LIMIT_BLOCK_MS)
      : null

  if (existing) {
    db.update(adminLoginAttempts)
      .set({
        failCount: nextFailCount,
        firstFailedAt: shouldResetWindow ? now : existing.firstFailedAt,
        lastFailedAt: now,
        blockedUntil,
      })
      .where(eq(adminLoginAttempts.id, existing.id))
      .run()
  } else {
    db.insert(adminLoginAttempts)
      .values({
        attemptKey,
        username,
        ipAddress: context.ipAddress,
        failCount: nextFailCount,
        firstFailedAt: now,
        lastFailedAt: now,
        blockedUntil,
      })
      .run()
  }

  await recordSecurityEvent({
    type: blockedUntil ? 'login_rate_limited' : 'login_failed',
    ipAddress: context.ipAddress,
    userAgent: context.userAgent,
    detail: `${username}${blockedUntil ? ' blocked' : ' failed'}`,
  })
}

export async function registerAdminLoginSuccess(input: { userId: number; username: string; sessionId: string }) {
  const context = await getAdminRequestContext()
  const attemptKey = buildAttemptKey(input.username, context.ipAddress)
  const existingAttempt = db
    .select()
    .from(adminLoginAttempts)
    .where(eq(adminLoginAttempts.attemptKey, attemptKey))
    .get()

  if (existingAttempt) {
    db.update(adminLoginAttempts)
      .set({
        failCount: 0,
        firstFailedAt: null,
        lastFailedAt: null,
        blockedUntil: null,
        lastSuccessAt: new Date(),
      })
      .where(eq(adminLoginAttempts.id, existingAttempt.id))
      .run()
  }

  const previousSuccess = db
    .select()
    .from(adminSecurityEvents)
    .where(and(eq(adminSecurityEvents.userId, input.userId), eq(adminSecurityEvents.type, 'login_success')))
    .orderBy(desc(adminSecurityEvents.createdAt))
    .get()

  await recordSecurityEvent({
    userId: input.userId,
    type: 'login_success',
    ipAddress: context.ipAddress,
    userAgent: context.userAgent,
    detail: `session=${input.sessionId};device=${context.device}`,
  })

  if (previousSuccess?.ipAddress && previousSuccess.ipAddress !== context.ipAddress) {
    await recordSecurityEvent({
      userId: input.userId,
      type: 'login_new_ip',
      ipAddress: context.ipAddress,
      userAgent: context.userAgent,
      detail: `previous=${previousSuccess.ipAddress}`,
    })
  }
}

function toAdminSession(payload: AdminJwtPayload): AdminSession {
  return {
    userId: payload.sub,
    username: payload.username,
    sessionId: payload.sid,
    exp: payload.exp,
    issuedAt: payload.iat,
  }
}

async function revokeRefreshTokenRecord(token: string, reason: string) {
  const tokenHash = hashRefreshToken(token)
  const existing = db
    .select()
    .from(adminRefreshTokens)
    .where(eq(adminRefreshTokens.tokenHash, tokenHash))
    .get()

  if (!existing || existing.revokedAt) return existing

  db.update(adminRefreshTokens)
    .set({
      revokedAt: new Date(),
      revokedReason: reason,
    })
    .where(eq(adminRefreshTokens.id, existing.id))
    .run()

  return existing
}

async function issueAdminTokens(input: {
  userId: number
  username: string
  sessionId?: string
  rotateFromToken?: string | null
}) {
  const context = await getAdminRequestContext()
  const sessionId = input.sessionId || crypto.randomUUID()
  const accessPayload = createTokenPayload({
    userId: input.userId,
    username: input.username,
    sessionId,
    type: 'access',
    expiresInMs: ACCESS_TOKEN_LIFETIME_MS,
  })
  const refreshPayload = createTokenPayload({
    userId: input.userId,
    username: input.username,
    sessionId,
    type: 'refresh',
    expiresInMs: REFRESH_TOKEN_LIFETIME_MS,
  })

  const accessToken = encodeJwt(accessPayload)
  const refreshToken = encodeJwt(refreshPayload)

  if (input.rotateFromToken) {
    await revokeRefreshTokenRecord(input.rotateFromToken, 'rotated')
  }

  db.insert(adminRefreshTokens)
    .values({
      userId: input.userId,
      sessionId,
      tokenHash: hashRefreshToken(refreshToken),
      device: context.device,
      ipAddress: context.ipAddress,
      userAgent: context.userAgent,
      expiresAt: new Date(refreshPayload.exp),
      lastUsedAt: new Date(),
      createdAt: new Date(),
    })
    .run()

  await writeAuthCookies(accessToken, accessPayload.exp, refreshToken, refreshPayload.exp)

  return {
    session: toAdminSession(accessPayload),
    refreshToken,
  }
}

export async function getAdminSession() {
  if (isAdminAuthBypassed()) {
    return {
      userId: 0,
      username: DEV_BYPASS_USERNAME,
      sessionId: 'dev-bypass',
      exp: Number.MAX_SAFE_INTEGER,
      issuedAt: 0,
    } satisfies AdminSession
  }

  const token = await readCookieToken(ADMIN_ACCESS_COOKIE_NAME)
  if (!token) {
    return null
  }

  const payload = decodeJwt(token, 'access')
  return payload ? toAdminSession(payload) : null
}

export async function createAdminSession(input: { id: number; username: string }) {
  if (isAdminAuthBypassed()) {
    return {
      userId: 0,
      username: DEV_BYPASS_USERNAME,
      sessionId: 'dev-bypass',
      exp: Number.MAX_SAFE_INTEGER,
      issuedAt: 0,
    } satisfies AdminSession
  }

  const { session } = await issueAdminTokens({
    userId: input.id,
    username: input.username,
  })

  await registerAdminLoginSuccess({
    userId: input.id,
    username: input.username,
    sessionId: session.sessionId,
  })

  return session
}

export async function refreshAdminSession() {
  if (isAdminAuthBypassed()) {
    return {
      userId: 0,
      username: DEV_BYPASS_USERNAME,
      sessionId: 'dev-bypass',
      exp: Number.MAX_SAFE_INTEGER,
      issuedAt: 0,
    } satisfies AdminSession
  }

  const refreshToken = await readCookieToken(ADMIN_REFRESH_COOKIE_NAME)
  if (!refreshToken) {
    return null
  }

  const payload = decodeJwt(refreshToken, 'refresh')
  if (!payload) {
    await clearAuthCookies()
    return null
  }

  const tokenHash = hashRefreshToken(refreshToken)
  const tokenRecord = db
    .select()
    .from(adminRefreshTokens)
    .where(
      and(
        eq(adminRefreshTokens.tokenHash, tokenHash),
        isNull(adminRefreshTokens.revokedAt),
        gt(adminRefreshTokens.expiresAt, new Date())
      )
    )
    .get()

  if (!tokenRecord || tokenRecord.userId !== payload.sub || tokenRecord.sessionId !== payload.sid) {
    await clearAuthCookies()
    return null
  }

  const { session } = await issueAdminTokens({
    userId: payload.sub,
    username: payload.username,
    sessionId: payload.sid,
    rotateFromToken: refreshToken,
  })

  db.update(adminRefreshTokens)
    .set({ lastUsedAt: new Date() })
    .where(eq(adminRefreshTokens.id, tokenRecord.id))
    .run()

  const context = await getAdminRequestContext()
  await recordSecurityEvent({
    userId: payload.sub,
    type: 'token_refreshed',
    ipAddress: context.ipAddress,
    userAgent: context.userAgent,
    detail: `session=${payload.sid}`,
  })

  return session
}

export async function clearAdminSession() {
  if (isAdminAuthBypassed()) {
    return
  }

  const [accessToken, refreshToken] = await Promise.all([
    readCookieToken(ADMIN_ACCESS_COOKIE_NAME),
    readCookieToken(ADMIN_REFRESH_COOKIE_NAME),
  ])

  const accessPayload = accessToken ? decodeJwt(accessToken, 'access') : null
  const refreshPayload = refreshToken ? decodeJwt(refreshToken, 'refresh') : null
  const context = await getAdminRequestContext()

  if (refreshToken) {
    await revokeRefreshTokenRecord(refreshToken, 'logout')
  }

  await clearAuthCookies()

  await recordSecurityEvent({
    userId: accessPayload?.sub ?? refreshPayload?.sub ?? null,
    type: 'logout',
    ipAddress: context.ipAddress,
    userAgent: context.userAgent,
    detail: accessPayload?.sid || refreshPayload?.sid || 'unknown-session',
  })
}

export async function revokeAllAdminSessions(userId: number) {
  if (isAdminAuthBypassed()) {
    return
  }

  db.update(adminRefreshTokens)
    .set({
      revokedAt: new Date(),
      revokedReason: 'logout_all',
    })
    .where(and(eq(adminRefreshTokens.userId, userId), isNull(adminRefreshTokens.revokedAt)))
    .run()

  const context = await getAdminRequestContext()
  await recordSecurityEvent({
    userId,
    type: 'logout_all',
    ipAddress: context.ipAddress,
    userAgent: context.userAgent,
  })
}

export async function getAdminSessionSnapshot(session: AdminSession): Promise<AdminSessionSnapshot> {
  const context = await getAdminRequestContext()
  const lastLogin = db
    .select()
    .from(adminSecurityEvents)
    .where(and(eq(adminSecurityEvents.userId, session.userId), eq(adminSecurityEvents.type, 'login_success')))
    .orderBy(desc(adminSecurityEvents.createdAt))
    .get()

  const activeSessions = db
    .select()
    .from(adminRefreshTokens)
    .where(
      and(
        eq(adminRefreshTokens.userId, session.userId),
        isNull(adminRefreshTokens.revokedAt),
        gt(adminRefreshTokens.expiresAt, new Date())
      )
    )
    .all()

  const sessionRecord = activeSessions.find((item) => item.sessionId === session.sessionId)

  return {
    currentIp: context.ipAddress,
    currentDevice: sessionRecord?.device ?? context.device,
    lastLoginAt: lastLogin?.createdAt ? lastLogin.createdAt.toISOString() : null,
    lastLoginIp: lastLogin?.ipAddress || null,
    activeSessionCount: activeSessions.length,
  }
}

export async function requireAdminSession() {
  const session = await getAdminSession()
  if (!session) {
    redirect(getAdminLoginPath())
  }
  return session
}
