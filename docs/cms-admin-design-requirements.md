# 序栈 CMS 后台管理系统设计需求

## 1. 项目定位

将现有序栈技术博客升级为单用户 CMS。站长本人是唯一管理员，后台负责文章、页面、分类、标签、友链、评论、站点配置、SEO、系统更新和数据维护；前台继续使用当前 Next.js 站点，后台界面全面采用 Arco Design Pro，后端独立使用 Go，数据使用 SQLite，图片暂时只保存外部图床链接。

## 2. 设计原则

- 单用户优先：不实现团队成员、角色、组织和多租户系统，仅保留管理员登录、会话、改密和安全审计。
- 前后端解耦：Next.js 只负责前台展示和后台 UI，Go 负责业务 API、鉴权、数据库、系统任务和 Git 更新。
- 内容优先：文章编辑、预览、保存和发布是最高频任务，入口和操作路径必须短。
- API 统一：所有接口使用 `/api/v1` 前缀、统一响应结构、统一错误码、统一分页和请求追踪 ID。
- 数据库为 CMS 内容唯一来源：代码通过 Git 更新，文章和站点数据由 SQLite 管理，不能因为拉取代码覆盖后台内容。
- 渐进增强：保留现有 Markdown/MDX 渲染能力，先导入现有内容，再逐步替换 Contentlayer 的构建期读取。
- 安全优先：后台禁止任意命令执行、任意 Git 地址、任意文件路径和未经校验的外部 URL。

## 3. 总体技术架构

```text
浏览器
  ├── Next.js 前台站点
  └── Next.js + Arco Design Pro 管理后台
          │ HTTPS / HttpOnly Cookie
          ▼
      Go API 服务 :8080
          ├── SQLite
          ├── Markdown/MDX 内容转换
          ├── Git 更新任务
          ├── SEO 与缓存刷新任务
          └── 系统日志与备份
```

### 3.1 前端

- Next.js 继续承载当前博客前台。
- 管理后台使用独立的 `/admin` 路由组。
- 后台统一使用 `@arco-design/web-react` 和 Arco Design Pro 的 Layout、ProTable、ProForm、PageHeader、Descriptions、Notification、Modal、Drawer、Alert、Result、Skeleton 等组件。
- 管理后台不混用当前前台的 Radix/shadcn 风格组件；现有前台组件保持不变。

### 3.2 后端

- Go 作为唯一业务后端。
- 推荐使用标准 `net/http` + `chi` 或 Echo/Gin；路由、Handler、Service、Repository 分层。
- SQLite 驱动优先使用无需 CGO 的 `modernc.org/sqlite`。
- 所有写操作通过 Service 层完成，Handler 不直接操作数据库。
- 长任务使用后台 Job 机制，接口立即返回 `jobId`，前端通过轮询获取进度。

### 3.3 数据与文件

- 数据库文件：`storage/db/blog.sqlite`。
- 数据库开启 WAL、外键约束和 busy timeout。
- 本地文件仅用于 SQLite、备份、日志和必要的运行文件。
- 图片不做上传存储，文章中直接保存图床 URL；后台提供 URL 校验、预览和域名白名单。
- 默认不接入对象存储、不建立媒体上传服务。

## 4. 后台信息架构

```text
/admin
├── /login                         登录
├── /dashboard                     仪表盘
├── /content/posts                 文章管理
├── /content/posts/new             新建文章
├── /content/posts/:id/edit        编辑文章
├── /content/pages                 独立页面
├── /content/categories            分类
├── /content/tags                  标签
├── /engagement/comments           评论审核
├── /engagement/suggestions        反馈建议
├── /site/friends                  友链
├── /site/settings                 站点设置
├── /site/navigation               导航菜单
├── /site/seo                      SEO 设置
├── /system/git                    代码更新
├── /system/jobs                   后台任务
├── /system/backups                SQLite 备份恢复
├── /system/logs                   操作日志
└── /system/health                 系统状态
```

