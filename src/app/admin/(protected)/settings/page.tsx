import SiteSettingsForm from '@/features/admin/components/SiteSettingsForm'
import { requireAdminSession } from '@/features/admin/lib/admin-session'
import { DEFAULT_ADMIN_USERNAME } from '@/features/admin/lib/defaults'
import { getSiteSettings } from '@/server/site-settings'

export default async function AdminSettingsPage() {
  await requireAdminSession()
  const settings = await getSiteSettings()
  const loginUsername = DEFAULT_ADMIN_USERNAME

  return (
    <section>
      <SiteSettingsForm settings={settings} username={loginUsername} />
    </section>
  )
}
