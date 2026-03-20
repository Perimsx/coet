import { ReactNode } from 'react'
import { cn } from '@/shared/utils/utils'

interface PageHeaderProps {
  title: ReactNode
  meta?: ReactNode
  action?: ReactNode
  className?: string
}

export default function PageHeader({ title, meta, action, className }: PageHeaderProps) {
  return (
    <div className={cn('border-border/55 mb-4 border-b pb-4 sm:mb-5 sm:pb-5', className)}>
      <div className="flex flex-col gap-2 sm:gap-3">
        <h1 className="truncate text-2xl leading-8 font-extrabold tracking-tight text-gray-900 sm:text-4xl sm:leading-10 dark:text-gray-100">
          {title || "页面内容"}
        </h1>
        <div className="mt-1 flex items-center gap-4 sm:gap-6">
          <div className="min-w-0">
            {meta ? (
              <p className="truncate text-xs font-medium text-gray-500 sm:text-sm dark:text-gray-400">
                {meta}
              </p>
            ) : null}
          </div>
          {action ? <div className="shrink-0">{action}</div> : null}
        </div>
      </div>
    </div>
  )
}
