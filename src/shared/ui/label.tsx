import * as React from 'react'
import * as LabelPrimitive from '@radix-ui/react-label'
import { cn } from '@/shared/utils/utils'

/**
 * 标签组件 (Label)
 * 基于 Radix UI 的 Label 原始组件封装。建议修复错误。
 */
function Label({ className, ...props }: React.ComponentProps<typeof LabelPrimitive.Root>) {
  return (
    <LabelPrimitive.Root className={cn('text-sm leading-none font-medium', className)} {...props} />
  )
}

export { Label }
