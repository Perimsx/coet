'use client'

import { SearchProvider as PlinySearchProvider } from 'pliny/search'
import type { SearchConfig } from 'pliny/search'
import EnhancedKBarProvider from './EnhancedKBarProvider'

export default function SearchProvider({
  searchConfig,
  children,
}: {
  searchConfig: SearchConfig | undefined
  children: React.ReactNode
}) {
  if (!searchConfig || !searchConfig.provider) {
    return <>{children}</>
  }

  if (searchConfig.provider === 'kbar' && 'kbarConfig' in searchConfig) {
    return (
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      <EnhancedKBarProvider kbarConfig={(searchConfig as any).kbarConfig}>{children}</EnhancedKBarProvider>
    )
  }

  return <PlinySearchProvider searchConfig={searchConfig}>{children}</PlinySearchProvider>
}
