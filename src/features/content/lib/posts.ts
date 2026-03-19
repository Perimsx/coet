import 'server-only'

import { promises as fs } from 'fs'
import path from 'path'
import matter from 'gray-matter'
import { normalizePostSlug } from './post-editor-helpers'

const blogContentDir = path.join(process.cwd(), 'content', 'blog')
const dataDir = path.join(process.cwd(), 'content')

const postFrontmatterKeys = new Set([
  'title',
  'date',
  'tags',
  'categories',
  'draft',
  'summary',
  'authors',
  'lastmod',
])

/**
 * 文章文件摘要信息
 */
export type PostFileSummary = {
  title: string      // 标题
  slug: string       // 路径标识符
  relativePath: string // 相对路径
  absolutePath: string // 绝对路径
  updatedAt: string   // 更新时间
  date: string        // 发布日期
  summary: string     // 摘要
  tags: string[]      // 标签
  categories: string[] // 分类
  draft: boolean      // 是否草稿
  wordCount: number   // 字数
}

export type PostEditorRecord = PostFileSummary & {
  content: string
  authors: string[]
}

export type SavePostEditorInput = {
  relativePath?: string
  title: string
  slug?: string
  date?: string
  summary?: string
  tags?: string[]
  categories?: string[]
  draft?: boolean
  content?: string
  authors?: string[]
}

export type BatchPostMutationInput = {
  relativePaths: string[]
  operation: 'publish' | 'draft' | 'delete' | 'update-categories' | 'update-tags'
  categories?: string[]
  tags?: string[]
}

export type BatchPostMutationResult = {
  total: number
  successCount: number
  failureCount: number
  items: Array<{
    relativePath: string
    ok: boolean
    message: string
  }>
}

function normalizePathForUrl(filePath: string) {
  return filePath.replace(/\\/g, '/')
}

function normalizeInsideBlog(relativePath: string) {
  const normalized = normalizePathForUrl(relativePath).replace(/^\/+/, '')
  if (!normalized.startsWith('blog/') || !/\.(mdx?|md)$/.test(normalized)) {
    throw new Error('Invalid post path')
  }
  return normalized
}

function ensurePathInsideBlog(absolutePath: string) {
  const normalizedRoot = path.resolve(blogContentDir)
  const normalizedPath = path.resolve(absolutePath)
  const rootPrefix = `${normalizedRoot}${path.sep}`

  if (normalizedPath !== normalizedRoot && !normalizedPath.startsWith(rootPrefix)) {
    throw new Error('Post path out of content/blog')
  }

  return normalizedPath
}

function resolveSafePostPath(relativePath: string) {
  const normalized = normalizeInsideBlog(relativePath)
  return ensurePathInsideBlog(path.resolve(dataDir, normalized))
}

async function walkMdxFiles(dir: string): Promise<string[]> {
  try {
    const entries = await fs.readdir(dir, { withFileTypes: true })
    const nestedFiles = await Promise.all(
      entries.map(async (entry) => {
        const fullPath = path.join(dir, entry.name)
        if (entry.isDirectory()) {
          return walkMdxFiles(fullPath)
        }
        if (entry.isFile() && /\.mdx?$/.test(fullPath)) {
          return [fullPath]
        }
        return []
      })
    )

    return nestedFiles.flat()
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
      return []
    }
    throw error
  }
}

