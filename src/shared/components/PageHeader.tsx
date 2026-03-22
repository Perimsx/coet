'use client'

import { ReactNode } from 'react'
import { motion, Variants } from 'framer-motion'
import { cn } from '@/shared/utils/utils'

export interface PageHeaderProps {
  title: ReactNode
  meta?: ReactNode
  action?: ReactNode
  className?: string
}

export default function PageHeader({ title, meta, action, className }: PageHeaderProps) {
  // 冷峻的技术感微动效 (Micro interactions)
  const containerVariants: Variants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
        delayChildren: 0.05,
      }
    }
  }

  const itemVariants: Variants = {
    hidden: { opacity: 0, x: -5 }, // 向右微推的打字机入场感，比上下更锐利
    visible: { 
      opacity: 1, 
      x: 0,
      transition: { type: 'tween' as const, ease: 'easeOut', duration: 0.4 }
    }
  }

  return (
    <div className={cn('w-full pt-0 pb-4 sm:pb-6 mb-6 sm:mb-8 overflow-hidden', className)}>
      {/* 极简化核心排版: 全局生效的左右分离架构（移动端也不折叠） */}
      <motion.div 
        className="flex flex-row items-center justify-between gap-3 sm:gap-6 border-l-[3px] border-zinc-900/10 dark:border-zinc-50/10 pl-3 sm:pl-4 pr-1"
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        <div className="flex min-w-0 flex-col items-start justify-center text-left">
          <motion.h1 
            variants={itemVariants}
            className="truncate w-full text-xl leading-snug font-extrabold tracking-tight text-zinc-900 sm:text-2xl md:text-3xl dark:text-zinc-50"
          >
            {title || "页面内容"}
          </motion.h1>

          {meta && (
            <motion.div variants={itemVariants} className="mt-1 sm:mt-2 max-w-2xl min-w-0">
              <p 
                className="truncate text-xs font-medium leading-normal text-muted-foreground/85 sm:text-[13.5px]" 
              >
                {meta}
              </p>
            </motion.div>
          )}
        </div>

        {action && (
          <motion.div variants={itemVariants} className="shrink-0">
            {action}
          </motion.div>
        )}
      </motion.div>
    </div>
  )
}
