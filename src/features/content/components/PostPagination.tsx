'use client'

import { motion, AnimatePresence } from 'framer-motion'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { usePathname, useSearchParams } from 'next/navigation'
import Link from '@/shared/components/Link'
import { getNavLanguage } from '@/features/site/lib/nav-language'

interface PostPaginationProps {
  totalPages: number
  currentPage: number
}

function getBasePath(pathname: string) {
  return pathname.replace(/\/page\/\d+\/?$/, '').replace(/\/$/, '')
}

function appendQuery(href: string, queryString: string) {
  return queryString ? `${href}?${queryString}` : href
}

function getPageHref(basePath: string, page: number, queryString: string) {
  const normalizedBase = basePath || ''

  if (page === 1) {
    return appendQuery(normalizedBase ? `${normalizedBase}/` : '/', queryString)
  }

  return appendQuery(`${normalizedBase}/page/${page}`, queryString)
}

function getPaginationItems(
  totalPages: number,
  currentPage: number
): Array<number | 'dots-left' | 'dots-right'> {
  if (totalPages <= 7) {
    return Array.from({ length: totalPages }, (_, i) => i + 1)
  }

  const items: Array<number | 'dots-left' | 'dots-right'> = [1]
  const start = Math.max(2, currentPage - 1)
  const end = Math.min(totalPages - 1, currentPage + 1)

  if (start > 2) items.push('dots-left')
  for (let page = start; page <= end; page += 1) {
    items.push(page)
  }
  if (end < totalPages - 1) items.push('dots-right')
  items.push(totalPages)

  return items
}

export default function PostPagination({ totalPages, currentPage }: PostPaginationProps) {
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const { dictionary } = getNavLanguage()
  const basePath = getBasePath(pathname)
  const queryString = searchParams.toString()
  const prevPage = currentPage - 1 > 0
  const nextPage = currentPage + 1 <= totalPages
  const items = getPaginationItems(totalPages, currentPage)

  return (
    <div className="mt-6 flex justify-center sm:mt-10">
      <nav 
        aria-label={dictionary.common.pagination} 
        className="border-border/30 bg-background/60 shadow-sm relative flex items-center justify-center gap-1 rounded-full border p-1.5 backdrop-blur-xl sm:gap-2 sm:p-2"
      >
        {/* 上一页按钮 */}
        {prevPage ? (
          <Link
            href={getPageHref(basePath, currentPage - 1, queryString)}
            rel="prev"
            className="hover:bg-primary/8 text-muted-foreground/40 hover:text-primary flex h-9 w-9 items-center justify-center rounded-full transition-all hover:scale-110 sm:h-10 sm:w-10"
            aria-label={dictionary.common.previous}
          >
            <ChevronLeft size={18} strokeWidth={2.5} />
          </Link>
        ) : (
          <span className="flex h-9 w-9 items-center justify-center rounded-full text-muted-foreground/10 sm:h-10 sm:w-10">
            <ChevronLeft size={18} strokeWidth={2.5} />
          </span>
        )}

        {/* 页码列表 */}
        <div className="flex items-center gap-1 sm:gap-1.5">
          {items.map((item, idx) => {
            if (typeof item !== 'number') {
              return (
                <span
                  key={`${item}-${idx}`}
                  className="w-4 text-center text-[10px] font-black text-muted-foreground/20"
                >
                  •••
                </span>
              )
            }

            const isActive = item === currentPage

            return (
              <Link
                key={`page-${item}`}
                href={getPageHref(basePath, item, queryString)}
                className={`relative flex h-9 min-w-[36px] items-center justify-center px-2 text-[11px] font-bold transition-colors sm:h-10 sm:min-w-[40px] sm:text-xs ${
                  isActive 
                    ? 'text-primary-foreground' 
                    : 'text-muted-foreground/50 hover:text-primary'
                }`}
              >
                {isActive && (
                  <motion.div
                    layoutId="activeIndicator"
                    className="bg-primary absolute inset-0 z-0 rounded-full shadow-lg shadow-primary/25"
                    transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                  />
                )}
                <span className="relative z-10">{item}</span>
              </Link>
            )
          })}
        </div>

        {/* 下一页按钮 */}
        {nextPage ? (
          <Link
            href={getPageHref(basePath, currentPage + 1, queryString)}
            rel="next"
            className="hover:bg-primary/8 text-muted-foreground/40 hover:text-primary flex h-9 w-9 items-center justify-center rounded-full transition-all hover:scale-110 sm:h-10 sm:w-10"
            aria-label={dictionary.common.next}
          >
            <ChevronRight size={18} strokeWidth={2.5} />
          </Link>
        ) : (
          <span className="flex h-9 w-9 items-center justify-center rounded-full text-muted-foreground/10 sm:h-10 sm:w-10">
            <ChevronRight size={18} strokeWidth={2.5} />
          </span>
        )}
      </nav>
    </div>
  )
}
