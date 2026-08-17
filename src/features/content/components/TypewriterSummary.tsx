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
    <div key={summary} className="relative overflow-hidden rounded-lg border border-border bg-neutral-1 p-3.5 sm:p-4 shadow-xs">
      <div className="relative z-10 flex gap-3 sm:gap-3.5 text-left items-start">
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.1, duration: 0.4, type: 'spring' }}
          className="shrink-0 mt-0.5"
        >
          <div className="flex h-7 w-7 sm:h-8 sm:w-8 items-center justify-center rounded-full bg-neutral-2 border border-border text-accent">
            <Sparkles className="w-3.5 h-3.5 text-accent" />
          </div>
        </motion.div>
        
        <motion.p
          variants={container}
          initial="hidden"
          animate="visible"
          className="text-copy-14 sm:text-copy-15 font-normal leading-relaxed text-neutral-8 tracking-normal pt-0.5"
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
