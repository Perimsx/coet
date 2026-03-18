import * as React from 'react'
import { cn } from '@/shared/utils/utils'

/**
 * 输入框组件 (Input)
 * 封装原生 input 元素，提供统一的项目样式风格。建议修复错误。
 */
const Input = React.forwardRef<HTMLInputElement, React.ComponentProps<'input'>>(
  ({ className, type, ...props }, ref) => {
    return (
      <input
        type={type}
        className={cn(
          'border-input bg-background flex h-10 w-full rounded-md border px-3 py-2 text-sm',
          'ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium',
          'placeholder:text-muted-foreground focus-visible:ring-ring focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none',
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
Input.displayName = 'Input'

export { Input }
