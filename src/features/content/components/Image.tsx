import NextImage, { ImageProps } from 'next/image'
import { normalizeImageSrc, toProxiedImageSrc } from '@/shared/utils/image-proxy'

function normalizeSrc(src: ImageProps['src']) {
  if (typeof src !== 'string') {
    return src
  }
  return toProxiedImageSrc(normalizeImageSrc(src))
}

const Image = ({ src, ...rest }: ImageProps) => <NextImage src={normalizeSrc(src)} {...rest} />

export default Image
