'use client'

import { motion } from 'framer-motion'
import Image from 'next/image'
import type { CSSProperties } from 'react'
import type { HeroPresentation } from '@/blog.config'
import type { AboutProfileViewModel } from '@/features/content/lib/about-profile'
import SocialIcon from '@/features/site/components/social-icons'
import { ChevronDown } from 'lucide-react'
import { TooltipIconButton } from '@/shared/components/TooltipIconButton'

interface HeroProps {
  presentation: HeroPresentation
  socials?: AboutProfileViewModel['socials']
}

const rainStreaks = [
  {
    left: '5%',
    top: '-8%',
    height: 76,
    duration: 8.8,
    delay: -1.4,
    opacity: 0.36
  },
  {
    left: '12%',
    top: '18%',
    height: 64,
    duration: 10.4,
    delay: -5.1,
    opacity: 0.3
  },
  {
    left: '18%',
    top: '-16%',
    height: 92,
    duration: 11.8,
    delay: -2.2,
    opacity: 0.26
  },
  {
    left: '24%',
    top: '35%',
    height: 56,
    duration: 9.3,
    delay: -6.7,
    opacity: 0.32
  },
  {
    left: '31%',
    top: '4%',
    height: 80,
    duration: 10.9,
    delay: -4.3,
    opacity: 0.26
  },
  {
    left: '39%',
    top: '30%',
    height: 96,
    duration: 12.2,
    delay: -8.2,
    opacity: 0.3
  },
  {
    left: '46%',
    top: '-10%',
    height: 68,
    duration: 8.9,
    delay: -3.4,
    opacity: 0.24
  },
  {
    left: '52%',
    top: '23%',
    height: 100,
    duration: 11.6,
    delay: -7.8,
    opacity: 0.28
  },
  {
    left: '59%',
    top: '0%',
    height: 74,
    duration: 10.1,
    delay: -1.9,
    opacity: 0.34
  },
  {
    left: '66%',
    top: '40%',
    height: 62,
    duration: 9.8,
    delay: -6.1,
    opacity: 0.26
  },
  {
    left: '74%',
    top: '-12%',
    height: 94,
    duration: 12.7,
    delay: -3.6,
    opacity: 0.28
  },
  {
    left: '83%',
    top: '20%',
    height: 78,
    duration: 10.6,
    delay: -9.4,
    opacity: 0.3
  },
  {
    left: '91%',
    top: '2%',
    height: 66,
    duration: 9.4,
    delay: -4.8,
    opacity: 0.24
  },
  {
    left: '96%',
    top: '33%',
    height: 98,
    duration: 12.4,
    delay: -7.2,
    opacity: 0.26
  },
  {
    left: '3%',
    top: '55%',
    height: 82,
    duration: 11.2,
    delay: -10.1,
    opacity: 0.24
  },
  {
    left: '28%',
    top: '63%',
    height: 68,
    duration: 9.7,
    delay: -8.8,
    opacity: 0.2
  },
  {
    left: '61%',
    top: '58%',
    height: 92,
    duration: 12.9,
    delay: -11.4,
    opacity: 0.22
  },
  {
    left: '88%',
    top: '61%',
    height: 76,
    duration: 10.8,
    delay: -9.7,
    opacity: 0.24
  }
] as const

