'use client'

import React, { useRef, useState, useEffect } from 'react'
import { cn } from '@/shared/utils/utils'

const TableWrapper = ({ children }: { children: React.ReactNode }) => {
  const containerRef = useRef<HTMLDivElement>(null)
  const [canScrollLeft, setCanScrollLeft] = useState(false)
  const [canScrollRight, setCanScrollRight] = useState(false)

  const checkScroll = () => {
    if (!containerRef.current) return
    const { scrollLeft, scrollWidth, clientWidth } = containerRef.current
    setCanScrollLeft(scrollLeft > 0)
    // 加入 1px 容错，应对高分屏的像素取整问题
    setCanScrollRight(Math.ceil(scrollLeft + clientWidth) < scrollWidth - 1)
  }

  useEffect(() => {
    checkScroll()
    window.addEventListener('resize', checkScroll)
    return () => window.removeEventListener('resize', checkScroll)
  }, [children])

  return (
    <div className="group relative my-8 overflow-hidden rounded-xl border border-zinc-200/60 bg-white/40 shadow-sm backdrop-blur-md dark:border-white/10 dark:bg-zinc-900/40">
      {/* 左侧滚动边缘渐变遮罩 */}
      <div 
        className={cn(
          "pointer-events-none absolute bottom-0 left-0 top-0 z-10 w-12 bg-gradient-to-r from-white to-transparent opacity-0 transition-opacity duration-300 dark:from-zinc-900",
          canScrollLeft && "opacity-100"
        )}
      />
      
      {/* 右侧滚动边缘渐变遮罩 */}
      <div 
        className={cn(
          "pointer-events-none absolute bottom-0 right-0 top-0 z-10 w-12 bg-gradient-to-l from-white to-transparent opacity-0 transition-opacity duration-300 dark:from-zinc-900",
          canScrollRight && "opacity-100"
        )}
      />
      
      {/* 表格可滚动容器 */}
      <div 
        ref={containerRef}
        onScroll={checkScroll}
        className="no-scrollbar w-full overflow-x-auto"
      >
        <table className={cn(
          "m-0 w-full min-w-[500px] border-collapse text-left text-[14px] sm:min-w-full",
          // 表头重塑
          "[&_th]:border-b [&_th]:border-zinc-200/80 [&_th]:bg-zinc-50/80 [&_th]:px-4 [&_th]:py-3 [&_th]:font-semibold [&_th]:text-zinc-900 [&_th]:backdrop-blur-sm dark:[&_th]:border-white/10 dark:[&_th]:bg-white/5 dark:[&_th]:text-zinc-100",
          // 单元格重塑
          "[&_td]:border-b [&_td]:border-zinc-100 [&_td]:px-4 [&_td]:py-3 [&_td]:text-zinc-600 dark:[&_td]:border-white/5 dark:[&_td]:text-zinc-300",
          // 最后一行去底边
          "[&_tr:last-child_td]:border-b-0",
          // 行悬浮交互态
          "[&_tbody_tr]:transition-colors [&_tbody_tr:hover]:bg-zinc-50/80 dark:[&_tbody_tr:hover]:bg-white/5"
        )}>
          {children}
        </table>
      </div>
    </div>
  )
}

export default TableWrapper
