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
├── @/                    # 辅助目录：核心组件与 Hooks 的便捷访问入口
├── content/              # 内容层：包含所有 MDX 博客文章、作者信息及项目数据
│   ├── authors/          # 作者元数据 (Markdown)
│   ├── blog/             # 博客文章 (MDX)
│   └── projects/         # 项目/作品展示数据 (JSON)
├── public/               # 静态资源：字体、图片、SVG 图标等
├── scripts/              # 脚本库：数据库迁移、部署脚本及自动化任务
├── src/                  # 核心源码
│   ├── app/              # Next.js 15 App Router：页面路由与布局
│   ├── features/         # 业务功能模块 (管理后台、评论、搜索、SEO 等)
│   ├── config/           # 站点全局配置 (品牌、SEO、功能开关)
│   ├── server/           # 服务端逻辑 (Drizzle Schema、数据库连接)
│   └── shared/           # 共享逻辑 (Hooks、Utils、UI 组件库、全局样式)
├── storage/              # 存储层：存放生产环境数据库 (.db) 与日志
├── contentlayer.config.ts # Contentlayer 配置：定义 MDX 内容模型
├── deploy.sh             # 自动化部署 Shell 脚本
├── ecosystem.config.cjs   # PM2 进程管理配置 (用于生产环境)
├── next.config.js         # Next.js 核心配置 (包含 Image 优化、重定向等)
├── package.json           # 项目清单：依赖管理与运行脚本定义
└── tsconfig.json          # TypeScript 配置与路径别名 (@/*) 定义
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
