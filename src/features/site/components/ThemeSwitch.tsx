'use client'

import { useEffect, useState } from 'react'
import { useTheme } from 'next-themes'

import { SunMedium, MoonStar } from 'lucide-react'

const Blank = () => <svg className="h-5 w-5" />

const ThemeSwitch = () => {
  const [mounted, setMounted] = useState(false)
  const { setTheme, resolvedTheme } = useTheme()

  // 客户端挂载完成后再显示 UI
  useEffect(() => setMounted(true), [])

  const toggleTheme = (event: React.MouseEvent) => {
    const isDark = resolvedTheme === 'dark'
    const nextTheme = isDark ? 'light' : 'dark'
    
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
    })
  }

  return (
    <button
      aria-label="切换明暗主题"
      type="button"
      className="group text-muted-foreground transition-all hover:bg-primary-500/10 hover:text-primary-600 dark:hover:bg-primary-400/15 dark:hover:text-primary-400 active:scale-95 flex h-8 w-8 sm:h-10 sm:w-10 items-center justify-center rounded-full outline-none focus:outline-none"
      onClick={toggleTheme}
    >
      <div className="h-4 w-4 sm:h-[19px] sm:w-[19px] flex items-center justify-center transition-transform duration-300 group-hover:rotate-45 group-hover:scale-110">
        {mounted ? resolvedTheme === 'dark' ? <MoonStar strokeWidth={2.5} className="h-full w-full group-hover:text-indigo-400" /> : <SunMedium strokeWidth={2.5} className="h-full w-full group-hover:text-amber-500" /> : <Blank />}
      </div>
    </button>
  )
}

export default ThemeSwitch

