import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { getAdminSession } from '@/features/admin/lib/admin-session'
import LoginView from '@/app/admin/login/login-view'

export const metadata: Metadata = {
  title: 'Admin Login',
  robots: {
    index: false,
    follow: false,
  },
}

export default async function AdminEntryPage() {
  const session = await getAdminSession()

  if (session) {
    redirect('/admin')
  }

  return <LoginView />
}
