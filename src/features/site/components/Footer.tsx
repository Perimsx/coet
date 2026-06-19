import { getSitePresentation } from '@/features/site/services/site-presentation'
import LegalInfo from './LegalInfo'
import { ScrollReveal } from '@/shared/components/ScrollReveal'

export default async function Footer() {
  const presentation = await getSitePresentation()

  return (
    <ScrollReveal>
      <footer className="mt-0.5 pt-0.5 sm:mt-0.5 sm:pt-0.5">
        <div className="pb-4">
          <LegalInfo presentation={presentation.footer} />
        </div>
      </footer>
    </ScrollReveal>
  )
}
