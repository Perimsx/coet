import { CATEGORY_LABELS, normalizeCategoryToSlug } from './post-categories'

function toTitleCase(input: string) {
  return input.replace(/\b[a-z]/g, (char) => char.toUpperCase())
}

export function getLocalizedCategoryLabel(categorySlug: string, locale: 'zh' | 'en' = 'zh') {
  if (!categorySlug) {
    return locale === 'en' ? 'Other' : '其他'
  }

  const normalizedSlug = normalizeCategoryToSlug(categorySlug)
  const labels = CATEGORY_LABELS[normalizedSlug]

  if (labels) {
    return labels[locale]
  }

  const hasChinese = /[一-龥]/.test(categorySlug)
  if (hasChinese) {
    return categorySlug
  }

  return toTitleCase(categorySlug.replace(/-/g, ' '))
}
