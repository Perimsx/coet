import { Metadata } from 'next'
import { getCategoryData } from '@/features/content/lib/contentlayer-adapter'
import { genPageMetadata } from '@/app/seo'
import PageHeader from '@/shared/components/PageHeader'
import Link from '@/shared/components/Link'
import { getLocalizedCategoryLabel } from '@/features/content/lib/localized-category-label'
import { NavIcon } from '@/features/site/components/nav-icons'

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
    <div className="mx-auto max-w-5xl px-4 pt-4 pb-12 sm:pt-6 sm:pb-16 sm:px-6 lg:px-8">
      <PageHeader 
        title="文章分类" 
        meta={`目前共有 ${categories.length} 个内容分类`}
      />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 mt-8">
        {categories.map(([category, count]) => (
          <Link
            key={category}
            href={`/blog/category/${category}`}
            className="group flex items-center justify-between p-5 rounded-2xl border border-zinc-200/60 dark:border-zinc-800/60 bg-zinc-50/30 dark:bg-zinc-900/20 transition-all hover:scale-[1.02] hover:bg-zinc-100/50 dark:hover:bg-zinc-800/40 hover:border-primary/20"
          >
            <div className="flex items-center gap-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary transition-colors group-hover:bg-primary group-hover:text-white">
                <NavIcon href="/blog/category" className="h-5 w-5" />
              </div>
              <div className="flex flex-col">
                <span className="text-[15px] font-bold text-zinc-800 dark:text-zinc-200 group-hover:text-primary transition-colors">
                  {getLocalizedCategoryLabel(category)}
                </span>
                <span className="text-[11px] font-medium text-zinc-400 dark:text-zinc-500 uppercase tracking-wider">
                  Browse category
                </span>
              </div>
            </div>
            <span className="flex items-center justify-center h-7 px-2.5 rounded-full bg-zinc-200/50 dark:bg-zinc-800/50 text-[11px] font-black text-zinc-500 dark:text-zinc-400 group-hover:bg-primary/20 group-hover:text-primary transition-colors">
              {count}
            </span>
          </Link>
        ))}
      </div>
    </div>
  )
}
