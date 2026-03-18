import { Construction } from '@/features/site/components/nav-icons'
import { genPageMetadata } from '@/app/seo'
import { Metadata } from 'next'

export async function generateMetadata(): Promise<Metadata> {
  return genPageMetadata({
    title: '项目',
    description: '项目展示建设中',
    pathname: '/projects',
  })
}

export default function ProjectsPage() {
  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center px-4 py-20 text-center">
      <div className="relative mb-8 flex h-24 w-24 items-center justify-center rounded-3xl bg-primary-500/10 text-primary-600 sm:h-32 sm:w-32">
        <div className="absolute inset-0 animate-pulse rounded-3xl bg-primary-500/5" />
        <Construction className="h-12 w-12 animate-bounce sm:h-16 sm:w-16" />
      </div>
      
      <h1 className="mb-4 text-3xl font-extrabold tracking-tight text-gray-900 sm:text-5xl dark:text-gray-100">
        项目建设中
      </h1>
      
      <p className="max-w-md text-base leading-7 text-gray-600 sm:text-lg dark:text-gray-400">
        正在整理过去的作品与开源项目，稍后即刻上线。敬请期待！
      </p>

      <div className="mt-10 flex items-center gap-4">
        <div className="h-1 w-1 rounded-full bg-primary-500" />
        <div className="h-1 w-1 rounded-full bg-primary-500/60" />
        <div className="h-1 w-1 rounded-full bg-primary-500/30" />
      </div>
    </div>
  )
}
