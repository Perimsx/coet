'use client'

import { useRef } from 'react'
import { motion } from 'framer-motion'
import Image from 'next/image'
import type { HeroPresentation } from '@/blog.config'
import type { AboutProfileViewModel } from '@/features/content/lib/about-profile'
import SocialIcon from '@/features/site/components/social-icons'
import { ChevronDown } from 'lucide-react'
import { TooltipIconButton } from '@/shared/components/TooltipIconButton'

interface HeroProps {
  presentation: HeroPresentation
  socials?: AboutProfileViewModel['socials']
  stats?: {
    postsCount: number
    wordCount: number | string
    daysCount: number | string
  }
}

export default function Hero({ presentation, socials = [], stats }: HeroProps) {
  const heroRef = useRef<HTMLDivElement>(null)

  const postsCount = stats?.postsCount ?? 0
  const wordCount = stats?.wordCount ?? '0'
  const daysCount = stats?.daysCount ?? '0'

  return (
    <div
      ref={heroRef}
      className="relative flex min-h-[85vh] w-full flex-col items-center justify-center overflow-hidden py-16"
    >
      {/* 1:1 Radial Ambient Glow */}
      <div
        className="pointer-events-none absolute -z-10 left-1/2 top-[42%] -translate-x-1/2 -translate-y-1/2 rounded-full size-[250px] lg:size-[450px] bg-[radial-gradient(ellipse,rgba(255,240,210,0.15)_0%,transparent_55%)] dark:bg-[radial-gradient(ellipse,rgba(180,200,255,0.08)_0%,transparent_55%)]"
      />

      <div className="mx-auto flex w-full max-w-4xl flex-col items-center justify-center px-4 text-center lg:px-8">
        {/* 头像 */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
          className="mb-8 flex shrink-0"
        >
          <div className="relative size-20 lg:size-28 overflow-hidden rounded-full shadow-[inset_0_0_0_1px_rgba(0,0,0,0.06)] dark:shadow-[inset_0_0_0_1px_rgba(255,255,255,0.08)]">
            <Image
              src={presentation.avatarSrc}
              alt={presentation.avatarAlt}
              fill
              sizes="(max-width: 1024px) 80px, 112px"
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
        </motion.div>

        {/* 1:1 H1 Title & AI Agents Shimmer */}
        <motion.h1
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.08, duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
          className="text-center font-serif text-title-24 sm:text-title-28 lg:text-[2.5rem] font-normal leading-relaxed text-neutral-9 lg:leading-snug"
        >
          <span className="font-light opacity-85">Hi, I&apos;m </span>
          <span className="font-medium text-accent tracking-[-0.035em] [text-shadow:0_0_28px_color-mix(in_srgb,var(--color-accent)_22%,transparent)]">
            {presentation.displayName || 'Kerntau'}
          </span>
          <span className="inline-block font-light -rotate-8 -translate-y-[0.03em] ml-1.5">👋</span>
          <br />
          <span className="font-light opacity-80">I orchestrate </span>
          <span className="font-medium text-accent tracking-[-0.025em] italic">ideas</span>
          <span className="font-light opacity-80"> into products with </span>
          <span className="inline-block mx-1 text-accent text-[0.72em] align-middle [animation:aiTwinkle_2.4s_ease-in-out_infinite]">
            ✦
          </span>
          <code className="inline-flex items-center font-mono text-[0.62em] font-medium px-3 py-1 rounded-full text-accent border border-accent/25 bg-gradient-to-br from-accent/8 via-accent/13 to-accent/7 shadow-xs [animation:aiShimmerLoop_4.8s_cubic-bezier(0.4,0,0.2,1)_infinite] align-middle leading-none">
            AI Agents
          </code>
          <span className="inline-block w-[2px] h-[0.86em] bg-accent ml-1 align-middle [animation:blink_1.2s_linear_infinite] rounded-full opacity-80 shadow-[0_0_14px_var(--color-accent)]" />
        </motion.h1>

        {/* 1:1 Subtitle Tagline */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.16, duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
          className="mt-4 text-center text-caption-10 uppercase tracking-[1.2px] text-neutral-5 lg:text-label-12 lg:tracking-[1.5px]"
        >
          {presentation.tagline || 'A product-minded engineer building interfaces, workflows, and tiny autonomous systems.'}
        </motion.div>

        {/* 1:1 诗意引言与统计栏 */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.24, duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
          className="mt-8 text-center"
        >
          <div className="min-h-[1.5em] max-w-[65ch] font-serif text-label-12 italic text-neutral-5">
            「当第一颗卫星飞向大气层外，我们便以为自己终有一日会征服宇宙。」
          </div>
          <div className="mt-2.5 flex items-center justify-center gap-3 text-caption-10 tracking-wide text-neutral-5">
            <span>{postsCount} 篇</span>
            <span>·</span>
            <span>{wordCount} 万字</span>
            <span>·</span>
            <span>{daysCount} 天</span>
          </div>
        </motion.div>

        {/* 1:1 社交平台圆形纽扣阵列 */}
        {socials.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.32, duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
            className="mb-8 mt-7 flex justify-center gap-3"
          >
            {socials.map((social) => {
              return (
                <TooltipIconButton
                  key={`${social.platform}-${social.url}`}
                  label={social.label}
                >
                  <a
                    href={social.url}
                    target="_blank"
                    rel="noreferrer"
                    className="flex size-10 items-center justify-center rounded-full text-neutral-6 transition-colors duration-200 hover:bg-neutral-3 hover:text-neutral-9 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/35"
                    aria-label={social.label}
                  >
                    <SocialIcon
                      kind={social.platform}
                      size={4}
                      icon={social.icon}
                    />
                  </a>
                </TooltipIconButton>
              )
            })}
          </motion.div>
        )}
      </div>

      {/* 底部阅读向下指引 */}
      <div className="mt-4 flex flex-col items-center gap-1 text-center">
        <TooltipIconButton label={presentation.scrollAriaLabel} side="top">
          <motion.button
            initial={{ opacity: 0, y: -4 }}
            animate={{
              opacity: [0.4, 0.8, 0.4],
              y: [0, 4, 0],
            }}
            transition={{
              duration: 2.2,
              repeat: Infinity,
              ease: 'easeInOut',
            }}
            onClick={() => {
              const nextSection = document.getElementById('recent-writing')
              if (nextSection) {
                nextSection.scrollIntoView({ behavior: 'smooth' })
              }
            }}
            className="text-neutral-5 transition-colors hover:text-accent focus:outline-none cursor-pointer"
            aria-label={presentation.scrollAriaLabel}
          >
            <ChevronDown className="h-4 w-4 sm:h-5 sm:w-5" />
          </motion.button>
        </TooltipIconButton>
      </div>
    </div>
  )
}
