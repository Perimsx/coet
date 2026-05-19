'use client'

import { useEffect, useState } from 'react'

export default function ReadingProgressBar() {
  const [completion, setCompletion] = useState(0)

  useEffect(() => {
    const updateScrollCompletion = () => {
      const scrollHeight = document.documentElement.scrollHeight - window.innerHeight
      if (scrollHeight) {
        setCompletion(+(window.scrollY / scrollHeight).toFixed(2) * 100)
      } else {
        setCompletion(0)
      }
    }

    updateScrollCompletion()
    window.addEventListener('scroll', updateScrollCompletion, { passive: true })
    return () => window.removeEventListener('scroll', updateScrollCompletion)
  }, [])

  return (
    <div className="fixed top-0 left-0 z-[100] w-full pointer-events-none h-[2.5px] sm:h-[3px] bg-transparent">
      <div
        className="h-full bg-primary/50 dark:bg-primary/60 transition-[width] duration-150"
        style={{ width: `${completion}%` }}
      />
    </div>
  )
}
