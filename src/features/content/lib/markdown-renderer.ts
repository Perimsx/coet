/* eslint-disable @typescript-eslint/no-explicit-any */
import 'server-only'

import { unified } from 'unified'
// import rehypeKatex from 'rehype-katex'
import rehypeSlug from 'rehype-slug'
import rehypeStringify from 'rehype-stringify'
import rehypeRaw from 'rehype-raw'
import remarkGfm from 'remark-gfm'
// import remarkMath from 'remark-math'
import remarkParse from 'remark-parse'
import remarkRehype from 'remark-rehype'
import { remarkCodeTitles } from 'pliny/mdx-plugins/index.js'
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
    // .use(remarkMath as any)
    .use(remarkAlert as any)
    .use(remarkRehype as any, { allowDangerousHtml: true })
    .use(rehypeRaw as any)
    .use(rehypeRemoveFirstH1 as any)
    .use(rehypeOptimization as any)
    .use(rehypeSlug as any)
    // .use(rehypeKatex as any)
    .use(rehypePrettyCode as any, rehypePrettyCodeOptions)
    .use(rehypeTrimPrettyCodeWhitespace as any)
    .use(rehypeStringify as any, { allowDangerousHtml: true })
    .process(markdown || '')

  return String(result)
}
