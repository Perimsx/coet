import categoryLabels from '@/generated/content/category-labels.json'

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

  const labels = (categoryLabels as Record<string, { zh: string }>)[categorySlug]
  if (labels) {
    return labels.zh
  }

  return toTitleCase(categorySlug.replace(/-/g, ' '))
}
