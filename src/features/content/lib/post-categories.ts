import { slug } from 'github-slugger'
import categoryLabels from '@/generated/content/category-labels.json'

const FALLBACK_CATEGORY = 'general'

function normalizeSourcePath(sourcePath: string) {
  return sourcePath.replace(/\\/g, '/').toLowerCase()
}

function toTitleCase(input: string) {
  return input.replace(/\b[a-z]/g, (char) => char.toUpperCase())
}

export function inferCategoryFromPath(sourcePath: string) {
  // 移除所有硬编码逻辑
  return FALLBACK_CATEGORY
}

export function resolvePostCategories(categories: string[] | undefined, sourcePath: string) {
  const normalized = (categories || [])
    .map((category) => slug(String(category).trim()))
    .filter(Boolean)

  if (normalized.length) {
    return [...new Set(normalized)]
  }

  return [inferCategoryFromPath(sourcePath)]
}

export function getCategoryLabel(categorySlug: string) {
  const labels = categoryLabels as Record<string, { zh: string; en: string }>
  if (!categorySlug) {
    return labels[FALLBACK_CATEGORY]?.zh || '其他'
  }
  return labels[categorySlug]?.zh || toTitleCase(categorySlug.replace(/-/g, ' '))
}
