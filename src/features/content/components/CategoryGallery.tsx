'use client'

import { getLocalizedCategoryLabel } from '@/features/content/lib/localized-category-label'
import { NavIcon } from '@/features/site/components/nav-icons'
import Link from '@/shared/components/Link'
import { motion } from 'framer-motion'
import { usePathname } from 'next/navigation'

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.08 }
  }
}

const itemVariants = {
  hidden: { opacity: 0, y: 20, scale: 0.95 },
  visible: { 
    opacity: 1, 
    y: 0, 
    scale: 1,
    transition: { type: 'spring', damping: 20, stiffness: 100 }
  }
}

interface CategoryGalleryProps {
  categories: [string, number][]
}

export default function CategoryGallery({ categories }: CategoryGalleryProps) {
  return (
    <motion.div 
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 mt-10"
    >
      {categories.map(([category, count]) => (
        <motion.div key={category} variants={itemVariants}>
          <Link
            href={`/blog/category/${category}`}
            className="group relative flex flex-col p-6 rounded-[2rem] border border-white/40 dark:border-white/10 bg-white/40 dark:bg-zinc-900/40 backdrop-blur-md transition-all hover:shadow-[0_20px_50px_rgba(0,0,0,0.1)] dark:hover:shadow-[0_20px_50px_rgba(0,0,0,0.3)] hover:-translate-y-1"
          >
            <div className="flex items-start justify-between mb-6">
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-primary-500/20 to-primary-600/5 text-primary shadow-[inset_0_1px_1px_rgba(255,255,255,0.4)] transition-transform group-hover:scale-110 group-hover:rotate-3">
                <NavIcon href="/blog/category" className="h-7 w-7" />
              </div>
              <div className="flex items-center gap-1 px-3 py-1 rounded-full bg-zinc-900/5 dark:bg-white/5 text-[10px] font-black text-zinc-500 dark:text-zinc-400 group-hover:bg-primary/10 group-hover:text-primary transition-colors">
                <span className="opacity-50">#</span> {count} ARTICLES
              </div>
            </div>
            
            <div className="flex flex-col">
              <h3 className="text-xl font-extrabold text-zinc-800 dark:text-zinc-100 group-hover:text-primary transition-colors leading-tight">
                {getLocalizedCategoryLabel(category)}
              </h3>
              <p className="mt-2 text-xs font-medium text-zinc-400 dark:text-zinc-500 uppercase tracking-widest leading-relaxed">
                Deep dive into {category.replace(/-/g, ' ')} logic and architecture
              </p>
            </div>

            {/* 装饰性背景光晕 */}
            <div className="absolute -right-4 -bottom-4 h-24 w-24 bg-primary-500/5 rounded-full blur-3xl opacity-0 group-hover:opacity-100 transition-opacity" />
          </Link>
        </motion.div>
      ))}
    </motion.div>
  )
}
