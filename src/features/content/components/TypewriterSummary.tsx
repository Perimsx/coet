'use client'

import { motion } from 'framer-motion'
import { Sparkles } from 'lucide-react'

export default function TypewriterSummary({ summary }: { summary: string }) {
  if (!summary) return null

  const container = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.015,
        delayChildren: 0.2,
      },
    },
  }

  const child = {
    hidden: { opacity: 0, y: 4, filter: 'blur(2px)' },
    visible: {
      opacity: 1,
      y: 0,
      filter: 'blur(0px)',
      transition: {
        duration: 0.3,
        ease: 'easeOut' as const,
      },
    },
  }

  const characters = Array.from(summary)

  return (
    <div key={summary} className="relative overflow-hidden rounded-2xl border border-zinc-200/60 bg-zinc-50/50 p-3 sm:p-4 dark:border-zinc-800/60 dark:bg-zinc-900/50 backdrop-blur-sm shadow-sm transition-all hover:shadow-md dark:shadow-none">
      {/* 装饰性大号背景图标 */}
      <div className="absolute -top-6 -right-2 z-0 opacity-[0.03] dark:opacity-[0.05] pointer-events-none">
        <Sparkles className="w-24 h-24 text-foreground" />
      </div>

      <div className="relative z-10 flex gap-3 sm:gap-4 text-left items-start">
        <motion.div
          initial={{ opacity: 0, scale: 0.5, rotate: -10 }}
          animate={{ opacity: 1, scale: 1, rotate: 0 }}
          transition={{ delay: 0.1, duration: 0.5, type: 'spring' }}
          className="shrink-0 mt-0.5"
        >
          <div className="flex h-8 w-8 sm:h-9 sm:w-9 items-center justify-center rounded-full bg-primary/10 dark:bg-primary/20 shadow-sm ring-1 ring-primary/20">
            <Sparkles className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-primary" />
          </div>
        </motion.div>
        
        <motion.p
          variants={container}
          initial="hidden"
          animate="visible"
          className="text-[14px] sm:text-[15px] font-medium leading-relaxed text-zinc-700 dark:text-zinc-300 tracking-wide pt-1 sm:pt-1.5"
        >
          {characters.map((char, index) => (
            <motion.span key={index} variants={child} className="inline-block whitespace-pre-wrap">
              {char}
            </motion.span>
          ))}
        </motion.p>
      </div>
    </div>
  )
}
