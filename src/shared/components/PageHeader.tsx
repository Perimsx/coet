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
  const containerVariants: Variants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.1 }
    }
  }

  const itemVariants: Variants = {
    hidden: { opacity: 0, filter: 'blur(8px)', y: 15 },
    visible: { 
      opacity: 1, 
      filter: 'blur(0px)',
      y: 0,
      transition: { type: 'spring', stiffness: 100, damping: 20 }
    }
  }

  return (
    <div className={cn('relative w-full pt-8 pb-6 mb-6 sm:pt-14 sm:pb-8 sm:mb-10 border-b border-border/10', className)}>
      <motion.div 
        className="relative flex flex-col md:flex-row md:items-end justify-between gap-6"
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        <div className="flex flex-col items-start gap-2.5">
          <motion.h1 
            variants={itemVariants}
            className="text-3xl sm:text-4xl lg:text-5xl font-black tracking-tight text-foreground drop-shadow-sm leading-none"
          >
            {title || "页面内容"}
          </motion.h1>

          <motion.div variants={itemVariants} className="h-1 w-10 rounded-full bg-primary/50 mt-1.5 mb-1" />

          {meta && (
            <motion.p 
              variants={itemVariants} 
              className="text-[13.5px] sm:text-[14.5px] font-medium text-muted-foreground/85 leading-snug max-w-2xl tracking-wide"
            >
              {meta}
            </motion.p>
          )}
        </div>

        {action && (
          <motion.div variants={itemVariants} className="shrink-0 mb-1">
            {action}
          </motion.div>
        )}
      </motion.div>
    </div>
  )
}