左侧菜单分为“内容管理、互动管理、站点管理、系统管理”四组；顶部提供面包屑、全局搜索、主题切换、系统状态、更新提示和退出登录。

## 5. 功能需求

### 5.1 登录与安全

- 管理员登录、退出、会话续期和主动注销所有会话。
- 修改管理员密码；密码必须使用强哈希保存，禁止明文写入 SQLite。
- HttpOnly、Secure、SameSite Cookie 会话。
- 登录失败次数限制、请求限流、CSRF 防护和基础安全响应头。
- 单用户不实现角色权限，但所有管理接口仍必须经过管理员会话校验。
- 记录登录、退出、改密、删除、发布、恢复、系统更新和备份操作。

### 5.2 仪表盘

- 已发布文章、草稿、待审核评论、友链数量、近 7/30 天访问量。
- 最近编辑文章、最近发布文章、最近系统任务。
- 当前 Git 分支、当前 Commit、最近一次更新状态。
- SQLite 文件大小、最后备份时间、服务健康状态。
- 所有指标必须有加载、空数据、失败和重试状态。

### 5.3 文章管理

- 文章列表支持关键词、状态、分类、标签、语言、时间范围筛选。
- 字段包括标题、Slug、摘要、正文、封面 URL、分类、标签、作者、语言、发布时间、最后修改时间、SEO 信息、草稿状态。
- Markdown/MDX 编辑器，支持代码块、表格、引用、图片 URL、链接和现有自定义指令。
- 编辑区支持自动保存草稿、手动保存、实时预览和前台预览。
- 文章状态：草稿、已发布、已下线、回收站。
- 支持发布、取消发布、定时发布、批量删除、批量恢复和批量修改分类/标签。
- 发布前校验标题、Slug、正文、语言和重复 Slug。
- 支持文章版本列表、版本差异查看和版本恢复。
- 删除默认进入回收站，永久删除必须二次确认。
- 发布后触发前台缓存刷新、Sitemap 更新和可选搜索引擎推送。

### 5.4 独立页面

- 管理关于页、隐私政策、版权说明等非文章页面。
- 支持标题、Slug、正文、SEO 信息、发布状态和更新时间。
- 页面使用与文章相同的 Markdown/MDX 渲染管线。

### 5.5 分类与标签

- 分类支持名称、Slug、中英文显示名称、描述、排序和启用状态。
- 标签支持名称、Slug、描述和关联文章数量。
- 删除分类前检查文章引用，提供迁移到其他分类的选项。
- Slug 生成、重复校验和 URL 安全校验由后端完成。

### 5.6 评论与反馈

- 评论列表支持待审核、已发布、已隐藏、垃圾评论筛选。
- 支持审核通过、隐藏、删除、批量处理和查看上下文。
- 反馈建议支持查看、标记已读、归档和删除。
- 所有删除操作提供撤销窗口或回收站策略。

### 5.7 友链管理

- 友链名称、URL、头像 URL、描述、分组、排序和启用状态。
- 支持 URL 连通性检查和元信息预览，但检查任务必须异步执行。
- 保留现有 `content/friends.json` 的导入能力，导入后以 SQLite 为主。

### 5.8 站点设置

- 基础信息：站点标题、副标题、描述、域名、作者、邮箱、Logo、社交链接。
- 首页展示：欢迎语、头像、角色、Hero 文案、最新文章数量。
- 导航菜单：新增、编辑、排序、隐藏和下拉子菜单。
- 页脚：版权、备案、公安备案、运行时间、技术栈信息。
- 主题：亮色、暗色、跟随系统；后台默认使用 Arco Pro 的高可读工作台主题。
- 国际化：中文/英文 UI 文案和文章语言关联。
- 所有设置保存前校验，保存后显示明确成功或失败反馈。

### 5.9 SEO

