/* eslint-disable @typescript-eslint/no-require-imports */
const { withContentlayer } = require("next-contentlayer2")
const withBundleAnalyzer = require("@next/bundle-analyzer")({
  enabled: process.env.ANALYZE === "true",
})

// 安全头和缓存策略已通过 public/_headers 文件配置（静态导出模式下 next.config.js 的 headers() 不生效）

const basePath = process.env.BASE_PATH || undefined
const isStaticExport = process.env.STATIC_EXPORT === "true"
const distDir = process.env.NEXT_DIST_DIR || ".next"
const allowedDevOrigins = [
  "127.0.0.1",
  "[::1]",
  "10.*.*.*",
  "172.*.*.*",
  "192.168.*.*",
  "198.18.*.*",
  "localhost:3000",
]

/**
 * @type {import('next').NextConfig}
 */
module.exports = () => {
  const plugins = [withContentlayer, withBundleAnalyzer]

  return plugins.reduce((acc, next) => next(acc), {
    output: isStaticExport ? "export" : "standalone",
    distDir,
    basePath,
    allowedDevOrigins,
    reactStrictMode: true,
    transpilePackages: ["lucide-react", "pliny"],
    experimental: {
      optimizePackageImports: ["lucide-react", "framer-motion", "@radix-ui/react-dialog", "@radix-ui/react-dropdown-menu", "@radix-ui/react-tooltip"],
    },
    compiler: {
      removeConsole: process.env.NODE_ENV === 'production' ? { exclude: ['error', 'warn'] } : false,
    },
    trailingSlash: true,
    turbopack: {
      root: process.cwd(),
      rules: {
        "*.svg": {
          loaders: ["@svgr/webpack"],
          as: "*.js",
        },
      },
    },
    pageExtensions: ["ts", "tsx", "js", "jsx", "md", "mdx"],
    images: {
      remotePatterns: [
        { protocol: "https", hostname: "images.unsplash.com" },
        { protocol: "https", hostname: "raw.githubusercontent.com" },
        { protocol: "https", hostname: "avatars.githubusercontent.com" },
        { protocol: "https", hostname: "cot.wiki" },
        { protocol: "https", hostname: "**.amazonaws.com" },
      ],
      unoptimized: true,
    },
    webpack: (config) => {
      config.module.rules.push({
        test: /\.svg$/,
        use: ["@svgr/webpack"],
      })

      return config
    },
  })
}
