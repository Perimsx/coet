import { getDictionary } from '@/shared/utils/i18n'

export function getNavLanguage() {
  return {
    dictionary: getDictionary(),
    locale: 'zh',
    dateLocale: 'zh-CN',
  }
}
