import { genPageMetadata } from '@/app/seo'
import { Metadata } from 'next'
import Link from '@/shared/components/Link'
import { Github, Calendar, GitBranch, ArrowUpRight, Blocks } from 'lucide-react'
import { formatDate } from 'pliny/utils/formatDate'
import { ReactNode } from 'react'

export async function generateMetadata(): Promise<Metadata> {
  return genPageMetadata({
    title: "开源实战",
    description: "Chen Guitao (kerntau) | Coet 全栈架构与迭代日志",
    pathname: '/projects',
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

  return (
    <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6 lg:px-8 xl:py-24">
      <div className="grid grid-cols-1 gap-12 lg:grid-cols-12 lg:gap-8">
        
        {/* 左侧：项目横幅介绍 (Sticky) */}
        <div className="h-fit lg:col-span-5 lg:sticky lg:top-28">
          <div className="flex flex-col space-y-8 relative">
            {/* 氛围光点 */}
            <div className="absolute -left-20 -top-20 z-0 h-64 w-64 rounded-full bg-primary/10 blur-[80px] pointer-events-none dark:bg-primary/5" />

            <div className="relative z-10">
              <div className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/10 px-3 py-1.5 text-xs font-bold uppercase tracking-widest text-primary w-fit mb-6">
                <Blocks className="h-4 w-4" />
                Flagship Project
              </div>
              
              <h1 className="text-4xl font-black tracking-tight text-zinc-900 sm:text-5xl lg:text-5xl dark:text-zinc-50 text-balance leading-[1.1]">
                Coet <br className="hidden lg:block"/> Workstation
              </h1>
              
              <p className="mt-6 text-[15px] leading-relaxed text-zinc-500 dark:text-zinc-400 font-medium">
                打破常规静态站的局限边界。基于 Next.js 15 App Router，抽象出强内聚的 Feature-based 领域目录。彻底重构静态 MDX 渲染管线，并全景整合 SQLite 与 Drizzle 构建出极高容错率的自动化流水控制台。
              </p>
              
              <div className="mt-8 flex flex-wrap gap-2">
                 {['Next.js 15', 'RSC', 'Tailwind v4', 'Contentlayer', 'MDX AST', 'Drizzle', 'SQLite'].map(tech => (
                   <span key={tech} className="rounded-lg border border-zinc-200/50 bg-zinc-50 px-3 py-1.5 text-[11px] font-extrabold tracking-wide text-zinc-600 shadow-xs dark:border-zinc-800/50 dark:bg-zinc-900/50 dark:text-zinc-300 backdrop-blur-sm">
                     {tech}
                   </span>
                 ))}
              </div>
              
              <div className="mt-10">
                <Link
                  href="https://github.com/kerntau/Coet"
                  className="group flex w-full items-center justify-center gap-2 rounded-2xl bg-zinc-900 px-6 py-4 text-sm font-bold text-zinc-50 shadow-[0_10px_20px_-10px_rgba(0,0,0,0.3)] transition-all hover:scale-[1.02] hover:bg-zinc-800 dark:bg-zinc-50 dark:text-zinc-900 dark:shadow-[0_10px_20px_-10px_rgba(255,255,255,0.1)] dark:hover:bg-white"
                >
                  <Github className="h-5 w-5" />
                  <span>访问 GitHub 源仓库</span>
                  <ArrowUpRight className="h-4 w-4 opacity-50 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
                </Link>
              </div>
            </div>
          </div>
        </div>

        {/* 右侧：直连 Commits 的动态交互流 */}
        <div className="lg:col-span-7 lg:pl-12">
          <div className="mb-8 flex items-center justify-between border-b border-zinc-200/80 pb-4 dark:border-zinc-800/80 relative z-10">
            <h2 className="text-[17px] font-extrabold text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
              <span className="relative flex h-2.5 w-2.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
              </span>
              主干工程进展
            </h2>
            <span className="text-[10px] font-black text-zinc-400 tracking-[0.2em] uppercase">
              Live from Main
            </span>
          </div>

          <div className="relative space-y-6 before:absolute before:inset-y-0 before:left-[11px] before:w-[2px] before:bg-zinc-100 dark:before:bg-zinc-800/40">
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
                   let typeColor = 'bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400'
                   switch(type) {
                     case 'feat': typeColor = 'bg-blue-50/80 text-blue-700 dark:bg-blue-500/10 dark:text-blue-400'; break;
                     case 'fix': typeColor = 'bg-red-50/80 text-red-700 dark:bg-red-500/10 dark:text-red-400'; break;
                     case 'style': typeColor = 'bg-purple-50/80 text-purple-700 dark:bg-purple-500/10 dark:text-purple-400'; break;
                     case 'docs': typeColor = 'bg-emerald-50/80 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400'; break;
                     case 'chore': typeColor = 'bg-orange-50/80 text-orange-700 dark:bg-orange-500/10 dark:text-orange-400'; break;
                   }
                   typeBadge = (
                     <span className={`px-2 py-0.5 text-[9px] font-black uppercase tracking-widest rounded ${typeColor}`}>
                        {type}
                     </span>
                   )
                }

                return (
                  <div key={item.sha} className="relative pl-10 md:pl-12 group">
                    {/* 时间轴连线呼吸点 */}
                    <div className="absolute left-[7px] top-1.5 h-[10px] w-[10px] rounded-full border-2 border-white bg-zinc-300 ring-4 ring-white transition-all duration-300 group-hover:scale-125 group-hover:bg-primary dark:border-background dark:bg-zinc-700 dark:ring-background dark:group-hover:bg-primary" />
                    
                    <div className="group-hover:-translate-y-1 transition-transform duration-300">
                      <div className="flex flex-col rounded-[1rem] border border-zinc-200/40 bg-zinc-50/50 p-4 transition-all hover:border-zinc-200 hover:bg-white hover:shadow-lg dark:border-zinc-800/40 dark:bg-zinc-900/30 dark:hover:border-zinc-700/80 dark:hover:bg-zinc-800/50 backdrop-blur-md dark:shadow-[0_0_20px_-10px_rgba(0,0,0,0.5)]">
                        
                        <div className="flex flex-wrap items-center gap-3 w-full mb-3">
                          {typeBadge}
                          <span className="flex items-center gap-1.5 text-xs font-bold text-zinc-500 dark:text-zinc-500 group-hover:text-primary transition-colors ml-auto md:ml-0">
                            <GitBranch className="h-3.5 w-3.5" />
                            <a href={item.html_url} target="_blank" rel="noopener noreferrer" className="font-mono hover:underline decoration-primary underline-offset-4">
                              {shortSha}
                            </a>
                          </span>
                          <span className="flex items-center gap-1 text-[11px] font-bold text-zinc-400 dark:text-zinc-600 ml-auto md:ml-auto">
                            <Calendar className="h-3 w-3" />
                            {formatDate(item.commit.author.date, 'zh-CN')}
                          </span>
                        </div>

                        <h3 className="text-[15px] font-extrabold text-zinc-900 dark:text-zinc-100 leading-snug">
                          {gitMatch ? gitMatch[3] : title}
                        </h3>
                        
                        {bodyLines.length > 0 && (
                          <div className="mt-3 space-y-2">
                            {bodyLines.map((line, i) => {
                              const isTag = line.startsWith('[') && line.includes(']')
                              if (isTag) {
                                const endIdx = line.indexOf(']')
                                const tag = line.substring(0, endIdx + 1)
                                const content = line.substring(endIdx + 1).trim()
                                return (
                                  <div key={i} className="flex items-start gap-2 bg-zinc-100/50 dark:bg-zinc-900/50 rounded-lg p-2 px-3 border border-zinc-100 dark:border-zinc-800/50">
                                    <span className="font-black text-zinc-700 dark:text-zinc-300 tracking-widest text-[9px] px-1 py-0.5 rounded bg-white dark:bg-zinc-800 flex-shrink-0 mt-[2px] shadow-xs">
                                      {tag}
                                    </span>
                                    <p className="text-[12px] text-zinc-600 dark:text-zinc-400 font-medium leading-relaxed">
                                      {content}
                                    </p>
                                  </div>
                                )
                              }
                              return (
                                <p key={i} className="text-[12px] text-zinc-500 dark:text-zinc-500 font-medium leading-relaxed pl-1 pt-1">
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
            <div className="absolute bottom-[-1px] left-0 right-0 h-32 bg-gradient-to-t from-background to-transparent pointer-events-none" />
          </div>
        </div>
      </div>
    </div>
  )
}
