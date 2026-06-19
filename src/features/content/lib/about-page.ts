import 'server-only'

import { promises as fs } from 'fs'
import path from 'path'
import matter from 'gray-matter'

type AboutPageData = {
  frontmatter: Record<string, unknown>
  content: string
}

export async function getAboutPageData(locale: 'zh' | 'en' = 'zh'): Promise<AboutPageData> {
  const fileName = locale === 'en' ? 'default.en.md' : 'default.md'
  const aboutFilePath = path.join(process.cwd(), 'content', 'authors', fileName)
  const raw = await fs.readFile(aboutFilePath, 'utf8')
  const parsed = matter(raw)
  return {
    frontmatter: parsed.data || {},
    content: parsed.content || '',
  }
}
