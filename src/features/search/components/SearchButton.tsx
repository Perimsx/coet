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
        title={searchAriaLabel}
        className="group inline-flex h-10 w-10 items-center justify-center rounded-full bg-white/[0.72] dark:bg-black/[0.78] backdrop-blur-2xl border border-white/[0.18] dark:border-white/[0.08] text-zinc-600 dark:text-zinc-300 transition-all hover:text-primary active:scale-95 outline-none focus:outline-none"
      >
        <Search className="h-[19px] w-[19px] shrink-0 transition-transform group-hover:scale-110 group-hover:rotate-6" strokeWidth={2.5} />
      </SearchButtonWrapper>
    )
  }

  return null
}

export default SearchButton
