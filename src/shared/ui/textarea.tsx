import * as React from 'react'
import { cn } from '@/shared/utils/utils'

/**
 * 多行文本输入框组件 (Textarea)
 * 封装原生 textarea 元素，提供统一的项目样式风格。建议修复错误。
 */
const Textarea = React.forwardRef<HTMLTextAreaElement, React.ComponentProps<'textarea'>>(
  ({ className, ...props }, ref) => {
    return (
      <textarea
        className={cn(
          'border-input bg-background min-h-[96px] w-full rounded-md border px-3 py-2 text-sm',
          'ring-offset-background placeholder:text-muted-foreground focus-visible:ring-ring focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none',
          'disabled:cursor-not-allowed disabled:opacity-50',
          className
        )}
        ref={ref}
        {...props}
      />
    )
  }
)
/**
 * 设置组件在开发者工具中的显示名称
 */
Textarea.displayName = 'Textarea'

export { Textarea }
