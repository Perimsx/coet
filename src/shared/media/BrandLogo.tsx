import brandingConfig from '@/config/branding'
import Image from '@/features/content/components/Image'
import { cn } from '@/shared/utils/utils'

type BrandLogoProps = {
  className?: string
  alt?: string
}

export default function BrandLogo({ className, alt = 'Site logo' }: BrandLogoProps) {
  return (
    <span className={cn('relative block overflow-hidden', className)}>
      <Image
        src={brandingConfig.logo}
        alt={alt}
        fill
        sizes="32px"
        className="object-contain"
      />
    </span>
  )
}
