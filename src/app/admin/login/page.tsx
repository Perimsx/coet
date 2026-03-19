import { redirect } from 'next/navigation'
import { getAdminSession } from '@/features/admin/lib/admin-session'
import { getAdminLoginPath } from '@/features/admin/lib/routes'
import LoginView from './login-view'

export default async function AdminLoginPage() {
  const session = await getAdminSession()

  if (session) {
    redirect('/admin')
  }

  return <LoginView entryPath={getAdminLoginPath()} />
}
