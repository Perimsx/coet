import { useLanguage } from '@/shared/contexts/LanguageContext'

const NAV_TRANSLATIONS: Record<string, Record<string, string>> = {
  zh: {
    "首页": "首页", "文章": "文章", "归档": "归档", "分类": "分类",
    "标签": "标签", "友链": "友链", "关于": "关于", "导航菜单": "导航菜单",
    "知识库": "知识库",
  },
  en: {
    "首页": "Home", "文章": "Articles", "归档": "Archives", "分类": "Categories",
    "标签": "Tags", "友链": "Friends", "关于": "About", "导航菜单": "Menu",
    "知识库": "Knowledge Base",
  },
}

export function useNavLanguage() {
  const { locale, dictionary } = useLanguage()
  const translateNav = (title: string) => NAV_TRANSLATIONS[locale]?.[title] || title

  return {
    dictionary,
    locale,
    dateLocale: locale === 'en' ? 'en-US' : 'zh-CN',
    translateNav,
  }
}
