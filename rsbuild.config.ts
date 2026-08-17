import { defineConfig } from '@rsbuild/core'
import { pluginReact } from '@rsbuild/plugin-react'
import path from 'path'

export default defineConfig({
  plugins: [pluginReact()],
  source: {
    entry: {
      index: './src/main.tsx',
    },
    alias: {
      '@': path.resolve(__dirname, './src'),
      '@/app': path.resolve(__dirname, './src/app'),
      '@/features': path.resolve(__dirname, './src/features'),
      '@/components': path.resolve(__dirname, './src/components'),
      '@/shared': path.resolve(__dirname, './src/shared'),
      '@/blog.config': path.resolve(__dirname, './blog.config.ts'),
      '@/generated': path.resolve(__dirname, './src/generated'),
      'contentlayer/generated': path.resolve(__dirname, './.contentlayer/generated'),
      'next/link': path.resolve(__dirname, './src/shared/adapters/next-link.tsx'),
      'next/image': path.resolve(__dirname, './src/shared/adapters/next-image.tsx'),
      'next/navigation': path.resolve(__dirname, './src/shared/adapters/next-navigation.tsx'),
      'next/dynamic': path.resolve(__dirname, './src/shared/adapters/next-dynamic.tsx'),
      'next/script': path.resolve(__dirname, './src/shared/adapters/next-script.tsx'),
      next: path.resolve(__dirname, './src/shared/adapters/next-metadata.ts'),
      'server-only': path.resolve(__dirname, './src/shared/adapters/server-only.ts'),
    },
    define: {
      'process.env.BASE_PATH': '""',
      'process.env.NEXT_UMAMI_ID': '""',
      'process.env.GOOGLE_SEARCH_CONSOLE': '""',
      'process.env.NODE_ENV': JSON.stringify(process.env.NODE_ENV || 'development'),
    },
  },
  html: {
    template: './index.html',
    title: '序栈 - 在有序的世界里，寻一处生活的归栈。',
    meta: {
      viewport: 'width=device-width, initial-scale=1, maximum-scale=5',
      description: '序栈博客 - 记录技术思考与生活沉淀',
    },
  },
  server: {
    port: 3000,
    host: '127.0.0.1',
    proxy: {
      '/api': {
        target: 'http://127.0.0.1:8080',
        changeOrigin: true,
      },
    },
  },
  tools: {
    rspack: {
      node: {
        __dirname: false,
      },
    },
  },
  output: {
    distPath: {
      root: 'out',
    },
    assetPrefix: '/',
  },
})
