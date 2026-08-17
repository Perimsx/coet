'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import Link from '@/shared/components/Link'

function getSeasonalGreeting(): string {
  const month = new Date().getMonth() + 1
  if (month >= 3 && month <= 5) return '春水初生'
  if (month >= 6 && month <= 8) return '盛夏繁荫'
  if (month >= 9 && month <= 11) return '初秋微凉'
  return '深冬宁谧'
}

export default function HomeSeasonLetters() {
  const [likes, setLikes] = useState<number>(() => {
    if (typeof window === 'undefined') return 42
    try {
      const stored = localStorage.getItem('xuzhan_site_likes')
      return stored ? parseInt(stored, 10) : 42
    } catch {
      return 42
    }
  })
  const [hasLiked, setHasLiked] = useState<boolean>(() => {
    if (typeof window === 'undefined') return false
    try {
      return localStorage.getItem('xuzhan_has_liked') === 'true'
    } catch {
      return false
    }
  })
  const seasonGreeting = getSeasonalGreeting()

  const handleLike = () => {
    if (hasLiked) return
    const newLikes = likes + 1
    setLikes(newLikes)
    setHasLiked(true)
    try {
      localStorage.setItem('xuzhan_site_likes', String(newLikes))
      localStorage.setItem('xuzhan_has_liked', 'true')
    } catch {
      // ignore
    }
  }

  return (
    <section className="mx-auto mt-16 max-w-[1400px] px-6 pb-8 lg:px-12 font-serif">
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
        className="pt-20 text-center text-title-20 tracking-[2px] text-neutral-7 lg:text-title-24"
      >
        {seasonGreeting}
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 16 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ delay: 0.08, duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
        className="mb-16 text-center text-title-20 tracking-[2px] text-neutral-7 lg:mb-20 lg:text-title-24"
      >
        欢迎来信
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 16 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ delay: 0.16, duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
        className="mb-16 flex items-center justify-center gap-12 lg:mb-20"
      >
        <button
          onClick={handleLike}
          className="group text-center cursor-pointer focus:outline-none"
          aria-label="留下印记"
        >
          <div className="font-serif text-copy-14 text-neutral-6 transition-colors duration-300 group-hover:text-accent">
            留下印记
          </div>
          <div className="font-serif text-copy-13 italic text-neutral-6 flex items-center justify-center gap-1">
            <span className={hasLiked ? 'text-accent scale-110 transition-transform' : 'text-accent'}>♥</span>
            <span aria-label={String(likes)}>{likes}</span>
          </div>
        </button>

        <div className="h-6 w-px bg-border" />

        <Link
          href="/feed.xml"
          target="_blank"
          className="group text-center cursor-pointer focus:outline-none"
        >
          <div className="font-serif text-copy-14 text-neutral-6 transition-colors duration-300 group-hover:text-accent">
            订阅通信
          </div>
          <div className="font-serif text-copy-13 italic text-neutral-6">
            不错过每一纸书。
          </div>
        </Link>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 16 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ delay: 0.24, duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
        className="flex flex-wrap items-center justify-center gap-y-1 font-serif text-copy-13 text-neutral-7/80 hover:text-neutral-7"
      >
        <span className="inline-flex items-center">
          <Link className="transition-colors duration-300 hover:text-accent" href="/friends">
            朋友们
          </Link>
        </span>
        <span className="inline-flex items-center">
          <span className="mx-2.5">·</span>
          <Link className="transition-colors duration-300 hover:text-accent" href="/blog/category">
            分类
          </Link>
        </span>
        <span className="inline-flex items-center">
          <span className="mx-2.5">·</span>
          <Link className="transition-colors duration-300 hover:text-accent" href="/archive">
            归档
          </Link>
        </span>
        <span className="inline-flex items-center">
          <span className="mx-2.5">·</span>
          <Link className="transition-colors duration-300 hover:text-accent" href="/about">
            关于
          </Link>
        </span>
      </motion.div>
    </section>
  )
}
