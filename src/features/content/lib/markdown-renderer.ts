/* eslint-disable @typescript-eslint/no-explicit-any */
import { unified } from 'unified'
import rehypeSlug from 'rehype-slug'
import rehypeStringify from 'rehype-stringify'
import rehypeRaw from 'rehype-raw'
import remarkGfm from 'remark-gfm'
import remarkParse from 'remark-parse'
import remarkRehype from 'remark-rehype'
import { remarkCodeTitles } from './remark-code-titles'
import { remarkAlert } from 'remark-github-blockquote-alert'
import rehypePrettyCode, {
  rehypePrettyCodeOptions,
  rehypeTrimPrettyCodeWhitespace,
} from '@/features/content/lib/rehype-pretty-code'
import rehypeRemoveFirstH1 from '@/features/content/lib/rehype-remove-first-h1'
import rehypeOptimization from '@/features/content/lib/rehype-optimization'

export async function renderMarkdownToHtml(markdown: string) {
  const result = await unified()
    .use(remarkParse as any)
    .use(remarkGfm as any)
    .use(remarkCodeTitles as any)
    .use(remarkAlert as any)
    .use(remarkRehype as any, { allowDangerousHtml: true })
    .use(rehypeRaw as any)
    .use(rehypeRemoveFirstH1 as any)
    .use(rehypeOptimization as any)
    .use(rehypeSlug as any)
    .use(rehypePrettyCode as any, rehypePrettyCodeOptions)
    .use(rehypeTrimPrettyCodeWhitespace as any)
    .use(rehypeStringify as any, { allowDangerousHtml: true })
    .process(markdown || '')

  return String(result)
}

export function extractMarkdownToc(source: string) {
  return (source || '').split('\n').flatMap((line) => {
    const match = /^(#{2,4})\s+(.+?)\s*$/.exec(line)
    if (!match) return []
    const value = match[2].replace(/[`*_]/g, '')
    return [
      {
        value,
        url: `#${value
          .toLowerCase()
          .replace(/[^\p{L}\p{N}\s-]/gu, '')
          .trim()
          .replace(/\s+/g, '-')}`,
        depth: match[1].length,
      },
    ]
  })
}

export const databaseToc = extractMarkdownToc

