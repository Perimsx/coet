import TechStackIcons from '@/features/content/components/TechStackIcons'
import type { AboutProfileViewModel } from '@/features/content/lib/about-profile'
import SocialIcon from '@/features/site/components/social-icons'
import HtmlMarkdownContent from './HtmlMarkdownContent'

type AboutProfileShowcaseProps = {
  profile: AboutProfileViewModel
  contentHtml: string
  mode?: 'page' | 'preview'
}

export default function AboutProfileShowcase({
  profile,
  contentHtml,
  mode = 'page',
}: AboutProfileShowcaseProps) {
  const compact = mode === 'preview'

  return (
    <section className={compact ? 'pt-1' : '-mx-4 pt-1 pb-2 sm:-mx-6 lg:-mx-8'}>
      <div
        className={[
          'relative overflow-hidden border-border/40 bg-linear-to-b from-[#f8f9fb] to-[#fbfcfe] transition-all duration-500 dark:from-card/40 dark:to-card/20',
          compact 
            ? 'rounded-[1.5rem] p-5 border shadow-sm' 
            : 'border-y px-4 py-4 sm:px-6 sm:py-6 lg:px-8 lg:py-8',
        ].join(' ')}
      >
        <div className={compact ? '' : 'mx-auto max-w-5xl'}>
          <div className="relative grid gap-8 xl:grid-cols-[280px_1fr]">
            {/* 左侧栏：个人资料 */}
            <aside className="flex flex-col items-center">
              <div className="relative group">
                <div className="absolute -inset-1.5 rounded-full bg-linear-to-br from-primary/5 to-transparent opacity-0 transition-opacity duration-500 group-hover:opacity-100" />
                {profile.avatar ? (
                  <img
                    src={profile.avatar}
                    alt={profile.name}
                    className="relative h-28 w-28 rounded-full object-cover shadow-[0_8px_30px_rgb(0,0,0,0.06)] ring-[5px] ring-white dark:ring-gray-850 sm:h-32 sm:w-32"
                  />
                ) : (
                  <div className="relative flex h-28 w-28 items-center justify-center rounded-full bg-primary/10 text-4xl font-bold text-primary ring-[5px] ring-white dark:ring-gray-850 sm:h-32 sm:w-32">
                    {profile.name.slice(0, 1)}
                  </div>
                )}
              </div>

              <div className="mt-3 text-center">
                <h1 className="text-[1.8rem] font-extrabold tracking-tight text-foreground sm:text-[2.2rem]">
                  {profile.name}
                </h1>
                {profile.ageLabel && (
                  <p className="mt-0.5 text-[13px] font-bold tracking-wide text-muted-foreground/50">
                    {profile.ageLabel.replace('years old', '岁')}
                  </p>
                )}
              </div>

              {/* 社交图标行 */}
              <div className="mt-2 flex flex-wrap justify-center gap-3">
                {profile.socials.map((item, index) => (
                  <div key={index} className="transition-transform duration-300 hover:-translate-y-1">
                    <SocialIcon
                      kind={item.platform}
                      href={item.url}
                      size={8}
                      icon={item.icon}
                    />
                  </div>
                ))}
              </div>

              {/* 技术栈 */}
              <div className="mt-3 w-full flex flex-col items-center">
                <span className="block text-[13px] font-bold tracking-wide text-muted-foreground/50 leading-none mb-1">
                  技术栈
                </span>
                {profile.techStacks.length > 0 ? (
                  <div className="flex flex-wrap justify-center gap-2">
                    {profile.techStacks.map((tech, idx) => (
                      <div
                        key={idx}
                        title={tech.name}
                        className="flex h-10 w-10 items-center justify-center rounded-lg bg-white/40 shadow-xs transition-all hover:scale-110 hover:bg-white dark:bg-white/5 dark:hover:bg-white/10"
                      >
                        {tech.iconSrc ? (
                          <img
                            src={tech.iconSrc}
                            alt={tech.name}
                            className="h-6.5 w-6.5 object-contain opacity-70 transition-opacity hover:opacity-100"
                          />
                        ) : (
                          <div className="text-[8px] font-bold opacity-40">
                            {tech.name.slice(0, 2)}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-[11px] font-medium text-muted-foreground/30 italic">
                    暂未添加技术栈
                  </div>
                )}
              </div>
            </aside>

            {/* 右侧栏：文章内容 */}
            <div className="min-w-0">
              <div className="prose prose-slate max-w-none dark:prose-invert 
                prose-headings:font-bold prose-headings:tracking-tight 
                prose-h2:mt-8 prose-h2:mb-4 prose-h2:pb-2 prose-h2:border-b prose-h2:border-border/10 prose-h2:text-[1.35rem] prose-h2:first:mt-0
                prose-h3:mt-6 prose-h3:mb-2 prose-h3:text-[1.1rem] 
                prose-p:mb-4 prose-p:text-[0.95rem] prose-p:leading-7 prose-p:text-foreground/80 
                prose-li:text-[0.95rem] prose-li:text-foreground/80
                prose-strong:text-foreground prose-strong:font-bold
                prose-blockquote:not-italic prose-blockquote:border-l-2 prose-blockquote:border-primary/20 prose-blockquote:bg-primary/5 prose-blockquote:py-3 prose-blockquote:px-5 prose-blockquote:rounded-r-lg prose-blockquote:my-4
                prose-img:inline-block prose-img:my-0 prose-img:mr-1
                prose-a:font-semibold prose-a:text-primary prose-a:no-underline hover:prose-a:no-underline
                sm:prose-base">
                <HtmlMarkdownContent html={contentHtml} />
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

