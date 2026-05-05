"use client"

import { Moon, SunMedium } from "lucide-react"
import { useTheme } from "next-themes"
import { useEffect, useState } from "react"

import { Button } from "@/components/ui/button"

export default function ThemeToggle() {
  const { resolvedTheme, setTheme } = useTheme()
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  const isDark = mounted && resolvedTheme === "dark"

  return (
    <Button
      type="button"
      variant="outline"
      size="icon"
      className="h-11 w-11 rounded-[20px] border-white/70 bg-white/82 shadow-[0_12px_24px_rgba(15,23,42,0.08)] backdrop-blur dark:border-white/10 dark:bg-slate-950/65"
      onClick={() => setTheme(isDark ? "light" : "dark")}
      disabled={!mounted}
      aria-label={isDark ? "切换为浅色主题" : "切换为深色主题"}
      title={isDark ? "切换为浅色主题" : "切换为深色主题"}
    >
      {isDark ? <Moon className="size-4" /> : <SunMedium className="size-4" />}
    </Button>
  )
}
