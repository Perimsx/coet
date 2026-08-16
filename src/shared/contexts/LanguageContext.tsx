'use client'

import React, { createContext, useContext, useState, useEffect, useSyncExternalStore } from 'react'
import { getDictionary, Dictionary } from '@/shared/utils/i18n'

type Locale = 'zh' | 'en'

const emptySubscribe = () => () => {}

function readSavedLocale(): Locale {
  if (typeof window === 'undefined') return 'zh'
  try {
    const savedLocale = localStorage.getItem('locale') as Locale
    if (savedLocale === 'zh' || savedLocale === 'en') {
      return savedLocale
    }
  } catch {}
  return 'zh'
}

interface LanguageContextType {
  locale: Locale
  setLocale: (locale: Locale) => void
  toggleLanguage: () => void
  dictionary: Dictionary
  isMounted: boolean
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined)

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>(readSavedLocale)
  const isMounted = useSyncExternalStore(emptySubscribe, () => true, () => false)

  useEffect(() => {
    document.documentElement.lang = locale === 'en' ? 'en' : 'zh-CN'
  }, [locale])

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