- Title、Description、Keywords、Canonical URL、Open Graph 图片 URL。
- Sitemap、Robots、RSS、JSON-LD 开关和状态。
- IndexNow、百度推送等密钥只从环境变量或受保护配置读取，页面不回显完整密钥。
- 支持手动重新生成 Sitemap、刷新 SEO 缓存和查看最近推送结果。

### 5.10 系统更新

- 展示当前仓库、分支、Commit、版本时间和工作区状态。
- 检查远程仓库是否有新提交。
- 查看待更新 Commit、提交人、时间和变更摘要。
- 执行“拉取更新”任务：固定远程仓库、固定分支、`fetch`、`pull --ff-only`、依赖检查、数据库迁移、前端构建、健康检查和服务重启。
- 支持查看任务实时日志、失败原因、重试和回滚到上一个稳定 Commit。
- Git 认证使用服务器环境变量中的 Deploy Key 或 Access Token，禁止从页面输入任意仓库地址、分支或命令。
- 更新过程加全局锁，禁止同时执行多个更新、备份或迁移任务。
- 代码更新不触碰 SQLite 内容数据；数据库迁移必须有版本号和失败保护。

### 5.11 备份、日志与健康检查

- 手动和定时备份 SQLite 数据库。
- 展示备份时间、文件大小、校验结果和保留数量。
- 支持从指定备份恢复，恢复前自动创建当前数据库快照。
- 操作日志支持时间、操作类型、结果、耗时、请求 ID 和错误详情筛选。
- 健康检查包括 Go API、SQLite、前台站点、Git 仓库、磁盘空间和最近构建状态。

## 6. Go API 设计规范

### 6.1 基础规则

- API 前缀统一为 `/api/v1`。
- 管理接口统一使用 `/api/v1/admin/...`。
- 公开前台接口统一使用 `/api/v1/public/...`。
- 系统内部回调统一使用 `/api/v1/internal/...`，必须校验内部密钥。
- JSON 字段统一使用 `camelCase`。
- 时间统一使用 ISO 8601 UTC，前端按站点时区显示。
- 每个请求生成或透传 `X-Request-ID`。
- 列表接口统一使用 `page`、`pageSize`、`sortBy`、`sortOrder`、`keyword`。

### 6.2 成功响应

```json
{
  "code": 0,
  "message": "ok",
  "data": {},
  "requestId": "req_xxx"
}
```

分页响应：

```json
{
  "code": 0,
  "message": "ok",
  "data": {
    "items": [],
    "page": 1,
    "pageSize": 20,
    "total": 0
  },
  "requestId": "req_xxx"
}
```

### 6.3 错误响应

```json
{
  "code": 40001,
  "message": "文章标题不能为空",
  "details": { "field": "title" },
  "requestId": "req_xxx"
}
```

错误码按模块划分：`401xx` 认证、`403xx` 安全、`404xx` 资源、`400xx` 参数、`409xx` 冲突、`422xx` 业务校验、`500xx` 系统错误。

### 6.4 接口清单

#### 认证

```text
POST /api/v1/auth/login
POST /api/v1/auth/logout
GET  /api/v1/auth/session
POST /api/v1/auth/logout-all
POST /api/v1/auth/change-password
```

#### 仪表盘

```text
GET /api/v1/admin/dashboard/summary
GET /api/v1/admin/dashboard/recent-activities
GET /api/v1/admin/dashboard/health
```

#### 文章与页面

```text
GET    /api/v1/admin/posts
POST   /api/v1/admin/posts
GET    /api/v1/admin/posts/:id
PATCH  /api/v1/admin/posts/:id
DELETE /api/v1/admin/posts/:id
POST   /api/v1/admin/posts/:id/publish
POST   /api/v1/admin/posts/:id/unpublish
POST   /api/v1/admin/posts/:id/restore
GET    /api/v1/admin/posts/:id/revisions
GET    /api/v1/admin/posts/:id/revisions/:revisionId
POST   /api/v1/admin/posts/:id/revisions/:revisionId/restore
POST   /api/v1/admin/posts/:id/preview
GET    /api/v1/admin/pages
POST   /api/v1/admin/pages
GET    /api/v1/admin/pages/:id
PATCH  /api/v1/admin/pages/:id
DELETE /api/v1/admin/pages/:id
```

