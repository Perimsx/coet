import { notFound, permanentRedirect } from 'next/navigation'
import { getAllBlogs } from '@/features/content/lib/contentlayer-adapter'

type LegacyBlogSlugPageProps = {
  params: Promise<{
    slug: string[]
  }>
}

export function generateStaticParams() {
  return getAllBlogs()
    .map((post) => post.slug)
    .filter((slug): slug is string => Boolean(slug))
    .map((slug) => ({
      slug: slug.split('/'),
    }))
}

export default async function LegacyBlogSlugPage({ params }: LegacyBlogSlugPageProps) {
  const { slug } = await params
  const legacySlug = slug.join('/')
  const post = getAllBlogs().find((item) => item.slug === legacySlug)

  if (!post) notFound()

  permanentRedirect(`/blog/${legacySlug}`)
}
