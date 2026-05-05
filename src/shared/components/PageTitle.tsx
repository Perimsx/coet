import { ReactNode } from 'react'
import { cn } from '@/shared/utils/utils'

interface Props {
  children: ReactNode
  className?: string
}

export default function PageTitle({ children, className }: Props) {
  return (
    <h1 className={cn(
      "mx-auto max-w-4xl px-4 sm:px-0 text-2xl sm:text-3xl md:text-4xl lg:text-[42px] leading-snug font-extrabold tracking-tight text-gray-900 dark:text-gray-100 text-balance",
      className
    )}>
      {children}
    </h1>
  )
}
