import { slug } from 'github-slugger'
import categoryLabels from '@/generated/content/category-labels.json'

const FALLBACK_CATEGORY = 'general'
const CATEGORY_LABELS = categoryLabels as Record<string, { zh: string; en: string }>

function normalizeSourcePath(sourcePath: string) {
  return sourcePath.replace(/\\/g, '/').toLowerCase()
}

function toTitleCase(input: string) {
  return input.replace(/\b[a-z]/g, (char) => char.toUpperCase())
}

export function inferCategoryFromPath(sourcePath: string) {
  const normalizedPath = normalizeSourcePath(sourcePath)
  const segments = normalizedPath.split('/').filter(Boolean)

  for (let index = segments.length - 2; index >= 0; index -= 1) {
    const candidate = slug(segments[index])
    if (!candidate || candidate === 'blog' || candidate === 'content') {
      continue
    }

    if (CATEGORY_LABELS[candidate]) {
      return candidate
    }
  }

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
  if (!categorySlug) {
    return CATEGORY_LABELS[FALLBACK_CATEGORY]?.zh || '其他'
  }
  return CATEGORY_LABELS[categorySlug]?.zh || toTitleCase(categorySlug.replace(/-/g, ' '))
}
