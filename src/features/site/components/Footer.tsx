import { getSiteSettings } from '@/server/site-settings'
import { getSitePresentation } from '@/features/site/services/site-presentation'
import LegalInfo from './LegalInfo'

export default async function Footer() {
  const [settings, presentation] = await Promise.all([
    getSiteSettings(),
    getSitePresentation(),
  ])

  return (
    <footer className="mt-0.5 pt-0.5 sm:mt-0.5 sm:pt-0.5">
      <div className="pb-4">
        <LegalInfo settings={settings} presentation={presentation.footer} />
      </div>
    </footer>
  )
}
