import 'server-only'

import { promises as fs } from 'fs'
import path from 'path'
import matter from 'gray-matter'

const aboutFilePath = path.join(process.cwd(), 'content', 'authors', 'default.md')

type AboutPageData = {
  frontmatter: Record<string, unknown>
  content: string
}

export async function getAboutPageData(): Promise<AboutPageData> {
  const raw = await fs.readFile(aboutFilePath, 'utf8')
  const parsed = matter(raw)
  return {
    frontmatter: parsed.data || {},
    content: parsed.content || '',
  }
}
