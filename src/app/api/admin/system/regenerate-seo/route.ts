import { revalidatePath } from 'next/cache'
import { NextResponse } from 'next/server'
import { getAdminSession } from '@/features/admin/lib/admin-session'

export async function POST() {
  const session = await getAdminSession()
  if (!session) {
    return NextResponse.json({ ok: false, error: 'UNAUTHORIZED' }, { status: 401 })
  }

  revalidatePath('/robots.txt')
  revalidatePath('/sitemap.xml')
  revalidatePath('/')
  revalidatePath('/blog')

  return NextResponse.json({ ok: true })
}
