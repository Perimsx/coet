'use client'

import { Search } from 'lucide-react'
import { AlgoliaButton } from 'pliny/search/AlgoliaButton'
import { KBarButton } from 'pliny/search/KBarButton'
import siteMetadata from '@/config/site'
import { getNavLanguage } from '@/features/site/lib/nav-language'

const SearchButton = () => {
  const { dictionary } = getNavLanguage()
  const searchAriaLabel = dictionary.search.buttonAriaLabel
  const searchProvider = siteMetadata.search?.provider as string | undefined

  if (searchProvider === 'algolia' || searchProvider === 'kbar') {
    const SearchButtonWrapper = searchProvider === 'algolia' ? AlgoliaButton : KBarButton

    return (
      <SearchButtonWrapper
        aria-label={searchAriaLabel}
        className="hover:bg-primary-500/10 hover:text-primary-600 dark:hover:bg-primary-400/15 dark:hover:text-primary-400 inline-flex h-8 w-8 items-center justify-center rounded-full bg-transparent text-sm font-medium text-muted-foreground transition-all outline-none focus:outline-none ring-0 active:scale-95"
      >
        <Search className="h-5 w-5 shrink-0" />
      </SearchButtonWrapper>
    )
  }

  return null
}

export default SearchButton
