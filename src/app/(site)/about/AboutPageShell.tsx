'use client'

import { useLanguage } from '@/shared/contexts/LanguageContext'
import AboutProfileShowcase from '@/features/content/components/AboutProfileShowcase'
import type { AboutProfileViewModel } from '@/features/content/lib/about-profile'

type AboutPageShellProps = {
  zhProfile: AboutProfileViewModel
  enProfile: AboutProfileViewModel
  zhHtml: string
  enHtml: string
}

export default function AboutPageShell({
  zhProfile,
  enProfile,
  zhHtml,
  enHtml,
}: AboutPageShellProps) {
  const { locale } = useLanguage()
  const isEn = locale === 'en'

  return (
    <AboutProfileShowcase
      profile={isEn ? enProfile : zhProfile}
      contentHtml={isEn ? enHtml : zhHtml}
      locale={locale}
    />
  )
}
