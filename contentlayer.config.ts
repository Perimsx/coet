/**
 * Contentlayer 核心配置文件
 * 定义了 Blog (博客文章) 和 Authors (作者信息) 的数据模型、MDX 插件链及自动化索引生成逻辑。
 */
import { defineDocumentType, defineNestedType, ComputedFields, makeSource } from 'contentlayer2/source-files'
import { mkdirSync, writeFileSync } from 'fs'
import readingTime from 'reading-time'
import path from 'path'
// Remark 插件包
import remarkGfm from 'remark-gfm'
import { remarkAlert } from 'remark-github-blockquote-alert'
import remarkDirective from 'remark-directive'
import {
  remarkExtractFrontmatter,
  remarkCodeTitles,
  remarkImgToJsx,
  extractTocHeadings,
} from 'pliny/mdx-plugins/index.js'
import {
  remarkProxyExternalImages,
  remarkLazyLoadImages,
} from './src/features/content/lib/mdx-plugins'
// Rehype 插件包
import rehypeSlug from 'rehype-slug'
import rehypePresetMinify from 'rehype-preset-minify'
import { siteMetadata } from './blog.config'
import { allCoreContent, sortPosts } from 'pliny/utils/contentlayer.js'
import prettier from 'prettier'
import rehypeRemoveFirstH1 from './src/features/content/lib/rehype-remove-first-h1'
import rehypeOptimization from './src/features/content/lib/rehype-optimization'
import { resolvePostCategories, normalizeTagToSlug } from './src/features/content/lib/post-categories'
import rehypePrettyCode, {
  rehypePrettyCodeOptions,
  rehypeTrimPrettyCodeWhitespace,
} from './src/features/content/lib/rehype-pretty-code'
import { remarkStyleToJsx } from './src/features/content/lib/remark-style-to-jsx'
import { remarkUnwrapBlockElements } from './src/features/content/lib/remark-unwrap-block-elements'
import { remarkCustomDirectives } from './src/features/content/lib/remark-custom-directives'

const root = process.cwd()
const isProduction = process.env.NODE_ENV === 'production'
const generatedContentDir = path.join(root, 'src', 'generated', 'content')

