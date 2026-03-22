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
  const heading = document.querySelector<HTMLElement>('article h1, .prose h1, h1.text-3xl')
  return heading?.textContent?.trim() || null
}

function getArticleThreshold() {
  const heading = document.querySelector<HTMLElement>('article h1, .prose h1, h1.text-3xl')
  if (!heading) {
    return 100
  }

  const rect = heading.getBoundingClientRect()
  return rect.bottom + window.scrollY - 80
}

export default function ScrollTitle({
  logo,
  navContent,
  centerContent,
  stats,
}: {
  logo: React.ReactNode
  navContent: React.ReactNode
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
  const [articleTitle, setArticleTitle] = useState<string | null>(null)
  const [mode, setMode] = useState<'normal' | 'article'>('normal')
  const [isScrolling, setIsScrolling] = useState(false)
  const [visitorIp, setVisitorIp] = useState<string | null>(null)
  const scrollTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const scrollStopTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

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
    setIsScrolling(false)

    if (scrollTimerRef.current) {
      clearTimeout(scrollTimerRef.current)
      scrollTimerRef.current = null
    }

    if (scrollStopTimerRef.current) {
      clearTimeout(scrollStopTimerRef.current)
      scrollStopTimerRef.current = null
    }
  }, [pathname])

  // 首页：由于 Server Component 在 SSR 取 IP，为了不破坏静态生成采用低侵入式的 DOM 提取
  useEffect(() => {
    if (!isHomePage) return
    const extractIp = () => {
      const el = document.getElementById('terminal-greeting-ip')
      if (el && el.textContent) {
        setVisitorIp(el.textContent.trim())
      }
    }
    extractIp()
    const timer = window.setTimeout(extractIp, 1000)
    return () => window.clearTimeout(timer)
  }, [isHomePage, pathname])

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
    // 如果既不是文章也非列表统计上下文页，那就完全不需要触发动态模式
    if ((!isPostDetailPage || !articleTitle) && !isListContextPage) {
      setMode('normal')
      return
    }

    const handleScroll = () => {
      setIsScrolling(true)
      if (scrollStopTimerRef.current) {
        clearTimeout(scrollStopTimerRef.current)
      }
      scrollStopTimerRef.current = setTimeout(() => {
        setIsScrolling(false)
      }, 500)

      const threshold = isPostDetailPage ? getArticleThreshold() : 40

      if (window.scrollY > threshold) {
        setMode('article') // 这里借用 'article' mode 表示“显示当前上下文（标题或统计）”

        if (scrollTimerRef.current) {
          clearTimeout(scrollTimerRef.current)
        }
        return
      }

      setMode('normal')
      if (scrollTimerRef.current) {
        clearTimeout(scrollTimerRef.current)
        scrollTimerRef.current = null
      }
    }

    window.addEventListener('scroll', handleScroll, { passive: true })
    handleScroll()

    return () => {
      window.removeEventListener('scroll', handleScroll)
      if (scrollTimerRef.current) {
        clearTimeout(scrollTimerRef.current)
        scrollTimerRef.current = null
      }
      if (scrollStopTimerRef.current) {
        clearTimeout(scrollStopTimerRef.current)
        scrollStopTimerRef.current = null
      }
    }
  }, [articleTitle, isPostDetailPage, isListContextPage])

  const isArticleMode = isPostDetailPage && mode === 'article' && articleTitle && isScrolling
  const isListMode = isListContextPage && mode === 'article'
  const transitionClass =
    'transition-all duration-500 [transition-timing-function:cubic-bezier(0.16,1,0.3,1)]'

  const renderListContext = () => {
    let title = ""
    let subtitle = ""

    if (isHomePage) {
      if (!visitorIp) return null
      title = "当前访客"
      subtitle = visitorIp
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
        <span className="mx-2 sm:mx-3 opacity-30 shrink-0">|</span>
        <span className="text-[12px] sm:text-[13px] text-muted-foreground font-medium truncate">
          {subtitle}
        </span>
      </div>
    )
  }

  return (
    <div
      className={`relative flex min-h-[1.5rem] w-full items-center justify-between gap-2 sm:gap-4 ${transitionClass}`}
      data-is-article-mode={isArticleMode ? 'true' : 'false'}
    >
      {/* 左侧区域：标志 */}
      <div className={`${transitionClass} flex items-center justify-start flex-1 shrink-0 min-w-0`}>
        <motion.div
          className={`${transitionClass} flex shrink-0 opacity-100 scale-100 relative`}
          whileHover={{ scale: 1.1, rotate: -3 }}
          whileTap={{ scale: 0.9, rotate: 3 }}
          transition={{ type: "spring", stiffness: 400, damping: 10 }}
        >
          {logo}
        </motion.div>

        {/* 仅在移动端：置于 Logo 右侧的统计区域 */}
        {isListContextPage && (
          <div className={`${transitionClass} sm:hidden flex items-center min-w-0 ml-2.5 ${isListMode ? 'opacity-100 translate-x-0 visible' : 'opacity-0 -translate-x-2 invisible'}`}>
            {renderListContext()}
          </div>
        )}
      </div>

      {/* 中间区域：导航链接 / 动态标题 / 统计数据 */}
      <div className={`${transitionClass} relative flex justify-center items-center shrink-0 px-1 sm:px-2 text-center z-10 w-auto`}>
        {/* 正常导航栏 */}
        <div className={`${transitionClass} ${(isArticleMode || isListMode) ? 'opacity-0 translate-y-4 pointer-events-none invisible absolute' : 'opacity-100 translate-y-0 pointer-events-auto visible relative'}`}>
          {centerContent}
        </div>

        {/* 列表页统计（桌面端居中） */}
        <div className={`${transitionClass} hidden sm:flex ${isListMode ? 'opacity-100 translate-y-0 pointer-events-auto visible relative' : 'opacity-0 translate-y-4 pointer-events-none invisible absolute'}`}>
          {renderListContext()}
        </div>

        {/* 文章详情标题（缩略居中） */}
        <div className={`${transitionClass} max-w-[45vw] lg:max-w-[400px] xl:max-w-[500px] ${isArticleMode ? 'opacity-100 translate-y-0 pointer-events-auto visible relative' : 'opacity-0 translate-y-4 pointer-events-none invisible absolute'}`}>
          <div
            className="font-semibold text-foreground/80 break-words whitespace-normal text-center w-full mx-auto text-[13px] sm:text-base"
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
        className={`${transitionClass} flex items-center justify-end flex-1 shrink-0 min-w-0 ${
          isArticleMode
            ? 'opacity-100 !flex sm:opacity-50 sm:pointer-events-none'
            : 'opacity-100'
        }`}
      >
        <div className="flex items-center shrink-0">
          {navContent}
        </div>
      </div>
    </div>
  )
}

