import { revalidatePath } from 'next/cache'
import { NextResponse } from 'next/server'
import { getAdminSession } from '@/features/admin/lib/admin-session'

export async function POST() {
  const session = await getAdminSession()
  if (!session) {
    return NextResponse.json({ ok: false, error: 'UNAUTHORIZED' }, { status: 401 })
  }

  for (const path of ['/', '/about', '/blog', '/archive', '/friends', '/projects', '/tags']) {
    revalidatePath(path)
  }

  revalidatePath('/', 'layout')
  revalidatePath('/admin/settings')

  return NextResponse.json({ ok: true })
}
