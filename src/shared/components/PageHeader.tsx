'use client'

import { ReactNode } from 'react'
import { motion, Variants } from 'framer-motion'
import { cn } from '@/shared/utils/utils'

interface PageHeaderProps {
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
    <div className={cn('relative w-full pb-4 mb-6 border-b border-border', className)}>
      <motion.div 
        className="relative flex flex-col sm:flex-row sm:items-end justify-between gap-4"
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        <div className="flex flex-col items-start gap-1">
          <div className="flex items-center justify-between w-full gap-4">
            <motion.h1 
              variants={itemVariants}
              className="font-serif text-title-24 sm:text-title-28 font-medium tracking-tight text-neutral-10 leading-snug"
            >
              {title || "页面内容"}
            </motion.h1>

            {action && (
              <motion.div variants={itemVariants} className="shrink-0">
                {action}
              </motion.div>
            )}
          </div>

          {meta && (
            <motion.p
              variants={itemVariants}
              className="text-label-12 font-normal text-neutral-6 leading-relaxed max-w-2xl"
            >
              {meta}
            </motion.p>
          )}
        </div>

      </motion.div>
    </div>
  )
}
