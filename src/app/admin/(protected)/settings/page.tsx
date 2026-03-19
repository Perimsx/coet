import SiteSettingsForm from '@/features/admin/components/SiteSettingsForm'
import { requireAdminSession } from '@/features/admin/lib/admin-session'
import { getSiteSettings } from '@/server/site-settings'

export default async function AdminSettingsPage() {
  const session = await requireAdminSession()
  const settings = await getSiteSettings()

  return (
    <section>
      <SiteSettingsForm settings={settings} username={session.username} />
    </section>
  )
}
