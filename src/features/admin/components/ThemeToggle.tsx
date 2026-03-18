"use client"

import { Moon, Sun } from "lucide-react"
import { Button, Tooltip } from "antd"
import { useTheme } from "next-themes"
import { useEffect, useState } from "react"

export default function ThemeToggle() {
  const { resolvedTheme, setTheme } = useTheme()
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) {
    return <Button shape="circle" disabled className="admin-icon-button" />
  }

  const isDark = resolvedTheme === "dark"

  return (
    <Tooltip title={isDark ? "切换为浅色主题" : "切换为深色主题"}>
      <Button
        shape="circle"
        className="admin-icon-button"
        icon={isDark ? <Moon size={16} /> : <Sun size={16} />}
        onClick={() => setTheme(isDark ? "light" : "dark")}
      />
    </Tooltip>
  )
}
