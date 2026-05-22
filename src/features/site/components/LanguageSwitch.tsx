'use client'

import { useLanguage } from '@/shared/contexts/LanguageContext'
import { Languages } from 'lucide-react'
import { usePathname, useRouter } from 'next/navigation'

export default function LanguageSwitch() {
  const { locale, toggleLanguage } = useLanguage()
  const pathname = usePathname()
  const router = useRouter()

  const handleLanguageSwitch = () => {
    // 1. 如果在文章详情页，且排除分类页、分页路由和博客首页
    if (
      pathname.startsWith('/blog/') &&
      !pathname.startsWith('/blog/category/') &&
      !pathname.startsWith('/blog/page/') &&
      pathname !== '/blog'
    ) {
      if (pathname.startsWith('/blog/en/')) {
        // 从英文文章跳回中文文章
        const zhSlug = pathname.substring('/blog/en/'.length)
        toggleLanguage()
        router.push(`/blog/${zhSlug}`)
      } else {
        // 从中文文章跳到英文文章
        const zhSlug = pathname.substring('/blog/'.length)
        toggleLanguage()
        router.push(`/blog/en/${zhSlug}`)
      }
    } else {
      // 2. 其他页面，更新全局语言状态并清洗分页路径
      toggleLanguage()
      if (/\/page\/\d+\/?$/.test(pathname)) {
        const newPathname = pathname.replace(/\/page\/\d+\/?$/, '')
        router.push(newPathname)
      }
    }
  }

  const title = locale === 'zh' ? 'Switch to English' : '切换至中文'

  return (
    <button
      title={title}
      onClick={handleLanguageSwitch}
      className="group inline-flex h-8 w-8 sm:h-10 sm:w-10 items-center justify-center rounded-full text-muted-foreground outline-none transition-all hover:bg-primary-500/10 hover:text-primary-600 focus:outline-none active:scale-95 dark:hover:bg-primary-400/15 dark:hover:text-primary-400"
    >
      <Languages 
        className="h-4 w-4 sm:h-[19px] sm:w-[19px] transition-all duration-300 group-hover:scale-110 group-hover:rotate-12 group-hover:text-primary" 
        strokeWidth={2.5} 
      />
    </button>
  )
}
