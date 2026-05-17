import { CATEGORY_LABELS, normalizeCategoryToSlug } from './post-categories'

function toTitleCase(input: string) {
  return input.replace(/\b[a-z]/g, (char) => char.toUpperCase())
}

/**
 * 获取分类的本地化标签
 */
export function getLocalizedCategoryLabel(categorySlug: string) {
  if (!categorySlug) {
    return '其他'
  }

  const normalizedSlug = normalizeCategoryToSlug(categorySlug)
  const labels = CATEGORY_LABELS[normalizedSlug]
  
  if (labels) {
    return labels.zh
  }

  const hasChinese = /[\u4e00-\u9fa5]/.test(categorySlug)
  if (hasChinese) {
    return categorySlug
  }

  return toTitleCase(categorySlug.replace(/-/g, ' '))
}
