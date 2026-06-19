import { ScrollReveal } from '@/shared/components/ScrollReveal'
import LegalInfo from './LegalInfo'

export default function Footer() {
  return (
    <ScrollReveal>
      <footer className="mt-0.5 pt-0.5 sm:mt-0.5 sm:pt-0.5">
        <div className="pb-4">
          <LegalInfo />
        </div>
      </footer>
    </ScrollReveal>
  )
}
