import { NextResponse } from 'next/server'
import { getAdminSession } from '@/features/admin/lib/admin-session'
import { getPostEditorData } from '@/features/content/lib/posts'

type DraftPayload = {
  relativePath?: string
  title?: string
  slug?: string
  date?: string
  summary?: string
  tags?: string
  categories?: string
  draft?: boolean
  content?: string
}

function normalizeDraft(value?: DraftPayload | null) {
  return {
    title: value?.title?.trim() || '',
    slug: value?.slug?.trim() || '',
    date: value?.date?.trim() || '',
    summary: value?.summary?.trim() || '',
    tags: value?.tags?.trim() || '',
    categories: value?.categories?.trim() || '',
    draft: Boolean(value?.draft),
    content: value?.content || '',
  }
}

export async function POST(request: Request) {
  const session = await getAdminSession()
  if (!session) {
    return NextResponse.json({ ok: false, error: 'UNAUTHORIZED' }, { status: 401 })
  }

  const body = (await request.json()) as {
    relativePath?: string
    draft?: DraftPayload | null
  }

  const localDraft = normalizeDraft(body.draft)

  if (!body.relativePath) {
    const shouldRestore =
      Boolean(localDraft.title) || Boolean(localDraft.content.trim()) || Boolean(localDraft.summary)

    return NextResponse.json({
      ok: true,
      shouldRestore,
      server: null,
    })
  }

  try {
    const server = await getPostEditorData(body.relativePath)
    const serverDraft = normalizeDraft({
      title: server.title,
      slug: server.slug,
      date: server.date,
      summary: server.summary,
      tags: server.tags.join(', '),
      categories: server.categories.join(', '),
      draft: server.draft,
      content: server.content,
    })

    return NextResponse.json({
      ok: true,
      shouldRestore: JSON.stringify(serverDraft) !== JSON.stringify(localDraft),
      server: serverDraft,
    })
  } catch {
    return NextResponse.json({
      ok: true,
      shouldRestore:
        Boolean(localDraft.title) || Boolean(localDraft.content.trim()) || Boolean(localDraft.summary),
      server: null,
    })
  }
}
