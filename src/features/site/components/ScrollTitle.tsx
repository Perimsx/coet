import { AnimatePresence, motion } from 'framer-motion'
import { usePathname } from 'next/navigation'
import { useEffect, useRef, useState } from 'react'
import { ChevronRight } from 'lucide-react'

function isBlogPostDetailPath(pathname: string | null) {
  if (!pathname) return false
  return /^\/blog\/(?!page(?:\/|$)|category(?:\/|$)).+/.test(pathname)
}

function getArticleMeta() {
  const heading = document.querySelector<HTMLElement>('article h1, .prose h1, h1')
  const categoryLink = document.querySelector<HTMLElement>('a[href*="/blog/category/"]')
  
  return {
    title: heading?.textContent?.trim() || null,
    category: categoryLink?.textContent?.trim() || null
  }
}

export default function ScrollTitle({
  logo,
  navContent,
  mobileMenu,
  centerContent,
  stats,
}: {
  logo: React.ReactNode
  navContent: React.ReactNode
  mobileMenu: React.ReactNode
  centerContent?: React.ReactNode
  stats: {
    postCount: number
    tagCount: number
    categoryCount: number
    friendCount: number
    commitCount: number
  }
}) {
  const pathname = usePathname()
  const isPostDetailPage = isBlogPostDetailPath(pathname)
  const [meta, setMeta] = useState<{ title: string | null; category: string | null }>({ title: null, category: null })
  const [mode, setMode] = useState<'normal' | 'article'>('normal')
  const scrollTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const isHomePage = pathname === '/'
  const isAllPostsPage = /^\/blog(?:\/|$)/.test(pathname || '')
  const isArchivePage = /^\/archive(?:\/|$)/.test(pathname || '')
  const isTagsPage = /^\/tags(?:\/|$)/.test(pathname || '')
  const isFriendsPage = /^\/friends(?:\/|$)/.test(pathname || '')
  const isLogsPage = /^\/logs(?:\/|$)/.test(pathname || '')
  const isListContextPage = (isAllPostsPage || isArchivePage || isTagsPage || isFriendsPage || isLogsPage || isHomePage) && !isPostDetailPage

  useEffect(() => {
    setMeta({ title: null, category: null })
    setMode('normal')
  }, [pathname])

  useEffect(() => {
    if (!isPostDetailPage) return
    const syncMeta = () => {
      const data = getArticleMeta()
      if (data.title) setMeta(data)
    }
    syncMeta()
    const timer = window.setTimeout(syncMeta, 400)
    const observer = new MutationObserver(syncMeta)
    observer.observe(document.body, { childList: true, subtree: true })
    return () => { window.clearTimeout(timer); observer.disconnect() }
  }, [isPostDetailPage, pathname])

  useEffect(() => {
    if (!isPostDetailPage && !isListContextPage) {
      setMode('normal')
      return
    }
    const handleScroll = () => {
      if (isPostDetailPage && !meta.title) {
        const data = getArticleMeta()
        if (data.title) setMeta(data)
      }
      const threshold = isPostDetailPage ? 120 : 40
      if (window.scrollY > threshold) {
        setMode('article')
        if (isListContextPage) {
          if (scrollTimerRef.current) clearTimeout(scrollTimerRef.current)
          scrollTimerRef.current = setTimeout(() => setMode('normal'), 800)
        }
        return
      }
      setMode('normal')
    }
    window.addEventListener('scroll', handleScroll, { passive: true })
    return () => window.removeEventListener('scroll', handleScroll)
  }, [meta, isPostDetailPage, isListContextPage])

  const isArticleMode = isPostDetailPage && mode === 'article' && meta.title
  const isListMode = isListContextPage && mode === 'article'

  const renderListContext = () => {
    let title = ""
    let subtitle = ""
    if (isHomePage) { title = "kerntau"; subtitle = "Developer" }
    else if (isAllPostsPage) { title = "全部文章"; subtitle = `${stats.postCount} 篇` }
    else if (isArchivePage) { title = "归档"; subtitle = `${stats.postCount} 篇` }
    else if (isTagsPage) { title = "标签"; subtitle = `${stats.tagCount} 个` }
    else if (isFriendsPage) { title = "友链"; subtitle = `${stats.friendCount} 位` }
    else if (isLogsPage) { title = "日志"; subtitle = `${stats.commitCount} 次` }
    if (!title) return null
    return (
      <div className="flex items-center gap-2 px-2">
        <span className="text-sm font-bold text-foreground/90">{title}</span>
        <span className="h-3 w-[1px] bg-border/40" />
        <span className="text-[11px] font-medium text-muted-foreground/80">{subtitle}</span>
      </div>
    )
  }

  return (
    <div className="relative flex h-10 w-full items-center justify-between">
      <div className={`flex shrink-0 items-center transition-all duration-700 ${isArticleMode ? 'opacity-40 grayscale scale-90 blur-[1px]' : 'opacity-100'}`}>
        {logo}
      </div>

      <div className="relative flex flex-1 items-center justify-center min-w-0 px-4">
        <AnimatePresence mode="wait">
          {(!isArticleMode && !isListMode) ? (
            <motion.div
              key="nav"
              initial={{ y: 15, opacity: 0, filter: 'blur(4px)' }}
              animate={{ y: 0, opacity: 1, filter: 'blur(0px)' }}
              exit={{ y: -15, opacity: 0, filter: 'blur(4px)' }}
              transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
              className="flex items-center justify-center"
            >
              {centerContent}
            </motion.div>
          ) : isListMode ? (
            <motion.div
              key="list"
              initial={{ y: 15, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: -15, opacity: 0 }}
              transition={{ duration: 0.4 }}
            >
              {renderListContext()}
            </motion.div>
          ) : (
            <motion.div
              key="article"
              initial={{ y: 15, opacity: 0, filter: 'blur(4px)' }}
              animate={{ y: 0, opacity: 1, filter: 'blur(0px)' }}
              exit={{ y: -15, opacity: 0, filter: 'blur(4px)' }}
              transition={{ duration: 0.4 }}
              className="flex items-center gap-1.5 min-w-0 max-w-full"
            >
              {meta.category && (
                <>
                  <span className="hidden sm:inline-block shrink-0 text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground/50">
                    {meta.category}
                  </span>
                  <ChevronRight className="hidden sm:inline-block h-2.5 w-2.5 shrink-0 text-muted-foreground/20" />
                </>
              )}
              <h2 className="text-sm sm:text-[15px] font-bold text-foreground/90 truncate tracking-tight text-balance">
                {meta.title}
              </h2>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <div className={`flex shrink-0 items-center gap-2 transition-all duration-700 ${isArticleMode ? 'sm:opacity-40 sm:grayscale sm:blur-[0.5px]' : 'opacity-100'}`}>
        <div className="hidden sm:flex items-center">{navContent}</div>
        <div className="sm:hidden">{mobileMenu}</div>
      </div>
    </div>
  )
}
