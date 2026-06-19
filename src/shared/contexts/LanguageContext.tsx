'use client'

import React, { createContext, useContext, useState, useEffect } from 'react'
import { getDictionary, Dictionary } from '@/shared/utils/i18n'

type Locale = 'zh' | 'en'

interface LanguageContextType {
  locale: Locale
  setLocale: (locale: Locale) => void
  toggleLanguage: () => void
  dictionary: Dictionary
  isMounted: boolean
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined)

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>('zh')
  const [isMounted, setIsMounted] = useState(false)

  useEffect(() => {
    const savedLocale = localStorage.getItem('locale') as Locale
    if (savedLocale === 'zh' || savedLocale === 'en') {
      setLocaleState(savedLocale)
      document.documentElement.lang = savedLocale === 'en' ? 'en' : 'zh-CN'
    }
    setIsMounted(true)
  }, [])

  const setLocale = (newLocale: Locale) => {
    setLocaleState(newLocale)
    localStorage.setItem('locale', newLocale)
    document.documentElement.lang = newLocale === 'en' ? 'en' : 'zh-CN'
    window.dispatchEvent(new CustomEvent('locale-change', { detail: newLocale }))
  }

  const toggleLanguage = () => {
    setLocale(locale === 'zh' ? 'en' : 'zh')
  }

  const dictionary = getDictionary(locale)

  return (
    <LanguageContext.Provider value={{ locale, setLocale, toggleLanguage, dictionary, isMounted }}>
      {children}
    </LanguageContext.Provider>
  )
}

export function useLanguage() {
  const context = useContext(LanguageContext)
  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider')
  }
  return context
}
