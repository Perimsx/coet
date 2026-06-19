'use client'

import { useRef } from 'react'
import Image from '@/features/content/components/Image'
import PageTitle from '@/shared/components/PageTitle'
import { getCategoryLabel } from '@/features/content/lib/post-categories'
import { gsap } from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { useGSAP } from '@gsap/react'

gsap.registerPlugin(ScrollTrigger)

const postDateTemplate: Intl.DateTimeFormatOptions = {
  year: 'numeric',
  month: 'long',
  day: 'numeric',
}

interface PostHeroBannerProps {
  title: string
  date: string
  category?: string | null
  tags?: string[]
  displayImage: string
  locale?: 'zh' | 'en'
}

export default function PostHeroBanner({
  title,
  date,
  category,
  tags,
  displayImage,
  locale = 'zh',
}: PostHeroBannerProps) {
  const dateLocale = locale === 'en' ? 'en-US' : 'zh-CN'
  const bannerRef = useRef<HTMLDivElement>(null)
  const imageRef = useRef<HTMLDivElement>(null)
  const contentRef = useRef<HTMLDivElement>(null)

  useGSAP(() => {
    if (!bannerRef.current) return

    // Image parallax — subtle scale on scroll
    if (imageRef.current) {
      gsap.to(imageRef.current, {
        scale: 1.08,
        ease: 'none',
        scrollTrigger: {
          trigger: bannerRef.current,
          start: 'top bottom',
          end: 'bottom top',
          scrub: 0.5,
        },
      })
    }

    // Content fade in
    if (contentRef.current) {
      gsap.from(contentRef.current.children, {
        y: 20,
        opacity: 0,
        duration: 0.6,
        stagger: 0.1,
        ease: 'power2.out',
      })
    }
  }, { scope: bannerRef })

  return (
    <div ref={bannerRef} className="relative w-full h-auto min-h-[300px] py-14 md:py-0 md:h-[45vh] md:min-h-[400px] max-h-[550px] mb-6 sm:mb-10 flex items-center justify-center overflow-hidden rounded-2xl sm:rounded-3xl border border-zinc-200/10 dark:border-zinc-800/10 shadow-2xl">
      {/* Background image layer */}
      <div ref={imageRef} className="absolute inset-0 z-0 origin-center scale-[1.03]">
        <Image
          src={displayImage}
          alt={title}
          fill
          priority
          className="object-cover"
        />

        <div className="absolute inset-0 bg-zinc-950/40 dark:bg-black/55 backdrop-blur-[1.5px] transition-colors duration-300" />
        <div className="absolute inset-x-0 bottom-0 h-[35%] bg-gradient-to-t from-background via-background/40 to-transparent" />
      </div>

      {/* Content layer */}
      <div ref={contentRef} className="relative z-10 w-full max-w-4xl px-6 sm:px-8 pt-8 flex flex-col items-center text-center space-y-6 sm:space-y-7">
        <PageTitle className="text-2xl sm:text-3xl md:text-4xl lg:text-[44px] leading-snug sm:leading-tight font-black tracking-tight text-white drop-shadow-[0_4px_12px_rgba(0,0,0,0.6)] px-2">
          {title}
        </PageTitle>

        <div className="flex flex-wrap justify-center items-center gap-2.5 text-[11px] sm:text-[12.5px] font-semibold tracking-wide">
          {category && (
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-primary/20 text-white backdrop-blur-md border border-primary-500/30 shadow-md transition-all hover:bg-primary/30 hover:scale-105 active:scale-95 duration-200">
              <span className="w-1.5 h-1.5 rounded-full bg-blue-400 animate-pulse" />
              {getCategoryLabel(category, locale)}
            </span>
          )}

          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/10 text-white/90 backdrop-blur-md border border-white/10 shadow-sm transition-all hover:bg-white/15 hover:scale-105 active:scale-95 duration-200">
            <svg className="w-3.5 h-3.5 opacity-80 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
              <line x1="16" y1="2" x2="16" y2="6"></line>
              <line x1="8" y1="2" x2="8" y2="6"></line>
              <line x1="3" y1="10" x2="21" y2="10"></line>
            </svg>
            <time dateTime={date}>
              {new Date(date).toLocaleDateString(dateLocale, postDateTemplate)}
            </time>
          </span>

          {tags && tags.length > 0 && (
            <div className="flex flex-wrap justify-center gap-2">
              {tags.slice(0, 3).map((tag) => (
                <span
                  key={tag}
                  className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-white/5 text-white/85 backdrop-blur-md border border-white/5 transition-all hover:bg-white/10 hover:text-white hover:scale-105 active:scale-95 duration-200"
                >
                  <svg className="w-3 h-3 opacity-60 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <line x1="4" y1="9" x2="20" y2="9"></line>
                    <line x1="4" y1="15" x2="20" y2="15"></line>
                    <line x1="10" y1="3" x2="8" y2="21"></line>
                    <line x1="16" y1="3" x2="14" y2="21"></line>
                  </svg>
                  <span>{tag.replace(/^#/, '')}</span>
                </span>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
