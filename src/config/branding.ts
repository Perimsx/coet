const basePath = process.env.BASE_PATH || "";

const withBasePath = (path: string) => `${basePath}${path}`;
const faviconBasePath = withBasePath("/branding");
const primaryBrandImage = withBasePath("/branding/og-image.jpg");
const vectorBrandImage = withBasePath("/branding/logo.svg");

const brandingConfig = {
  logo: primaryBrandImage,
  favicon: `${faviconBasePath}/favicon.ico`,
  favicon16: `${faviconBasePath}/favicon-16x16.png`,
  favicon32: `${faviconBasePath}/favicon-32x32.png`,
  appleTouchIcon: `${faviconBasePath}/apple-touch-icon.png`,
  androidIcon192: `${faviconBasePath}/android-chrome-192x192.png`,
  androidIcon512: `${faviconBasePath}/android-chrome-512x512.png`,
  maskIcon: vectorBrandImage,
  manifest: `${faviconBasePath}/site.webmanifest`,
  ogImage: primaryBrandImage,
} as const;

export default brandingConfig;
