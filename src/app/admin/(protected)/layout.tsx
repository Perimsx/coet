import { AdminLayoutShell } from "@/features/admin/components"
import siteMetadata from "@/config/site"
import {
  getAdminSessionSnapshot,
  requireAdminSession,
} from "@/features/admin/lib/admin-session"
import { getSiteSettings } from "@/server/site-settings"
import { getServerDictionary } from "@/shared/utils/i18n-server"

export default async function AdminProtectedLayout({ children }: { children: React.ReactNode }) {
  const session = await requireAdminSession()
  const sessionSnapshot = await getAdminSessionSnapshot(session)
  const dictionary = await getServerDictionary()
  const settings = await getSiteSettings()

  const navLabels = {
    navPosts: dictionary.admin.navPosts,
    navComments: dictionary.admin.navComments,
    about: dictionary.nav.about,
  };

  return (
    <AdminLayoutShell 
      username={session.username} 
      siteTitle={settings.title || siteMetadata.title}
      navLabels={navLabels}
      sessionSnapshot={sessionSnapshot}
    >
      {children}
    </AdminLayoutShell>
  )
}
