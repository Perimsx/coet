'use client'

import { useEffect, useState } from 'react'
import LegalInfo from './LegalInfo'
import { getSitePresentation } from '@/features/site/services/site-presentation'
import { getSiteSettings, type SiteSettings } from '@/features/site/services/site-settings'
import { sitePresentationDefaults } from '@/blog.config'

export default function Footer() {
  const [data, setData] = useState<{
    settings: SiteSettings | null
    presentation: Awaited<ReturnType<typeof getSitePresentation>> | null
  }>({ settings: null, presentation: null })

  useEffect(() => {
    Promise.all([getSiteSettings(), getSitePresentation()]).then(
      ([settings, presentation]) => {
        setData({ settings, presentation })
      }
    )
  }, [])

  const settings = data.settings
  const presentation = data.presentation

  return (
    <footer className="pt-0.5 pb-1 sm:pt-1 sm:pb-1.5">
      <LegalInfo
        siteTitle={settings?.title || ''}
        siteCreatedAt={settings?.siteCreatedAt || ''}
        icp={settings?.icp || ''}
        policeBeian={settings?.policeBeian || ''}
        footer={presentation?.footer || sitePresentationDefaults.footer}
      />
    </footer>
  )
}