#### 分类、标签、友链、评论、反馈

```text
GET|POST|PATCH|DELETE /api/v1/admin/categories
GET|POST|PATCH|DELETE /api/v1/admin/tags
GET|POST|PATCH|DELETE /api/v1/admin/friends
POST /api/v1/admin/friends/:id/check
GET|POST|PATCH|DELETE /api/v1/admin/comments
POST /api/v1/admin/comments/batch-action
GET|PATCH|DELETE /api/v1/admin/suggestions
```

#### 站点与 SEO

```text
GET   /api/v1/admin/settings
PATCH /api/v1/admin/settings
GET   /api/v1/admin/navigation
PUT   /api/v1/admin/navigation
GET   /api/v1/admin/seo
PATCH /api/v1/admin/seo
POST  /api/v1/admin/seo/rebuild
POST  /api/v1/admin/seo/push
```

#### 系统任务、Git、备份

```text
GET  /api/v1/admin/system/git/status
POST /api/v1/admin/system/git/check
POST /api/v1/admin/system/git/update
POST /api/v1/admin/system/git/rollback
GET  /api/v1/admin/system/jobs
GET  /api/v1/admin/system/jobs/:id
POST /api/v1/admin/system/jobs/:id/retry
GET  /api/v1/admin/system/backups
POST /api/v1/admin/system/backups
POST /api/v1/admin/system/backups/:id/restore
GET  /api/v1/admin/system/logs
GET  /api/v1/admin/system/health
POST /api/v1/admin/system/cache/revalidate
```

## 7. Arco Design Pro 界面规范

### 7.1 全局布局

- 使用 ProLayout 作为唯一后台壳层。
- 左侧导航宽度约 240px，可折叠；移动端改为 Drawer。
- 顶部固定 Header，包含面包屑、全局搜索、主题切换、系统更新入口、管理员菜单。
- 内容区使用 PageHeader + 内容卡片，桌面最大宽度约 1440px。
- 页面间使用 8px 间距体系，卡片内边距统一，避免每页自定义间距。
- 所有图标使用 Arco 图标或统一 SVG 图标，不使用 Emoji。

### 7.2 视觉方向

- 风格：技术编辑工作台、克制、数据密集、内容优先。
- 主色：Arco 蓝色语义色；危险操作使用红色，警告使用橙色，成功使用绿色。
- 默认亮色主题，支持暗色主题；两套主题都必须满足文字、边框、状态的可读性。
- 标题和正文使用系统无衬线字体；代码、Slug、Commit、日志使用等宽字体。
- 不使用大面积渐变、玻璃拟态、强阴影和装饰性动效。

### 7.3 页面组件映射

| 页面      | Arco/Pro 组件                                       | 关键交互                         |
| --------- | --------------------------------------------------- | -------------------------------- |
| 仪表盘    | Card、Statistic、Grid、Progress、Timeline           | 指标加载、失败重试、最近活动     |
| 文章列表  | ProTable、Form、Tag、Dropdown、Popconfirm           | 筛选、批量操作、分页、状态标签   |
| 文章编辑  | Form、Input、Select、Upload/链接输入、Tabs、Drawer  | 自动保存、预览、发布、离开确认   |
| 文章预览  | Modal/Drawer、Typography、Skeleton                  | 桌面双栏、移动端单栏             |
| 分类/标签 | ProTable、Modal、Form                               | Slug 校验、引用检查              |
| 设置      | Tabs、Form、Card、Alert                             | 分组保存、字段级错误提示         |
| Git 更新  | Steps、Card、Progress、Alert、Terminal 风格日志面板 | 检查、更新、日志、失败重试、回滚 |
| 备份恢复  | ProTable、Modal、Result、Popconfirm                 | 创建快照、恢复前确认             |
| 系统日志  | ProTable、Drawer、Descriptions                      | 请求 ID、错误详情、复制日志      |

