'use client'

import { useEffect, useState } from 'react'
import { useTheme } from 'next-themes'

import { SunMedium, MoonStar } from 'lucide-react'
import { TooltipIconButton } from '@/shared/components/TooltipIconButton'
import { useNavLanguage } from '@/features/site/lib/nav-language'

const Blank = () => <svg className="h-5 w-5" />

const ThemeSwitch = () => {
  const [mounted, setMounted] = useState(false)
  const { setTheme, resolvedTheme } = useTheme()
  const { locale } = useNavLanguage()
  const themeLabel = locale === 'en' ? 'Toggle theme' : '切换明暗主题'

  // 客户端挂载完成后再显示 UI
  useEffect(() => setMounted(true), [])

  const toggleTheme = (event: React.MouseEvent) => {
    const isDark = resolvedTheme === 'dark'
    const nextTheme = isDark ? 'light' : 'dark'

    // Write cookie for Edge Function theme injection
    document.cookie = `theme=${nextTheme};path=/;max-age=31536000;SameSite=Lax`

    if (!document.startViewTransition) {
      setTheme(nextTheme)
      return
    }

    const x = event.clientX
    const y = event.clientY
    const endRadius = Math.hypot(
      Math.max(x, window.innerWidth - x),
      Math.max(y, window.innerHeight - y)
    )

    const transition = document.startViewTransition(() => {
      setTheme(nextTheme)
    })

    transition.ready.then(() => {
      const clipPath = [
        `circle(0px at ${x}px ${y}px)`,
        `circle(${endRadius}px at ${x}px ${y}px)`,
      ]
      document.documentElement.animate(
        {
          clipPath: clipPath,
        },
        {
          duration: 400,
          easing: 'ease-out',
          pseudoElement: '::view-transition-new(root)',
        }
      )
    }).catch(() => {
      // View transition pseudo-element not available, fallback handled by CSS
    })
  }

  return (
    <TooltipIconButton label={themeLabel} side="bottom">
      <button
        type="button"
        className="group flex h-10 w-10 items-center justify-center rounded-full bg-white/[0.72] dark:bg-black/[0.78] backdrop-blur-2xl border border-white/[0.18] dark:border-white/[0.08] text-zinc-600 dark:text-zinc-300 transition-all hover:text-primary active:scale-95 outline-none focus:outline-none"
        onClick={toggleTheme}
      >
        <div className="flex h-[19px] w-[19px] items-center justify-center transition-transform duration-300 group-hover:rotate-45 group-hover:scale-110">
          {mounted ? resolvedTheme === 'dark' ? <MoonStar strokeWidth={2.5} className="h-full w-full group-hover:text-indigo-400" /> : <SunMedium strokeWidth={2.5} className="h-full w-full group-hover:text-amber-500" /> : <Blank />}
        </div>
      </button>
    </TooltipIconButton>
  )
}

export default ThemeSwitch