export default function Hero({ presentation, socials = [] }: HeroProps) {
  return (
    <div className="relative flex min-h-[calc(100svh-56px)] w-full items-center justify-center overflow-hidden pb-16 sm:pb-0">
      <div className="pointer-events-none absolute inset-0 -z-10 overflow-hidden">
        <div className="absolute left-1/2 top-[45%] h-[28rem] w-[28rem] -translate-x-1/2 -translate-y-1/2 rounded-full bg-primary-300/10 blur-3xl dark:bg-primary-400/5" />
        <div className="absolute inset-x-0 bottom-0 h-40 bg-gradient-to-t from-background to-transparent" />
        {rainStreaks.map((streak, index) => (
          <span
            key={`${streak.left}-${streak.top}-${index}`}
            className="shiro-rain-streak"
            style={
              {
                left: streak.left,
                top: streak.top,
                height: `${streak.height}px`,
                '--rain-opacity': streak.opacity,
                animationDuration: `${streak.duration}s`,
                animationDelay: `${streak.delay}s`
              } as CSSProperties
            }
          />
        ))}
      </div>

      <div className="mx-auto flex w-full max-w-[100rem] -translate-y-2 flex-col items-center justify-center px-4 text-center sm:-translate-y-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 18, scale: 0.92 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ type: 'spring', stiffness: 120, damping: 18 }}
          className="relative mb-10 flex shrink-0 sm:mb-12"
        >
          <div className="relative h-20 w-20 overflow-hidden rounded-full border border-slate-200 object-cover shadow-[0_20px_80px_-32px_rgba(15,23,42,0.55)] transition-transform duration-500 hover:scale-105 sm:h-24 sm:w-24 dark:border-gray-800">
            <Image
              src={presentation.avatarSrc}
              alt={presentation.avatarAlt}
              fill
              sizes="96px"
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
          <div className="absolute -inset-12 -z-10 rounded-full bg-primary-500/10 blur-3xl dark:bg-primary-400/5" />
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{
            delay: 0.08,
            type: 'spring',
            stiffness: 100,
            damping: 16
          }}
          className="flex w-full flex-col items-center"
        >
          <h1 className="flex max-w-full flex-wrap items-center justify-center gap-x-3 gap-y-2 text-[clamp(2rem,4.2vw,4.15rem)] font-medium leading-none tracking-normal text-zinc-700 dark:text-zinc-200">
            <span>Hi, I&apos;m</span>
            <span className="font-semibold text-primary-500/95 dark:text-primary-300/95">
              {presentation.displayName}
            </span>
            <span className="text-[0.82em]">👋</span>
          </h1>

          <div
            className="mt-7 flex max-w-[96vw] flex-wrap items-center justify-center gap-x-3 gap-y-3 whitespace-nowrap font-medium leading-[1.08] tracking-normal text-zinc-700 dark:text-zinc-200"
            style={{ fontSize: 'clamp(1.6rem, 3.05vw, 3.55rem)' }}
          >
            <span>I orchestrate</span>
            <em className="font-semibold italic text-primary-500/95 dark:text-primary-300/95">
              ideas
            </em>
            <span>into products with</span>
            <span className="text-primary-400/80">✦</span>
            <span className="inline-flex items-center rounded-full border border-primary-300/70 bg-primary-50/70 px-5 py-1.5 font-mono text-[0.58em] font-bold text-primary-600/95 shadow-[0_18px_54px_-30px_rgba(14,165,233,0.7)] backdrop-blur-md dark:border-primary-400/25 dark:bg-primary-950/20 dark:text-primary-300/95">
              AI Agents
            </span>
            <span className="animate-pulse text-primary-500/70">|</span>
          </div>

          <p className="mt-8 max-w-4xl text-balance text-[clamp(0.74rem,1.1vw,1.05rem)] font-medium uppercase leading-relaxed tracking-[0.18em] text-zinc-400 dark:text-zinc-500">
            A product-minded engineer building interfaces, workflows, and tiny autonomous systems.
          </p>

          {socials.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 18 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.18, type: 'spring', stiffness: 110, damping: 18 }}
              className="mt-8 flex flex-wrap items-center justify-center gap-4 sm:gap-5"
            >
              {socials.map((social) => {
                const theme =
                  presentation.socialThemes[social.platform] || presentation.socialThemes.default

                return (
                  <TooltipIconButton key={`${social.platform}-${social.url}`} label={social.label}>
                    <motion.a
                      href={social.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      whileHover={{ scale: 1.1, y: -4 }}
                      whileTap={{ scale: 0.96 }}
                      transition={{ type: 'spring', stiffness: 420, damping: 18 }}
                      className={`group flex size-11 items-center justify-center rounded-full text-white shadow-[0_12px_28px_-18px_rgba(15,23,42,0.65)] ring-1 ring-black/5 transition-shadow hover:shadow-[0_16px_34px_-18px_rgba(15,23,42,0.72)] sm:size-12 ${theme.color}`}
                      aria-label={social.label}
                    >
                      <SocialIcon kind={social.platform} size={5} icon={social.icon} />
                    </motion.a>
                  </TooltipIconButton>
                )
              })}
            </motion.div>
          )}
        </motion.div>
      </div>

      <div className="absolute bottom-4 left-1/2 flex w-full -translate-x-1/2 flex-col items-center gap-1.5 text-center sm:bottom-10 sm:gap-3 [@media(max-height:760px)]:hidden">
        <div className="px-4 text-xs font-medium uppercase tracking-widest text-muted-foreground opacity-60 sm:text-sm whitespace-nowrap">
          {presentation.bottomText}
        </div>

        <TooltipIconButton label={presentation.scrollAriaLabel} side="top">
          <motion.button
            initial={{ opacity: 0, y: -10 }}
            animate={{
              opacity: [0.4, 1, 0.4],
              y: [0, 8, 0]
            }}
            transition={{
              duration: 2,
              repeat: Infinity,
              ease: 'easeInOut'
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
