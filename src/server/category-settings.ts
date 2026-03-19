import 'server-only'

import { promises as fs } from 'fs'
import path from 'path'

export type CategoryDefinition = {
  slug: string
  labelZh: string
  labelEn: string
}

type StoredCategoryDefinition = Partial<CategoryDefinition>

const categoriesFilePath = path.join(process.cwd(), 'storage', 'settings', 'categories.json')
const categoryDataPath = path.join(process.cwd(), 'src', 'generated', 'content', 'category-data.json')

function isStoredCategoryDefinition(value: unknown): value is StoredCategoryDefinition {
  return typeof value === 'object' && value !== null
}

function normalizeStoredCategory(value: StoredCategoryDefinition): CategoryDefinition | null {
  if (typeof value.slug !== 'string' || !value.slug.trim()) {
    return null
  }

  const slug = value.slug.trim().toLowerCase()

  return {
    slug,
    labelZh: String(value.labelZh || slug).trim(),
    labelEn: String(value.labelEn || slug).trim(),
  }
}

export async function getCategoryDefinitions(): Promise<CategoryDefinition[]> {
  try {
    const raw = await fs.readFile(categoriesFilePath, 'utf8')
    const parsed: unknown = JSON.parse(raw)

    if (Array.isArray(parsed) && parsed.length > 0) {
      return parsed
        .filter(isStoredCategoryDefinition)
        .map(normalizeStoredCategory)
        .filter((item): item is CategoryDefinition => Boolean(item))
    }
  } catch {
    // Ignore malformed or missing runtime category files.
  }

  try {
    const rawData = await fs.readFile(categoryDataPath, 'utf8')
    const dataObj = JSON.parse(rawData) as Record<string, number>

    return Object.keys(dataObj).map((slug) => ({
      slug: slug.toLowerCase(),
      labelZh: slug,
      labelEn: slug.charAt(0).toUpperCase() + slug.slice(1),
    }))
  } catch {
    return []
  }
}

export async function saveCategoryDefinitions(categories: CategoryDefinition[]) {
  const normalized = categories
    .filter((item) => item.slug.trim())
    .map((item) => ({
      slug: item.slug.trim().toLowerCase().replace(/\s+/g, '-'),
      labelZh: item.labelZh.trim() || item.slug,
      labelEn: item.labelEn.trim() || item.slug,
    }))

  const seen = new Set<string>()
  const unique = normalized.filter((item) => {
    if (seen.has(item.slug)) return false
    seen.add(item.slug)
    return true
  })

  const dir = path.dirname(categoriesFilePath)
  await fs.mkdir(dir, { recursive: true })
  await fs.writeFile(categoriesFilePath, `${JSON.stringify(unique, null, 2)}\n`, 'utf8')

  const staticLabelsPath = path.join(process.cwd(), 'src', 'generated', 'content', 'category-labels.json')
  const staticLabelsMap: Record<string, { zh: string; en: string }> = {}

  unique.forEach((item) => {
    staticLabelsMap[item.slug] = { zh: item.labelZh, en: item.labelEn }
  })

  const staticDir = path.dirname(staticLabelsPath)
  await fs.mkdir(staticDir, { recursive: true })
  await fs.writeFile(staticLabelsPath, `${JSON.stringify(staticLabelsMap, null, 2)}\n`, 'utf8')

  return unique
}

export async function getCategoryLabelMap(): Promise<Record<string, { zh: string; en: string }>> {
  const categories = await getCategoryDefinitions()
  const map: Record<string, { zh: string; en: string }> = {}

  for (const category of categories) {
    map[category.slug] = { zh: category.labelZh, en: category.labelEn }
  }

  return map
}
