'use client'

import { motion, AnimatePresence } from 'framer-motion'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { getNavLanguage } from '@/features/site/lib/nav-language'
import { useToc } from './TocContext'

type TocHeading = {
  value: string
  url: string
  depth: number
}

function getTargetId(url: string) {
  const hashPart = url.includes('#') ? url.split('#').pop() || '' : url
  const normalized = hashPart.replace(/^#/, '').trim()
  if (!normalized) return ''
  try {
    return decodeURIComponent(normalized)
  } catch {
    return normalized
  }
}

function getOptionalCommonLabel(
  common: Record<string, unknown>,
  key: string,
  fallback: string
) {
  const value = common[key]
  return typeof value === 'string' ? value : fallback
}

export default function FloatingToc({ toc }: { toc?: TocHeading[] }) {
  const { isTocOpen: open, setIsTocOpen: setOpen } = useToc()
  const [activeId, setActiveId] = useState('')
  const listContainerRef = useRef<HTMLElement | null>(null)
  const isUserInteractingRef = useRef(false)
  const interactTimerRef = useRef<number | null>(null)
  const tickingRef = useRef(false)
  const { dictionary } = getNavLanguage()

  const tocItems = useMemo(() => {
    return (toc || [])
      .filter((item) => item.depth >= 2 && item.depth <= 4)
      .map((item) => ({ ...item, targetId: getTargetId(item.url) }))
      .filter((item) => item.targetId)
  }, [toc])

  const tocIds = useMemo(() => {
    return tocItems.map((item) => item.targetId)
  }, [tocItems])

  const activeIndex = useMemo(() => {
    if (!activeId) return -1
    return tocItems.findIndex((item) => item.targetId === activeId)
  }, [activeId, tocItems])

  const progressLabel = useMemo(() => {
    if (!tocItems.length) return '0%'
    if (activeIndex < 0) return '0%'
    const percent = Math.round(((activeIndex + 1) / tocItems.length) * 100)
    return `${percent}%`
  }, [activeIndex, tocItems.length])



  const updateActiveToc = useCallback(() => {
    if (!tocIds.length) {
      setActiveId('')
      return
    }

    const headings = tocIds
      .map((id) => document.getElementById(id))
      .filter((node): node is HTMLElement => Boolean(node))

    if (!headings.length) {
      setActiveId('')
      return
    }

    const viewportHeight = window.innerHeight
    // 调整检测阈值至 0.45，实现正文滚动到近中间位置时即切换高亮
    const threshold = viewportHeight * 0.45

    let currentActive = ''

    for (let i = headings.length - 1; i >= 0; i--) {
      const heading = headings[i]
      const rect = heading.getBoundingClientRect()
      
      if (rect.top <= threshold) {
        currentActive = heading.id
        break
      }
    }

    if (!currentActive && window.scrollY < 100) {
      setActiveId('')
    } else if (currentActive) {
      setActiveId(currentActive)
    }
  }, [tocIds])

  useEffect(() => {
    if (!tocIds.length) return

    const onScroll = () => {
      if (tickingRef.current) return
      tickingRef.current = true
      window.requestAnimationFrame(() => {
        updateActiveToc()
        tickingRef.current = false
      })
    }

    const onHashChange = () => updateActiveToc()
    document.addEventListener('scroll', onScroll, { capture: true, passive: true })
    window.addEventListener('hashchange', onHashChange)
    const initTimer = window.setTimeout(updateActiveToc, 80)

    return () => {
      document.removeEventListener('scroll', onScroll, true)
      window.removeEventListener('hashchange', onHashChange)
      window.clearTimeout(initTimer)
    }
  }, [tocIds, updateActiveToc])

  useEffect(() => {
    if (!open || !activeId || isUserInteractingRef.current || !listContainerRef.current) return

    const container = listContainerRef.current
    const activeLink = container.querySelector<HTMLAnchorElement>(`a[data-target="${activeId}"]`)
    if (!activeLink) return

    const scrollToIndex = () => {
      const containerRect = container.getBoundingClientRect()
      const linkRect = activeLink.getBoundingClientRect()
      const relativeTop = linkRect.top - containerRect.top
      const currentScrollTop = container.scrollTop
      
      // 核心触发逻辑：当高亮项在容器中的位置超过中线（0.5）或太靠近顶部（0.1）时，触发重置
      const isPastMiddle = relativeTop > container.clientHeight * 0.5
      const isTooNearTop = relativeTop < container.clientHeight * 0.1
      
      if (isPastMiddle || isTooNearTop) {
        // 目标：将高亮项对齐到容器的 1/4 (25%) 高度处，实现“上翻”的视觉反馈
        const targetScrollTop = currentScrollTop + relativeTop - (container.clientHeight * 0.25)
        
        container.scrollTo({
          top: targetScrollTop,
          behavior: 'smooth'
        })
      }
    }

    // 增加一个微小延迟，确保 DOM 布局已稳定
    const timer = setTimeout(scrollToIndex, 10)
    return () => clearTimeout(timer)
  }, [activeId, open])

  // 处理面板初次打开时的对齐
  useEffect(() => {
    if (open && activeId && listContainerRef.current) {
      const container = listContainerRef.current
      const timer = setTimeout(() => {
        const activeLink = container.querySelector<HTMLAnchorElement>(`a[data-target="${activeId}"]`)
        if (activeLink) {
          const containerRect = container.getBoundingClientRect()
          const linkRect = activeLink.getBoundingClientRect()
          const relativeTop = linkRect.top - containerRect.top
          const targetScrollTop = container.scrollTop + relativeTop - (container.clientHeight * 0.25)
          container.scrollTo({
            top: targetScrollTop,
            behavior: 'smooth'
          })
        }
      }, 300) 
      return () => clearTimeout(timer)
    }
  }, [activeId, open])

  useEffect(() => {
    if (!open || !listContainerRef.current) return

    const disableAutoScroll = () => {
      isUserInteractingRef.current = true
      if (interactTimerRef.current) {
        window.clearTimeout(interactTimerRef.current)
      }
    }

    const enableAutoScroll = () => {
      if (interactTimerRef.current) {
        window.clearTimeout(interactTimerRef.current)
      }
      interactTimerRef.current = window.setTimeout(() => {
        isUserInteractingRef.current = false
      }, 600) // 略微缩短恢复时间
    }

    const container = listContainerRef.current
    // 移除 mouseenter/mouseleave 锁定，仅锁定主动滚动/触控
    container.addEventListener('wheel', disableAutoScroll, { passive: true })
    container.addEventListener('touchstart', disableAutoScroll, { passive: true })
    container.addEventListener('touchmove', disableAutoScroll, { passive: true })
    container.addEventListener('touchend', enableAutoScroll, { passive: true })

    return () => {
      container.removeEventListener('wheel', disableAutoScroll)
      container.removeEventListener('touchstart', disableAutoScroll)
      container.removeEventListener('touchmove', disableAutoScroll)
      container.removeEventListener('touchend', enableAutoScroll)
      if (interactTimerRef.current) {
        window.clearTimeout(interactTimerRef.current)
        interactTimerRef.current = null
      }
      isUserInteractingRef.current = false
    }
  }, [open])

  if (!tocItems.length) return null

  return (
    <>
      <motion.button
        type="button"
        aria-label={open ? dictionary.toc.close : dictionary.toc.open}
        aria-expanded={open}
        aria-controls="floating-toc-panel"
        onClick={() => setOpen(!open)}
        whileHover={{ scale: 1.05, y: -2 }}
        whileTap={{ scale: 0.95 }}
        className={`group fixed z-[80] flex items-center justify-center transition-all duration-500 
          bottom-[calc(1.5rem+env(safe-area-inset-bottom))] left-4 h-12 w-12 rounded-full border shadow-[0_8px_30px_rgba(0,0,0,0.15)] 
          bg-background/80 backdrop-blur-xl dark:bg-gray-900/80
          sm:top-[55%] sm:left-auto sm:right-6 sm:bottom-auto sm:h-12 sm:w-auto sm:min-w-[52px] sm:px-3.5 sm:-translate-y-1/2 sm:rounded-full 
          sm:border-border/40 dark:sm:border-white/15 
          sm:shadow-[0_8px_25px_-5px_rgba(0,0,0,0.1)] sm:hover:shadow-[0_20px_40px_-12px_rgba(0,0,0,0.15)]
          sm:text-gray-600 dark:sm:text-gray-300 xl:right-10
          ${open 
            ? 'border-primary/20 text-primary !bg-primary/20 sm:opacity-0 sm:pointer-events-none' 
            : 'border-border/40 text-gray-700 dark:border-white/10 dark:text-gray-200'
          }`}
      >
        <div className="relative h-5 w-5 flex-shrink-0">
          <motion.div
            initial={false}
            animate={{ 
              rotate: open ? 45 : 0, 
              y: open ? 0 : -6,
            }}
            className="absolute top-1/2 left-0 h-[2.5px] w-5 origin-center rounded-full bg-current transition-colors group-hover:text-primary"
          />
          <motion.div
            initial={false}
            animate={{ 
              opacity: open ? 0 : 1,
              x: open ? 10 : 0
            }}
            className="absolute top-1/2 left-0 h-[2.5px] w-3.5 -translate-y-1/2 rounded-full bg-current transition-colors group-hover:text-primary"
          />
          <motion.div
            initial={false}
            animate={{ 
              rotate: open ? -45 : 0, 
              y: open ? 0 : 6,
            }}
            className="absolute top-1/2 left-0 h-[2.5px] w-5 origin-center rounded-full bg-current transition-colors group-hover:text-primary"
          />
        </div>
        <span className="hidden text-[14px] font-black tracking-tighter transition-colors sm:ml-2 sm:inline-block group-hover:text-primary">
          {progressLabel}
        </span>
      </motion.button>
      <AnimatePresence>
        {open && (
          <motion.aside
            id="floating-toc-panel"
            key="toc-panel"
            initial={{ opacity: 0, y: 30, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 30, scale: 0.95 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className="fixed bottom-[calc(5.5rem+env(safe-area-inset-bottom))] left-4 z-[70] flex max-h-[50vh] w-[min(85vw,300px)] flex-col overflow-hidden rounded-2xl border border-border/40 bg-background/95 backdrop-blur-2xl shadow-2xl dark:border-white/10 dark:bg-gray-900/95 lg:bottom-auto lg:top-[3.75rem] lg:left-auto lg:right-[calc(50vw-512px-270px-15px)] lg:h-[calc(100vh-3.75rem-6rem)] lg:max-h-none lg:w-[270px] lg:rounded-none lg:rounded-bl-2xl lg:border-none lg:bg-transparent lg:dark:bg-transparent lg:shadow-none lg:transform-none select-none"
          >
            <div className="flex items-center justify-between px-3.5 pt-2 pb-0.5">
              <h3 className="text-[14px] font-bold tracking-tight text-gray-900 dark:text-gray-100">
                {dictionary.toc.title}
              </h3>
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
                  title={getOptionalCommonLabel(
                    dictionary.common as Record<string, unknown>,
                    'backToTop',
                    '回到顶部'
                  )}
                  className="flex h-8 w-8 items-center justify-center rounded-full text-gray-400 transition-all hover:bg-gray-100 hover:text-gray-900 dark:hover:bg-white/10 dark:hover:text-gray-100"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><path d="m16 12-4-4-4 4"/><path d="M12 16V8"/></svg>
                </button>
                <button
                  type="button"
                  onClick={() => document.getElementById('comment')?.scrollIntoView({ behavior: 'smooth' })}
                  title={getOptionalCommonLabel(
                    dictionary.common as Record<string, unknown>,
                    'viewComments',
                    '查看评论'
                  )}
                  className="flex h-8 w-8 items-center justify-center rounded-full text-gray-400 transition-all hover:bg-gray-100 hover:text-gray-900 dark:hover:bg-white/10 dark:hover:text-gray-100"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M7.9 20A9 9 0 1 0 4 16.1L2 22Z"/></svg>
                </button>
                <div className="w-px h-3 bg-gray-200 dark:bg-gray-700 mx-0.5" />
                <button
                  type="button"
                  onClick={() => setOpen(false)}
                  title={dictionary.toc.close}
                  className="flex h-8 w-8 items-center justify-center rounded-full text-gray-400 transition-all hover:bg-red-50 hover:text-red-500 dark:hover:bg-red-500/10 dark:hover:text-red-400"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>
                </button>
              </div>
            </div>

            <div className="flex flex-1 flex-col px-1.5 pt-0 pb-0 min-h-0 sm:px-2">
              <nav
                ref={listContainerRef}
                className="no-scrollbar min-h-0 flex-1 overflow-y-auto pr-1 [mask-image:linear-gradient(to_bottom,transparent,black_24px,black_calc(100%-24px),transparent)]"
              >
                <ul className="relative py-6 space-y-[2px] border-l border-gray-200/80 dark:border-gray-700/60">
                  {tocItems.map((item, index) => {
                    const isActive = activeId === item.targetId
                    return (
                      <li key={`${item.url}-${index}`} className="relative leading-normal">
                        <a
                          href={item.url}
                          data-target={item.targetId}
                          aria-current={isActive ? 'location' : undefined}
                          onClick={() => {
                            if (window.innerWidth < 640) {
                              setOpen(false)
                            }
                          }}
                          className={`group relative flex items-start rounded-lg px-2.5 py-1.5 transition-all duration-300 ${
                            isActive
                              ? 'bg-muted font-bold text-gray-900 dark:bg-white/10 dark:text-gray-100'
                              : 'font-medium text-gray-500 hover:bg-muted/40 dark:text-gray-400 dark:hover:bg-white/5 dark:hover:text-gray-100'
                          }`}
                          style={{
                            paddingLeft: `${Math.max(0, item.depth - 2) * 12 + 10}px`,
                            fontSize: item.depth === 2 ? '13px' : '12px'
                          }}
                        >
                          {isActive && (
                            <motion.div
                              layoutId="active-toc-indicator"
                              className="absolute left-[-2px] top-1 bottom-1 w-[3px] rounded-full bg-primary shadow-[0_0_8px_rgba(59,130,246,0.4)]"
                              transition={{
                                type: 'spring',
                                stiffness: 350,
                                damping: 30
                              }}
                            />
                          )}
                          <span className={isActive ? 'whitespace-normal break-words' : 'truncate'}>
                            {item.value}
                          </span>
                        </a>
                      </li>
                    )
                  })}
                </ul>
              </nav>
            </div>
          </motion.aside>
        )}
      </AnimatePresence>
    </>
  )
}
