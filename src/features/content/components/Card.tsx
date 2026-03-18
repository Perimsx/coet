import Image from './Image'
import Link from '@/shared/components/Link'

interface CardProps {
  title: string
  description: string
  imgSrc?: string
  href?: string
  ctaLabel?: string
}

const Card = ({ title, description, imgSrc, href, ctaLabel = '' }: CardProps) => (
  <div className="max-w-[544px] p-4 md:w-1/2">
    <div
      className={`${
        imgSrc && 'h-full'
      } overflow-hidden rounded-md border-2 border-gray-200/60 dark:border-gray-700/60`}
    >
      {imgSrc &&
        (href ? (
          <Link href={href} aria-label={`Link to ${title}`}>
            <Image
              alt={title}
              src={imgSrc}
              className="h-40 w-full object-cover object-center sm:h-44 md:h-36 lg:h-48"
              width={544}
              height={306}
            />
          </Link>
        ) : (
          <Image
            alt={title}
            src={imgSrc}
            className="h-40 w-full object-cover object-center sm:h-44 md:h-36 lg:h-48"
            width={544}
            height={306}
          />
        ))}
      <div className="p-6">
        <h2 className="mb-3 text-xl leading-7 font-bold tracking-tight sm:text-2xl sm:leading-8">
          {href ? (
            <Link href={href} aria-label={`Link to ${title}`}>
              {title}
            </Link>
          ) : (
            title
          )}
        </h2>
        <p className="prose mb-3 max-w-none text-gray-500 dark:text-gray-400">{description}</p>
        {href && ctaLabel && (
          <Link
            href={href}
            className="text-primary-500 hover:text-primary-600 dark:hover:text-primary-400 text-base leading-6 font-medium"
            aria-label={`Link to ${title}`}
          >
            {ctaLabel} &rarr;
          </Link>
        )}
      </div>
    </div>
  </div>
)

export default Card
