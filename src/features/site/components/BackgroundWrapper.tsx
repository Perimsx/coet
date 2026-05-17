'use client'

import dynamic from 'next/dynamic'

export const InteractiveBackground = dynamic(
  () => import('./Background').then((mod) => mod.InteractiveBackground),
  { ssr: false }
)
