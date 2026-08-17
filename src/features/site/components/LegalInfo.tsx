'use client'

import React, { useMemo, useSyncExternalStore } from 'react'
import Link from '@/shared/components/Link'
import { useTheme } from 'next-themes'
import type { FooterPresentation } from '@/blog.config'
import { useLanguage } from '@/shared/contexts/LanguageContext'

interface LegalInfoProps {
  className?: string
  siteTitle?: string
  siteCreatedAt?: string
  icp?: string
  policeBeian?: string
  footer?: FooterPresentation
}

const emptySubscribe = () => () => {}

function useIsMounted() {
  return useSyncExternalStore(
    emptySubscribe,
    () => true,
    () => false
  )
}

function calculateRunDays(createdAt?: string): number {
  const start = createdAt ? new Date(createdAt).getTime() : new Date('2025-11-10').getTime()
  const now = Date.now()
  const diff = now - start
  return Math.max(1, Math.floor(diff / (1000 * 60 * 60 * 24)))
}

export default function LegalInfo({
  className = '',
  siteTitle = '序栈',
  siteCreatedAt = '2025-11-10',
  icp = '',
  policeBeian = '',
  footer,
}: LegalInfoProps) {
  const currentYear = useMemo(() => new Date().getFullYear(), [])
  const { setTheme, theme } = useTheme()
  const { locale, setLocale } = useLanguage()
  const mounted = useIsMounted()
  const runDays = useMemo(() => calculateRunDays(siteCreatedAt), [siteCreatedAt])
  const isEn = locale === 'en'

  const poweredByLabel = footer?.poweredByLabel || (isEn ? 'Powered by' : '基于')
  const poweredByName = footer?.poweredByName || (isEn ? 'XuZhan System' : '序栈系统')
  const rightsText = footer?.rightsText || (isEn ? 'All rights reserved' : '保留所有权利')
  const runtimeLabel = footer?.runtimeLabel || (isEn ? 'Site has been running for' : '站点已稳健运行')

  return (
    <div className={`w-full ${className}`}>
      {/* 渐变过渡 */}
      <div
        className="relative z-[1] mt-20 -mb-px h-9 md:h-14 pointer-events-none"
        style={{
          background:
            'linear-gradient(to bottom, transparent, color-mix(in oklab, var(--color-accent) 4%, var(--color-root-bg, #fff)))',
        }}
      />

      {/* 页脚主体 */}
      <div
        className="relative z-[1] pb-12 pt-2 border-t border-border/40"
        style={{
          background:
            'color-mix(in oklab, var(--color-accent) 4%, var(--color-root-bg, #fff))',
        }}
      >
        <div className="px-4 sm:px-8">
          <div className="mx-auto min-w-0 max-w-7xl lg:px-8">
            {/* 桌面端布局 */}
            <div className="hidden min-w-0 md:flex md:gap-16 lg:gap-24">
              {/* 左侧品牌与运行信息 */}
              <div className="w-80 max-w-[min(100%,22rem)] shrink-0">
                <div className="text-title-20 font-semibold tracking-wide text-foreground font-serif">
                  <Link href="/" className="hover:text-accent transition-colors">
                    {siteTitle}
                  </Link>
                </div>
                <div className="mt-2 text-copy-13 leading-relaxed italic text-muted-foreground font-serif">
                  {isEn
                    ? 'Seeking a tranquil haven of life in an ordered world.'
                    : '在有序的世界里，寻一处生活的归栈。'}
                </div>

                <div className="mt-6 text-copy-13 leading-normal text-muted-foreground">
                  <div>
                    © {siteCreatedAt ? siteCreatedAt.slice(0, 4) : '2025'}-{currentYear}{' '}
                    <span className="font-medium text-foreground">{siteTitle}</span>. {rightsText}.
                  </div>
                  <div className="mt-1 text-copy-13">
                    {poweredByLabel}{' '}
                    <span className="font-medium text-foreground/90">{poweredByName}</span>
                  </div>
                </div>

                {/* 运行天数与活跃状态 */}
                <div className="mt-3 text-copy-13 text-muted-foreground">
                  <div className="inline-flex items-center gap-2">
                    <span className="inline-flex items-center gap-1.5">
                      <span className="inline-block size-[6px] rounded-full bg-emerald-500 animate-pulse" />
                      <span>
                        {runtimeLabel}{' '}
                        <span className="tabular-nums font-semibold text-foreground px-0.5">
                          {runDays}
                        </span>{' '}
                        {isEn ? 'days' : '天'}
                      </span>
                    </span>
                  </div>
                </div>
              </div>

              {/* 右侧导航列 */}
              <div className="flex min-w-0 flex-1 justify-end gap-16 lg:gap-24 pt-0.5">
                <div>
                  <div className="mb-3 text-caption-10 font-semibold uppercase tracking-[2px] text-muted-foreground">
                    {isEn ? 'About' : '关于'}
                  </div>
                  <div className="text-copy-13 leading-[2.4]">
                    <Link
                      className="block text-foreground/80 hover:text-accent transition-colors"
                      href="/about"
                    >
                      {isEn ? 'About Me' : '关于本站与作者'}
                    </Link>
                    <a
                      rel="noreferrer"
                      target="_blank"
                      className="block text-foreground/80 hover:text-accent transition-colors"
                      href="https://github.com/kerntau/blog"
                    >
                      {isEn ? 'Source Code' : '开源仓库'}
                      <span className="ml-0.5 text-muted-foreground/60"> ↗</span>
                    </a>
                    <a
                      rel="noreferrer"
                      target="_blank"
                      className="block text-foreground/80 hover:text-accent transition-colors"
                      href="/sitemap.xml"
                    >
                      {isEn ? 'Sitemap' : '站点地图'}
                    </a>
                  </div>
                </div>

                <div>
                  <div className="mb-3 text-caption-10 font-semibold uppercase tracking-[2px] text-muted-foreground">
                    {isEn ? 'Explore' : '探索'}
                  </div>
                  <div className="text-copy-13 leading-[2.4]">
                    <Link
                      className="block text-foreground/80 hover:text-accent transition-colors"
                      href="/archive"
                    >
                      {isEn ? 'Timeline' : '文章归档'}
                    </Link>
                    <Link
                      className="block text-foreground/80 hover:text-accent transition-colors"
                      href="/blog/category"
                    >
                      {isEn ? 'Categories' : '分类导航'}
                    </Link>
                    <Link
                      className="block text-foreground/80 hover:text-accent transition-colors"
                      href="/tags"
                    >
                      {isEn ? 'Tags' : '标签索引'}
                    </Link>
                    <Link
                      className="block text-foreground/80 hover:text-accent transition-colors"
                      href="/friends"
                    >
                      {isEn ? 'Friends' : '友情链接'}
                    </Link>
                  </div>
                </div>

                <div>
                  <div className="mb-3 text-caption-10 font-semibold uppercase tracking-[2px] text-muted-foreground">
                    {isEn ? 'Connect' : '连接'}
                  </div>
                  <div className="text-copy-13 leading-[2.4]">
                    <a
                      rel="noreferrer"
                      target="_blank"
                      className="block text-foreground/80 hover:text-accent transition-colors"
                      href="https://github.com/kerntau"
                    >
                      GitHub<span className="ml-0.5 text-muted-foreground/60"> ↗</span>
                    </a>
                    <a
                      rel="noreferrer"
                      target="_blank"
                      className="block text-foreground/80 hover:text-accent transition-colors"
                      href="/feed.xml"
                    >
                      RSS 订阅
                    </a>
                    <Link
                      className="block text-foreground/80 hover:text-accent transition-colors"
                      href="/friends"
                    >
                      {isEn ? 'Guestbook' : '友链留言'}
                    </Link>
                  </div>
                </div>
              </div>
            </div>

            {/* 移动端布局 */}
            <div className="md:hidden">
              <div className="mb-5">
                <div className="mb-1 text-copy-16 font-semibold text-foreground font-serif">
                  <Link href="/">{siteTitle}</Link>
                </div>
                <div className="text-copy-13 leading-relaxed italic text-muted-foreground font-serif">
                  {isEn
                    ? 'Seeking a tranquil haven of life in an ordered world.'
                    : '在有序的世界里，寻一处生活的归栈。'}
                </div>
              </div>

              <div className="mb-5">
                <div className="text-copy-13 leading-[2.2] text-foreground/85">
                  <span>
                    <Link className="hover:underline hover:text-accent" href="/about">
                      {isEn ? 'About' : '关于'}
                    </Link>
                    <span aria-hidden="true" className="mx-1.5 text-muted-foreground/40 select-none">
                      ·
                    </span>
                  </span>
                  <span>
                    <Link className="hover:underline hover:text-accent" href="/archive">
                      {isEn ? 'Archive' : '归档'}
                    </Link>
                    <span aria-hidden="true" className="mx-1.5 text-muted-foreground/40 select-none">
                      ·
                    </span>
                  </span>
                  <span>
                    <Link className="hover:underline hover:text-accent" href="/blog/category">
                      {isEn ? 'Categories' : '分类'}
                    </Link>
                    <span aria-hidden="true" className="mx-1.5 text-muted-foreground/40 select-none">
                      ·
                    </span>
                  </span>
                  <span>
                    <Link className="hover:underline hover:text-accent" href="/tags">
                      {isEn ? 'Tags' : '标签'}
                    </Link>
                    <span aria-hidden="true" className="mx-1.5 text-muted-foreground/40 select-none">
                      ·
                    </span>
                  </span>
                  <span>
                    <Link className="hover:underline hover:text-accent" href="/friends">
                      {isEn ? 'Friends' : '友链'}
                    </Link>
                  </span>
                </div>
              </div>

              <div className="border-t border-border/40 pt-4 text-copy-13 leading-relaxed text-muted-foreground">
                <div>
                  © {siteCreatedAt ? siteCreatedAt.slice(0, 4) : '2025'}-{currentYear} {siteTitle}. {rightsText}.
                </div>
                <div className="mt-1 flex items-center gap-1.5">
                  <span className="size-[5px] rounded-full bg-emerald-500" />
                  <span>
                    {runtimeLabel}{' '}
                    <span className="tabular-nums font-medium text-foreground">{runDays}</span>{' '}
                    {isEn ? 'days' : '天'}
                  </span>
                </div>
                {icp && (
                  <div className="mt-1.5">
                    <a
                      href="https://beian.miit.gov.cn/"
                      target="_blank"
                      rel="noreferrer"
                      className="hover:text-accent transition-colors"
                    >
                      {icp}
                    </a>
                  </div>
                )}
                {policeBeian && (
                  <div className="mt-1">
                    <a
                      href="http://www.beian.gov.cn/portal/registerSystemInfo"
                      target="_blank"
                      rel="noreferrer"
                      className="hover:text-accent transition-colors"
                    >
                      {policeBeian}
                    </a>
                  </div>
                )}
              </div>
            </div>

            {/* 桌面端底部条 */}
            <div className="mt-8 hidden border-t border-border/40 pt-4 md:flex md:items-center md:justify-between text-copy-13 text-muted-foreground">
              <div className="flex items-center gap-3">
                <a
                  href="/feed.xml"
                  rel="noreferrer"
                  target="_blank"
                  className="hover:text-accent transition-colors"
                >
                  RSS
                </a>
                <span aria-hidden="true" className="select-none text-muted-foreground/30">
                  ·
                </span>
                <a
                  href="/sitemap.xml"
                  rel="noreferrer"
                  target="_blank"
                  className="hover:text-accent transition-colors"
                >
                  {isEn ? 'Sitemap' : '站点地图'}
                </a>
                <span aria-hidden="true" className="select-none text-muted-foreground/30">
                  ·
                </span>
                <Link href="/archive" className="hover:text-accent transition-colors">
                  {isEn ? 'Archive' : '归档'}
                </Link>

                <span aria-hidden="true" className="select-none text-muted-foreground/30 mx-1">
                  |
                </span>

                {/* 主题切换 */}
                {mounted && (
                  <span className="inline-flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => setTheme('light')}
                      className={`cursor-pointer transition-colors ${
                        theme === 'light'
                          ? 'text-accent font-medium'
                          : 'text-muted-foreground hover:text-foreground'
                      }`}
                    >
                      Light
                    </button>
                    <span className="select-none text-muted-foreground/30">·</span>
                    <button
                      type="button"
                      onClick={() => setTheme('system')}
                      className={`cursor-pointer transition-colors ${
                        theme === 'system'
                          ? 'text-accent font-medium'
                          : 'text-muted-foreground hover:text-foreground'
                      }`}
                    >
                      System
                    </button>
                    <span className="select-none text-muted-foreground/30">·</span>
                    <button
                      type="button"
                      onClick={() => setTheme('dark')}
                      className={`cursor-pointer transition-colors ${
                        theme === 'dark'
                          ? 'text-accent font-medium'
                          : 'text-muted-foreground hover:text-foreground'
                      }`}
                    >
                      Dark
                    </button>
                  </span>
                )}

                <span aria-hidden="true" className="select-none text-muted-foreground/30 mx-1">
                  |
                </span>

                {/* 语言切换 */}
                <button
                  type="button"
                  onClick={() => setLocale(locale === 'zh' ? 'en' : 'zh')}
                  className="rounded-md px-1.5 py-0.5 transition-colors hover:bg-neutral-2 text-foreground/80 hover:text-foreground cursor-pointer"
                >
                  {locale === 'zh' ? '简体中文' : 'English'}
                </button>
              </div>

              {/* 备案号区域 */}
              <div className="flex items-center gap-4">
                {icp && (
                  <a
                    rel="noreferrer"
                    target="_blank"
                    href="https://beian.miit.gov.cn/"
                    className="hover:text-accent transition-colors"
                  >
                    {icp}
                  </a>
                )}
                {policeBeian && (
                  <a
                    rel="noreferrer"
                    target="_blank"
                    href="http://www.beian.gov.cn/portal/registerSystemInfo"
                    className="hover:text-accent transition-colors"
                  >
                    {policeBeian}
                  </a>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
