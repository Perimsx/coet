'use client'

import React from 'react'
import { motion } from 'framer-motion'
import Image from 'next/image'
import Link from 'next/link'
// 移除未使用的 Globe 导入
import brandingConfig from '@/config/branding'
import type { AboutProfileViewModel } from '@/features/content/lib/about-profile'
import SocialIcon from '@/features/site/components/social-icons'
import { ChevronDown } from 'lucide-react'

const PLATFORM_THEMES: Record<string, { color: string }> = {
  github: { color: 'bg-[#181717]' },
  mail: { color: 'bg-[#EA4335]' },
  x: { color: 'bg-[#000000]' },
  twitter: { color: 'bg-[#1DA1F2]' },
  rss: { color: 'bg-zinc-600' },
  wechat: { color: 'bg-[#07C160]' },
  session: { color: 'bg-[#3B5998]' },
  yuque: { color: 'bg-[#25b864]' },
  bilibili: { color: 'bg-[#00A1D6]' },
  douyin: { color: 'bg-[#000000]' },
  default: { color: 'bg-[#333333]' },
}

interface HeroProps {
  socials?: AboutProfileViewModel['socials']
}

export default function Hero({ socials = [] }: HeroProps) {
  return (
    <div className="relative flex min-h-[calc(100vh-4rem)] w-full items-center justify-center overflow-hidden py-[--spacing-fluid-page] sm:min-h-[calc(100vh-6rem)]">
      <div className="mx-auto flex max-w-5xl -translate-y-8 flex-col-reverse items-center justify-center gap-10 px-4 sm:-translate-y-12 sm:flex-col-reverse sm:gap-12 sm:px-6 lg:flex-row lg:gap-14 lg:px-8">
        {/* 左侧文字信息 */}
        <div className="flex flex-col items-center text-center lg:items-start lg:text-left">
          <motion.div
            initial={{ opacity: 0, y: 25 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ type: "spring", stiffness: 100, damping: 15, mass: 1 }}
          >
            <h1 
              className="font-bold tracking-tight text-gray-900 dark:text-gray-100"
              style={{ fontSize: 'var(--font-size-fluid-h1)', lineHeight: 1.1 }}
            >
              Hi there, I'm{' '}
              <span className="relative inline-block">
                <span className="relative z-10 text-gray-900 dark:text-gray-100">kerntau</span>
                <motion.span
                  initial={{ width: 0 }}
                  animate={{ width: '100%' }}
                  transition={{ delay: 0.6, duration: 1, ease: "circOut" }}
                  className="absolute bottom-[0.1em] left-0 -z-10 h-[0.3em] w-full bg-[#00D1D1]/40 blur-[1px] dark:bg-[#00D1D1]/30"
                />
              </span>
              {' '}👋
            </h1>
            <h2 
              className="mt-4 font-medium text-gray-600 dark:text-gray-400"
              style={{ fontSize: 'var(--font-size-fluid-h2)', lineHeight: 1.2 }}
            >
              A Full Stack Developer
            </h2>
            <p 
              className="mt-4 italic text-muted-foreground"
              style={{ fontSize: 'var(--font-size-fluid-p)' }}
            >
              知行合一， 缄默前行。
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2, type: "spring", stiffness: 100, damping: 20 }}
            className="mt-6 flex flex-wrap justify-center gap-4 sm:mt-10 lg:justify-start"
          >
            {socials.map((social) => {
              const theme = PLATFORM_THEMES[social.platform] || PLATFORM_THEMES.default

              return (
                <motion.a
                  key={social.platform}
                  href={social.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  whileHover={{ scale: 1.15, y: -4 }}
                  whileTap={{ scale: 0.95 }}
                  transition={{ type: "spring", stiffness: 400, damping: 10 }}
                  className={`group relative flex h-10 w-10 items-center justify-center rounded-full text-white shadow-sm transition-shadow hover:shadow-lg ${theme.color}`}
                  aria-label={social.label}
                >
                  <SocialIcon 
                    kind={social.platform} 
                    size={5}
                    icon={social.icon}
                  />
                  <span className="absolute -top-10 left-1/2 -translate-x-1/2 scale-0 rounded bg-gray-900 px-2 py-1 text-xs text-white opacity-0 transition-all group-hover:scale-100 group-hover:opacity-100 whitespace-nowrap">
                    {social.label}
                  </span>
                </motion.a>
              )
            })}
          </motion.div>
        </div>

        {/* 右侧头像 */}
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.3, type: "spring", stiffness: 100, damping: 15, mass: 1 }}
          className="relative flex shrink-0"
        >
          <div className="relative h-48 w-48 overflow-hidden rounded-full border-4 border-white object-cover shadow-2xl transition-transform duration-500 hover:scale-105 sm:h-80 sm:w-80 dark:border-gray-800">
             {/* 此处暂用占位图，后续可换成真实头像路径 */}
            <Image
              src={brandingConfig.logo} 
              alt="Avatar"
              fill
              sizes="(max-width: 639px) 192px, 320px"
              className="object-cover"
              priority
              onError={(e) => {
                // 如果头像路径不存在，显示占位渐变
                (e.target as any).style.display = 'none';
                (e.target as any).parentElement.classList.add('bg-gradient-to-br', 'from-primary-500', 'to-primary-700');
              }}
            />
          </div>
          {/* 装饰元素 */}
          <div className="absolute -inset-4 -z-10 animate-pulse rounded-full bg-primary-500/10 blur-2xl dark:bg-primary-400/5" />
        </motion.div>
      </div>
      
      {/* 底部装饰文案 与 下滑箭头 */}
      <div className="absolute bottom-8 left-1/2 flex -translate-x-1/2 flex-col items-center gap-2 text-center sm:bottom-16 sm:gap-4">
        <div className="px-4 text-xs font-medium tracking-widest text-muted-foreground uppercase opacity-60 sm:text-sm">
          关关难过关关过，长路漫漫亦灿灿。
        </div>
        
        <motion.button
          initial={{ opacity: 0, y: -10 }}
          animate={{ 
            opacity: [0.4, 1, 0.4],
            y: [0, 8, 0] 
          }}
          transition={{ 
            duration: 2,
            repeat: Infinity,
            ease: "easeInOut"
          }}
          onClick={() => {
            const nextSection = document.getElementById('latest-posts')
            if (nextSection) {
              nextSection.scrollIntoView({ behavior: 'smooth' })
            }
          }}
          className="text-muted-foreground transition-colors hover:text-primary-500 focus:outline-none"
          aria-label="Scroll to content"
        >
          <ChevronDown className="h-5 w-5 sm:h-6 sm:w-6" />
        </motion.button>
      </div>
    </div>
  )
}
