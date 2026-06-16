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
        className="group inline-flex h-10 w-10 items-center justify-center rounded-full bg-white/70 text-sm font-medium text-zinc-600 shadow-lg shadow-zinc-800/5 ring-1 ring-zinc-900/5 backdrop-blur-md transition-all hover:text-primary-600 hover:ring-zinc-900/10 active:scale-95 dark:bg-zinc-900/70 dark:text-zinc-300 dark:ring-zinc-100/10 dark:hover:text-primary-400 dark:hover:ring-zinc-100/20 outline-none focus:outline-none"
      >
        <Search className="h-[19px] w-[19px] shrink-0 transition-transform group-hover:scale-110 group-hover:rotate-6" strokeWidth={2.5} />
      </SearchButtonWrapper>
    )
  }

  return null
}

export default SearchButton