function toSlugFromRelativePath(relativePath: string) {
  return normalizePathForUrl(relativePath)
    .replace(/^blog\//, '')
    .replace(/\.mdx?$/, '')
}

function toRelativePathFromSlug(slug: string) {
  return path.posix.join('blog', `${slug}.md`)
}

function normalizeString(value: unknown, maxLength = 240) {
  if (typeof value !== 'string') return ''
  return value.trim().slice(0, maxLength)
}

function normalizeList(value: unknown, maxItems = 12, maxLength = 40) {
  const rawList = Array.isArray(value)
    ? value
    : typeof value === 'string'
      ? value.split(/[,\n]/)
      : []

  return Array.from(
    new Set(
      rawList
        .map((item) => normalizeString(item, maxLength))
        .filter(Boolean)
        .slice(0, maxItems)
    )
  )
}

function normalizeDateInput(value: unknown) {
  const text = typeof value === 'string' ? value.trim() : ''
  if (!text) {
    return new Date().toISOString()
  }
  
  // 如果是 YYYY-MM-DD，补齐时间
  if (/^\d{4}-\d{2}-\d{2}$/.test(text)) {
    return `${text} 00:00:00`
  }

  const parsed = new Date(text)
  if (Number.isNaN(parsed.getTime())) {
    return new Date().toISOString()
  }

  return parsed.toISOString()
}

function normalizeDraftValue(value: unknown, fallback = false) {
  if (typeof value === 'boolean') return value
  if (typeof value === 'string') {
    const normalized = value.trim().toLowerCase()
    if (['true', '1', 'yes', 'on'].includes(normalized)) return true
    if (['false', '0', 'no', 'off'].includes(normalized)) return false
  }
  return fallback
}

/**
 * 统计文章内容字数
 * 逻辑：移除 Markdown 语法元素后，统计中文字符数 + 英文单词数。建议修复错误。
 */
function countContentCharacters(content: string) {
  if (!content) return 0
  
  // 1. 移除 Markdown 语法元素 (图片, 链接, 代码块等)
  const cleanContent = content
    .replace(/!\[.*?\]\(.*?\)/g, '')       // 图片
    .replace(/\[.*?\]\(.*?\)/g, '')       // 链接
    .replace(/```[\s\S]*?```/g, '')       // 代码块内容通常不计入正文字数
    .replace(/`.*?`/g, '')                 // 行内代码
    .replace(/[#*`_~\[\]()!<>|-]/g, ' ')  // 特殊符号替换为空格
    .trim()

  // 2. 统计中文字符
  const chineseChars = cleanContent.match(/[\u4e00-\u9fa5]/g)?.length || 0
  
  // 3. 统计英文单词 (移除中文字符后按空白分割)
  const nonChineseContent = cleanContent.replace(/[\u4e00-\u9fa5]/g, ' ')
  const words = nonChineseContent.split(/\s+/).filter(word => word.length > 0).length
  
  return chineseChars + words
}

function uniqueRelativePath(baseRelativePath: string, existingPaths: Set<string>) {
  if (!existingPaths.has(baseRelativePath)) {
    return baseRelativePath
  }

  const extension = path.posix.extname(baseRelativePath)
  const stem = baseRelativePath.slice(0, -extension.length)
  let index = 1

  while (true) {
    const candidate = `${stem}-${index}${extension}`
    if (!existingPaths.has(candidate)) {
      return candidate
    }
    index += 1
  }
}

function parsePostSource(
  relativePath: string,
  absolutePath: string,
  rawSource: string,
  updatedAt: string
) {
  const parsed = matter(rawSource)
  const slug = toSlugFromRelativePath(relativePath)
  const content = parsed.content || ''

  return {
    title: normalizeString(parsed.data.title, 160) || slug,
    slug,
    relativePath,
    absolutePath,
    updatedAt,
    date: normalizeDateInput(parsed.data.date),
    summary: normalizeString(parsed.data.summary, 320),
    tags: normalizeList(parsed.data.tags, 16, 40),
    categories: normalizeList(parsed.data.categories, 8, 40),
    draft: normalizeDraftValue(parsed.data.draft, false),
    wordCount: countContentCharacters(content),
    content,
    authors: normalizeList(parsed.data.authors, 6, 80),
  } satisfies PostEditorRecord
}

function buildPostSource(frontmatter: Record<string, unknown>, content: string) {
  const body = content
    .replace(/^\uFEFF/, '')
    .replace(/\r\n/g, '\n')
    .trimEnd()
  return matter.stringify(body, frontmatter)
}

function getPreservedFrontmatter(data: Record<string, unknown>) {
  return Object.fromEntries(Object.entries(data).filter(([key]) => !postFrontmatterKeys.has(key)))
}

/**
 * 读取单篇文章完整记录
 */
async function readPostRecord(relativePath: string) {
  const absolutePath = resolveSafePostPath(relativePath)
  const [rawSource, stats] = await Promise.all([
    fs.readFile(absolutePath, 'utf8'),
    fs.stat(absolutePath),
  ])

  return {
    absolutePath,
    rawSource,
    stats,
    parsed: matter(rawSource),
    record: parsePostSource(relativePath, absolutePath, rawSource, stats.mtime.toISOString()),
  }
}

export async function listPostFiles(): Promise<PostFileSummary[]> {
  const mdxFiles = await walkMdxFiles(blogContentDir)

  const posts = await Promise.all(
    mdxFiles.map(async (filePath) => {
      const [rawSource, stats] = await Promise.all([
        fs.readFile(filePath, 'utf8'),
        fs.stat(filePath),
      ])
      const relativeInsideBlog = normalizePathForUrl(path.relative(blogContentDir, filePath))
      const record = parsePostSource(
        path.posix.join('blog', relativeInsideBlog),
        filePath,
        rawSource,
        stats.mtime.toISOString()
      )

      return {
        title: record.title,
        slug: record.slug,
        relativePath: record.relativePath,
        absolutePath: record.absolutePath,
        updatedAt: record.updatedAt,
        date: record.date,
        summary: record.summary,
        tags: record.tags,
        categories: record.categories,
        draft: record.draft,
        wordCount: record.wordCount,
      } satisfies PostFileSummary
    })
  )

  return posts.sort((left, right) => right.updatedAt.localeCompare(left.updatedAt))
}

export async function getPostCount() {
  const mdxFiles = await walkMdxFiles(blogContentDir)
  return mdxFiles.length
}

export async function getPostEditorData(relativePath: string): Promise<PostEditorRecord> {
  const post = await readPostRecord(relativePath)
  return post.record
}

export async function savePostEditorData(input: SavePostEditorInput) {
  await fs.mkdir(blogContentDir, { recursive: true })

  const trimmedTitle = normalizeString(input.title, 160)
  const providedSlug = normalizePostSlug(input.slug ?? '')
  const derivedTitleSlug = normalizePostSlug(trimmedTitle)
  const fallbackSlug = providedSlug || derivedTitleSlug || `post-${Date.now()}`
  const categories = normalizeList(input.categories, 8, 40)
  const tags = normalizeList(input.tags, 16, 40)
  const authors = normalizeList(input.authors, 6, 80)
  const content = (input.content ?? '').replace(/^\uFEFF/, '')
  const date = normalizeDateInput(input.date)
  const summary = normalizeString(input.summary, 320)
  const relativePath = input.relativePath?.trim()
    ? normalizeInsideBlog(input.relativePath)
    : undefined
  const existingFiles = await walkMdxFiles(blogContentDir)
  const existingRelativePaths = new Set(
    existingFiles.map((filePath) =>
      path.posix.join('blog', normalizePathForUrl(path.relative(blogContentDir, filePath)))
    )
  )

  let currentFrontmatter: Record<string, unknown> = {}
  const previousPath = relativePath

  if (relativePath) {
    const existing = await readPostRecord(relativePath)
    currentFrontmatter = existing.parsed.data || {}
    existingRelativePaths.delete(relativePath)
  }

  const requestedRelativePath = toRelativePathFromSlug(fallbackSlug)
  const nextRelativePath = input.slug?.trim()
    ? requestedRelativePath
    : uniqueRelativePath(requestedRelativePath, existingRelativePaths)

  if (input.slug?.trim() && existingRelativePaths.has(nextRelativePath)) {
    throw new Error('This URL slug already exists. Please choose a different one.')
  }

  const nextAbsolutePath = ensurePathInsideBlog(path.resolve(dataDir, nextRelativePath))
  const nextFrontmatter: Record<string, unknown> = {
    title: trimmedTitle || fallbackSlug,
    date,
    tags,
    categories,
    draft: normalizeDraftValue(input.draft, previousPath ? false : true),
    authors: authors.length ? authors : ['default'],
    ...getPreservedFrontmatter(currentFrontmatter),
    lastmod: new Date().toISOString(),
  }

  if (summary) {
    nextFrontmatter.summary = summary
  }

  const nextSource = buildPostSource(nextFrontmatter, content)

  await fs.mkdir(path.dirname(nextAbsolutePath), { recursive: true })
  await fs.writeFile(nextAbsolutePath, nextSource, 'utf8')

  if (previousPath && previousPath !== nextRelativePath) {
    const previousAbsolutePath = resolveSafePostPath(previousPath)
    await fs.unlink(previousAbsolutePath)
  }

  const nextRecord = await getPostEditorData(nextRelativePath)

  return {
    previousPath,
    record: nextRecord,
  }
}
export async function batchMutatePosts(
  input: BatchPostMutationInput
): Promise<BatchPostMutationResult> {
  const relativePaths = Array.from(
    new Set(
      input.relativePaths
        .map((value) => value.trim())
        .filter(Boolean)
    )
  )

  const items: BatchPostMutationResult["items"] = []

  for (const relativePath of relativePaths) {
    try {
      if (input.operation === 'delete') {
        await deletePostFile(relativePath)
        items.push({
          relativePath,
          ok: true,
          message: 'deleted',
        })
        continue
      }

      const current = await getPostEditorData(relativePath)

      const nextCategories =
        input.operation === 'update-categories'
          ? input.categories
          : current.categories
      const nextTags =
        input.operation === 'update-tags'
          ? input.tags
          : current.tags
      const nextDraft =
        input.operation === 'publish'
          ? false
          : input.operation === 'draft'
            ? true
            : current.draft

      await savePostEditorData({
        relativePath,
        title: current.title,
        slug: current.slug,
        date: current.date,
        summary: current.summary,
        tags: nextTags,
        categories: nextCategories,
        draft: nextDraft,
        content: current.content,
        authors: current.authors,
      })

      items.push({
        relativePath,
        ok: true,
        message: input.operation,
      })
    } catch (error) {
      items.push({
        relativePath,
        ok: false,
        message: error instanceof Error ? error.message : 'unknown error',
      })
    }
  }

  const successCount = items.filter((item) => item.ok).length

  return {
    total: relativePaths.length,
    successCount,
    failureCount: items.length - successCount,
    items,
  }
}

export async function deletePostFile(relativePath: string) {
  const normalizedPath = normalizeInsideBlog(relativePath)
  const absolutePath = resolveSafePostPath(normalizedPath)
  await fs.unlink(absolutePath)
}

export async function createPostTemplate(
  titleInput: string,
  options?: { tags?: string[]; categories?: string[] }
) {
  const saved = await savePostEditorData({
    title: titleInput || 'Untitled Post',
    tags: options?.tags,
    categories: options?.categories,
    summary: 'Write a short summary for this post.',
    draft: true,
    content: '## Start writing\n\nWrite your content here.\n',
    authors: ['default'],
  })

  const vscodeUrl = `vscode://file/${normalizePathForUrl(path.resolve(saved.record.absolutePath))}`

  return {
    title: saved.record.title,
    absolutePath: saved.record.absolutePath,
    relativePath: saved.record.relativePath,
    slug: saved.record.slug,
    vscodeUrl,
  }
}

export async function readPostSource(relativePath: string) {
  const absolutePath = resolveSafePostPath(relativePath)
  return fs.readFile(absolutePath, 'utf8')
}

export async function savePostSource(relativePath: string, source: string) {
  const absolutePath = resolveSafePostPath(relativePath)
  await fs.mkdir(path.dirname(absolutePath), { recursive: true })
  await fs.writeFile(absolutePath, source, 'utf8')
}

export function extractMdxBody(source: string) {
  const parsed = matter(source || '')
  return parsed.content || ''
}
