'use client'

import { useTheme } from 'next-themes'
import { Toaster as Sonner, type ToasterProps } from 'sonner'

/**
 * 全局通知容器组件 (Toaster)
 * 封装自 sonner 库，提供响应式的通知弹出逻辑。建议修复错误。
 */
export function Toaster(props: ToasterProps) {
  const { theme = 'system' } = useTheme()
  return (
    <Sonner 
      theme={theme as ToasterProps['theme']} 
      position="top-center"
      offset="66px"
      {...props} 
    />
  )
}
