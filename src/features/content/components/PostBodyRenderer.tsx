'use client'

import { MDXLayoutRenderer } from 'pliny/mdx-components'
import { components } from './MDXComponents'

/**
 * 博文正文渲染组件
 * 使用 MDX 编译后的 code 进行渲染，保留自定义组件（代码块、图片等）
 */
export default function PostBodyRenderer({ code, toc }: { code: string; toc?: any }) {
  return <MDXLayoutRenderer code={code} components={components} toc={toc} />
}
