import brandingConfig from './branding'

const basePath = process.env.BASE_PATH || ''

const siteConfig = {
  title: '陈桂涛的博客',
  author: '陈桂涛',
  headerTitle: '陈桂涛的博客',
  description: '陈桂涛的技术记录与项目实践',
  theme: 'light',
  siteUrl: 'https://chenguitao.com/',
  language: 'zh-CN',
  siteRepo: 'https://github.com/kerntau/Coet',
  siteLogo: brandingConfig.logo,
  socialBanner: brandingConfig.ogImage,
  mastodon: '',
  email: 'kerntau@outlook.com',
  github: 'https://github.com/kerntau',
  x: 'https://x.com/kerntau',
  yuque: 'https://www.yuque.com/coet',
  facebook: '',
  youtube: '',
  linkedin: '',
  threads: '',
  instagram: '',
  medium: '',
  bluesky: '',
  stickyNav: true,
  analytics: {
    umamiAnalytics: {
      umamiWebsiteId: process.env.NEXT_UMAMI_ID,
    },
  },
  comments: {
    provider: 'local',
  },
  search: {
    provider: 'kbar',
    kbarConfig: {
      searchDocumentsPath: `${basePath}/search.json`,
    },
  },
  googleSearchConsole: process.env.GOOGLE_SEARCH_CONSOLE || '',
  siteCreatedAt: '2025-11-10 00:07:03',
}

export default siteConfig
