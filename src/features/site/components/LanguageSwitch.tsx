'use client'

import { useLanguage } from '@/shared/contexts/LanguageContext'
import { Languages } from 'lucide-react'
import { usePathname, useRouter } from 'next/navigation'
import { TooltipIconButton } from '@/shared/components/TooltipIconButton'

export default function LanguageSwitch() {
  const { locale, toggleLanguage } = useLanguage()
  const pathname = usePathname()
  const router = useRouter()

  const handleLanguageSwitch = () => {
    const nextLocale = locale === 'zh' ? 'en' : 'zh'
    // Write locale cookie for server-side detection
    document.cookie = `locale=${nextLocale};path=/;max-age=31536000;SameSite=Lax`

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
    <TooltipIconButton label={title} side="bottom">
      <button
        onClick={handleLanguageSwitch}
        className="group inline-flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-b from-zinc-50/70 to-white/90 text-zinc-600 shadow-lg shadow-zinc-800/5 ring-1 ring-zinc-900/5 backdrop-blur-md transition-all hover:text-primary-600 hover:ring-zinc-900/10 active:scale-95 dark:from-zinc-900/70 dark:to-zinc-800/90 dark:text-zinc-300 dark:ring-zinc-100/10 dark:hover:text-primary-400 dark:hover:ring-zinc-100/20 outline-none focus:outline-none"
      >
        <Languages
          className="h-[19px] w-[19px] transition-all duration-300 group-hover:scale-110 group-hover:rotate-12 group-hover:text-primary"
          strokeWidth={2.5}
        />
      </button>
    </TooltipIconButton>
  )
}
