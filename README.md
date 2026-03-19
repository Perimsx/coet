# Coet

Coet 是一套基于 Next.js 15 的个人博客与后台管理系统，当前站点标题为 `Chen Guitao's Blog`。它的核心目标很明确：

- 前台展示和后台运营放在同一套工程里统一维护。
- 文章和关于页继续使用 Markdown/MDX 文件存储，不把内容改造成数据库文章系统。
- 评论、建议、友链、登录会话、站点设置等运营数据使用 SQLite 管理。
- 保持可上线、可维护、可继续迭代，而不是堆功能页面。

## 系统定位

这不是单纯的博客主题，也不是只管内容的静态站点。

它包含两部分：

- 前台站点：首页、博客列表、文章详情、标签、分类、归档、友链、关于页、搜索与建议入口。
- 后台系统：登录鉴权、仪表盘、文章管理、沉浸式编辑器、评论审核、建议工单、友链管理、关于页编辑、站点设置。

## 数据设计

项目故意采用“内容文件 + 运营数据 SQLite”的分层结构：

- 文章内容：保存在 `content/blog` 下的 Markdown/MDX 文件。
- 作者与关于页内容：保存在 `content/authors` 下的文件。
- 后台登录、评论、建议、友链、邮件配置、站点设置、分类配置等：保存在 SQLite 和 `storage/settings` 中。

当前约束如下：

- 文章不入库。
- 关于页不入库。
- 删除是硬删除，不带回收站。
- 后台配置优先从运行时设置读取，缺失时再回退到代码默认值。

## 当前功能

### 前台

- 首页 Hero 主视觉与个人信息展示
- 博客列表、分页、分类、标签、归档
- 文章详情、目录、代码高亮、SEO 元信息
- 关于页与友链页
- 全站搜索
- 建议反馈入口
- RSS、`robots.txt`、`sitemap.xml`、`manifest.webmanifest`

### 后台

- 隐藏入口登录与后台会话管理
- 仪表盘指标、趋势、快捷入口、系统状态
- 文章列表筛选、保存视图、批量操作
- 文件型文章编辑器，支持元数据侧栏与本地自动保存
- 评论线程审核、回复、删除、上下文查看
- 建议工单流转与回复模板
- 友链录入、编辑、健康巡检、站点元信息抓取
- 关于页资料、社交项、技术栈和正文编辑
- 站点设置、SEO 设置、SMTP 设置、安全设置

## 技术栈

- Next.js 15 App Router
- React 19
- Tailwind CSS 4
- SQLite
- `better-sqlite3`
- Drizzle ORM
- Contentlayer 2
- PM2
- Nodemailer
- Zustand

## 目录结构

```text
content/                 内容源文件
  authors/               作者与关于页内容
  blog/                  文章 Markdown/MDX
public/                  静态资源与构建产物
scripts/                 初始化、SEO、构建辅助脚本
src/app/                 路由与页面
src/features/            业务模块
src/server/              SQLite、邮件、设置等服务层
storage/
  db/                    SQLite 数据库
  logs/                  运行日志
  settings/              运行时 JSON 配置
```

## 后台与认证说明

后台登录不是直接暴露 `/admin/login` 给外部使用，而是采用“外部隐藏入口 + 内部登录页”的方式：

- 外部隐藏入口：由 `ADMIN_LOGIN_ENTRY` 控制，默认是 `/18671188011`
- 内部登录页：`/admin/login`
- 生产环境下，直接访问 `/admin/login` 会被拦截
- 访问外部隐藏入口时，中间件会重写到 `/admin/login?__entry=1`

当前登录逻辑要点：

- 使用 HttpOnly Cookie 维护后台会话
- 已接入 Access Token / Refresh Token 刷新链路
- 登录有失败限流
- 无用户名模式下，会按 SQLite 中现有管理员账号匹配密码，而不是固定写死某个用户名

管理员初始化相关：

- 默认管理员用户名来自 `ADMIN_BOOTSTRAP_USERNAME`，默认值为 `admin`
- 初始化脚本会使用 `ADMIN_PASSWORD`，若未提供则回退到 `ADMIN_BOOTSTRAP_PASSWORD`

## 邮件通知什么时候会触发

项目当前会在以下场景尝试发邮件：

- 在后台测试 SMTP 配置时
- 站长回复评论时，给被回复访客发送通知
- 在后台回复建议时，给提交建议的访客发送通知
- 收到新的友链申请时，给站长通知地址发送邮件
- 友链申请通过时，给申请者发送通知
- 友链资料更新时，给申请者发送通知
- 友链被删除时，给申请者发送通知

注意：

- 只有在 SMTP 已启用且配置完整时才会实际发送
- SMTP 缺失或不完整时，系统会跳过发送，不会阻塞主流程

## 环境要求

- Node.js 20 或更高版本
- pnpm 10 或更高版本
- 可写入 SQLite 文件的部署环境
- 生产部署需要 `pm2`

## 环境变量

下面是一份适合当前项目的最小示例：

