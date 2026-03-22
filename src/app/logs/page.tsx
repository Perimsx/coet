import { genPageMetadata } from '@/app/seo'
import { Metadata } from 'next'
import Link from '@/shared/components/Link'
import { 
  Github, GitBranch, ArrowUpRight, Activity, FileText, 
  Hash, FolderTree, ScrollText, GitCommit, Clock, Terminal
} from 'lucide-react'
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

export default async function LogsPage() {
  const commits = await getCommits()
  
  const allBlogs = getAllBlogs()
  const tagData = getTagData()
  const categoryData = getCategoryData()
  
  const totalPosts = allBlogs.length
  const totalTags = Object.keys(tagData).length
  const totalCategories = Object.keys(categoryData).length
  
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const totalWords = allBlogs.reduce((acc: number, curr: any) => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const readingTime = curr.readingTime as any
    if (readingTime?.words) {
       return acc + readingTime.words
    }
    return acc + (curr.body?.raw?.length || 0)
  }, 0)

  const formatWordCount = (num: number) => {
    return num > 1000 ? (num / 1000).toFixed(1) + 'k' : num.toString()
  }

  return (
    <div className="mx-auto max-w-6xl px-4 pt-4 pb-12 sm:px-6 lg:px-8 sm:pt-6 lg:pt-8">
      <div className="grid grid-cols-1 gap-12 lg:grid-cols-12 lg:gap-16">
        
        {/* ================= 左侧：静态概览信息 ================= */}
        <div className="h-fit lg:col-span-4 lg:sticky lg:top-24 space-y-10">
          <div>
            <div className="flex items-center gap-2 text-xs font-medium text-zinc-500 dark:text-zinc-400 mb-6 uppercase tracking-widest">
              <Activity className="h-3.5 w-3.5" />
              <span>System Status</span>
            </div>
            <h1 className="text-3xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50 mb-5 text-balance">
              架构与运行日志
            </h1>
            <p className="text-[14.5px] leading-loose text-zinc-600 dark:text-zinc-400">
              基于 Contentlayer 2 与本地 SQLite 构建。这里记录了全站的底层内容指标与 Git 迭代轨迹。
            </p>
          </div>
          
          {/* 极简数据列表，摒弃厚重的卡片 */}
          <div className="flex flex-col gap-4 border-y border-zinc-200/60 dark:border-zinc-800/60 py-7">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5 text-zinc-600 dark:text-zinc-400">
                <FileText className="h-[15px] w-[15px] text-zinc-400 dark:text-zinc-500" />
                <span className="text-[13.5px] font-medium tracking-wide">文章总数</span>
              </div>
              <span className="text-[15px] font-semibold font-mono text-zinc-900 dark:text-zinc-100">{totalPosts}</span>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5 text-zinc-600 dark:text-zinc-400">
                <ScrollText className="h-[15px] w-[15px] text-zinc-400 dark:text-zinc-500" />
                <span className="text-[13.5px] font-medium tracking-wide">内容预估字数</span>
              </div>
              <span className="text-[15px] font-semibold font-mono text-zinc-900 dark:text-zinc-100">{formatWordCount(totalWords)}</span>
            </div>
            <div className="flex items-center justify-between">
               <div className="flex items-center gap-2.5 text-zinc-600 dark:text-zinc-400">
                <Hash className="h-[15px] w-[15px] text-zinc-400 dark:text-zinc-500" />
                <span className="text-[13.5px] font-medium tracking-wide">独立标签归档</span>
              </div>
              <span className="text-[15px] font-semibold font-mono text-zinc-900 dark:text-zinc-100">{totalTags}</span>
            </div>
            <div className="flex items-center justify-between">
               <div className="flex items-center gap-2.5 text-zinc-600 dark:text-zinc-400">
                <FolderTree className="h-[15px] w-[15px] text-zinc-400 dark:text-zinc-500" />
                <span className="text-[13.5px] font-medium tracking-wide">专栏分类空间</span>
              </div>
              <span className="text-[15px] font-semibold font-mono text-zinc-900 dark:text-zinc-100">{totalCategories}</span>
            </div>
            <div className="flex items-center justify-between pt-3 mt-1 border-t border-zinc-200/50 dark:border-zinc-800/50 border-dashed">
               <div className="flex items-center gap-2.5 text-zinc-600 dark:text-zinc-400">
                <Clock className="h-[15px] w-[15px] text-zinc-400 dark:text-zinc-500" />
                <span className="text-[13.5px] font-medium tracking-wide">最近架构同步</span>
              </div>
              <span className="text-[14px] font-semibold font-mono text-zinc-900 dark:text-zinc-100">
                {commits.length > 0 ? formatDate(commits[0].commit.author.date, 'zh-CN') : 'N/A'}
              </span>
            </div>
            <div className="flex items-center justify-between">
               <div className="flex items-center gap-2.5 text-zinc-600 dark:text-zinc-400">
                <Terminal className="h-[15px] w-[15px] text-zinc-400 dark:text-zinc-500" />
                <span className="text-[13.5px] font-medium tracking-wide">系统运行时环境</span>
              </div>
              <span className="text-[12.5px] font-semibold font-mono text-zinc-900 dark:text-zinc-100 uppercase tracking-widest bg-zinc-100 dark:bg-zinc-800 px-1.5 py-0.5 rounded">
                Production RSC
              </span>
            </div>
          </div>

          <div className="pt-2">
            <Link
              href="https://github.com/kerntau/Coet"
              className="group inline-flex items-center gap-2.5 text-[13px] font-semibold text-zinc-600 transition-colors hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100 bg-zinc-100/50 hover:bg-zinc-100 dark:bg-zinc-800/50 dark:hover:bg-zinc-800 px-3 py-1.5 rounded-md"
            >
              <Github className="h-4 w-4" />
              <span>查阅底层通信源码</span>
              <ArrowUpRight className="h-3 w-3 opacity-50 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
            </Link>
          </div>
        </div>

        {/* ================= 右侧：时间轴日志流 ================= */}
        <div className="lg:col-span-8 lg:pl-8 h-full flex flex-col">
          <div className="flex-shrink-0 mb-6 flex items-center justify-between border-b border-zinc-200 dark:border-zinc-800 pb-5">
            <h2 className="text-[15px] font-bold text-zinc-900 dark:text-zinc-100 flex items-center gap-2.5 tracking-wide">
              <GitCommit className="h-5 w-5 text-zinc-400" />
              主干工程流 (Commits)
            </h2>
            <div className="flex items-center gap-2">
              <span className="relative flex h-1.5 w-1.5">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-emerald-500"></span>
              </span>
              <span className="text-[10px] font-mono text-zinc-500 tracking-[0.15em] uppercase">Live Sync</span>
            </div>
          </div>

          <div className="relative">
            {/* 顶部柔化过渡与裁切掩码 */}
            <div className="pointer-events-none absolute left-0 right-0 top-0 z-10 h-6 bg-gradient-to-b from-background to-transparent" />

            {/* 独立滚动区 */}
            <div className="custom-scrollbar relative space-y-10 before:absolute before:inset-y-0 before:left-2 before:w-px before:bg-zinc-200 dark:before:bg-zinc-800 lg:max-h-[calc(100vh-12rem)] lg:overflow-y-auto lg:pr-4 pb-12 pt-6 -mx-2 px-2">
              {commits.length === 0 ? (
                 <div className="text-sm text-zinc-500 py-4 pl-8">
                   <div className="w-4 h-4 rounded-full border-2 border-zinc-400 border-t-transparent animate-spin inline-block align-middle mr-2" />
                   暂无最新提交记录...
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
                     // 极简架构感配色，依靠不同色系的文字与极淡底色辅助视觉索引
                     let colorClass = 'bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400'
                     switch(type) {
                        case 'feat': colorClass = 'bg-blue-50/80 text-blue-600 dark:bg-blue-500/10 dark:text-blue-400'; break;
                        case 'fix': colorClass = 'bg-red-50/80 text-red-600 dark:bg-red-500/10 dark:text-red-400'; break;
                        case 'style': colorClass = 'bg-purple-50/80 text-purple-600 dark:bg-purple-500/10 dark:text-purple-400'; break;
                        case 'docs': colorClass = 'bg-emerald-50/80 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-400'; break;
                        case 'refactor': colorClass = 'bg-indigo-50/80 text-indigo-600 dark:bg-indigo-500/10 dark:text-indigo-400'; break;
                        case 'chore': colorClass = 'bg-orange-50/80 text-orange-600 dark:bg-orange-500/10 dark:text-orange-400'; break;
                     }
                     typeBadge = (
                       <span className={`rounded px-1.5 py-[1px] text-[10px] uppercase font-mono font-bold tracking-widest ${colorClass}`}>
                          {type}
                       </span>
                     )
                  }

                  return (
                    <div key={item.sha} className="relative group pl-10 pr-2">
                      {/* 精准的时间轴微小节点: Line is left-2(8px..9px). Center is 8.5px. Dot left-5px width-7px. Center 8.5px. */}
                      <div className="absolute left-[4.5px] top-1.5 h-[8px] w-[8px] rounded-full border-[2px] border-background bg-zinc-300 transition-colors group-hover:bg-zinc-400 dark:bg-zinc-600 dark:group-hover:bg-zinc-400" />
                      
                      <div className="flex flex-col gap-2.5">
                        {/* Meta 数据区 */}
                        <div className="flex flex-wrap items-center gap-3 text-sm mb-0.5">
                          {typeBadge}
                          <time className="text-[11px] font-mono text-zinc-400 dark:text-zinc-500 tracking-wider">
                            {formatDate(item.commit.author.date, 'zh-CN')}
                          </time>
                          <div className="flex items-center gap-1.5 text-[11px] font-mono text-zinc-400 ml-auto">
                            <GitBranch className="h-3 w-3 opacity-60" />
                            <a href={item.html_url} target="_blank" rel="noopener noreferrer" className="hover:text-zinc-900 transition-colors dark:hover:text-zinc-200">
                              {shortSha}
                            </a>
                          </div>
                        </div>

                        {/* 内容标题区 */}
                        <h3 className="text-[15.5px] font-semibold text-zinc-900 dark:text-zinc-100 leading-snug tracking-tight">
                          {gitMatch ? gitMatch[3] : title}
                        </h3>
                        
                        {/* 正文 Body 区 */}
                        {bodyLines.length > 0 && (
                          <div className="mt-1 space-y-2 text-[13.5px] leading-relaxed text-zinc-600 dark:text-zinc-400">
                            {bodyLines.map((line, i) => {
                              const isTag = line.startsWith('[') && line.includes(']')
                              if (isTag) {
                                const endIdx = line.indexOf(']')
                                const tag = line.substring(1, endIdx)
                                const content = line.substring(endIdx + 1).trim()
                                return (
                                  <div key={i} className="flex items-start gap-2.5">
                                    <span className="text-[11px] font-bold text-zinc-400 tracking-widest mt-[1px] flex-shrink-0">
                                      [{tag}]
                                    </span>
                                    <span className="font-medium">{content}</span>
                                  </div>
                                )
                              }
                              return <p key={i} className="font-medium">{line}</p>
                            })}
                          </div>
                        )}
                      </div>
                    </div>
                  )
                })
              )}
            </div>

            {/* 底部融合渐变层（固定在视口而非内容底端） */}
            <div className="pointer-events-none absolute bottom-[-1px] left-0 right-0 z-10 h-20 bg-gradient-to-t from-background to-transparent" />
          </div>
        </div>
      </div>
    </div>
  )
}