interface BlogDoc {
  tags?: string[]
  categories?: string[]
  draft?: boolean
  _raw: { sourceFilePath: string }
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const rehypePlugins: any[] = [
  rehypeRemoveFirstH1,
  rehypeOptimization,
  rehypeSlug,
  [rehypePrettyCode, rehypePrettyCodeOptions],
  rehypeTrimPrettyCodeWhitespace,
  ...(isProduction ? [rehypePresetMinify] : []),
]

const computedFields: ComputedFields = {
  readingTime: { type: 'json', resolve: (doc) => readingTime(doc.body.raw) },
  slug: {
    type: 'string',
    resolve: (doc) => {
      // url 字段优先（英文 slug），其次 slug 字段，最后文件路径
      const baseSlug = doc.url || doc.slug || doc._raw.flattenedPath.replace(/^.+?(\/)/, '')
      return baseSlug.split('/').map(part => {
        if (/[^\x00-\x7F]/.test(part)) {
          return encodeURIComponent(part)
        }
        return part
      }).join('/')
    },
  },
  path: {
    type: 'string',
    resolve: (doc) => {
      // path 也优先使用 url 字段
      const rawPath = doc.url || doc._raw.flattenedPath
      return rawPath.split('/').map(part => {
        if (/[^\x00-\x7F]/.test(part)) {
          return encodeURIComponent(part)
        }
        return part
      }).join('/')
    },
  },
  filePath: {
    type: 'string',
    resolve: (doc) => doc._raw.sourceFilePath,
  },
  lang: {
    type: 'string',
    resolve: (doc) => {
      const isEn = doc._raw.sourceFilePath.includes('.en.') || 
                   doc.url?.startsWith('en/') || 
                   doc.slug?.startsWith('en/')
      return isEn ? 'en' : 'zh'
    }
  },
  toc: { type: 'json', resolve: (doc) => extractTocHeadings(doc.body.raw) },
}

/**
 * 统计所有文章的标签出现次数并写入 JSON 文件
 */
async function createTagCount(allBlogs: BlogDoc[]) {
  mkdirSync(generatedContentDir, { recursive: true })
  const tagCount: Record<string, number> = {}
  allBlogs.forEach((file) => {
    if (file.tags && (!isProduction || file.draft !== true)) {
      file.tags.forEach((tag) => {
        const formattedTag = normalizeTagToSlug(tag)
        if (formattedTag in tagCount) {
          tagCount[formattedTag] += 1
        } else {
          tagCount[formattedTag] = 1
        }
      })
    }
  })
  const formatted = await prettier.format(JSON.stringify(tagCount, null, 2), { parser: 'json' })
  writeFileSync('./src/generated/content/tag-data.json', formatted)
}

/**
 * 统计所有文章的分类出现次数并写入 JSON 文件
 */
async function createCategoryCount(allBlogs: BlogDoc[]) {
  mkdirSync(generatedContentDir, { recursive: true })
  const categoryCount: Record<string, number> = {}
  allBlogs.forEach((file) => {
    if (!isProduction || file.draft !== true) {
      const categories = resolvePostCategories(file.categories, file._raw.sourceFilePath)
      categories.forEach((category) => {
        if (category in categoryCount) {
          categoryCount[category] += 1
        } else {
          categoryCount[category] = 1
        }
      })
    }
  })
  const formatted = await prettier.format(JSON.stringify(categoryCount, null, 2), { parser: 'json' })
  writeFileSync('./src/generated/content/category-data.json', formatted)
}

function createSearchIndex(allBlogs) {
  if (
    siteMetadata?.search?.provider === 'kbar' &&
    siteMetadata.search.kbarConfig.searchDocumentsPath
  ) {
    writeFileSync(
      `public/${path.basename(siteMetadata.search.kbarConfig.searchDocumentsPath)}`,
      JSON.stringify(allCoreContent(sortPosts(allBlogs)))
    )
    console.log('本地搜索索引已生成...')
  }
}

export const Blog = defineDocumentType(() => ({
  name: 'Blog',
  filePathPattern: 'blog/**/*.md',
  contentType: 'mdx',
  fields: {
    title: { type: 'string', required: true },
    date: { type: 'date', required: true },
    tags: { type: 'list', of: { type: 'string' }, default: [] },
    categories: { type: 'list', of: { type: 'string' }, default: [] },
    lastmod: { type: 'date' },
    draft: { type: 'boolean' },
    summary: { type: 'string' },
    images: { type: 'json' },
    authors: { type: 'list', of: { type: 'string' } },
    layout: { type: 'string' },
    bibliography: { type: 'string' },
    canonicalUrl: { type: 'string' },
    slug: { type: 'string' },
    url: { type: 'string' },
  },
  computedFields: {
    ...computedFields,
    structuredData: {
      type: 'json',
      resolve: (doc) => ({
        '@context': 'https://schema.org',
        '@type': 'BlogPosting',
        headline: doc.title,
        datePublished: doc.date,
        dateModified: doc.lastmod || doc.date,
        description: doc.summary,
        image: doc.images ? doc.images[0] : siteMetadata.socialBanner,
        url: `${(siteMetadata.siteUrl || '').replace(/\/+$/, '')}/${doc.path}`,
      }),
    },
  },
}))

export const Social = defineNestedType(() => ({
  name: 'Social',
  fields: {
    platform: { type: 'string', required: true },
    url: { type: 'string', required: true },
    icon: { type: 'string' },
  },
}))

export const Authors = defineDocumentType(() => ({
  name: 'Authors',
  filePathPattern: 'authors/**/*.md',
  contentType: 'mdx',
  fields: {
    name: { type: 'string', required: true },
    avatar: { type: 'string' },
    birthYear: { type: 'number' },
    birthMonth: { type: 'number' },
    showBirthday: { type: 'boolean', default: false },
    email: { type: 'string' },
    twitter: { type: 'string' },
    bluesky: { type: 'string' },
    linkedin: { type: 'string' },
    github: { type: 'string' },
    douyin: { type: 'string' },
    bilibili: { type: 'string' },
    socials: { type: 'list', of: Social },
    techStacks: { type: 'list', of: { type: 'string' } },
    layout: { type: 'string' },
  },
  computedFields,
}))

export default makeSource({
  contentDirPath: 'content',
  contentDirExclude: ['node_modules', '.git', '.yarn', '.cache', '.next', '.contentlayer', 'kb'],
  documentTypes: [Blog, Authors],
  mdx: {
    cwd: process.cwd(),
    remarkPlugins: [
      remarkStyleToJsx,
      remarkUnwrapBlockElements,
      remarkExtractFrontmatter,
      remarkDirective,
      remarkCustomDirectives,
      remarkGfm,
      remarkCodeTitles,
      remarkProxyExternalImages,
      remarkLazyLoadImages,
      remarkImgToJsx,
      remarkAlert,
    ],
    rehypePlugins,
  },
  onSuccess: async (importData) => {
    const { allBlogs } = await importData()
    createTagCount(allBlogs)
    createCategoryCount(allBlogs)
    createSearchIndex(allBlogs)
  },
})
