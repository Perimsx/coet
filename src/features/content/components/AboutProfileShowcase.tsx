import Image from '@/features/content/components/Image'
import NextImage from 'next/image'
import type { AboutProfileViewModel } from '@/features/content/lib/about-profile'
import SocialIcon from '@/features/site/components/social-icons'
import HtmlMarkdownContent from './HtmlMarkdownContent'
import { getDictionary } from '@/shared/utils/i18n'
import { Tooltip, TooltipTrigger, TooltipContent } from '@/components/ui/tooltip'

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
  const dict = getDictionary(locale)
  const compact = mode === 'preview'

  return (
    <section className={compact ? 'pt-1' : 'px-4 pt-4 pb-12 sm:px-6 lg:px-8'}>
      <div
        className={[
          'relative transition-all duration-300',
          compact
            ? 'overflow-hidden rounded-lg border border-border bg-paper/60 p-5 shadow-xs'
            : 'mx-auto max-w-4xl',
        ].join(' ')}
      >
        <div className="relative grid gap-8 md:grid-cols-[240px_1fr]">
          <aside className="flex flex-col items-center">
            <div className="group relative">
              {profile.avatar ? (
                <Image
                  src={profile.avatar}
                  alt={profile.name}
                  width={120}
                  height={120}
                  className="relative h-24 w-24 sm:h-28 sm:w-28 rounded-full object-cover border border-border ring-2 ring-paper shadow-sm"
                  onError={(e) => {
                    const img = e.currentTarget
                    if (img.src !== window.location.origin + '/avatar.png') {
                      img.src = '/avatar.png'
                    }
                  }}
                />
              ) : (
                <div className="relative flex h-24 w-24 sm:h-28 sm:w-28 items-center justify-center rounded-full bg-neutral-2 text-title-28 font-medium text-neutral-8 border border-border">
                  {profile.name.slice(0, 1)}
                </div>
              )}
            </div>

            <div className="mt-4 text-center">
              <h1 className="font-serif text-title-24 font-medium tracking-tight text-neutral-10">
                {profile.name}
              </h1>
              {profile.ageLabel && (
                <p className="mt-1 text-label-12 font-normal text-neutral-6">
                  {profile.ageLabel}
                </p>
              )}
            </div>

            <div className="mt-3 flex flex-wrap justify-center gap-2.5">
              {profile.socials.map((item, index) => (
                <div key={index} className="transition-transform duration-200 hover:-translate-y-0.5">
                  <SocialIcon kind={item.platform} href={item.url} size={6} icon={item.icon} />
                </div>
              ))}
            </div>

            <div className="mt-5 flex w-full max-w-full sm:max-w-[240px] flex-col items-center border-t border-border pt-4">
              <span className="mb-2.5 block text-caption-10 font-semibold uppercase tracking-widest text-neutral-6">
                {dict.about.stats.techStack}
              </span>
              {profile.techStacks.length > 0 ? (
                <div className="flex flex-wrap justify-center gap-1.5">
                  {profile.techStacks.map((tech, index) => (
                    <Tooltip key={index}>
                      <TooltipTrigger asChild>
                        <div
                          className="flex h-7 w-7 items-center justify-center rounded-full border border-border bg-neutral-1 text-neutral-7 transition-colors hover:border-accent/40 hover:text-accent"
                        >
                          {tech.iconSrc ? (
                            <NextImage
                              src={tech.iconSrc}
                              alt={tech.name}
                              width={14}
                              height={14}
                              className="h-3.5 w-3.5 object-contain"
                            />
                          ) : (
                            <span className="h-1.5 w-1.5 rounded-full bg-accent/40" aria-hidden="true" />
                          )}
                        </div>
                      </TooltipTrigger>
                      <TooltipContent side="bottom" className="text-caption-10">
                        {tech.name}
                      </TooltipContent>
                    </Tooltip>
                  ))}
                </div>
              ) : (
                <div className="text-caption-10 font-normal italic text-neutral-5">
                  {isEn ? 'No tech stack added yet' : '暂未添加技术栈'}
                </div>
              )}
            </div>
          </aside>

          <main className="min-w-0">
            <div className="rounded-xl border border-border/70 bg-paper/70 p-6 sm:p-8 shadow-xs">
              <div className="article-detail">
                <HtmlMarkdownContent html={contentHtml} />
              </div>
            </div>
          </main>
        </div>
      </div>
    </section>
  )
}
