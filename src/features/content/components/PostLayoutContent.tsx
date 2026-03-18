'use client'

import { useToc } from './TocContext'
import { ReactNode } from 'react'

export function PostLayoutContent({ children }: { children: ReactNode }) {
  const { isTocOpen } = useToc()

  return (
    <article 
      className={`relative mx-auto transition-all duration-500 ease-in-out px-1 sm:px-2
        ${isTocOpen 
          ? 'max-w-4xl xl:max-w-5xl xl:ml-[15%] 2xl:ml-auto' 
          : 'max-w-5xl'
        }`}
    >
      {children}
    </article>
  )
}
