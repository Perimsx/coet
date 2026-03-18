import { allBlogs, allAuthors } from 'contentlayer/generated'
import type { Blog, Authors } from 'contentlayer/generated'
import fs from 'fs'
import path from 'path'

const isProduction = process.env.NODE_ENV === 'production'
const root = process.cwd()

/**
 * 动态加载 Contentlayer 数据
 * 在生产环境下，通过直接读取 JSON 文件来绕过 Node.js 模块缓存，
 * 实现“保存即生效”而无需重启服务器。
 */
function loadDynamicData<T>(jsonPath: string, fallback: T): T {
  try {
    const absolutePath = path.join(root, jsonPath)
    if (fs.existsSync(absolutePath)) {
      const content = fs.readFileSync(absolutePath, 'utf8')
      return JSON.parse(content)
    }
  } catch (error) {
    // 生产环境下记录错误，开发环境下如果文件不存在通常由 fallback 处理
    if (isProduction) {
      console.error(`[ContentlayerAdapter] Failed to load dynamic data from ${jsonPath}:`, error)
    }
  }
  
  return fallback
}

export function getAllBlogs(): Blog[] {
  return loadDynamicData<Blog[]>('.contentlayer/generated/Blog/_index.json', allBlogs)
}

export function getAllAuthors(): Authors[] {
  return loadDynamicData<Authors[]>('.contentlayer/generated/Authors/_index.json', allAuthors)
}

export function getTagData(): Record<string, number> {
  return loadDynamicData<Record<string, number>>(
    'src/generated/content/tag-data.json',
    {}
  )
}

export function getCategoryData(): Record<string, number> {
  return loadDynamicData<Record<string, number>>(
    'src/generated/content/category-data.json',
    {}
  )
}
