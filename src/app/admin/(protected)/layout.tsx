import { AdminLayoutShell } from "@/features/admin/components"
import siteMetadata from "@/config/site"
import { requireAdminSession } from "@/features/admin/lib/admin-session"
import { getServerDictionary } from "@/shared/utils/i18n-server"

export default async function AdminProtectedLayout({ children }: { children: React.ReactNode }) {
  const session = await requireAdminSession()
  const dictionary = await getServerDictionary()

  const navLabels = {
    navPosts: dictionary.admin.navPosts,
    navComments: dictionary.admin.navComments,
    about: dictionary.nav.about,
  };

  return (
    <AdminLayoutShell 
      username={session.username} 
      siteTitle={siteMetadata.title}
      navLabels={navLabels}
    >
      {children}
    </AdminLayoutShell>
  )
}
