'use client'

import { Search } from 'lucide-react'
import { AlgoliaButton } from 'pliny/search/AlgoliaButton'
import { KBarButton } from 'pliny/search/KBarButton'
import { siteMetadata } from '@/blog.config'
import { useNavLanguage } from '@/features/site/lib/nav-language'

const SearchButton = () => {
  const { dictionary } = useNavLanguage()
  const searchAriaLabel = dictionary.search.buttonAriaLabel
  const searchProvider = siteMetadata.search?.provider as string | undefined

  if (searchProvider === 'algolia' || searchProvider === 'kbar') {
    const SearchButtonWrapper = searchProvider === 'algolia' ? AlgoliaButton : KBarButton

    return (
      <SearchButtonWrapper
        aria-label={searchAriaLabel}
        className="group hover:bg-primary-500/10 hover:text-primary-600 dark:hover:bg-primary-400/15 dark:hover:text-primary-400 inline-flex h-8 w-8 sm:h-10 sm:w-10 items-center justify-center rounded-full bg-transparent text-sm font-medium text-muted-foreground transition-all outline-none focus:outline-none ring-0 active:scale-95"
      >
        <Search className="h-4 w-4 sm:h-[19px] sm:w-[19px] shrink-0 transition-transform group-hover:scale-110 group-hover:rotate-6" strokeWidth={2.5} />
      </SearchButtonWrapper>
    )
  }

  return null
}

export default SearchButton
