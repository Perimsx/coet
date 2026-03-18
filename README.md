# Coet Blog 🚀

[![Next.js 15](https://img.shields.io/badge/Next.js-15-black?logo=next.js)](https://nextjs.org/)
[![Tailwind CSS 4](https://img.shields.io/badge/Tailwind-v4-38B2AC?logo=tailwind-css)](https://tailwindcss.com/)
[![Contentlayer2](https://img.shields.io/badge/Contentlayer-2-yellow)](https://contentlayer.dev/)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](https://opensource.org/licenses/MIT)

Coet Blog 是一个基于 **Next.js 15 (App Router)**、**Contentlayer2** 和 **Tailwind CSS v4** 构建的现代个人博客系统。旨在提供极致的写作与阅读体验，集成了强大的 MDX 支持、丝滑的动画效果以及完善的管理后台。

🔗 **在线演示**: [blog.coet.ink](https://blog.coet.ink)

---

## ✨ 核心特性

- ⚡ **极致性能**: 基于 Next.js 15 App Router，极致的静态生成 (SSG) 与流式渲染 (Streaming)。
- 🎨 **潮流设计**: 使用 **Tailwind CSS v4** + **Radix UI** + **Framer Motion**，支持暗黑模式无缝切换。
- 📝 **全能 MDX**: 基于 Contentlayer2 驱动，支持数学公式 (KaTeX)、代码高亮 (Shiki)、GitHub 风格警告框、目录导航 (TOC) 等。
- 🔍 **高效检索**: 集成 **KBar** (Command+K) 命令交互面板与全文检索。
- 🛠️ **内容管理**: 内置轻量级 **Admin 管理后台**，支持管理评论、友链等动态数据。
- 📊 **数据驱动**: 使用 **Drizzle ORM** + **better-sqlite3**，响应极快且易于自托管。
- 🚀 **一键部署**: 提供自研 `deploy.sh` 脚本与 PM2 配置，支持自动化更新。
- 📈 **SEO 友好**: 自动生成 JSON-LD 结构化数据，内置 IndexNow 和百度主动推送支持。

---

## 🛠️ 技术栈

| 分类 | 关键技术 |
| :--- | :--- |
| **框架** | [Next.js 15](https://nextjs.org/) (App Router), [React 19](https://reactjs.org/) |
| **内容处理** | [Contentlayer2](https://contentlayer.dev/), [MDX](https://mdxjs.com/), [Shiki](https://shiki.matsu.io/) |
| **样式/组件** | [Tailwind CSS v4](https://tailwindcss.com/), [Ant Design 6](https://ant.design/), [Shadcn UI](https://ui.shadcn.com/) |
| **动画** | [Framer Motion](https://motion.dev/) |
| **数据库/ORM** | [Drizzle ORM](https://orm.drizzle.team/), [better-sqlite3](https://github.com/WiseLibs/better-sqlite3) |
| **图标** | [Lucide](https://lucide.dev/), [Ant Design Icons](https://ant.design/components/icon) |
| **其他** | [Zustand](https://github.com/pmndrs/zustand), [React Hook Form](https://react-hook-form.com/), [Zod](https://zod.dev/) |

---

## 📂 目录结构

```text
.
├── content/              # MDX 博客内容与作者信息
├── scripts/              # 构建、迁移与种子数据脚本
├── src/
│   ├── app/              # Next.js App Router 路由
│   ├── features/         # 核心业务模块划分 (领域驱动)
│   │   ├── admin/        # 管理后台逻辑
│   │   ├── site/         # 站点公共组件与文案
│   │   ├── content/      # 内容层封装
│   │   └── ...           # 搜索、评论、SEO 等模块
│   ├── config/           # 站点全局配置 (site.ts, branding.ts)
│   ├── server/           # 服务端 Drizzle Schema 与数据库逻辑
│   └── shared/           # 通用 Hooks、Utils 与样式
├── public/               # 静态资源
└── contentlayer.config.ts # Contentlayer 核心配置
```

---

## 🚀 快速开始

### 1. 克隆并安装依赖

```bash
git clone https://github.com/kerntau/Coet.git
cd Coet
pnpm install
```

### 2. 环境配置

复制 `.env.example` (如果有) 并根据需要填写：

```bash
# 核心配置项
DATABASE_URL=./storage/data.db
NEXTAUTH_SECRET=your_secret
# ... (其他三方服务 ID)
```

### 3. 初始化数据库

```bash
pnpm db:push         # 同步表结构
pnpm db:seed-admin   # 创建初始管理员账号
pnpm db:seed-friends # 初始化默认友链
```

### 4. 启动开发模式

```bash
pnpm dev
```

打开 [http://localhost:3000](http://localhost:3000) 即可预览。

---

## 📦 部署指南

### 使用 PM2 部署 (推荐)

项目已内置 PM2 配置文件 `ecosystem.config.cjs`：

```bash
pnpm build
pm2 start ecosystem.config.cjs
```

### 自动化部署

您也可以修改并使用 `deploy.sh` 进行自动化部署：

```bash
chmod +x deploy.sh
./deploy.sh
```

---

## ✨ 致谢

- 感谢 [tailwind-nextjs-starter-blog](https://github.com/timlrx/tailwind-nextjs-starter-blog) 提供的初期灵感。
- 感谢 [Pliny](https://github.com/timlrx/pliny) 强大的博文管理能力封装。

---

## 📄 许可证

本项目基于 [MIT License](LICENSE) 开源。
