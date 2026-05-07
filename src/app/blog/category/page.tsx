import { Metadata } from 'next'
import { getCategoryData } from '@/features/content/lib/contentlayer-adapter'
import { genPageMetadata } from '@/app/seo'
import PageHeader from '@/shared/components/PageHeader'
import CategoryGallery from '@/features/content/components/CategoryGallery'

export async function generateMetadata(): Promise<Metadata> {
  return genPageMetadata({
    title: "分类",
    description: "按技术方向和内容类型浏览 kerntau 博客的文章分类。",
    pathname: '/blog/category',
  })
}

export default function CategoriesPage() {
  const categoryData = getCategoryData()
  const categories = Object.entries(categoryData).sort((a, b) => b[1] - a[1])

  return (
    <div className="mx-auto max-w-5xl px-4 pt-6 pb-12 sm:pt-8 sm:pb-16 sm:px-6 lg:px-8">
      <PageHeader 
        title="文章分类" 
        meta={`探索全站 ${categories.length} 个技术领域与知识模块`}
      />

      <CategoryGallery categories={categories} />
    </div>
  )
}
