import { headers } from 'next/headers'
import type { AdminSessionDevice } from '@/server/db/schema'

export type AdminRequestContext = {
  ipAddress: string
  userAgent: string
  device: AdminSessionDevice
}

function normalizeIp(raw?: string | null) {
  if (!raw) return 'unknown'

  const value = raw.split(',')[0]?.trim() || ''
  if (!value) return 'unknown'

  return value.slice(0, 128)
}

export function detectAdminSessionDevice(userAgent: string): AdminSessionDevice {
  const normalized = userAgent.toLowerCase()

  if (!normalized) return 'unknown'
  if (/bot|spider|crawler|curl|wget|python|postman/.test(normalized)) return 'bot'
  if (/ipad|tablet/.test(normalized)) return 'tablet'
  if (/mobile|iphone|android/.test(normalized)) return 'mobile'
  if (/windows|macintosh|linux|x11/.test(normalized)) return 'desktop'
  return 'unknown'
}

export async function getAdminRequestContext(): Promise<AdminRequestContext> {
  const headerStore = await headers()
  const userAgent = headerStore.get('user-agent')?.slice(0, 512) || 'unknown'
  const ipAddress = normalizeIp(
    headerStore.get('x-admin-client-ip') ||
      headerStore.get('x-forwarded-for') ||
      headerStore.get('x-real-ip')
  )

  return {
    ipAddress,
    userAgent,
    device: detectAdminSessionDevice(userAgent),
  }
}
