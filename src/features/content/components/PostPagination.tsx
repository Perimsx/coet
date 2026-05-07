import { motion } from 'framer-motion'
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

  const commonItemClass = "relative flex h-10 w-10 items-center justify-center text-[13px] font-bold transition-colors duration-300 outline-none"
  const navBtnClass = "flex h-10 w-10 items-center justify-center transition-all duration-300 outline-none text-muted-foreground/30 hover:text-primary"

  const renderItem = (page: number) => {
    const isActive = page === currentPage
    const content = (
      <>
        {page}
        {isActive && (
          <motion.div
            layoutId="active-pagination-underline"
            className="absolute bottom-1 h-1 w-4 rounded-full bg-primary shadow-[0_2px_8px_rgba(var(--primary-rgb),0.4)]"
            transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
          />
        )}
      </>
    )

    if (onPageChange) {
      return (
        <button
          key={`page-${page}`}
          onClick={() => onPageChange(page)}
          className={cn(commonItemClass, isActive ? "text-primary" : "text-muted-foreground/40 hover:text-foreground")}
        >
          {content}
        </button>
      )
    }

    return (
      <Link
        key={`page-${page}`}
        href={getPageHref(basePath, page, queryString)}
        className={cn(commonItemClass, isActive ? "text-primary" : "text-muted-foreground/40 hover:text-foreground")}
      >
        {content}
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
        <span className="flex h-10 w-10 items-center justify-center text-muted-foreground/10">
          <Icon size={20} strokeWidth={3} />
        </span>
      )
    }

    if (onPageChange) {
      return (
        <button onClick={() => onPageChange(targetPage)} className={navBtnClass}>
          <Icon size={20} strokeWidth={3} />
        </button>
      )
    }

    return (
      <Link href={getPageHref(basePath, targetPage, queryString)} className={navBtnClass}>
        <Icon size={20} strokeWidth={3} />
      </Link>
    )
  }

  if (totalPages <= 1) return null

  return (
    <div className="flex justify-center mt-2 sm:mt-4 pb-2">
      <nav
        aria-label={dictionary.common.pagination}
        className="relative flex items-center justify-center gap-4"
      >
        {renderNav('prev')}

        <div className="relative flex items-center">
          {/* 背景轨道线 */}
          <div className="absolute bottom-[5px] left-4 right-4 h-[1px] bg-border/20 -z-10" />
          
          <div className="flex items-center">
            {items.map((item, index) => (
              typeof item === 'number' 
                ? renderItem(item)
                : <span key={`${item}-${index}`} className="flex w-8 justify-center text-[10px] font-black text-muted-foreground/20">•••</span>
            ))}
          </div>
        </div>

        {renderNav('next')}
      </nav>
    </div>
  )
}
