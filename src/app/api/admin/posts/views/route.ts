import { NextResponse } from 'next/server'
import { getAdminSession } from '@/features/admin/lib/admin-session'
import {
  deleteArticleFilterPreset,
  listArticleFilterPresets,
  saveArticleFilterPreset,
} from '@/features/admin/lib/article-views'

export async function GET() {
  const session = await getAdminSession()
  if (!session) {
    return NextResponse.json({ ok: false, error: 'UNAUTHORIZED' }, { status: 401 })
  }

  const items = await listArticleFilterPresets(session.userId)
  return NextResponse.json({ ok: true, items })
}

export async function POST(request: Request) {
  const session = await getAdminSession()
  if (!session) {
    return NextResponse.json({ ok: false, error: 'UNAUTHORIZED' }, { status: 401 })
  }

  const body = (await request.json()) as {
    name?: string
    state?: {
      query?: string
      category?: string
      status?: string
      sortBy?: string
    }
  }

  if (!body.name || !body.state) {
    return NextResponse.json({ ok: false, error: 'INVALID_PAYLOAD' }, { status: 400 })
  }

  const item = await saveArticleFilterPreset({
    userId: session.userId,
    name: body.name,
    state: {
      query: body.state.query || '',
      category: body.state.category || 'all',
      status: body.state.status || 'all',
      sortBy: body.state.sortBy || 'date-desc',
    },
  })

  return NextResponse.json({ ok: true, item })
}

export async function DELETE(request: Request) {
  const session = await getAdminSession()
  if (!session) {
    return NextResponse.json({ ok: false, error: 'UNAUTHORIZED' }, { status: 401 })
  }

  const { searchParams } = new URL(request.url)
  const id = Number(searchParams.get('id'))
  if (!Number.isInteger(id) || id <= 0) {
    return NextResponse.json({ ok: false, error: 'INVALID_ID' }, { status: 400 })
  }

  const deleted = await deleteArticleFilterPreset(id, session.userId)
  return NextResponse.json({ ok: true, deleted })
}
