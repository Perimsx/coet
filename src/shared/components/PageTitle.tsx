import { ReactNode } from 'react'
import { cn } from '@/shared/utils/utils'

interface Props {
  children: ReactNode
  className?: string
}

export default function PageTitle({ children, className }: Props) {
  return (
    <h1 className={cn(
      "mx-auto max-w-5xl px-4 sm:px-0 font-serif font-medium text-title-24 sm:text-title-28 md:text-display-36 leading-snug tracking-tight text-neutral-10",
      className
    )}>
      {children}
    </h1>
  )
}
