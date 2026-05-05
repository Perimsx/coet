# 序栈 (kerntau) | 数字化个人品牌工作站

> **寻一处理性的归栈，留一段温柔的时光。**
> 
> 这是一个基于 **Next.js 15** 构建的沉浸式个人空间，旨在通过现代化的工程实践，将纯粹的阅读体验与深度的数字化管理完美融合。

---

## 🏛️ 灵感与致谢 (Credits & Inspirations)

“序栈”的诞生并非闭门造车，其视觉语言与工程逻辑深受以下优秀开源项目的启发，特此鸣谢：

-   **[blog-v3 (Nuxt)](https://github.com/L33Z22L11/blog-v3)**：借鉴了其极其严谨的内容建模与自动化工程流转思路。
-   **[ThriveX (Vue)](https://github.com/LiuYuYang01/ThriveX-Blog)**：吸纳了其极具冲击力的沉浸式 Hero Banner 视觉设计与动效美学。
-   **[Astro Gyoza](https://github.com/lxchapu/astro-gyoza)**：学习了其极简主义的排版布局与内容呈现哲学。

本项目在 Next.js 生态下对上述灵感进行了二次重构与演进，实现了更轻量、更模块化的全栈体验。

---

## ✨ 核心亮点

-   **📽️ 沉浸式视觉管线**：复刻 ThriveX 质感，通过 `backdrop-blur` 与动态遮罩实现 Banner 与内容区的无缝融合。
-   **🧪 内容即代码**：基于 `Contentlayer 2` 驱动的 MDX 引擎，支持丰富的自定义指令与高度灵活的 Slug 映射。
-   **🏗️ 模块化架构 (Feature-based)**：核心业务按 Feature 拆分，逻辑高度内聚，拒绝臃肿的扁平化目录。
-   **🎛️ 无代码后台**：内置品牌化 Admin 控制台，支持配置一键 JSON 导入/导出，数据备份如丝般顺滑。
-   **🛰️ 极致 SEO 与语义化**：全站 RSC 架构，内置自动化的 JSON-LD 生成与高性能本地搜索。

## 🛠️ 技术矩阵

-   **Core**: Next.js 15 (App Router)
-   **Engine**: Contentlayer 2 + MDX
-   **Styling**: Tailwind CSS 4 + Lucide
-   **Storage**: SQLite + Drizzle ORM
-   **DX**: TypeScript + pnpm

## 📂 架构快照

```text
.
├── blog.config.ts          # ⚙️ 全站单源配置 (SSOT)
├── content/                # 📝 MDX 内容资产
├── src/
│   ├── features/           # 📦 业务能力域 (Admin/Content/Site)
│   ├── server/             # ⚙️ 数据持久化逻辑
│   └── shared/             # 🧩 共享支撑基建
└── storage/                # 💾 运行时持久化数据
```

## 🚀 极速启动

```bash
pnpm install
pnpm dev
```

---

**序栈 - 汲百家之长，序个人之志。**
