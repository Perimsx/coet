'use client'

import React from 'react'
import SocialIcon from '@/features/site/components/social-icons'
import type { SiteSettings } from '@/server/site-settings'

interface SocialLinksProps {
  settings: SiteSettings
  className?: string
}

export default function SocialLinks({ settings, className = "" }: SocialLinksProps) {
  const socialLinks = [
    {
      kind: 'mail' as const,
      href: settings.email ? `mailto:${settings.email}` : undefined,
    },
    { kind: 'github' as const, href: settings.github || undefined },
    { kind: 'x' as const, href: settings.x || undefined },
    { kind: 'yuque' as const, href: settings.yuque || undefined },
    { kind: 'rss' as const, href: '/feed.xml' },
  ].filter((item) => Boolean(item.href))

  return (
    <div className={`mb-3 flex items-center justify-center gap-4 ${className}`}>
      {socialLinks.map((item) => (
        <SocialIcon key={item.kind} kind={item.kind} href={item.href} size={8} />
      ))}
    </div>
  )
}
