import TOCInline from 'pliny/ui/TOCInline'
import type { MDXComponents } from 'mdx/types'
import Image from './Image'
import CustomLink from '@/shared/components/Link'
import TableWrapper from './TableWrapper'
import MdxImage from './mdx/MdxImage'
import CodeBlockPre from '@/features/content/components/CodeBlockPre'

export const components: MDXComponents = {
  Image,
  img: MdxImage,
  TOCInline,
  a: CustomLink,
  pre: CodeBlockPre,
  table: TableWrapper,
}
