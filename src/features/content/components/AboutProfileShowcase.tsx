import Image from '@/features/content/components/Image'
import NextImage from 'next/image'
import type { AboutProfileViewModel } from '@/features/content/lib/about-profile'
import SocialIcon from '@/features/site/components/social-icons'
import HtmlMarkdownContent from './HtmlMarkdownContent'

type AboutProfileShowcaseProps = {
  profile: AboutProfileViewModel
  contentHtml: string
  locale?: 'zh' | 'en'
  mode?: 'page' | 'preview'
}

export default function AboutProfileShowcase({
  profile,
  contentHtml,
  locale = 'zh',
  mode = 'page',
}: AboutProfileShowcaseProps) {
  const isEn = locale === 'en'
  const compact = mode === 'preview'
  const visibleTechStacks = profile.techStacks.slice(0, compact ? 8 : 10)
  const remainingTechStackCount = Math.max(0, profile.techStacks.length - visibleTechStacks.length)

  return (
    <section className={compact ? 'pt-1' : '-mx-4 pt-1 pb-2 sm:-mx-6 lg:-mx-8'}>
      <div
        className={[
          'relative overflow-hidden transition-all duration-500',
          compact
            ? 'rounded-[1.5rem] border border-border/40 bg-background/50 backdrop-blur-md p-5 shadow-sm'
            : 'px-4 py-4 sm:px-6 sm:py-6 lg:px-8 lg:py-8',
        ].join(' ')}
      >
        <div className={compact ? '' : 'mx-auto max-w-5xl'}>
          <div className="relative grid gap-8 xl:grid-cols-[280px_1fr]">
            {!compact && (
              <div className="absolute inset-x-0 top-0 -mx-8 h-48 -z-10 opacity-30 dark:opacity-20 blur-3xl pointer-events-none">
                <div className="absolute inset-0 bg-linear-to-r from-primary/30 via-sky-400/20 to-indigo-500/30" />
              </div>
            )}
            <aside className="flex flex-col items-center">
              <div className="group relative">
                <div className="absolute -inset-1.5 rounded-full bg-linear-to-br from-primary/5 to-transparent opacity-0 transition-opacity duration-500 group-hover:opacity-100" />
                {profile.avatar ? (
                  <Image
                    src={profile.avatar}
                    alt={profile.name}
                    width={128}
                    height={128}
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
                    {profile.ageLabel}
                  </p>
                )}
              </div>

              <div className="mt-2 flex flex-wrap justify-center gap-3">
                {profile.socials.map((item, index) => (
                  <div key={index} className="transition-transform duration-300 hover:-translate-y-1">
                    <SocialIcon kind={item.platform} href={item.url} size={8} icon={item.icon} />
                  </div>
                ))}
              </div>

              <div className="mt-5 flex w-full max-w-[240px] flex-col items-center border-t border-border/10 pt-4">
                <span className="mb-2 block text-[11px] leading-none font-bold uppercase tracking-[0.18em] text-muted-foreground/45">
                  {isEn ? 'Tech Stack' : '技术栈'}
                </span>
                {profile.techStacks.length > 0 ? (
                  <div className="flex flex-wrap justify-center gap-1.5">
                    {visibleTechStacks.map((tech, index) => (
                      <div
                        key={index}
                        title={tech.name}
                        className="flex min-h-8 items-center gap-1.5 rounded-full border border-border/15 bg-background/45 px-2.5 text-[11px] font-semibold text-foreground/62 shadow-sm transition-colors hover:border-primary/25 hover:text-foreground dark:bg-white/[0.04]"
                      >
                        {tech.iconSrc ? (
                          <NextImage
                            src={tech.iconSrc}
                            alt={tech.name}
                            width={16}
                            height={16}
                            className="h-4 w-4 object-contain"
                          />
                        ) : (
                          <span className="h-1.5 w-1.5 rounded-full bg-primary/40" aria-hidden="true" />
                        )}
                        <span>{tech.name}</span>
                      </div>
                    ))}
                    {remainingTechStackCount > 0 && (
                      <span className="inline-flex min-h-8 items-center rounded-full border border-dashed border-border/25 px-2.5 text-[11px] font-semibold text-muted-foreground/55">
                        +{remainingTechStackCount}
                      </span>
                    )}
                  </div>
                ) : (
                  <div className="text-[11px] font-medium italic text-muted-foreground/30">
                    {isEn ? 'No tech stack added yet' : '暂未添加技术栈'}
                  </div>
                )}
              </div>
            </aside>

            <div className="min-w-0">
              <div
                className="prose prose-slate max-w-none prose-headings:tracking-tight prose-headings:font-bold prose-h2:mt-8 prose-h2:mb-4 prose-h2:border-b prose-h2:border-border/10 prose-h2:pb-2 prose-h2:text-[1.35rem] prose-h2:first:mt-0 prose-h3:mt-6 prose-h3:mb-2 prose-h3:text-[1.1rem] prose-p:mb-4 prose-p:text-[0.95rem] prose-p:leading-7 prose-p:text-foreground/80 prose-li:text-[0.95rem] prose-li:text-foreground/80 prose-strong:font-bold prose-strong:text-foreground prose-blockquote:my-4 prose-blockquote:not-italic prose-blockquote:rounded-r-lg prose-blockquote:border-l-2 prose-blockquote:border-primary/20 prose-blockquote:bg-primary/5 prose-blockquote:px-5 prose-blockquote:py-3 prose-img:my-0 prose-img:mr-1 prose-img:inline-block prose-a:font-semibold prose-a:text-primary prose-a:no-underline hover:prose-a:no-underline dark:prose-invert sm:prose-base"
              >
                <HtmlMarkdownContent html={contentHtml} />
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
