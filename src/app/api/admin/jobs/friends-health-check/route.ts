import { NextResponse } from 'next/server'
import { getAdminSession } from '@/features/admin/lib/admin-session'
import { getFriends } from '@/features/friends/lib/friends'
import { checkFriendHealth, writeFriendHealthResult } from '@/features/friends/lib/monitoring'

export async function POST(request: Request) {
  const session = await getAdminSession()
  if (!session) {
    return NextResponse.json({ ok: false, error: 'UNAUTHORIZED' }, { status: 401 })
  }

  const body = (await request.json().catch(() => ({}))) as { id?: number }
  const friends = await getFriends()
  const targets = body.id ? friends.filter((item) => item.id === body.id) : friends

  const results: Awaited<ReturnType<typeof writeFriendHealthResult>>[] = []
  for (const friend of targets) {
    const healthResult = await checkFriendHealth(friend)
    const updated = await writeFriendHealthResult(healthResult)
    results.push(updated)
  }

  return NextResponse.json({
    ok: true,
    items: results,
  })
}
