import LegalInfo from './LegalInfo'
import { getSitePresentation } from '@/features/site/services/site-presentation'
import { getSiteSettings } from '@/features/site/services/site-settings'

export default async function Footer() {
  const [settings, presentation] = await Promise.all([
    getSiteSettings(),
    getSitePresentation(),
  ])

  return (
    <footer className="pt-0.5 pb-1 sm:pt-1 sm:pb-1.5">
      <LegalInfo
        siteTitle={settings.title}
        siteCreatedAt={settings.siteCreatedAt}
        icp={settings.icp}
        policeBeian={settings.policeBeian}
        footer={presentation.footer}
      />
    </footer>
  )
}
