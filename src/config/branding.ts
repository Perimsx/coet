const basePath = process.env.BASE_PATH || ''

const withBasePath = (path: string) => `${basePath}${path}`
const primaryBrandImage = withBasePath('/branding/og-image.jpg')
const vectorBrandImage = withBasePath('/branding/logo.svg')

const brandingConfig = {
  logo: primaryBrandImage,
  favicon: withBasePath('/branding/favicon.ico'),
  appleTouchIcon: primaryBrandImage,
  maskIcon: vectorBrandImage,
  manifest: withBasePath('/branding/site.webmanifest'),
  ogImage: primaryBrandImage,
} as const

export default brandingConfig
