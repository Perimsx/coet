'use client'

import { createContext, useContext, useState, ReactNode } from 'react'

type TocContextType = {
  isTocOpen: boolean
  setIsTocOpen: (open: boolean) => void
}

const TocContext = createContext<TocContextType | undefined>(undefined)

export function TocProvider({ children }: { children: ReactNode }) {
  const [isTocOpen, setIsTocOpen] = useState(true)

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
