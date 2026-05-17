'use client'

import { motion } from 'framer-motion'
import { usePathname } from 'next/navigation'
import { useEffect, useRef, useState } from 'react'

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
  isMobileCentered = false,
}: {
  logo: React.ReactNode
  navContent: React.ReactNode
  mobileMenu: React.ReactNode
  centerContent?: React.ReactNode
  isMobileCentered?: boolean
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
  const [articleTitle, setArticleTitle] = useState<string | null>(null)
  const [mode, setMode] = useState<'normal' | 'article'>('normal')

  const scrollTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const isScrollingTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const tickingRef = useRef(false)

  // 使用正则匹配特定页面
  const isHomePage = pathname === '/'
  const isAllPostsPage = /^\/blog(?:\/|$)/.test(pathname || '')
  const isArchivePage = /^\/archive(?:\/|$)/.test(pathname || '')
  const isTagsPage = /^\/tags(?:\/|$)/.test(pathname || '')
  const isFriendsPage = /^\/friends(?:\/|$)/.test(pathname || '')
  const isLogsPage = /^\/logs(?:\/|$)/.test(pathname || '')
  const isListContextPage = (isAllPostsPage || isArchivePage || isTagsPage || isFriendsPage || isLogsPage || isHomePage) && !isPostDetailPage

  useEffect(() => {
    setArticleTitle(null)
    setMode('normal')
    if (scrollTimerRef.current) {
      clearTimeout(scrollTimerRef.current)
      scrollTimerRef.current = null
    }
    if (isScrollingTimerRef.current) {
      clearTimeout(isScrollingTimerRef.current)
      isScrollingTimerRef.current = null
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
    observer.observe(document.body, { childList: true, subtree: true, characterData: true })

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
      if (isScrollingTimerRef.current) {
        clearTimeout(isScrollingTimerRef.current)
        isScrollingTimerRef.current = null
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
      title = "kerntau"
      subtitle = "A Full Stack Developer"
    } else if (isAllPostsPage) {
      title = "全部文章"
      subtitle = `共 ${stats.postCount} 篇`
    } else if (isArchivePage) {
      title = "全站归档"
      subtitle = `共 ${stats.postCount} 篇`
    } else if (isTagsPage) {
      title = "标签检索"
      subtitle = `共 ${stats.tagCount} 个`
    } else if (isFriendsPage) {
      title = "友情链接"
      subtitle = `共 ${stats.friendCount} 位`
    } else if (isLogsPage) {
      title = "系统日志"
      subtitle = `共 ${stats.commitCount} 次`
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
      className={`relative flex min-h-[2.5rem] w-full items-center gap-2 md:gap-4 ${isArticleMode ? 'justify-center md:justify-between' : (isMobileCentered ? 'justify-center md:justify-between' : 'justify-between')} ${transitionClass}`}
      data-is-article-mode={isArticleMode ? 'true' : 'false'}
    >
      {/* 左侧区域：标志 */}
      <div className={`${transitionClass} flex items-center justify-start shrink-0 min-w-0 opacity-100 pointer-events-auto`}>
        <motion.div
          className={`${transitionClass} flex shrink-0 opacity-100 scale-100 relative`}
          whileHover={{ scale: 1.1, rotate: -3 }}
          whileTap={{ scale: 0.9, rotate: 3 }}
          transition={{ type: "spring", stiffness: 400, damping: 10 }}
        >
          {logo}
        </motion.div>
      </div>

      {/* 中间区域：导航链接 / 动态标题 / 统计数据 */}
      <div className={`${transitionClass} relative flex justify-center items-center shrink-0 px-1 md:px-2 text-center z-10 w-auto`}>
        {/* 正常导航栏 */}
        <div className={`${transitionClass} ${(isArticleMode || isListMode) ? 'opacity-0 translate-y-4 pointer-events-none invisible absolute' : 'opacity-100 translate-y-0 pointer-events-auto visible relative'}`}>
          {centerContent}
        </div>

        {/* 列表页统计（所有屏幕居中） */}
        <div className={`${transitionClass} ${isListMode ? 'opacity-100 translate-y-0 pointer-events-auto visible relative' : 'opacity-0 translate-y-4 pointer-events-none invisible absolute'}`}>
          {renderListContext()}
        </div>

        {/* 文章详情标题（缩略居中） */}
        <div className={`${transitionClass} max-w-[90vw] md:max-w-[45vw] lg:max-w-[400px] xl:max-w-[500px] ${isArticleMode ? 'opacity-100 translate-y-0 pointer-events-auto visible relative' : 'opacity-0 translate-y-4 pointer-events-none invisible absolute'}`}>
          <div
            className="font-semibold text-foreground/80 break-words whitespace-normal text-center w-full mx-auto text-[13px] md:text-base"
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

      {/* 右侧区域：功能图标集合 */}
      <div
        className={`${transitionClass} flex items-center justify-end shrink-0 min-w-0`}
      >
        <div className={`${transitionClass} items-center shrink-0 flex`}>
          {navContent}
        </div>
        <div className="md:hidden flex items-center">
          {mobileMenu}
        </div>
      </div>
    </div>
  )
}
