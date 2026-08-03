'use client'

import { useToc } from './TocContext'
import { ReactNode } from 'react'

export function PostLayoutContent({
  header,
  children,
  toc,
}: {
  header?: ReactNode
  children: ReactNode
  toc?: ReactNode
}) {
  const { isTocOpen } = useToc()

  return (
    <div className="w-full relative">
      {/* 物理绝对居中的主内容容器 */}
      <div className="mx-auto w-full max-w-4xl lg:max-w-5xl px-4 sm:px-6 space-y-8 sm:space-y-10">
        {/* 1. 居中 Header */}
        {header && (
          <header className="fly-post-header border-b border-border/50 pb-6 pt-2">
            {header}
          </header>
        )}

        {/* 2. 居中正文主体与外挂 TOC */}
        <div className="relative w-full">
          <article className="min-w-0 w-full transition-all duration-500">
            {children}
          </article>

          {/* 3. 桌面端目录：fixed 定位锁定在视口 top-[15vh] 右侧，整体向右贴合移动，避免遮挡正文 */}
          {toc && (
            <div
              className={`hidden lg:block fixed top-[15vh] right-1 sm:right-2 lg:right-3 xl:right-6 z-[50] transition-all duration-500 ease-in-out
                ${isTocOpen ? 'w-[240px] xl:w-[270px] opacity-100 pointer-events-auto' : 'w-0 opacity-0 pointer-events-none'}
              `}
            >
              {toc}
            </div>
          )}

          {/* 移动端 / 窄屏目录 */}
          <div className="lg:hidden">
            {toc}
          </div>
        </div>
      </div>
    </div>
  )
}
