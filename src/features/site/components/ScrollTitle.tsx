'use client'

import { motion } from 'framer-motion'
import { usePathname } from 'next/navigation'
import { useEffect, useRef, useState } from 'react'
import { useNavLanguage } from '@/features/site/lib/nav-language'

function isBlogPostDetailPath(pathname: string | null) {
  if (!pathname) {
    return false
  }

  return /^\/blog\/(?!page(?:\/|$)|category(?:\/|$)).+/.test(pathname)
}

function getCurrentArticleTitle() {
  // 增加更通用的选择器，优先抓取 article 标签内的 h1
  const heading = document.querySelector<HTMLElement>('article h1, .prose h1, h1')
  return heading?.textContent?.trim() || null
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
  const { dictionary } = useNavLanguage()
  const isPostDetailPage = isBlogPostDetailPath(pathname)
  const [articleTitle, setArticleTitle] = useState<string | null>(null)
  const [mode, setMode] = useState<'normal' | 'article'>('normal')

  const scrollTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const tickingRef = useRef(false)

  // 使用正则匹配特定页面
  const isHomePage = pathname === '/'
  const isAllPostsPage = /^\/blog(?:\/|$)/.test(pathname || '')
  const isArchivePage = /^\/archive(?:\/|$)/.test(pathname || '')
  const isTagsPage = /^\/tags(?:\/|$)/.test(pathname || '')
  const isFriendsPage = /^\/friends(?:\/|$)/.test(pathname || '')
  const isLogsPage = /^\/logs(?:\/|$)/.test(pathname || '')
  const isListContextPage = (isAllPostsPage || isArchivePage || isTagsPage || isFriendsPage || isLogsPage) && !isPostDetailPage

  useEffect(() => {
    setArticleTitle(null)
    setMode('normal')
    if (scrollTimerRef.current) {
      clearTimeout(scrollTimerRef.current)
      scrollTimerRef.current = null
    }
  }, [pathname])

  useEffect(() => {
    if (!isPostDetailPage) {
      return
    }

    const syncTitle = () => {
      setArticleTitle(getCurrentArticleTitle())
    }

    syncTitle()

    const timer = window.setTimeout(syncTitle, 250)
    const observer = new MutationObserver(syncTitle)
    const target = document.querySelector('article') || document.body
    observer.observe(target, { childList: true, subtree: true, characterData: true })

    return () => {
      window.clearTimeout(timer)
      observer.disconnect()
    }
  }, [isPostDetailPage, pathname])

  useEffect(() => {
    // 只要是文章页或列表上下文页，就必须挂载滚动监听
    if (!isPostDetailPage && !isListContextPage) {
      setMode('normal')
      return
    }

    const handleScroll = () => {
      if (tickingRef.current) return
      tickingRef.current = true

      window.requestAnimationFrame(() => {
        // 关键修复：如果处于文章页但标题缺失，在滚动时再次尝试抓取
        if (isPostDetailPage && !articleTitle) {
          const detectedTitle = getCurrentArticleTitle()
          if (detectedTitle) {
            setArticleTitle(detectedTitle)
          }
        }

        const threshold = isPostDetailPage ? 120 : 40

        if (window.scrollY > threshold) {
          setMode('article')

          if (scrollTimerRef.current) {
            clearTimeout(scrollTimerRef.current)
          }
          // 列表页：首页保持自动回跳，其他页面保持吸附
          if (isListContextPage && isHomePage) {
            scrollTimerRef.current = setTimeout(() => {
              setMode('normal')
              scrollTimerRef.current = null
            }, 800)
          }
        } else {
          setMode('normal')
          if (scrollTimerRef.current) {
            clearTimeout(scrollTimerRef.current)
            scrollTimerRef.current = null
          }
        }
        
        tickingRef.current = false
      })
    }

    window.addEventListener('scroll', handleScroll, { passive: true })
    handleScroll()

    return () => {
      window.removeEventListener('scroll', handleScroll)
      if (scrollTimerRef.current) {
        clearTimeout(scrollTimerRef.current)
        scrollTimerRef.current = null
      }
    }
  }, [articleTitle, isPostDetailPage, isListContextPage, isHomePage])

  const isArticleMode = isPostDetailPage && mode === 'article' && articleTitle
  const isListMode = isListContextPage && mode === 'article'
  const transitionClass =
    'transition-all duration-500 [transition-timing-function:cubic-bezier(0.16,1,0.3,1)]'

  const renderListContext = () => {
    let title = ""
    let subtitle = ""

    if (isHomePage) {
      title = "Kerntau"
      subtitle = "A Full Stack Developer"
    } else if (isAllPostsPage) {
      title = dictionary.scrollTitle.allPosts
      subtitle = dictionary.scrollTitle.countPosts.replace('{count}', String(stats.postCount))
    } else if (isArchivePage) {
      title = dictionary.scrollTitle.archive
      subtitle = dictionary.scrollTitle.countPosts.replace('{count}', String(stats.postCount))
    } else if (isTagsPage) {
      title = dictionary.scrollTitle.tags
      subtitle = dictionary.scrollTitle.countTags.replace('{count}', String(stats.tagCount))
    } else if (isFriendsPage) {
      title = dictionary.scrollTitle.friends
      subtitle = dictionary.scrollTitle.countFriends.replace('{count}', String(stats.friendCount))
    } else if (isLogsPage) {
      title = dictionary.scrollTitle.logs
      subtitle = dictionary.scrollTitle.countCommits.replace('{count}', String(stats.commitCount))
    }

    if (!title) return null

    return (
      <div className="flex items-center justify-start min-w-0 max-w-full overflow-hidden">
        <span className="text-[14px] sm:text-[15px] text-foreground/80 font-semibold truncate leading-tight tracking-tight">
          {title}
        </span>
        <span className="mx-2 sm:mx-3 opacity-30 shrink-0 [@media(max-width:360px)]:hidden">|</span>
        <span className="text-[12px] sm:text-[13px] text-muted-foreground font-medium truncate [@media(max-width:360px)]:hidden">
          {subtitle}
        </span>
      </div>
    )
  }

  return (
    <div
      className={`relative grid min-h-12 w-full grid-cols-[3.5rem_minmax(0,1fr)_3.5rem] items-center lg:min-h-16 lg:grid-cols-[13rem_minmax(0,1fr)_13rem] ${transitionClass}`}
      data-is-article-mode={isArticleMode ? 'true' : 'false'}
    >
      <div className="flex min-w-0 items-center justify-center lg:justify-start">
        <div className="flex items-center lg:hidden">{mobileMenu}</div>
        <motion.div
          className={`${transitionClass} hidden shrink-0 opacity-100 lg:flex`}
          whileHover={{ scale: 1.06, rotate: -2 }}
          whileTap={{ scale: 0.94, rotate: 2 }}
          transition={{ type: "spring", stiffness: 400, damping: 10 }}
        >
          {logo}
        </motion.div>
      </div>

      <div className={`${transitionClass} relative z-10 flex min-w-0 items-center justify-center px-1 text-center`}>
        <motion.div
          className={`${transitionClass} flex shrink-0 opacity-100 lg:hidden`}
          whileTap={{ scale: 0.94 }}
          transition={{ type: "spring", stiffness: 400, damping: 10 }}
        >
          {logo}
        </motion.div>

        <div className={`${transitionClass} hidden lg:block ${(isArticleMode || isListMode) ? 'lg:pointer-events-none lg:invisible lg:absolute lg:translate-y-4 lg:opacity-0' : 'lg:pointer-events-auto lg:visible lg:relative lg:translate-y-0 lg:opacity-100'}`}>
          {centerContent}
        </div>

        <div className={`${transitionClass} hidden lg:flex ${isListMode ? 'lg:pointer-events-auto lg:visible lg:relative lg:translate-y-0 lg:opacity-100' : 'lg:pointer-events-none lg:invisible lg:absolute lg:translate-y-4 lg:opacity-0'}`}>
          {renderListContext()}
        </div>

        <div className={`${transitionClass} hidden lg:flex lg:max-w-[640px] ${isArticleMode ? 'lg:pointer-events-auto lg:visible lg:relative lg:translate-y-0 lg:opacity-100' : 'lg:pointer-events-none lg:invisible lg:absolute lg:translate-y-4 lg:opacity-0'}`}>
          <div
            className="mx-auto w-full break-words text-center text-lg font-bold text-foreground/80"
            style={{
              display: '-webkit-box',
              WebkitLineClamp: 1,
              WebkitBoxOrient: 'vertical',
              overflow: 'hidden',
            }}
          >
            {articleTitle}
          </div>
        </div>
      </div>

      <div className={`${transitionClass} flex min-w-0 items-center justify-center lg:justify-end`}>
        <div className={`${transitionClass} flex shrink-0 items-center justify-end`}>
          {navContent}
        </div>
      </div>
    </div>
  )
}
