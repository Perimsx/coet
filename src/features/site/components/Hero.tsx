'use client'

import React from 'react'
import { motion } from 'framer-motion'
import Image from 'next/image'
import type { HeroPresentation } from '@/config/site-presentation'
import type { AboutProfileViewModel } from '@/features/content/lib/about-profile'
import SocialIcon from '@/features/site/components/social-icons'
import { ChevronDown } from 'lucide-react'

interface HeroProps {
  socials?: AboutProfileViewModel['socials']
  presentation: HeroPresentation
  greetingElement?: React.ReactNode
  avatarBubbleElement?: React.ReactNode
}

export default function Hero({ socials = [], presentation, greetingElement, avatarBubbleElement }: HeroProps) {
  return (
    <div className="relative flex min-h-[calc(100vh-4rem)] w-full items-center justify-center overflow-hidden py-[--spacing-fluid-page] sm:min-h-[calc(100vh-6rem)]">
      <div className="mx-auto flex max-w-5xl -translate-y-8 flex-col-reverse items-center justify-center gap-6 px-4 sm:-translate-y-12 sm:flex-col-reverse sm:gap-12 sm:px-6 lg:flex-row lg:gap-14 lg:px-8">
        <div className="flex flex-col items-center text-center lg:items-start lg:text-left">
          <motion.div
            initial={{ opacity: 0, y: 25 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ type: 'spring', stiffness: 100, damping: 15, mass: 1 }}
            className="flex flex-col items-center lg:items-start"
          >
            {greetingElement && (
              <div className="mb-2">
                {greetingElement}
              </div>
            )}

            <h1
              className="font-bold tracking-tight text-gray-900 dark:text-gray-100 flex flex-wrap justify-center lg:justify-start items-center gap-x-2 gap-y-1"
              style={{ fontSize: 'var(--font-size-fluid-h1)', lineHeight: 1.1 }}
            >
              <span>{presentation.greetingPrefix}</span>
              <span className="relative inline-flex items-center whitespace-nowrap">
                <span className="relative z-10 text-gray-900 dark:text-gray-100">
                  {presentation.displayName}
                </span>
                <motion.span
                  initial={{ width: 0 }}
                  animate={{ width: '100%' }}
                  transition={{ delay: 0.6, duration: 1, ease: 'circOut' }}
                  className="absolute bottom-[0.1em] left-0 -z-10 h-[0.3em] w-full bg-[#00D1D1]/40 blur-[1px] dark:bg-[#00D1D1]/30"
                />
                <span className="ml-1 sm:ml-2 z-10">👋</span>
              </span>
            </h1>
            <h2
              className="mt-4 font-medium text-gray-600 dark:text-gray-400"
              style={{ fontSize: 'var(--font-size-fluid-h2)', lineHeight: 1.2 }}
            >
              {presentation.role}
            </h2>
            <p
              className="mt-4 italic text-muted-foreground"
              style={{ fontSize: 'var(--font-size-fluid-p)' }}
            >
              {presentation.tagline}
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2, type: 'spring', stiffness: 100, damping: 20 }}
            className="mt-6 flex flex-wrap justify-center gap-4 sm:mt-10 lg:justify-start"
          >
            {socials.map((social) => {
              const theme =
                presentation.socialThemes[social.platform] ||
                presentation.socialThemes.default

              return (
                <motion.a
                  key={social.platform}
                  href={social.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  whileHover={{ scale: 1.15, y: -4 }}
                  whileTap={{ scale: 0.95 }}
                  transition={{ type: 'spring', stiffness: 400, damping: 10 }}
                  className={`group relative flex h-10 w-10 items-center justify-center rounded-full text-white shadow-sm transition-shadow hover:shadow-lg ${theme.color}`}
                  aria-label={social.label}
                >
                  <SocialIcon
                    kind={social.platform}
                    size={5}
                    icon={social.icon}
                  />
                  <span className="absolute -top-10 left-1/2 -translate-x-1/2 scale-0 whitespace-nowrap rounded bg-gray-900 px-2 py-1 text-xs text-white opacity-0 transition-all group-hover:scale-100 group-hover:opacity-100">
                    {social.label}
                  </span>
                </motion.a>
              )
            })}
          </motion.div>
        </div>

        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.3, type: 'spring', stiffness: 100, damping: 15, mass: 1 }}
          className="relative flex shrink-0 mt-8 sm:mt-12"
        >
          {/* 头像上方气泡 */}
          {avatarBubbleElement && (
            <motion.div 
              initial={{ opacity: 0, y: 15, scale: 0.8 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              transition={{ delay: 1.1, type: 'spring', damping: 12 }}
              className="absolute -top-12 left-1/2 -translate-x-1/2 z-20 whitespace-nowrap"
            >
              <div className="relative">
                {avatarBubbleElement}
                {/* 气泡小倒三角尾巴 */}
                <div className="absolute -bottom-1.5 left-1/2 -translate-x-1/2 w-3 h-3 rotate-45 bg-white/90 border-r border-b border-zinc-200/50 dark:bg-zinc-900/90 dark:border-zinc-800/50 backdrop-blur-md"></div>
              </div>
            </motion.div>
          )}

          <div className="relative h-40 w-40 overflow-hidden rounded-full border-4 border-white object-cover shadow-2xl transition-transform duration-500 hover:scale-105 sm:h-64 sm:w-64 dark:border-gray-800">
            <Image
              src={presentation.avatarSrc}
              alt={presentation.avatarAlt}
              fill
              sizes="(max-width: 639px) 192px, 320px"
              className="object-cover"
              priority
              onError={(event) => {
                const image = event.currentTarget
                image.style.display = 'none'
                image.parentElement?.classList.add(
                  'bg-gradient-to-br',
                  'from-primary-500',
                  'to-primary-700'
                )
              }}
            />
          </div>
          <div className="absolute -inset-4 -z-10 animate-pulse rounded-full bg-primary-500/10 blur-2xl dark:bg-primary-400/5" />
        </motion.div>
      </div>

      <div className="absolute bottom-6 left-1/2 flex w-full -translate-x-1/2 flex-col items-center gap-2 text-center sm:bottom-16 sm:gap-4 [@media(max-height:700px)]:hidden">
        <div className="px-4 text-xs font-medium uppercase tracking-widest text-muted-foreground opacity-60 sm:text-sm whitespace-nowrap">
          {presentation.bottomText}
        </div>

        <motion.button
          initial={{ opacity: 0, y: -10 }}
          animate={{
            opacity: [0.4, 1, 0.4],
            y: [0, 8, 0],
          }}
          transition={{
            duration: 2,
            repeat: Infinity,
            ease: 'easeInOut',
          }}
          onClick={() => {
            const nextSection = document.getElementById('latest-posts')
            if (nextSection) {
              nextSection.scrollIntoView({ behavior: 'smooth' })
            }
          }}
          className="text-muted-foreground transition-colors hover:text-primary-500 focus:outline-none"
          aria-label={presentation.scrollAriaLabel}
        >
          <ChevronDown className="h-5 w-5 sm:h-6 sm:w-6" />
        </motion.button>
      </div>
    </div>
  )
}
