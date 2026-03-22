'use client'

import { useEffect, useState } from 'react'

export default function ReadingProgressBar() {
  const [completion, setCompletion] = useState(0)

  useEffect(() => {
    const updateScrollCompletion = () => {
      const currentProgress = window.scrollY
      const scrollHeight = document.documentElement.scrollHeight - window.innerHeight
      if (scrollHeight) {
        setCompletion(+(currentProgress / scrollHeight).toFixed(2) * 100)
      }
    }

    window.addEventListener('scroll', updateScrollCompletion)
    return () => window.removeEventListener('scroll', updateScrollCompletion)
  }, [])

  return (
    <div className="fixed top-0 left-0 z-[100] h-1 w-full pointer-events-none">
      <div
        className="h-full bg-primary-500 transition-all duration-300 ease-out"
        style={{ width: `${completion}%` }}
      />
    </div>
  )
}
