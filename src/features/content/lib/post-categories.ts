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
    .map((category) => String(category).trim())
    .filter(Boolean)

  if (normalized.length) {
    return [...new Set(normalized)]
  }

  return [inferCategoryFromPath(sourcePath)]
}

export function getCategoryLabel(category: string) {
  if (!category) {
    return CATEGORY_LABELS[FALLBACK_CATEGORY]?.zh || '其他'
  }
  
  // 1. 尝试从映射表找 (针对英文 slug 映射中文)
  const categorySlug = slug(category)
  if (CATEGORY_LABELS[categorySlug]) {
    return CATEGORY_LABELS[categorySlug].zh
  }

  // 2. 如果本身就是中文，直接返回
  const hasChinese = /[\u4e00-\u9fa5]/.test(category)
  if (hasChinese) {
    return category
  }

  // 3. 兜底处理 (Title Case)
  return toTitleCase(category.replace(/-/g, ' '))
}
