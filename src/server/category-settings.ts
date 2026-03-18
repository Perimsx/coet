import 'server-only'

import { promises as fs } from 'fs'
import path from 'path'

/**
 * 分类定义：包含 slug、中英文标签
 * 动态存储在 storage/settings/categories.json 中
 * 前后台实时同步读取
 */
export type CategoryDefinition = {
  slug: string
  labelZh: string
  labelEn: string
}

const categoriesFilePath = path.join(process.cwd(), 'storage', 'settings', 'categories.json')

const categoryDataPath = path.join(process.cwd(), 'src', 'generated', 'content', 'category-data.json')

/**
 * 获取全部分类定义
 * 优先从 JSON 文件读取，文件不存在时返回默认值
 */
export async function getCategoryDefinitions(): Promise<CategoryDefinition[]> {
  try {
    const raw = await fs.readFile(categoriesFilePath, 'utf8')
    const parsed = JSON.parse(raw)
    if (Array.isArray(parsed) && parsed.length > 0) {
      // 确保每项有 slug/labelZh/labelEn
      return parsed
        .filter((item: any) => item?.slug && typeof item.slug === 'string')
        .map((item: any) => ({
          slug: String(item.slug).trim().toLowerCase(),
          labelZh: String(item.labelZh || item.slug || '').trim(),
          labelEn: String(item.labelEn || item.slug || '').trim(),
        }))
    }
  } catch {
    // ignore
  }

  // 如果没有定义或者文件不存在，从基于文章扫描出的动态类别数据中恢复出结构
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

/**
 * 保存分类定义列表
 */
export async function saveCategoryDefinitions(categories: CategoryDefinition[]) {
  const normalized = categories
    .filter((item) => item.slug.trim())
    .map((item) => ({
      slug: item.slug.trim().toLowerCase().replace(/\s+/g, '-'),
      labelZh: item.labelZh.trim() || item.slug,
      labelEn: item.labelEn.trim() || item.slug,
    }))

  // 去重
  const seen = new Set<string>()
  const unique = normalized.filter((item) => {
    if (seen.has(item.slug)) return false
    seen.add(item.slug)
    return true
  })

  const dir = path.dirname(categoriesFilePath)
  await fs.mkdir(dir, { recursive: true })
  await fs.writeFile(categoriesFilePath, `${JSON.stringify(unique, null, 2)}\n`, 'utf8')

  // 同时同步到生成的静态 JSON，供客户端组件 import 使用
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

/**
 * 构建分类标签查找表（供前台使用）
 * 返回 { slug -> { zh: label, en: label } }
 */
export async function getCategoryLabelMap(): Promise<Record<string, { zh: string; en: string }>> {
  const categories = await getCategoryDefinitions()
  const map: Record<string, { zh: string; en: string }> = {}
  for (const cat of categories) {
    map[cat.slug] = { zh: cat.labelZh, en: cat.labelEn }
  }
  return map
}
