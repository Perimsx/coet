'use client'

import { useRef } from 'react'
import { gsap } from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { useGSAP } from '@gsap/react'

gsap.registerPlugin(ScrollTrigger)

export default function ReadingProgressBar() {
  const barRef = useRef<HTMLDivElement>(null)

  useGSAP(() => {
    if (!barRef.current) return

    gsap.to(barRef.current, {
      width: '100%',
      ease: 'none',
      scrollTrigger: {
        trigger: document.documentElement,
        start: 'top top',
        end: 'bottom bottom',
        scrub: 0.3,
      },
    })
  })

  return (
    <div className="pointer-events-none fixed left-0 top-0 z-[100] h-[2.5px] w-full bg-transparent sm:h-[3px]">
      <div
        ref={barRef}
        className="h-full w-0 bg-primary/50 dark:bg-primary/60"
      />
    </div>
  )
}
