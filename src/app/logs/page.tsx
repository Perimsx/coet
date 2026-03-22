import { genPageMetadata } from '@/app/seo'
import { Metadata } from 'next'
import Link from '@/shared/components/Link'
import { Github, GitBranch, ArrowUpRight, Activity, FileText, Hash, FolderTree, ScrollText, GitCommit } from 'lucide-react'
import { formatDate } from 'pliny/utils/formatDate'
import { ReactNode } from 'react'

import { getAllBlogs, getTagData, getCategoryData } from '@/features/content/lib/contentlayer-adapter'

export async function generateMetadata(): Promise<Metadata> {
  return genPageMetadata({
    title: "日志与归档",
    description: "Chen Guitao (kerntau) | 全站运行数据与底层迭代日志",
    pathname: '/logs',
  })
}

interface GitHubCommit {
  sha: string
  commit: {
    author: {
      name: string
      date: string
    }
    message: string
  }
  html_url: string
}

async function getCommits(): Promise<GitHubCommit[]> {
  try {
    const res = await fetch('https://api.github.com/repos/kerntau/Coet/commits?per_page=12', {
      next: { revalidate: 3600 },
    })
    if (!res.ok) return []
    return await res.json()
  } catch {
    return []
  }
}

export default async function ProjectsPage() {
  const commits = await getCommits()
  
  const allBlogs = getAllBlogs()
  const tagData = getTagData()
  const categoryData = getCategoryData()
  
  const totalPosts = allBlogs.length
  const totalTags = Object.keys(tagData).length
  const totalCategories = Object.keys(categoryData).length
  
  // 安全计算总字数估值
  const totalWords = allBlogs.reduce((acc, curr) => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const readingTime = curr.readingTime as any
    if (readingTime?.words) {
       return acc + readingTime.words
    }
    return acc + (curr.body?.raw?.length || 0)
  }, 0)

  // 格式化字数 (如 12.5k)
  const formatWordCount = (num: number) => {
    return num > 1000 ? (num / 1000).toFixed(1) + 'k' : num.toString()
  }

  return (
    <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6 lg:px-8 xl:py-24">
      <div className="grid grid-cols-1 gap-12 lg:grid-cols-12 lg:gap-14">
        
        {/* 左侧：全站文章信息架构与统计 (Sticky) */}
        <div className="h-fit lg:col-span-5 lg:sticky lg:top-32">
          <div className="flex flex-col relative">
            <div className="absolute -left-20 -top-20 z-0 h-48 w-48 rounded-full bg-primary/10 blur-[80px] pointer-events-none dark:bg-primary/5" />

            <div className="relative z-10 space-y-8">
              <div>
                <div className="inline-flex items-center gap-1.5 rounded-full bg-primary/[0.08] px-3 py-1 text-[10px] font-bold uppercase tracking-[0.2em] text-primary w-fit mb-5 ring-1 ring-primary/15">
                  <Activity className="h-3 w-3" />
                  Site Dashboard
                </div>
                
                <h1 className="text-3xl font-extrabold tracking-tight text-zinc-900 sm:text-4xl lg:text-5xl dark:text-zinc-50 text-balance leading-tight">
                  <span className="text-transparent bg-clip-text bg-gradient-to-r from-zinc-800 to-zinc-500 dark:from-zinc-100 dark:to-zinc-500">
                    架构看板
                  </span> 
                  <br className="hidden md:block"/> 与全站状态
                </h1>
                
                <p className="mt-5 text-[15px] leading-relaxed text-zinc-500 dark:text-zinc-400">
                  基于 Contentlayer 2 与本地 SQLite 构建。深入整合 MDX AST 抽象语法树，为您呈现实时的内容架构指标与微内核负载。
                </p>
              </div>
              
              {/* 统计指标卡片网格 */}
              <div className="grid grid-cols-2 gap-3 sm:gap-4 pt-2">
                <div className="flex flex-col gap-3 rounded-2xl border border-zinc-200/50 bg-white/50 p-5 shadow-xs transition-all hover:border-zinc-300/60 dark:border-zinc-800/50 dark:bg-zinc-900/40 dark:hover:border-zinc-700/60 backdrop-blur-sm">
                  <div className="flex items-center gap-2.5 text-zinc-500 dark:text-zinc-400">
                    <FileText className="h-4 w-4" />
                    <span className="text-[11px] font-bold uppercase tracking-wider">Posts</span>
                  </div>
                  <div className="flex items-baseline gap-1.5">
                    <span className="text-3xl font-black text-zinc-900 dark:text-zinc-100">{totalPosts}</span>
                    <span className="text-[10px] font-bold text-zinc-400">篇发布</span>
                  </div>
                </div>

                <div className="flex flex-col gap-3 rounded-2xl border border-zinc-200/50 bg-white/50 p-5 shadow-xs transition-all hover:border-zinc-300/60 dark:border-zinc-800/50 dark:bg-zinc-900/40 dark:hover:border-zinc-700/60 backdrop-blur-sm">
                  <div className="flex items-center gap-2.5 text-zinc-500 dark:text-zinc-400">
                    <ScrollText className="h-4 w-4" />
                    <span className="text-[11px] font-bold uppercase tracking-wider">Words</span>
                  </div>
                  <div className="flex items-baseline gap-1.5">
                    <span className="text-3xl font-black text-zinc-900 dark:text-zinc-100">{formatWordCount(totalWords)}</span>
                    <span className="text-[10px] font-bold text-zinc-400">字内容</span>
                  </div>
                </div>

                <div className="flex flex-col gap-3 rounded-2xl border border-zinc-200/50 bg-white/50 p-5 shadow-xs transition-all hover:border-zinc-300/60 dark:border-zinc-800/50 dark:bg-zinc-900/40 dark:hover:border-zinc-700/60 backdrop-blur-sm">
                   <div className="flex items-center gap-2.5 text-zinc-500 dark:text-zinc-400">
                    <Hash className="h-4 w-4" />
                    <span className="text-[11px] font-bold uppercase tracking-wider">Tags</span>
                  </div>
                  <div className="flex items-baseline gap-1.5">
                    <span className="text-3xl font-black text-zinc-900 dark:text-zinc-100">{totalTags}</span>
                    <span className="text-[10px] font-bold text-zinc-400">个标签</span>
                  </div>
                </div>

                <div className="flex flex-col gap-3 rounded-2xl border border-zinc-200/50 bg-white/50 p-5 shadow-xs transition-all hover:border-zinc-300/60 dark:border-zinc-800/50 dark:bg-zinc-900/40 dark:hover:border-zinc-700/60 backdrop-blur-sm">
                   <div className="flex items-center gap-2.5 text-zinc-500 dark:text-zinc-400">
                    <FolderTree className="h-4 w-4" />
                    <span className="text-[11px] font-bold uppercase tracking-wider">Categories</span>
                  </div>
                  <div className="flex items-baseline gap-1.5">
                    <span className="text-3xl font-black text-zinc-900 dark:text-zinc-100">{totalCategories}</span>
                    <span className="text-[10px] font-bold text-zinc-400">个分类列域</span>
                  </div>
                </div>
              </div>
              
              {/* 核心驱动栈 */}
              <div className="space-y-4 pt-4 border-t border-zinc-100 dark:border-zinc-800/60">
                 <h3 className="text-xs font-black uppercase tracking-[0.2em] text-zinc-400">Core Engines</h3>
                 <div className="flex flex-wrap gap-2">
                   {['Next.js 15', 'RSC', 'Tailwind', 'MDX AST', 'SQLite'].map(tech => (
                     <span key={tech} className="rounded-md bg-zinc-100/60 px-2.5 py-1 text-[10px] font-bold tracking-widest uppercase text-zinc-600 dark:bg-zinc-800/80 dark:text-zinc-400 border border-transparent dark:border-zinc-700/50">
                       {tech}
                     </span>
                   ))}
                </div>
              </div>

              <div className="pt-2">
                <Link
                  href="https://github.com/kerntau/Coet"
                  className="group flex w-full items-center justify-between gap-2 rounded-2xl bg-zinc-950 px-5 py-4 text-[13px] text-white transition-all hover:bg-zinc-800 shadow-[0_10px_30px_-10px_rgba(0,0,0,0.2)] dark:bg-zinc-200 dark:text-zinc-900 dark:hover:bg-white"
                >
                  <div className="flex items-center gap-2.5">
                    <Github className="h-[18px] w-[18px]" />
                    <span className="font-bold">探索系统底层源码</span>
                  </div>
                  <ArrowUpRight className="h-4 w-4 opacity-50 transition-transform group-hover:translate-x-1 group-hover:-translate-y-1" />
                </Link>
              </div>

            </div>
          </div>
        </div>

        {/* 右侧：纵向 Commits 日志流 */}
        <div className="lg:col-span-7 lg:pl-10">
          <div className="mb-8 flex items-end justify-between border-b border-zinc-200/80 pb-3 dark:border-zinc-800/80 relative z-10 mx-1 md:mx-0">
            <h2 className="text-[16px] font-extrabold text-zinc-900 dark:text-zinc-100 uppercase tracking-widest flex items-center gap-2">
              <GitCommit className="h-5 w-5 text-zinc-400" />
              迭代日志
            </h2>
            <span className="text-[10px] font-black text-primary/70 tracking-[0.2em] uppercase flex items-center gap-1.5">
              <span className="relative flex h-1.5 w-1.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
                <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-primary"></span>
              </span>
              Live Sync
            </span>
          </div>

          <div className="relative space-y-5 before:absolute before:inset-y-0 before:left-[11px] before:w-[2px] before:bg-zinc-100 dark:before:bg-zinc-800/60">
            {commits.length === 0 ? (
               <div className="pl-10 text-[13px] text-zinc-500 font-semibold flex items-center gap-3">
                 <div className="w-4 h-4 rounded-full border-2 border-primary border-t-transparent animate-spin" />
                 暂无最新提交记录
               </div>
            ) : (
              commits.map((item) => {
                const shortSha = item.sha.substring(0, 7)
                const msgLines = item.commit.message.split('\n').filter(Boolean)
                const title = msgLines[0]
                const bodyLines = msgLines.slice(1)
                
                const gitMatch = title.match(/^(\w+)(?:\((.*?)\))?:\s(.*)$/)
                let typeBadge: ReactNode = null
                
                if (gitMatch) {
                   const type = gitMatch[1]
                   let typeColor = 'text-zinc-500'
                   switch(type) {
                     case 'feat': typeColor = 'text-blue-600 dark:text-blue-400'; break;
                     case 'fix': typeColor = 'text-red-600 dark:text-red-400'; break;
                     case 'style': typeColor = 'text-purple-600 dark:text-purple-400'; break;
                     case 'docs': typeColor = 'text-emerald-600 dark:text-emerald-400'; break;
                     case 'chore': typeColor = 'text-orange-600 dark:text-orange-400'; break;
                     case 'refactor': typeColor = 'text-indigo-600 dark:text-indigo-400'; break;
                   }
                   typeBadge = (
                     <span className={`text-[10px] font-extrabold uppercase tracking-widest ${typeColor}`}>
                        {type}
                     </span>
                   )
                }

                return (
                  <div key={item.sha} className="relative pl-8 md:pl-10 group">
                    {/* 精准对齐的呼吸点: left: 8px, dot_width: 8px -> center is 12px; line left: 11px, line_width: 2px -> center is 12px */}
                    <div className="absolute left-[8px] top-[26px] h-[8px] w-[8px] rounded-full border-[2px] border-white bg-zinc-300 ring-[5px] ring-white transition-all duration-300 group-hover:scale-125 group-hover:bg-primary dark:border-background dark:bg-zinc-600 dark:ring-background dark:group-hover:bg-primary" />
                    
                    <div className="group-hover:-translate-y-0.5 transition-transform duration-300">
                      <div className="flex flex-col rounded-2xl border border-transparent bg-transparent p-4 transition-all hover:bg-zinc-50/60 dark:hover:bg-zinc-900/20">
                        
                        <div className="flex items-center gap-3 w-full mb-1">
                          {typeBadge}
                          <span className="flex items-center gap-1 text-[11px] font-bold text-zinc-400 dark:text-zinc-600 ml-auto uppercase tracking-widest">
                            {formatDate(item.commit.author.date, 'zh-CN')}
                          </span>
                        </div>

                        <h3 className="text-[15px] font-bold text-zinc-900 dark:text-zinc-100 leading-snug">
                          {gitMatch ? gitMatch[3] : title}
                        </h3>
                        
                        <div className="mt-1 flex items-center gap-1.5 text-[11px] font-mono text-zinc-400/80 group-hover:text-primary transition-colors w-fit">
                          <GitBranch className="h-3 w-3" />
                          <a href={item.html_url} target="_blank" rel="noopener noreferrer" className="hover:underline transition-colors">
                            {shortSha}
                          </a>
                        </div>
                        
                        {bodyLines.length > 0 && (
                          <div className="mt-4 space-y-3 border-l-2 border-zinc-100 pl-4 dark:border-zinc-800/80 transition-colors group-hover:border-primary/20">
                            {bodyLines.map((line, i) => {
                              const isTag = line.startsWith('[') && line.includes(']')
                              if (isTag) {
                                const endIdx = line.indexOf(']')
                                const tag = line.substring(1, endIdx) // 去除中括号
                                const content = line.substring(endIdx + 1).trim()
                                return (
                                  <div key={i} className="flex items-start gap-2.5">
                                    <span className="font-bold text-zinc-600 dark:text-zinc-400 text-[10px] uppercase tracking-wider flex-shrink-0 mt-[1.5px] border border-zinc-200/80 dark:border-zinc-700/80 rounded bg-white dark:bg-zinc-900 px-1.5 py-[1px] shadow-xs">
                                      {tag}
                                    </span>
                                    <p className="text-[13px] text-zinc-600 dark:text-zinc-400 font-medium leading-relaxed">
                                      {content}
                                    </p>
                                  </div>
                                )
                              }
                              return (
                                <p key={i} className="text-[13px] text-zinc-500 dark:text-zinc-500 font-medium leading-relaxed">
                                  {line}
                                </p>
                              )
                            })}
                          </div>
                        )}
                        
                      </div>
                    </div>
                  </div>
                )
              })
            )}

            {/* 底端视差遮罩 */}
            <div className="absolute bottom-[-1px] left-0 right-0 h-24 bg-gradient-to-t from-background to-transparent pointer-events-none" />
          </div>
        </div>
      </div>
    </div>
  )
}
