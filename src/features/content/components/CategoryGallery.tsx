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
      className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 mt-8"
    >
      {categories.map(([category, count]) => (
        <motion.div key={category} variants={itemVariants}>
          <Link
            href={`/blog/category/${category}`}
            className="group relative flex items-center justify-between p-4 rounded-2xl border border-border/40 bg-muted/20 backdrop-blur-sm transition-all hover:bg-muted/40 hover:shadow-lg hover:shadow-primary/5 hover:-translate-y-0.5"
          >
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary transition-colors group-hover:bg-primary group-hover:text-white">
                <NavIcon href="/blog/category" className="h-5 w-5" />
              </div>
              <h3 className="text-[15px] font-bold text-foreground/80 group-hover:text-primary transition-colors truncate max-w-[150px]">
                {getLocalizedCategoryLabel(category)}
              </h3>
            </div>
            
            <span className="flex items-center justify-center h-6 px-2 rounded-lg bg-background/50 text-[10px] font-black text-muted-foreground/50 transition-colors group-hover:bg-primary/10 group-hover:text-primary">
              {count}
            </span>
          </Link>
        </motion.div>
      ))}
    </motion.div>
  )
}
