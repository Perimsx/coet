# Coet Blog

基于 Next.js App Router 的个人博客系统，包含前台展示与后台管理两套界面。前台负责内容展示与阅读体验，后台用于内容与运营数据管理，前台代码保持只读保护。 
## 架构与分层
前台展示层位于 `src/app` 中除 `/admin` 外的路由与页面；后台管理层位于 `src/app/admin` 与 `src/features/admin`；业务模块集中在 `src/features`；服务端与数据层位于 `src/server` 与 `storage`；内容层位于 `content`。 
## 管理后台 UI 规范
F 型动线、左侧导航固定、核心 KPI 与极简趋势图；黑白灰为主并统一 Ant Design 组件尺寸；侧边栏多级折叠与面包屑；表格固定表头、分页、多条件筛选与批量操作；长表单拆分 Tabs；全局 Toast 与 Skeleton，删除等高危操作需要二次确认并输入资源名称。 
## 安全与防御
关键写入使用 Zod 校验；保存前执行 XSS 消毒；后台独立会话密钥并在生产环境使用安全 Cookie；所有 server actions 返回明确错误并在后台提示。 
## 环境变量

```bash
# 路径与静态资源
BASE_PATH=

# 数据库与管理员
DATABASE_URL=./storage/db/blog.sqlite
ADMIN_PASSWORD=change-me

# 后台会话
ADMIN_SESSION_SECRET=change-this-admin-session-secret
ADMIN_BYPASS_LOGIN=0

# 统计与站点验证（可选）
NEXT_UMAMI_ID=
GOOGLE_SEARCH_CONSOLE=

# 图片代理（可选，逗号分隔域名）
IMAGE_PROXY_DOMAINS=
```

## 本地运行

```bash
pnpm install
pnpm db:push
pnpm db:seed-admin
pnpm dev
```

## 质量检查

```bash
pnpm lint
pnpm typecheck
```
