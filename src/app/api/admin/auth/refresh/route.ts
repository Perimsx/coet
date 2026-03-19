import { NextResponse } from 'next/server'
import { refreshAdminSession } from '@/features/admin/lib/admin-session'

export async function POST() {
  const session = await refreshAdminSession()

  if (!session) {
    return NextResponse.json(
      {
        ok: false,
        error: 'SESSION_REFRESH_FAILED',
      },
      { status: 401 }
    )
  }

  return NextResponse.json({
    ok: true,
    session,
  })
}
