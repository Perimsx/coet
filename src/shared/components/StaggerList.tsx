'use client'

import { useRef, type ReactNode } from 'react'
import { gsap } from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { useGSAP } from '@gsap/react'

gsap.registerPlugin(ScrollTrigger)

export function StaggerList({ children, className = '', as: Tag = 'ul' }: {
  children: ReactNode
  className?: string
  as?: 'ul' | 'ol' | 'div'
}) {
  const ref = useRef<HTMLUListElement>(null)

  useGSAP(() => {
    if (!ref.current) return
    const items = ref.current.children
    if (!items.length) return

    gsap.from(items, {
      y: 20,
      opacity: 0,
      duration: 0.5,
      stagger: 0.08,
      ease: 'power2.out',
      scrollTrigger: {
        trigger: ref.current,
        start: 'top 85%',
        toggleActions: 'play none none none',
      },
    })
  })

  return <Tag ref={ref as any} className={className}>{children}</Tag>
}
