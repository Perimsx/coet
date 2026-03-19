import { NextResponse } from 'next/server'
import {
  clearAdminSession,
  getAdminSession,
  revokeAllAdminSessions,
} from '@/features/admin/lib/admin-session'

export async function POST() {
  const session = await getAdminSession()
  if (!session) {
    return NextResponse.json({ ok: false, error: 'UNAUTHORIZED' }, { status: 401 })
  }

  await revokeAllAdminSessions(session.userId)
  await clearAdminSession()

  return NextResponse.json({
    ok: true,
  })
}