### 7.4 交互状态

- 所有异步按钮提交后立即进入 loading，禁止重复点击。
- 超过 300ms 的请求显示 loading；超过 1 秒使用 Skeleton 或 Progress。
- 成功操作使用 Notification/Message；危险操作使用 Modal/Popconfirm。
- 表单错误显示在对应字段下方，并在顶部提供错误摘要。
- 文章编辑离开页面时检测未保存变更，必须提供保存、放弃、取消三个选项。
- 空列表必须提供说明和主操作，例如“还没有文章，创建第一篇”。
- 所有表格移动端采用横向滚动或卡片布局，不允许页面整体横向溢出。
- 键盘可操作，焦点状态清晰，图标按钮必须有 Tooltip 和 aria-label。

## 8. 数据表设计

核心表：`admin_sessions`、`posts`、`post_revisions`、`pages`、`categories`、`tags`、`post_tags`、`comments`、`suggestions`、`friend_links`、`site_settings`、`navigation_items`、`system_jobs`、`git_deployments`、`backups`、`audit_logs`。

`posts` 至少包含：`id`、`title`、`slug`、`summary`、`content`、`language`、`status`、`cover_url`、`published_at`、`scheduled_at`、`created_at`、`updated_at`、`deleted_at`；`content` 保存 Markdown/MDX 原文，前台继续使用统一渲染管线。

## 9. 内容迁移与前台改造

- 编写一次性导入程序，将当前 `content/blog/*.md`、作者、友链和站点设置导入 SQLite。
- 保留 `ContentlayerSource` 作为迁移和静态导出兼容层。
- 新增 `DatabaseContentSource`，前台通过 Go 公开接口读取已发布内容。
- 后台保存文章时只更新 SQLite，不修改 Git 工作区。
- 发布文章后由 Go 调用 Next.js 的受保护 Revalidate Webhook，刷新对应文章、首页、归档、分类、标签和 Sitemap 缓存。
- Git 拉取只更新程序代码和构建产物，不覆盖数据库内容。

## 10. 部署要求

```text
Nginx/Caddy
  ├── /       → Next.js :3000
  └── /api/   → Go API :8080
```

- 推荐服务器：2 核 4G、40GB SSD、Ubuntu 22.04/24.04。
- Go 和 Next.js 使用独立进程或 Docker Compose 管理。
- SQLite、备份和日志目录必须持久化挂载。
- Git 更新、构建、迁移和重启任务必须在后台 Job 中执行，不能阻塞 HTTP 请求。
- 生产环境关闭调试日志，所有密钥放环境变量，不写入前端包和普通日志。

## 11. 第一阶段交付范围

第一阶段只实现：Go API 骨架、SQLite 初始化和迁移、单用户登录、后台 ProLayout、仪表盘、文章列表、新建/编辑文章、草稿保存、发布/下线、分类、标签、站点设置、系统健康检查、Git 更新任务和操作日志。评论、反馈、友链、SEO 推送、备份恢复、版本回滚和统计作为第二阶段接入。

## 12. 验收标准

- 所有后台接口均以 `/api/v1` 开头，且响应结构、错误码、分页、鉴权方式统一。
- 未登录不能访问任何后台页面和管理接口。
- 文章编辑、预览、保存、发布、下线和恢复流程可闭环完成。
- Git 更新支持检查、日志、失败提示、重试和回滚，且不能覆盖 SQLite 内容。
- 后台所有页面使用 Arco Design Pro 组件，不出现两套视觉体系混用。
- 375px、768px、1024px、1440px 宽度下均可使用；表格不造成页面级横向滚动。
- 所有破坏性操作有确认、loading、成功/失败反馈和审计记录。
- SQLite 可备份、恢复，恢复前自动生成当前数据库快照。
- 文章发布后前台缓存能被刷新，首页、文章页、归档、分类、标签和 Sitemap 数据一致。
