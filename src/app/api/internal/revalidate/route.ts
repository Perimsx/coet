import { revalidatePath } from 'next/cache'
import { NextRequest, NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

const allowedPath = (value: unknown): value is string => typeof value === 'string' && value.startsWith('/') && !value.startsWith('//') && value.length <= 512

export async function POST(request: NextRequest) {
  const secret = process.env.CMS_NEXT_REVALIDATE_SECRET
  if (!secret || request.headers.get('x-cms-revalidate-secret') !== secret) {
    return NextResponse.json({ message: 'unauthorized' }, { status: 401 })
  }

  let payload: { paths?: unknown }
  try { payload = await request.json() } catch { return NextResponse.json({ message: 'invalid payload' }, { status: 400 }) }
  const paths = Array.isArray(payload.paths) ? [...new Set(payload.paths.filter(allowedPath))] : []
  if (paths.length === 0 || paths.length > 100) return NextResponse.json({ message: 'invalid paths' }, { status: 400 })
  for (const path of paths) revalidatePath(path)
  return NextResponse.json({ revalidated: paths })
}
