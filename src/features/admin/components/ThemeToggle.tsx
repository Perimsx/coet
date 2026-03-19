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
      className="h-10 w-10 rounded-2xl shadow-sm"
      onClick={() => setTheme(isDark ? "light" : "dark")}
      disabled={!mounted}
      aria-label={isDark ? "切换为浅色主题" : "切换为深色主题"}
      title={isDark ? "切换为浅色主题" : "切换为深色主题"}
    >
      {isDark ? <Moon className="size-4" /> : <SunMedium className="size-4" />}
    </Button>
  )
}
