/* eslint-disable @typescript-eslint/no-require-imports */
const { withContentlayer } = require("next-contentlayer2")
const withBundleAnalyzer = require("@next/bundle-analyzer")({
  enabled: process.env.ANALYZE === "true",
})

function parseOriginHost(value) {
  if (!value) return null

  try {
    return new URL(value).host
  } catch {
    return value
      .trim()
      .replace(/^https?:\/\//i, "")
      .replace(/\/+$/, "")
  }
}

function splitCsv(value) {
  return String(value || "")
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean)
}

const contentSecurityPolicy = `
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
  {
    key: "Content-Security-Policy",
    value: contentSecurityPolicy.replace(/\n/g, ""),
  },
  {
    key: "Referrer-Policy",
    value: "strict-origin-when-cross-origin",
  },
  {
    key: "X-Frame-Options",
    value: "DENY",
  },
  {
    key: "X-Content-Type-Options",
    value: "nosniff",
  },
  {
    key: "X-DNS-Prefetch-Control",
    value: "on",
  },
  {
    key: "Strict-Transport-Security",
    value: "max-age=31536000; includeSubDomains",
  },
  {
    key: "Permissions-Policy",
    value: "camera=(), microphone=(), geolocation=()",
  },
]

const output = process.env.EXPORT ? "export" : undefined
const basePath = process.env.BASE_PATH || undefined
const unoptimized = process.env.UNOPTIMIZED ? true : undefined
const allowedDevOrigins = [
  "127.0.0.1",
  "[::1]",
  "10.*.*.*",
  "172.*.*.*",
  "192.168.*.*",
  "198.18.*.*",
  "localhost:3000",
]

const allowedServerActionOrigins = Array.from(
  new Set([
    ...allowedDevOrigins,
    parseOriginHost(process.env.NEXT_PUBLIC_SITE_URL),
    parseOriginHost(process.env.SITE_URL),
    ...splitCsv(process.env.ADMIN_ALLOWED_ORIGINS).map(parseOriginHost),
  ].filter(Boolean)),
)

/**
 * @type {import('next').NextConfig}
 */
module.exports = () => {
  const plugins = [withContentlayer, withBundleAnalyzer]

  return plugins.reduce((acc, next) => next(acc), {
    output: output || "standalone",
    basePath,
    allowedDevOrigins,
    reactStrictMode: true,
    transpilePackages: ["lucide-react", "pliny"],
    experimental: {
      serverActions: {
        allowedOrigins: allowedServerActionOrigins,
      },
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
        {
          protocol: "https",
          hostname: "**",
        },
        {
          protocol: "http",
          hostname: "**",
        },
      ],
      unoptimized,
    },
    async headers() {
      return [
        {
          source: "/(.*)",
          headers: securityHeaders,
        },
      ]
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
