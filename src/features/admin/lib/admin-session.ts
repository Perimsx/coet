import crypto from 'crypto'
import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import { ADMIN_LOGIN_PATH } from '@/features/admin/lib/routes'

const ADMIN_COOKIE_NAME = 'admin_session'
const SESSION_DURATION_MS = 1000 * 60 * 60 * 24 * 7
const DEV_BYPASS_USERNAME = 'Admin'

export type AdminSession = {
  userId: number
  username: string
  exp: number
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

function sign(payloadBase64: string) {
  return crypto.createHmac('sha256', getSessionSecret()).update(payloadBase64).digest('base64url')
}

function encodeSession(session: AdminSession) {
  const payloadBase64 = Buffer.from(JSON.stringify(session)).toString('base64url')
  const signature = sign(payloadBase64)
  return `${payloadBase64}.${signature}`
}

function decodeSession(token: string): AdminSession | null {
  const [payloadBase64, signature] = token.split('.')
  if (!payloadBase64 || !signature) {
    return null
  }

  const expectedSignature = sign(payloadBase64)
  const signatureBuffer = Buffer.from(signature)
  const expectedSignatureBuffer = Buffer.from(expectedSignature)

  if (signatureBuffer.length !== expectedSignatureBuffer.length) {
    return null
  }

  const validSignature = crypto.timingSafeEqual(signatureBuffer, expectedSignatureBuffer)

  if (!validSignature) {
    return null
  }

  try {
    const payload = JSON.parse(
      Buffer.from(payloadBase64, 'base64url').toString('utf8')
    ) as AdminSession
    if (payload.exp <= Date.now()) {
      return null
    }
    return payload
  } catch {
    return null
  }
}

export async function getAdminSession() {
  if (isAdminAuthBypassed()) {
    return {
      userId: 0,
      username: DEV_BYPASS_USERNAME,
      exp: Number.MAX_SAFE_INTEGER,
    } satisfies AdminSession
  }

  const cookieStore = await cookies()
  const token = cookieStore.get(ADMIN_COOKIE_NAME)?.value
  if (!token) {
    return null
  }
  return decodeSession(token)
}

export async function createAdminSession(input: { id: number; username: string }) {
  if (isAdminAuthBypassed()) {
    return
  }

  const exp = Date.now() + SESSION_DURATION_MS
  const session: AdminSession = {
    userId: input.id,
    username: input.username,
    exp,
  }

  const token = encodeSession(session)
  const cookieStore = await cookies()

  cookieStore.set(ADMIN_COOKIE_NAME, token, {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    expires: new Date(exp),
  })
}

export async function clearAdminSession() {
  if (isAdminAuthBypassed()) {
    return
  }

  const cookieStore = await cookies()
  cookieStore.set(ADMIN_COOKIE_NAME, '', {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    expires: new Date(0),
  })
  cookieStore.set(ADMIN_COOKIE_NAME, '', {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/admin',
    expires: new Date(0),
  })
}

export async function requireAdminSession() {
  const session = await getAdminSession()
  if (!session) {
    redirect(ADMIN_LOGIN_PATH)
  }
  return session
}
