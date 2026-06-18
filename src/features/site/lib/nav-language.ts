import { useLanguage } from '@/shared/contexts/LanguageContext'

export function useNavLanguage() {
  const { locale, dictionary } = useLanguage()
  return {
    dictionary,
    locale,
    dateLocale: locale === 'en' ? 'en-US' : 'zh-CN',
  }
}
