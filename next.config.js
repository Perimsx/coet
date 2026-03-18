/**
 * Next.js 核心配置文件
 * 包含：Contentlayer 集成、Bundle 分析、安全头、Server Actions 域白名单及 Webpack 定制。
 */
const { withContentlayer } = require('next-contentlayer2')

const withBundleAnalyzer = require('@next/bundle-analyzer')({
  enabled: process.env.ANALYZE === 'true',
})

// 如果您使用了外部服务（如埋点、第三方脚本），可能需要在此处的 script-src 中添加域名
const ContentSecurityPolicy = `
  default-src 'self';
  script-src 'self' 'unsafe-eval' 'unsafe-inline' giscus.app analytics.umami.is cloud.umami.is;
  style-src 'self' 'unsafe-inline';
  img-src * blob: data:;
  media-src * blob: data:;
  connect-src *;
  font-src 'self';
  frame-src *
`

const securityHeaders = [
  // 内容安全策略 (CSP): https://developer.mozilla.org/en-US/docs/Web/HTTP/CSP
  {
    key: 'Content-Security-Policy',
    value: ContentSecurityPolicy.replace(/\n/g, ''),
  },
  // 来源策略: https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Referrer-Policy
  {
    key: 'Referrer-Policy',
    value: 'strict-origin-when-cross-origin',
  },
  // X-Frame-Options: 防止点击劫持 (Clickjacking)
  // https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/X-Frame-Options
  {
    key: 'X-Frame-Options',
    value: 'DENY',
  },
  // X-Content-Type-Options: 禁用 MIME 嗅探
  // https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/X-Content-Type-Options
  {
    key: 'X-Content-Type-Options',
    value: 'nosniff',
  },
  // X-DNS-Prefetch-Control: 开启 DNS 预取
  // https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/X-DNS-Prefetch-Control
  {
    key: 'X-DNS-Prefetch-Control',
    value: 'on',
  },
  // HSTS (HTTP Strict Transport Security): 强制全程 HTTPS
  // https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Strict-Transport-Security
  {
    key: 'Strict-Transport-Security',
    value: 'max-age=31536000; includeSubDomains',
  },
  // 权限策略 (Permissions-Policy): 限制浏览器功能访问
  // https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Feature-Policy
  {
    key: 'Permissions-Policy',
    value: 'camera=(), microphone=(), geolocation=()',
  },
]

const output = process.env.EXPORT ? 'export' : undefined
const basePath = process.env.BASE_PATH || undefined
const unoptimized = process.env.UNOPTIMIZED ? true : undefined
const allowedDevOrigins = [
  '127.0.0.1',
  '[::1]',
  '10.*.*.*',
  '172.*.*.*',
  '192.168.*.*',
  '198.18.*.*',
]

/**
 * @type {import('next/dist/next-server/server/config').NextConfig}
 **/
module.exports = () => {
  const plugins = [withContentlayer, withBundleAnalyzer]
  return plugins.reduce((acc, next) => next(acc), {
    output: output || 'standalone',
    basePath,
    allowedDevOrigins,
    reactStrictMode: true,
    transpilePackages: ['lucide-react', 'pliny'],
    experimental: {
      serverActions: {
        allowedOrigins: [
          'blog.coet.ink',
          '*.blog.coet.ink',
          'chenguitao.com',
          '*.chenguitao.com',
          'localhost:3000',
        ],
      },
    },
    trailingSlash: true,
    turbopack: {
      root: process.cwd(),
      rules: {
        '*.svg': {
          loaders: ['@svgr/webpack'],
          as: '*.js',
        },
      },
    },
    pageExtensions: ['ts', 'tsx', 'js', 'jsx', 'md', 'mdx'],
    images: {
      remotePatterns: [
        {
          protocol: 'https',
          hostname: '**',
        },
        {
          protocol: 'http',
          hostname: '**',
        },
      ],
      unoptimized,
    },
    async headers() {
      return [
        {
          source: '/(.*)',
          headers: securityHeaders,
        },
      ]
    },
    webpack: (config, options) => {
      // 允许在 Next.js 组件中以 React 组件形式导入 .svg 文件
      config.module.rules.push({
        test: /\.svg$/,
        use: ['@svgr/webpack'],
      })

      return config
    },
  })
}
