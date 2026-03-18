'use client'

import type { Action } from 'kbar'
import { SearchProvider as PlinySearchProvider } from 'pliny/search'
import type { SearchConfig } from 'pliny/search'
import EnhancedKBarProvider from './EnhancedKBarProvider'

type KBarLikeConfig = {
  provider: 'kbar'
  kbarConfig: {
    searchDocumentsPath: string | false
    defaultActions?: Action[]
  }
}

function isKBarConfig(value: SearchConfig | undefined): value is KBarLikeConfig {
  return Boolean(value && value.provider === 'kbar' && 'kbarConfig' in value)
}

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

  if (isKBarConfig(searchConfig)) {
    return (
      <EnhancedKBarProvider kbarConfig={searchConfig.kbarConfig}>{children}</EnhancedKBarProvider>
    )
  }

  return <PlinySearchProvider searchConfig={searchConfig}>{children}</PlinySearchProvider>
}
