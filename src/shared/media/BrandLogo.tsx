import brandingConfig from '@/config/branding'

type BrandLogoProps = {
  className?: string
  alt?: string
}

export default function BrandLogo({ className, alt = 'Site logo' }: BrandLogoProps) {
  return <img src={brandingConfig.logo} alt={alt} className={className} />
}
