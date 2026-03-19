import { AdminLayoutShell } from "@/features/admin/components"
import siteMetadata from "@/config/site"
import {
  getAdminSessionSnapshot,
  requireAdminSession,
} from "@/features/admin/lib/admin-session"
import { getSiteSettings } from "@/server/site-settings"

export default async function AdminProtectedLayout({ children }: { children: React.ReactNode }) {
  const session = await requireAdminSession()
  const sessionSnapshot = await getAdminSessionSnapshot(session)
  const settings = await getSiteSettings()

  return (
    <AdminLayoutShell
      username={session.username}
      siteTitle={settings.title || siteMetadata.title}
      sessionSnapshot={sessionSnapshot}
    >
      {children}
    </AdminLayoutShell>
  )
}
