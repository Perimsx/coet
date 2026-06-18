<div align="center">

<img src="public/avatar.png" width="100" height="100" style="border-radius: 50%;" alt="COT Logo" />

# COT

**知行合一，缄默前行。**

[![Next.js](https://img.shields.io/badge/Next.js-15-black?logo=next.js)](https://nextjs.org/)
[![React](https://img.shields.io/badge/React-19-61dafb?logo=react)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.9-3178c6?logo=typescript)](https://www.typescriptlang.org/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind-4-06b6d4?logo=tailwindcss)](https://tailwindcss.com/)
[![License](https://img.shields.io/badge/License-GPL--3.0-blue)](./LICENSE)

一个基于 Next.js 15 构建的个人技术主页与知识库。
博客、知识库、搜索、归档、标签、友链和 SEO 管线统一在一个 App Router 架构中，偏向内容沉淀与长期维护。

**[在线预览](https://cot.wiki)** · [报告 Bug](https://github.com/cotovo/homepage/issues)

</div>

---

## 特性

<table>
<tr>
<td width="50%">

### 内容引擎
- **双管线架构** — Contentlayer 2 管理博客/作者，Velite 管理知识库
- **MDX 增强** — 代码块标题、行高亮、图片懒加载、外部图片代理
- **多语言** — 中英文同源（`.en.md` 后缀约定），UI 文案国际化
- **全文搜索** — FlexSearch 客户端索引，KBar 弹层即时检索

</td>
<td width="50%">

### 工程能力
- **双模式部署** — VPS standalone SSR 一键部署 / EdgeOne 静态导出
- **SEO 全链路** — sitemap、RSS、JSON-LD、百度/IndexNow 推送
- **响应式 UI** — Tailwind CSS 4 + Framer Motion，明暗主题
- **构建管线** — 内容生成 → Velite → Next.js → RSS → SEO 推送

</td>
</tr>
</table>

## 技术栈

```
框架层    Next.js 15 (App Router) · React 19 · TypeScript 5.9
样式层    Tailwind CSS 4 · Framer Motion · GSAP · Lenis
内容层    Contentlayer 2 · Velite · MDX · Unified / Rehype / Remark
搜索层    FlexSearch · KBar
组件层    Radix UI · shadcn/ui · Lucide React · Vaul · Sonner
工具层    pnpm 10 · ESLint · Prettier · Husky · lint-staged
部署层    PM2 · Nginx · EdgeOne · deploy.sh 自引导脚本
```

## 快速开始

```bash
git clone https://github.com/cotovo/homepage.git
cd homepage
pnpm install
pnpm dev          # http://127.0.0.1:3000
```

## 命令速查

| 命令 | 说明 |
|:-----|:-----|
| `pnpm dev` | 启动开发服务器（自动内容生成 + 热更新） |
| `pnpm dev:clean` | 清除所有缓存后启动 |
| `pnpm build` | 生产构建（standalone SSR，`.next/standalone/`） |
| `STATIC_EXPORT=true pnpm build` | 静态导出（`out/` 目录，用于 EdgeOne / COS） |
| `pnpm typecheck` | TypeScript 类型检查 |
| `pnpm lint` | ESLint 自动修复 |
| `pnpm analyze` | Bundle 体积分析 |

## 部署

### VPS 自动部署

```bash
# 上传 deploy.sh 到 VPS，一键完成
chmod +x deploy.sh && ./deploy.sh
```

<details>
<summary><b>脚本做什么</b></summary>

1. 检测 OS / 架构，自动安装 Node.js 20 LTS、pnpm 10、PM2
2. 清理历史残留（损坏的 corepack、孤立 PM2 进程、异常 node_modules）
3. `git clone` 仓库到 `/opt/cotovo`
4. `pnpm install` + `pnpm build`（含内容生成 + standalone 静态资源拷贝）
5. PM2 启动 → 进程健康检查 → HTTP 健康检查 → 开机自启配置
6. 失败自动回滚到上一版本

环境变量覆盖：`GIT_REPO` · `GIT_BRANCH` · `DEPLOY_DIR` · `APP_PORT` · `APP_DOMAIN` · `NODE_MAJOR`

</details>

### EdgeOne 静态部署

```bash
STATIC_EXPORT=true pnpm build
# 上传 out/ 目录到 EdgeOne 对象存储
```

搜索基于客户端 FlexSearch，静态模式下完整可用。

## 项目结构

```
├── blog.config.ts                 # 站点单源配置
├── contentlayer.config.ts         # 博客内容模型 + MDX 插件链
├── velite.config.ts               # 知识库内容模型
├── deploy.sh                      # VPS 一键部署脚本
├── ecosystem.config.cjs           # PM2 进程配置
│
├── content/
│   ├── blog/                      # 博客（.md 中文 / .en.md 英文）
│   ├── kb/                        # 知识库文档
│   └── authors/                   # 作者信息
│
├── src/
│   ├── app/
│   │   ├── (site)/                # 主站（首页·博客·标签·归档·友链·关于）
│   │   ├── (app)/                 # 知识库
│   │   ├── (marketing)/           # 营销页
│   │   └── api/                   # API 路由
│   ├── features/
│   │   ├── content/               # 内容渲染（布局·MDX·代码块·工具函数）
│   │   ├── site/                  # 站点通用（导航·页脚·SEO·主题）
│   │   ├── search/                # KBar 搜索
│   │   └── friends/               # 友链
│   ├── kb/                        # 知识库专用组件
│   ├── shared/                    # 共享组件·上下文·Hooks·工具函数
│   └── generated/                 # 自动生成数据
│
├── scripts/build/                 # 构建后处理（RSS·standalone 拷贝·SEO 推送）
└── public/                        # 静态资源·favicon·搜索索引·RSS
```

## 内容约定

| 内容 | 路径 | 命名规则 |
|:-----|:-----|:---------|
| 博客文章 | `content/blog/` | `标题.md` / `标题.en.md` |
| 知识库文档 | `content/kb/` | 按分类建子目录 |
| 作者信息 | `content/authors/` | `default.md` / `default.en.md` |
| 标签 / 分类 | frontmatter | `tags: [...]` · `categories: [...]` |

## 配置

所有站点配置集中在 **`blog.config.ts`**：

站点元信息 · 导航菜单 · 社交链接 · 搜索引擎 · 分析配置 · ICP 备案 · 首页 Hero · 页脚 · 文章列表展示

## 致谢

- [Shiro](https://github.com/innei/Shiro) — 极简个人网站，纸的纯粹与雪的清新
- [blog-v3](https://github.com/L33Z22L11/blog-v3)
- [ThriveX-Blog](https://github.com/LiuYuYang01/ThriveX-Blog)
- [Astro Gyoza](https://github.com/lxchapu/astro-gyoza)

## License

[GPL-3.0](./LICENSE)
