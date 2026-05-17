'use client'

import React from 'react'
import type { FooterPresentation } from '@/blog.config'
import Image from '@/features/content/components/Image'
import Link from '@/shared/components/Link'
import { siteMetadata } from '@/blog.config'

interface LegalInfoProps {
  settings?: any
  presentation: FooterPresentation
  className?: string
}

export default function LegalInfo({
  presentation,
  className = "",
}: LegalInfoProps) {
  const currentYear = new Date().getFullYear()
  const siteTitle = siteMetadata.title
  const [uptime, setUptime] = React.useState("")

  React.useEffect(() => {
    // 优先使用设置中的建站时间，如果没有则回退
    const rawStartTime = siteMetadata.siteCreatedAt || '2025-11-10T00:07:03'
    const startTimeStr = rawStartTime.includes('T') ? rawStartTime : rawStartTime.replace(' ', 'T')
    const startTime = new Date(startTimeStr).getTime()
    
    const updateUptime = () => {
      const now = new Date().getTime()
      const diff = now - startTime
      
      const years = Math.floor(diff / (1000 * 60 * 60 * 24 * 365))
      const days = Math.floor((diff % (1000 * 60 * 60 * 24 * 365)) / (1000 * 60 * 60 * 24))
      const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60))
      const mins = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60))
      const secs = Math.floor((diff % (1000 * 60)) / 1000)
      
      let uptimeStr = ""
      if (years > 0) uptimeStr += `${years}年`
      uptimeStr += `${days}天${hours}时${mins}分${secs}秒`
      
      setUptime(uptimeStr)
    }

    updateUptime()
    const timer = setInterval(updateUptime, 1000)
    return () => clearInterval(timer)
  }, [siteMetadata.siteCreatedAt])

  return (
    <div className={`flex flex-col items-center space-y-2.5 text-center text-xs font-medium tracking-tight text-muted-foreground/80 ${className}`}>
      {/* 核心统计行：全量信息单行呈现 */}
      <div className="flex flex-wrap items-center justify-center gap-x-2 gap-y-1 sm:gap-x-2.5 opacity-70">
        <Link
          href="/"
          className="text-foreground/90 transition-colors duration-300 hover:text-primary font-bold"
        >
          © {currentYear} {siteTitle}
        </Link>
        <span className="text-muted-foreground/30">|</span>
        <span className="capitalize">{presentation.rightsText.toLowerCase()}</span>
      </div>

      {/* 核心统计行：全量信息呈现 */}
      <div className="flex items-center gap-1.5 opacity-80 flex-nowrap whitespace-nowrap">
        <span className="flex items-center gap-1">
          {presentation.runtimeLabel} 
          <span className="text-foreground/90 tabular-nums">
            {uptime || "..."}
          </span>
        </span>
        <span className="mx-1 text-muted-foreground/40">•</span>
        <span className="flex items-center gap-1.5 transition-colors hover:text-primary">
          <svg className="h-3.5 w-3.5 grayscale opacity-50 group-hover:grayscale-0 group-hover:opacity-100 transition-all" viewBox="0 0 24 24" fill="currentColor">
            <path d="M21 16.5c0 .38-.21.71-.53.88l-7.97 4.43c-.31.17-.69.17-1 0L3.53 17.38c-.32-.17-.53-.5-.53-.88V7.5c0-.38.21-.71.53-.88l7.97-4.43c.31-.17.69-.17 1 0l7.97 4.43c.32.17.53.5.53.88v9z"/>
          </svg>
          <span className="text-muted-foreground/60">{presentation.edgeOneLabel}</span>
        </span>
      </div>

      {((siteMetadata as any).icp || (siteMetadata as any).policeBeian) && (
        <div className="flex flex-wrap items-center justify-center gap-x-2.5 gap-y-1 sm:gap-x-3 sm:gap-y-1 opacity-60 underline-offset-4 scale-95 origin-center">
          {(siteMetadata as any).icp && (
            <Link
              href="https://beian.miit.gov.cn/"
              className="flex items-center gap-0.5 sm:gap-1 transition-colors duration-300 hover:text-primary whitespace-nowrap"
            >
              <svg 
                viewBox="0 0 1024 1024" 
                className="h-3.5 w-3.5 sm:h-4 sm:w-4 translate-y-[-0.5px]"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path d="M150.528 689.152v-39.424h347.136v39.424H150.528z m0-225.28v-39.424h347.136v39.424H150.528z m0-217.6v-39.424h527.36v39.424h-527.36z" fill="currentColor"></path>
                <path d="M155.648 211.968h517.12v29.184h-517.12v-29.184z m0 217.6h336.896v29.184H155.648v-29.184z m0 225.28h336.896v29.184H155.648v-29.184z" fill="currentColor"></path>
                <path d="M94.72 914.944c-45.568 0-82.432-36.864-82.432-82.432v-742.4c0-45.568 36.864-82.432 82.432-82.432h638.464c45.568 0 82.432 36.864 82.432 82.432v152.576H768V90.112c0-18.944-15.36-34.304-34.304-34.304H94.72c-18.944 0-34.304 15.36-34.304 34.304v742.912c0 18.944 15.36 34.304 34.304 34.304h488.448v47.616H94.72z" fill="currentColor"></path>
                <path d="M94.72 909.824c-42.496 0-77.312-34.816-77.312-77.312v-742.4c0-42.496 34.816-77.312 77.312-77.312h638.464c42.496 0 77.312 34.816 77.312 77.312v147.456H773.12V90.112c0-21.504-17.92-39.424-39.424-39.424H94.72c-21.504 0-39.424 17.92-39.424 39.424v742.912c0 21.504 17.92 39.424 39.424 39.424h483.328v37.376H94.72z" fill="currentColor"></path>
                <path d="M791.552 770.048c-125.44 0-227.328-101.888-227.328-227.328s101.888-227.328 227.328-227.328S1018.88 417.792 1018.88 542.72c0 125.44-101.888 227.328-227.328 227.328z m0-406.528c-98.816 0-179.2 80.384-179.2 179.2s80.384 179.2 179.2 179.2 179.2-80.384 179.2-179.2c0.512-98.816-80.384-179.2-179.2-179.2z" fill="currentColor"></path>
                <path d="M791.552 764.928c-122.368 0-222.208-99.84-222.208-222.208s99.84-222.208 222.208-222.208S1013.76 420.352 1013.76 542.72s-99.84 222.208-222.208 222.208z m0-406.528c-101.888 0-184.32 82.944-184.32 184.32 0 101.888 82.944 184.32 184.32 184.32 101.888 0 184.32-82.944 184.32-184.32 0.512-101.888-82.432-184.32-184.32-184.32z" fill="currentColor"></path>
                <path d="M790.016 646.656c-55.808 0-100.864-45.056-100.864-100.864 0-55.808 45.056-100.864 100.864-100.864s100.864 45.056 100.864 100.864c0 55.808-45.056 100.864-100.864 100.864z m0-162.304c-33.792 0-61.44 27.648-61.44 61.44s27.648 61.44 61.44 61.44 61.44-27.648 61.44-61.44-27.648-61.44-61.44-61.44z" fill="#349AE8"></path>
                <path d="M790.016 641.536c-52.736 0-95.744-43.008-95.744-95.744s43.008-95.744 95.744-95.744 95.744 43.008 95.744 95.744-43.008 95.744-95.744 95.744z m0-162.304c-36.864 0-66.56 29.696-66.56 66.56s29.696 66.56 66.56 66.56 66.56-29.696 66.56-66.56-29.696-66.56-66.56-66.56z" fill="#349AE8"></path>
                <path d="M636.928 703.488h47.616v185.856l104.96-71.168 104.96 71.168v-185.856h47.616v275.968l-152.576-103.424-152.576 103.424z" fill="currentColor"></path>
                <path d="M642.048 708.608h37.376v190.464l110.08-74.752 110.08 74.752v-190.464h37.376v261.12l-147.456-99.84-147.456 99.84z" fill="currentColor"></path>
              </svg>
              {(siteMetadata as any).icp}
            </Link>
          )}
          {(siteMetadata as any).policeBeian && (
            <Link
              href="https://beian.mps.gov.cn/#/query/webSearch"
              className="flex items-center gap-0.5 sm:gap-1 transition-colors duration-300 hover:text-primary whitespace-nowrap"
            >
              <svg className="h-3.5 w-3.5 sm:h-4 sm:w-4 translate-y-[-0.5px]" viewBox="0 0 32 32">
                <path fill="#f4b400" d="M16 2L4 7v9c0 7.4 5.1 14.3 12 16 6.9-1.7 12-8.6 12-16V7l-12-5z"/>
                <path fill="#db4437" d="M16 6.5l-8 3.3v7.2c0 5.4 3.4 10.4 8 11.8 4.6-1.4 8-6.4 8-11.8V9.8l-8-3.3z"/>
                <path fill="#fff" d="M16 11l2 4h4l-3 2 1 4-4-2-4 2 1-4-3-2h4l2-4z"/>
              </svg>
              {(siteMetadata as any).policeBeian}
            </Link>
          )}
        </div>
      )}
    </div>
  )
}
