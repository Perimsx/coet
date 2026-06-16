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
      className="group flex h-10 w-10 items-center justify-center rounded-full bg-white/70 text-zinc-600 shadow-lg shadow-zinc-800/5 ring-1 ring-zinc-900/5 backdrop-blur-md transition-all hover:text-primary-600 hover:ring-zinc-900/10 active:scale-95 dark:bg-zinc-900/70 dark:text-zinc-300 dark:ring-zinc-100/10 dark:hover:text-primary-400 dark:hover:ring-zinc-100/20 outline-none focus:outline-none"
      onClick={toggleTheme}
    >
      <div className="flex h-[19px] w-[19px] items-center justify-center transition-transform duration-300 group-hover:rotate-45 group-hover:scale-110">
        {mounted ? resolvedTheme === 'dark' ? <MoonStar strokeWidth={2.5} className="h-full w-full group-hover:text-indigo-400" /> : <SunMedium strokeWidth={2.5} className="h-full w-full group-hover:text-amber-500" /> : <Blank />}
      </div>
    </button>
  )
}

export default ThemeSwitch

