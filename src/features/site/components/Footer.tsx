import Link from '@/shared/components/Link'
import { getSiteSettings } from '@/server/site-settings'
import LegalInfo from './LegalInfo'
import SocialLinks from './SocialLinks'

export default async function Footer() {
  const settings = await getSiteSettings()

  return (
    <footer className="mt-0.5 pt-0.5 sm:mt-0.5 sm:pt-0.5">
      <div className="pb-4">
        <LegalInfo settings={settings} />
      </div>
    </footer>
  )
}
