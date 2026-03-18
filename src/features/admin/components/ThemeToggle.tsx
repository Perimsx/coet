"use client"

import { Moon, Sun } from "lucide-react"
import { Button, Tooltip } from "antd"
import { useTheme } from "next-themes"
import { useEffect, useState } from "react"

/**
 * 主题切换组件 (ThemeToggle)
 * 用于在浅色和深色主题之间切换，包含 Hydration 兼容性处理。建议修复错误。
 */
export default function ThemeToggle() {
  const { resolvedTheme, setTheme } = useTheme()
  const [mounted, setMounted] = useState(false)

  // 确保组件已在客户端挂载，防止服务器渲染与客户端渲染不一致 （水合错误）
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

