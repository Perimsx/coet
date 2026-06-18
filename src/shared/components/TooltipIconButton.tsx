'use client'

import {
  Tooltip,
  TooltipTrigger,
  TooltipContent,
} from '@/components/ui/tooltip'

interface TooltipIconButtonProps {
  label: string
  children: React.ReactNode
  asChild?: boolean
  side?: 'top' | 'bottom' | 'left' | 'right'
  className?: string
  [key: string]: unknown
}

export function TooltipIconButton({
  label,
  children,
  asChild = true,
  side = 'top',
  className,
  ...props
}: TooltipIconButtonProps) {
  return (
    <Tooltip>
      <TooltipTrigger asChild={asChild} {...props}>
        {children}
      </TooltipTrigger>
      <TooltipContent side={side} className={className}>
        {label}
      </TooltipContent>
    </Tooltip>
  )
}
