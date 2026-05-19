import { getDictionary } from '@/shared/utils/i18n'
import { useLanguage } from '@/shared/contexts/LanguageContext'

export function getNavLanguage(locale: 'zh' | 'en' = 'zh') {
  return {
    dictionary: getDictionary(locale),
    locale,
    dateLocale: locale === 'en' ? 'en-US' : 'zh-CN',
  }
}

export function useNavLanguage() {
  const { locale, dictionary } = useLanguage()
  return {
    dictionary,
    locale,
    dateLocale: locale === 'en' ? 'en-US' : 'zh-CN',
  }
}
