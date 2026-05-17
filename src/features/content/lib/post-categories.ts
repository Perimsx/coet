import { slug } from 'github-slugger'

const FALLBACK_CATEGORY = 'general'

// 正向字典：slug -> 显示名
export const CATEGORY_LABELS: Record<string, { zh: string; en: string }> = {
  "general": { "zh": "综合", "en": "General" },
  "artificial-intelligence": { "zh": "人工智能", "en": "Artificial Intelligence" },
  "cyber-security": { "zh": "网络安全", "en": "Cyber Security" },
  "penetration-testing": { "zh": "渗透测试", "en": "Penetration Testing" },
  "algorithms": { "zh": "算法详解", "en": "Algorithms" },
  "project-practice": { "zh": "项目实践", "en": "Project Practice" },
  "system-design": { "zh": "系统设计", "en": "System Design" },
  "coet-dev": { "zh": "工作站开发", "en": "Coet Development" },
}

// 别名字典：乱写的中文分类 / 变体 -> 标准 slug (保障路由为英文)
export const CATEGORY_ALIASES: Record<string, string> = {
  "系统设计": "system-design",
  "工作站开发": "coet-dev",
  "coet": "coet-dev",
  "项目开发": "project-practice",
  "项目实践": "project-practice",
  "渗透测试": "penetration-testing",
  "渗透": "penetration-testing",
  "算法详解": "algorithms",
  "算法": "algorithms",
  "网络安全": "cyber-security",
  "安全": "cyber-security",
  "人工智能": "artificial-intelligence",
  "ai": "artificial-intelligence",
  "综合": "general",
}

export function normalizeCategoryToSlug(category: string): string {
  if (!category) return FALLBACK_CATEGORY
  const trimmed = String(category).trim()
  
  // 1. 优先命中中文到英文 slug 的翻译映射
  if (CATEGORY_ALIASES[trimmed]) {
    return CATEGORY_ALIASES[trimmed]
  }
  
  // 2. 对于不在字典中的新分类，尝试 slugify
  const sluggified = slug(trimmed)
  return sluggified || FALLBACK_CATEGORY
}

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
    const candidate = normalizeCategoryToSlug(segments[index])
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
    .map((category) => normalizeCategoryToSlug(category))
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
  const categorySlug = normalizeCategoryToSlug(category)
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