```bash
# 站点信息
NEXT_PUBLIC_SITE_TITLE="Chen Guitao's Blog"
NEXT_PUBLIC_SITE_AUTHOR="Chen Guitao"
NEXT_PUBLIC_SITE_DESCRIPTION="Chen Guitao's tech notes and project records"
NEXT_PUBLIC_SITE_URL="https://chenguitao.com"
NEXT_PUBLIC_SITE_HEADER_TITLE="Chen Guitao's Blog"

# 社交信息
NEXT_PUBLIC_SITE_EMAIL="kerntau@outlook.com"
NEXT_PUBLIC_GITHUB_URL="https://github.com/kerntau"
NEXT_PUBLIC_X_URL="https://x.com/kerntau"
NEXT_PUBLIC_YUQUE_URL="https://www.yuque.com/coet"
NEXT_PUBLIC_SITE_REPO="https://github.com/kerntau/Coet"

# 后台与运行时
DATABASE_URL="./storage/db/blog.sqlite"
ENABLE_ADMIN="true"
ADMIN_LOGIN_ENTRY="18671188011"
ADMIN_SESSION_SECRET="请替换为足够长的随机字符串"
ADMIN_PASSWORD="首次初始化管理员时使用"
ADMIN_BOOTSTRAP_USERNAME="admin"
ADMIN_BOOTSTRAP_PASSWORD="change-me-now"
ADMIN_BYPASS_LOGIN="0"
ADMIN_ALLOWED_ORIGINS=""

# SEO
SITE_URL="https://chenguitao.com"
GOOGLE_SEARCH_CONSOLE=""
BAIDU_PUSH_TOKEN=""
INDEXNOW_KEY=""

# 可选统计
NEXT_UMAMI_ID=""
```

推荐说明：

- `DATABASE_URL` 指向 SQLite 文件路径。
- `ADMIN_LOGIN_ENTRY` 决定外部隐藏后台入口。
- `ADMIN_SESSION_SECRET` 必须自行更换，不能用默认值上线。
- `SITE_URL` 和 `NEXT_PUBLIC_SITE_URL` 建议保持一致。

## 本地开发

安装依赖：

```bash
pnpm install
```

首次初始化管理员：

```bash
pnpm db:seed-admin
```

如需初始化友链示例数据：

```bash
pnpm db:seed-friends
```

启动开发环境：

```bash
pnpm dev
```

常用检查：

```bash
pnpm typecheck
pnpm lint
pnpm build
```

## 常用脚本

```bash
pnpm dev             # 本地开发
pnpm dev:clean       # 清理 .next 和 .contentlayer 后启动
pnpm build           # 生产构建，并执行 postbuild
pnpm start           # 生产方式启动
pnpm serve           # 等同于 next start
pnpm analyze         # 构建体积分析
pnpm lint            # ESLint 自动修复
pnpm typecheck       # Contentlayer + TypeScript 检查
pnpm db:generate     # 生成 Drizzle 变更
pnpm db:migrate      # 执行迁移
pnpm db:push         # 推送 schema 到 SQLite
pnpm db:studio       # 打开 Drizzle Studio
pnpm db:seed-admin   # 初始化管理员
pnpm db:seed-friends # 初始化友链数据
```

## SEO 与构建产物

执行：

```bash
pnpm build
```

构建完成后会额外执行 `scripts/build/postbuild.ts`，当前会处理这些内容：

- 生成 RSS
- 生成搜索索引
- 生成站点图标相关输出
- 在配置了 `INDEXNOW_KEY` 时生成对应验证文件

项目还提供了手动推送收录脚本：

```bash
pnpm exec tsx scripts/seo-push.ts
```

该脚本会整理这些 URL 并尝试提交：

- 首页
- 博客列表
- 归档页
- 标签页
- 关于页
- 友链页
- 所有已发布文章
- 标签与分类分页路径

如果未配置 `BAIDU_PUSH_TOKEN` 或 `INDEXNOW_KEY`，对应平台会自动跳过。

## 生产部署

项目内置了 `deploy.sh`，用于服务器上直接部署当前仓库。

部署前提：

- 服务器已经拉取本仓库
- 已安装 `node`、`pnpm`、`pm2`
- 可执行 `bash deploy.sh`

执行方式：

```bash
bash deploy.sh
```

脚本会依次完成：

- 检查 Node、pnpm、PM2 是否存在
- 在工作区干净时执行 `git pull --ff-only`
- 安装依赖
- 检测 Drizzle 配置并执行 `pnpm db:push --accept-data-loss`
- 构建 Next.js standalone 输出
- 复制 `public` 与 `.next/static` 到 `.next/standalone`
- 通过 PM2 启动或重启服务
- 对本地健康地址做检查

常见可选参数：

```bash
APP_NAME="coet-blog" PORT="1021" NODE_BUILD_MEMORY="1024" bash deploy.sh
```

当前 PM2 配置文件为 `ecosystem.config.cjs`，默认：

- 应用名：`coet-blog`
- 启动文件：`./.next/standalone/server.js`
- 端口：`1021`
- 运行模式：单实例 fork

日志位置：

- 部署日志：`storage/logs/deploy.log`
- PM2 标准输出：`storage/logs/pm2-out.log`
- PM2 错误输出：`storage/logs/pm2-error.log`

## 继续迭代时的约定

为了避免系统再次变成“功能堆叠页”，后续维护建议继续遵守这些约定：

- 文章和关于页仍然走文件存储，不引入文章数据库化改造
- 后台业务数据继续留在 SQLite
- UI 状态和业务数据读取分层处理，不把所有状态都塞到客户端
- 页面文案优先走后台设置或集中配置，不新增散落硬编码
- 删改类操作保持强确认与明确反馈

## 注意事项

- `storage/settings/site-settings.json`、`mail-settings.json`、`categories.json` 是运行时配置文件。
- 生产环境请务必替换后台会话密钥与管理员初始密码。
- Windows 下 Contentlayer 可能会出现提示警告，但不一定会阻断构建。
- 如果邮件没发出，先检查 SMTP 是否启用、主机端口是否正确、授权码是否有效。
- 如果后台入口访问不到，先确认 `ADMIN_LOGIN_ENTRY` 和反向代理转发配置是否一致。

## License

当前仓库未单独声明开源许可证，如需公开发布，请自行补充。
