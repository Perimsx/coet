# 💻 源码核心 (Source)

这是项目的核心逻辑所在目录，遵循功能导向（Feature-oriented）的架构模式。

## 📂 结构拆解

- **`app/`**: Next.js 15 App Router。
  - `(admin)/`: 管理后台路由组。
  - `(site)/`: 前台展示页面路由组。
  - `api/`: 后端 API 接口。
- **`features/`**: 业务逻辑层。每个子文件夹代表一个功能领域（如 `search`, `comments`, `admin`），包含该功能特有的组件、逻辑和 API 调用。
- **`config/`**: 全局静态配置。
  - `site.ts`: 站点名称、SEO 默认值。
  - `branding.ts`: 品牌色、Logo 等视觉配置。
- **`server/`**: 服务端基础设施。
  - `db/`: 数据库连接与 Drizzle ORM 配置。
  - `schema/`: 数据库表结构定义。
- **`shared/`**: 跨模块共享的可复用单元，包括底层的 UI 组件库（Radix/Tailwind）。

## 🛠️ 开发规约

- **组件划分**: 业务强相关的放入 `features/`，纯展示性、无业务逻辑的放入 `shared/components/`。
- **路径别名**: 始终使用 `@/` 前缀进行导入，避免深层相对路径。
