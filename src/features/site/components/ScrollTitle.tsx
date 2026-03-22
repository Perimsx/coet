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
  }
}) {
  const pathname = usePathname()
  const isPostDetailPage = isBlogPostDetailPath(pathname)
  const [articleTitle, setArticleTitle] = useState<string | null>(null)
  const [mode, setMode] = useState<'normal' | 'article'>('normal')
  const [isScrolling, setIsScrolling] = useState(false)
  const scrollTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const scrollStopTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  // 使用正则匹配特定页面及其子页面（如 /blog/page/2）
  const isAllPostsPage = /^\/blog(?:\/|$)/.test(pathname || '')
  const isArchivePage = /^\/archive(?:\/|$)/.test(pathname || '')
  const isTagsPage = /^\/tags(?:\/|$)/.test(pathname || '')
  const isListContextPage = (isAllPostsPage || isArchivePage || isTagsPage) && !isPostDetailPage

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
    // 如果不是文章详情页也不是特定上下文页，不进入 article/context 模式
    if ((!isPostDetailPage || !articleTitle) && !isListContextPage) {
      setMode('normal')
      return
    }

    const handleScroll = () => {
      // 停止滚动检测
      setIsScrolling(true)
      if (scrollStopTimerRef.current) {
        clearTimeout(scrollStopTimerRef.current)
      }
      scrollStopTimerRef.current = setTimeout(() => {
        setIsScrolling(false)
      }, 500)

      // 如果是特定上下文页，滚动阈值固定为 40 即可
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
  const isListMode = isListContextPage && mode === 'article' && isScrolling
  const transitionClass =
    'transition-all duration-500 [transition-timing-function:cubic-bezier(0.16,1,0.3,1)]'

  // 生成列表页面统计内容
  const renderListContext = () => {
    let title = ""
    let subtitle = ""

    if (isAllPostsPage) {
      title = "全部文章"
      subtitle = `共 ${stats.postCount} 篇 · ${stats.categoryCount} 个分类`
    } else if (isArchivePage) {
      title = "全站归档"
      subtitle = `共 ${stats.postCount} 篇文章记录`
    } else if (isTagsPage) {
      title = "标签检索"
      subtitle = `共 ${stats.tagCount} 个标签 · ${stats.postCount} 篇文章`
    }

    if (!title) return null

    return (
      <div className="flex flex-col items-start justify-center min-w-0">
        <span className="text-gray-900 dark:text-gray-100 text-sm font-bold tracking-tight leading-tight truncate max-w-full">
          {title}
        </span>
        <span className="text-[10px] text-muted-foreground font-medium mt-0.5 leading-none opacity-80">
          {subtitle}
        </span>
      </div>
    )
  }

  return (
    <div 
      className={`relative flex min-h-[1.5rem] w-full items-center justify-between ${transitionClass}`}
      data-is-article-mode={(isArticleMode || isListMode) ? 'true' : 'false'}
    >
      {/* 左侧区域：标志（始终显示）+ 动态标题 */}
      <div className={`${transitionClass} flex items-center flex-1 min-w-0 relative h-10`}>
        {/* 标志部分 - 始终可见 */}
        <motion.div 
          className={`${transitionClass} flex shrink-0 ${isArticleMode ? 'opacity-0 scale-90 pointer-events-none' : 'opacity-100 scale-100'}`}
          whileHover={{ scale: 1.1, rotate: -3 }}
          whileTap={{ scale: 0.9, rotate: 3 }}
          transition={{ type: "spring", stiffness: 400, damping: 10 }}
        >
          {logo}
        </motion.div>

        {/* 动态标题部分：站点标题与列表页上下文 */}
        <div className="ml-2 relative flex-1 min-w-0 h-full">
          {/* 原始站名 */}
            {/* 原始站名已移除 */}


          {/* 列表页特定标题 + 统计 (仅在列表页滚动时显示) */}
          {isListContextPage && (
            <div 
              className={`${transitionClass} absolute inset-0 flex items-center ${
                isListMode ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4 pointer-events-none'
              }`}
            >
              {renderListContext()}
            </div>
          )}
        </div>
      </div>

      {/* 中间区域：导航链接 / 文章详情标题 */}
      <div
        className={`${transitionClass} relative hidden sm:flex shrink-0 items-center justify-center px-2 text-center z-10`}
      >
        {/* 核心导航链接（列表模式下也要保持居中显示） */}
        <div className={`${transitionClass} ${isArticleMode ? 'opacity-0 translate-y-4 pointer-events-none' : 'opacity-100 translate-y-0 pointer-events-auto'}`}>
           {centerContent}
        </div>

        {/* 文章详情页长标题 (仅在文章模式下显示) */}
        {isPostDetailPage && (
          <div 
            className={`${transitionClass} absolute inset-0 flex items-center justify-center ${
              isArticleMode ? 'opacity-100 translate-y-0 pointer-events-auto' : 'opacity-0 translate-y-4 pointer-events-none'
            }`}
          >
             <span className="mx-auto block max-w-full truncate text-sm font-bold tracking-tight text-gray-900 sm:text-[1.125rem] dark:text-gray-100">
               {articleTitle}
             </span>
          </div>
        )}
      </div>

      {/* 右侧区域 */}
      <div
        className={`${transitionClass} flex items-center justify-end flex-1 ${
          isArticleMode ? 'sm:translate-x-12 sm:opacity-0 opacity-0 pointer-events-none' : 'translate-x-0 opacity-100'
        }`}
      >
        {navContent}
      </div>
    </div>
  )
}

