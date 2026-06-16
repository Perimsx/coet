// @ts-nocheck
import rehypeAutolinkHeadings from 'rehype-autolink-headings'
import rehypePrettyCode from 'rehype-pretty-code'
import rehypeSlug from 'rehype-slug'
import remarkGfm from 'remark-gfm'
import { defineConfig, s } from 'velite'

export default defineConfig({
  root: 'content/kb',
  output: {
    data: '.velite',
    assets: 'public/static',
    base: '/static/',
    name: '[name]-[hash].[ext]',
    clean: false,
  },
  collections: {
    posts: {
      name: 'Post',
      pattern: '**/*.{md,mdx}',
      schema: s
        .object({
          title: s.string().max(99),
          slug: s.path(),
          date: s.isodate().optional(),
          category: s.string().optional(),
          description: s.string().optional(),
          content: s.markdown({
            remarkPlugins: [remarkGfm],
            rehypePlugins: [
              rehypeSlug,
              [
                rehypePrettyCode,
                {
                  theme: {
                    dark: 'one-dark-pro',
                    light: 'github-light',
                  },
                  keepBackground: true,
                },
              ],
              [rehypeAutolinkHeadings, { behavior: 'wrap', properties: { className: ['heading-link'] } }],
            ],
          }),
          toc: s.toc(),
        })
        .transform((data) => ({ ...data, permalink: `/kb/posts/${data.slug}` })),
    },
  },
})
