'use client'

import { ChevronLeft, ChevronRight } from 'lucide-react'
import { usePathname, useSearchParams } from 'next/navigation'
import Link from '@/shared/components/Link'
import { getNavLanguage } from '@/features/site/lib/nav-language'
import { cn } from '@/shared/utils/utils'

interface PostPaginationProps {
  totalPages: number
  currentPage: number
  onPageChange?: (page: number) => void
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

function getPaginationItems(totalPages: number, currentPage: number): Array<number | 'dots-left' | 'dots-right'> {
  if (totalPages <= 7) return Array.from({ length: totalPages }, (_, i) => i + 1)
  const items: Array<number | 'dots-left' | 'dots-right'> = [1]
  const start = Math.max(2, currentPage - 1)
  const end = Math.min(totalPages - 1, currentPage + 1)
  if (start > 2) items.push('dots-left')
  for (let page = start; page <= end; page += 1) items.push(page)
  if (end < totalPages - 1) items.push('dots-right')
  items.push(totalPages)
  return items
}

export default function PostPagination({ totalPages, currentPage, onPageChange }: PostPaginationProps) {
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const { dictionary } = getNavLanguage()
  const basePath = getBasePath(pathname)
  const queryString = searchParams.toString()
  
  const hasPrev = currentPage > 1
  const hasNext = currentPage < totalPages
  const items = getPaginationItems(totalPages, currentPage)

  const commonItemClass = "relative flex h-8 min-w-[32px] items-center justify-center rounded-[4px] px-2 text-[11px] font-mono font-bold transition-all sm:h-9 sm:min-w-[36px] sm:text-xs outline-none"
  const navBtnClass = "flex h-8 w-8 items-center justify-center rounded-[4px] transition-all outline-none sm:h-9 sm:w-9 text-zinc-400 hover:text-zinc-900 hover:bg-zinc-200 dark:hover:bg-zinc-800 dark:hover:text-zinc-100"

  const renderItem = (page: number) => {
    const isActive = page === currentPage
    const activeClass = "bg-zinc-900 text-zinc-50 dark:bg-zinc-100 dark:text-zinc-900 shadow-sm"
    const inactiveClass = "text-zinc-400 hover:text-zinc-900 dark:text-zinc-500 dark:hover:text-zinc-100 hover:bg-zinc-100 dark:hover:bg-zinc-800"

    if (onPageChange) {
      return (
        <button
          key={`page-${page}`}
          onClick={() => onPageChange(page)}
          className={cn(commonItemClass, isActive ? activeClass : inactiveClass)}
        >
          {page}
        </button>
      )
    }

    return (
      <Link
        key={`page-${page}`}
        href={getPageHref(basePath, page, queryString)}
        className={cn(commonItemClass, isActive ? activeClass : inactiveClass)}
      >
        {page}
      </Link>
    )
  }

  const renderNav = (dir: 'prev' | 'next') => {
    const isPrev = dir === 'prev'
    const targetPage = isPrev ? currentPage - 1 : currentPage + 1
    const Icon = isPrev ? ChevronLeft : ChevronRight
    const isEnabled = isPrev ? hasPrev : hasNext

    if (!isEnabled) {
      return (
        <span className="flex h-8 w-8 items-center justify-center text-zinc-200 dark:text-zinc-800 sm:h-9 sm:w-9">
          <Icon size={16} strokeWidth={2.5} />
        </span>
      )
    }

    if (onPageChange) {
      return (
        <button onClick={() => onPageChange(targetPage)} className={navBtnClass}>
          <Icon size={16} strokeWidth={2.5} />
        </button>
      )
    }

    return (
      <Link href={getPageHref(basePath, targetPage, queryString)} className={navBtnClass}>
        <Icon size={16} strokeWidth={2.5} />
      </Link>
    )
  }

  if (totalPages <= 1) return null

  return (
    <div className="flex justify-center mt-8 sm:mt-12">
      <nav
        aria-label={dictionary.common.pagination}
        className={cn(
          "relative flex items-center justify-center gap-1.5 p-1 sm:gap-2 sm:p-1.5 rounded-md border shadow-sm backdrop-blur-xl transition-all",
          "border-zinc-200 dark:border-zinc-800 bg-zinc-50/60 dark:bg-zinc-900/40"
        )}
      >
        {renderNav('prev')}

        <div className="flex items-center gap-1 sm:gap-1.5">
          {items.map((item, index) => (
            typeof item === 'number' 
              ? renderItem(item)
              : <span key={`${item}-${index}`} className="w-4 text-center text-[10px] font-black text-zinc-300 dark:text-zinc-700">...</span>
          ))}
        </div>

        {renderNav('next')}
      </nav>
    </div>
  )
}
