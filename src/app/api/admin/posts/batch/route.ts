import { exec } from 'child_process'
import { promisify } from 'util'
import { revalidatePath } from 'next/cache'
import { NextResponse } from 'next/server'
import { getAdminSession } from '@/features/admin/lib/admin-session'
import { batchMutatePosts } from '@/features/content/lib/posts'

const execAsync = promisify(exec)

function triggerContentlayerBuild() {
  if (process.env.NODE_ENV !== 'production') return

  execAsync('npx contentlayer2 build').catch((error) => {
    console.error('[admin:posts:batch] Contentlayer build failed:', error)
  })
}

export async function POST(request: Request) {
  const session = await getAdminSession()
  if (!session) {
    return NextResponse.json({ ok: false, error: 'UNAUTHORIZED' }, { status: 401 })
  }

  const body = (await request.json()) as {
    relativePaths?: string[]
    operation?: 'publish' | 'draft' | 'delete' | 'update-categories' | 'update-tags'
    categories?: string[]
    tags?: string[]
  }

  if (!body.operation || !Array.isArray(body.relativePaths)) {
    return NextResponse.json({ ok: false, error: 'INVALID_PAYLOAD' }, { status: 400 })
  }

  const result = await batchMutatePosts({
    relativePaths: body.relativePaths,
    operation: body.operation,
    categories: body.categories,
    tags: body.tags,
  })

  revalidatePath('/admin/posts')
  revalidatePath('/blog')
  revalidatePath('/archive')
  revalidatePath('/tags')
  revalidatePath('/', 'layout')
  triggerContentlayerBuild()

  return NextResponse.json({
    ok: true,
    result,
  })
}
