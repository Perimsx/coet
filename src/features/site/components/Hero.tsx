'use client'

import { useRef } from 'react'
import { motion } from 'framer-motion'
import Image from 'next/image'
import type { HeroPresentation } from '@/blog.config'
import type { AboutProfileViewModel } from '@/features/content/lib/about-profile'
import SocialIcon from '@/features/site/components/social-icons'
import { ChevronDown } from 'lucide-react'
import { TooltipIconButton } from '@/shared/components/TooltipIconButton'
import { useNavLanguage } from '@/features/site/lib/nav-language'

interface HeroProps {
  presentation: HeroPresentation
  socials?: AboutProfileViewModel['socials']
}

export default function Hero({ presentation, socials = [] }: HeroProps) {
  const heroRef = useRef<HTMLDivElement>(null)
  const { dictionary } = useNavLanguage()

  return (
    <div
      ref={heroRef}
      className="relative flex min-h-[calc(100svh-48px)] w-full items-center justify-center overflow-hidden pb-16 sm:pb-0"
    >
      <div className="pointer-events-none absolute inset-0 -z-10 overflow-hidden">
        <div className="absolute left-1/2 top-[45%] h-[28rem] w-[28rem] -translate-x-1/2 -translate-y-1/2 rounded-full bg-primary-300/10 blur-3xl dark:bg-primary-400/5" />
        <div className="absolute inset-x-0 bottom-0 h-40 bg-gradient-to-t from-background to-transparent" />
      </div>

      <div className="mx-auto flex w-full max-w-[100rem] -translate-y-2 flex-col items-center justify-center px-4 text-center sm:-translate-y-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 18, scale: 0.92 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ type: 'spring', stiffness: 120, damping: 18 }}
          className="relative mb-12 flex shrink-0 sm:mb-14"
        >
          <div className="relative h-24 w-24 overflow-hidden rounded-full border border-slate-200 object-cover shadow-[0_20px_80px_-32px_rgba(15,23,42,0.55)] transition-transform duration-500 hover:scale-105 sm:h-28 sm:w-28 dark:border-gray-800">
            <Image
              src={presentation.avatarSrc}
              alt={presentation.avatarAlt}
              fill
              sizes="112px"
              className="object-cover"
              priority
              onError={(event) => {
                const img = event.currentTarget
                if (img.src !== window.location.origin + '/avatar.png') {
                  img.src = '/avatar.png'
                }
              }}
            />
          </div>
          <div className="absolute -inset-14 -z-10 rounded-full bg-primary-500/10 blur-3xl dark:bg-primary-400/5" />
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{
            delay: 0.08,
            type: 'spring',
            stiffness: 100,
            damping: 16,
          }}
          className="flex w-full flex-col items-center"
        >
          <h1 className="flex max-w-full flex-wrap items-center justify-center gap-x-3 gap-y-2 text-[clamp(1.6rem,3.5vw,3.2rem)] font-medium leading-none tracking-normal text-zinc-700 dark:text-zinc-200">
            <span>{presentation.greetingPrefix}</span>
            <span className="font-semibold text-primary-500/95 dark:text-primary-300/95">
              {presentation.displayName}
            </span>
          </h1>

          <div
            className="mt-7 flex max-w-[96vw] flex-wrap items-center justify-center gap-x-3 gap-y-3 font-medium leading-[1.08] tracking-normal text-zinc-700 dark:text-zinc-200"
            style={{ fontSize: 'clamp(1.3rem, 2.5vw, 2.8rem)' }}
          >
            <span>{presentation.role}</span>
          </div>

          <p className="mt-6 max-w-2xl text-balance text-sm font-medium leading-relaxed text-zinc-400 dark:text-zinc-500 sm:text-base">
            {presentation.tagline}
          </p>

          {socials.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 18 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{
                delay: 0.18,
                type: 'spring',
                stiffness: 110,
                damping: 18,
              }}
              className="mt-8 flex flex-wrap items-center justify-center gap-4 sm:gap-5"
            >
              {socials.map((social) => {
                const theme =
                  presentation.socialThemes[social.platform] ||
                  presentation.socialThemes.default

                return (
                  <TooltipIconButton
                    key={`${social.platform}-${social.url}`}
                    label={social.label}
                  >
                    <motion.a
                      href={social.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      whileHover={{ scale: 1.1, y: -4 }}
                      whileTap={{ scale: 0.96 }}
                      transition={{
                        type: 'spring',
                        stiffness: 420,
                        damping: 18,
                      }}
                      className={`group flex size-9 items-center justify-center rounded-full text-white shadow-[0_12px_28px_-18px_rgba(15,23,42,0.65)] ring-1 ring-black/5 transition-shadow hover:shadow-[0_16px_34px_-18px_rgba(15,23,42,0.72)] sm:size-10 ${theme.color}`}
                      aria-label={social.label}
                    >
                      <SocialIcon
                        kind={social.platform}
                        size={5}
                        icon={social.icon}
                      />
                    </motion.a>
                  </TooltipIconButton>
                )
              })}
            </motion.div>
          )}
        </motion.div>
      </div>

      <div className="absolute bottom-4 left-1/2 flex w-full -translate-x-1/2 flex-col items-center gap-1.5 text-center sm:bottom-10 sm:gap-3">
        <div className="px-4 text-xs font-medium uppercase tracking-widest text-muted-foreground opacity-60 sm:text-sm whitespace-nowrap [@media(max-height:760px)]:hidden">
          {dictionary.home.heroBottomText}
        </div>

        <TooltipIconButton label={presentation.scrollAriaLabel} side="top">
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
        </TooltipIconButton>
      </div>
    </div>
  )
}
