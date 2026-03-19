import { NextResponse } from 'next/server'
import { getAdminSession } from '@/features/admin/lib/admin-session'
import { fetchFriendLinkMetadata } from '@/features/friends/lib/monitoring'

export async function POST(request: Request) {
  const session = await getAdminSession()
  if (!session) {
    return NextResponse.json({ ok: false, error: 'UNAUTHORIZED' }, { status: 401 })
  }

  const body = (await request.json()) as { url?: string }
  if (!body.url) {
    return NextResponse.json({ ok: false, error: 'INVALID_URL' }, { status: 400 })
  }

  try {
    const meta = await fetchFriendLinkMetadata(body.url)
    return NextResponse.json({ ok: true, meta })
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        error: error instanceof Error ? error.message : 'FETCH_FAILED',
      },
      { status: 400 }
    )
  }
}
