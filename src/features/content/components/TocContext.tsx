'use client'

import { createContext, useContext, useState, ReactNode, useEffect } from 'react'

type TocContextType = {
  isTocOpen: boolean
  setIsTocOpen: (open: boolean) => void
}

const TocContext = createContext<TocContextType | undefined>(undefined)

export function TocProvider({ children }: { children: ReactNode }) {
  const [isTocOpen, setIsTocOpen] = useState(false)
  
  useEffect(() => {
    // 桌面端 (lg 1024px+) 默认开启目录，提升阅读引导性
    if (window.innerWidth >= 1024) {
      setIsTocOpen(true)
    }
  }, [])


  return (
    <TocContext.Provider value={{ isTocOpen, setIsTocOpen }}>
      {children}
    </TocContext.Provider>
  )
}

export function useToc() {
  const context = useContext(TocContext)
  if (context === undefined) {
    throw new Error('useToc must be used within a TocProvider')
  }
  return context
}
