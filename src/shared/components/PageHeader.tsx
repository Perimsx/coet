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
  // 提取标题对应的英文水印（如果有映射则使用，否则截取前 4 位）
  const getWatermark = (t: ReactNode) => {
    if (typeof t !== 'string') return 'PAGE'
    const map: Record<string, string> = {
      '全部标签': 'TAGS',
      '分类': 'CATEGORIES',
      '全部文章': 'POSTS',
      '归档': 'ARCHIVE',
      '友链': 'FRIENDS',
      '关于': 'ABOUT'
    }
    return map[t] || t.slice(0, 4).toUpperCase()
  }

  const containerVariants: Variants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.1 }
    }
  }

  const itemVariants: Variants = {
    hidden: { opacity: 0, filter: 'blur(10px)', y: 10 },
    visible: { 
      opacity: 1, 
      filter: 'blur(0px)',
      y: 0,
      transition: { type: 'spring', stiffness: 100, damping: 20 }
    }
  }

  return (
    <div className={cn('relative w-full pt-4 pb-4 mb-2 sm:mb-4 overflow-visible', className)}>
      {/* 水印背景：极简虚化 */}
      <div className="absolute -left-2 top-0 -z-10 select-none pointer-events-none overflow-hidden">
        <span className="text-[4rem] sm:text-[6rem] font-black leading-none text-foreground/[0.02] tracking-tighter uppercase italic">
          {getWatermark(title)}
        </span>
      </div>

      <motion.div 
        className="relative flex flex-row items-end justify-between gap-6 px-1"
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        <div className="flex flex-col items-start gap-1">
          {/* 品牌图标指示器：极其低调 */}
          <motion.div 
            variants={itemVariants}
            className="flex items-center gap-1.5 mb-0.5"
          >
            <span className="relative flex h-1.5 w-1.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-40"></span>
              <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-primary/60"></span>
            </span>
            <span className="text-[9px] font-bold uppercase tracking-[0.2em] text-muted-foreground/30">System Ready</span>
          </motion.div>

          <motion.h1 
            variants={itemVariants}
            className="text-2xl sm:text-3xl md:text-4xl font-extrabold tracking-tight text-foreground/90"
          >
            {title || "页面内容"}
          </motion.h1>

          {meta && (
            <motion.div variants={itemVariants} className="mt-0.5">
              <div className="flex items-center gap-2 font-mono text-[10px] sm:text-[11px] font-bold text-muted-foreground/40 uppercase tracking-wider">
                <span className="px-1 py-0.5 rounded bg-muted/30 border border-border/20 leading-none scale-90 origin-left">DAT</span>
                {meta}
              </div>
            </motion.div>
          )}
        </div>

        {action && (
          <motion.div variants={itemVariants} className="pb-0.5 scale-90 origin-bottom-right">
            {action}
          </motion.div>
        )}
      </motion.div>
    </div>
  )
}
