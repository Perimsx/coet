---
title: "Coet Personal Workstation: Full-Stack Architecture Design and Engineering Specification White Paper"
url: "en/coet-architecture"
date: '2026-03-20'
lastmod: '2026-03-20T11:30:00+08:00'
draft: false
authors:
  - default
tags:
  - Full stack architecture
  - Engineering
  - Next.js
  - MDX
images: ["https://images.unsplash.com/photo-1451187580459-43490279c0fa?auto=formatimages: ["https://images.unsplash.com/photo-1451187580459-43490279c0fa?auto=format&fit=crop&w=1200&q=80"]fit=cropimages: ["https://images.unsplash.com/photo-1451187580459-43490279c0fa?auto=format&fit=crop&w=1200&q=80"]w=1200images: ["https://images.unsplash.com/photo-1451187580459-43490279c0fa?auto=format&fit=crop&w=1200&q=80"]q=80"]
categories:
  - project development
summary: >
  From content modeling, rendering pipeline, background control, deployment links to operation and maintenance strategies, the system dissects the architectural boundaries, engineering specifications and evolution paths of Coet personal workstations, and provides a set of engineering blueprints suitable for the long-term evolution of personal sites.
---

# Coet Personal Workstation: Full-Stack Architecture Design and Engineering Specification White Paper

> **Current version**: v2.4.x
> **Technical skeleton**: Next.js 15 App Router, Contentlayer 2, MDX, Drizzle ORM, SQLite
> **Core Goals**: Content priority, clear structure, low-cost online, long-term maintainability

Coet is not a simple "blog plus backend" product, but a set of full-stack personal workstations focusing on content flow, interactive precipitation and automated delivery. Its core engineering proposition is: when the system needs to coexist with purely static generation, dynamic interaction, and long-term state management, how to maintain the bottom line of the mental burden of the project through restrained architectural layering.

:::info{title="Reading tips"}
This article follows the evolution of "Positioning -> Architecture -> Content -> Data -> Operation and Maintenance". All technical decisions are anchored by **single-person long-term maintenance availability**, and any over-design that is separated from the business for the sake of showing off skills is rejected.
:::

## 1. System boundary definition

In a nutshell: **Coet is a content-heavy independent workstation based on the MDX content engine and Feature-based directory organization as the skeleton. **

| Dimensions | Technology stack and selection | Design boundary considerations |
| --- | --- | --- |
| Content engine | `Contentlayer 2 + MDX` | Gives text component-level rendering capabilities and breaks the barriers between static content and dynamic components |
| Rendering pipeline | `Next.js 15 App Router + RSC` | Extremely compress the client JS load and achieve the optimal solution for SSR/SSG hybrid rendering |
| Data persistence | `SQLite + local JSON` | Cut down heavy database operation and maintenance costs while retaining core correlation query capabilities |
| Modular organization | `src/features/*` | Abandon the flat rollout model, force functional cohesion, and isolate by business domain rather than technology stack |
| Operation and maintenance link | `Shell + PM2` | Remove the heavy K8s/Docker assembly and return to the Unix philosophy of pipeline deployment |

> [!TIP]
> The ultimate secret of architectural design is choice. Personal workstations do not require multi-tenant isolation or distributed high concurrency. What they require is ultimate single-instance stability and minimal maintenance fatigue.

## 2. Architecture topology and domain division

### 2.1 Directory topology diagram

Adopt a minimalist but highly cohesive Feature-based architecture:

```text:project-topology
.
├── content/                    # 📌 静态资产域：MDX 文章与作者信息
├── scripts/                    # 🛠️ 工程脚本域：构建、部署、SEO 触发
├── src/
│   ├── app/                    # 🚪 路由入口域：RSC 与 Layout 组合
│   ├── features/               # 📦 业务能力域：高内聚模块
│   │   ├── admin/              # -> 后台管控台
│   │   ├── comments/           # -> 评论与反黄牛基建
│   │   ├── content/            # -> MDX 解析与渲染管线
│   │   └── site/               # -> 全局基础 UI 资产
│   ├── server/                 # ⚙️ 服务逻辑域：DB 连接与 Drizzle Schema
│   └── shared/                 # 🧩 共享支撑域：跨限界上下文工具
└── storage/                    # 💾 运行时状态域：SQLite 与 JSON 配置
```

<details>
<summary><strong>为什么严禁 `app/` 直连数据库？</strong></summary>

无论 Server Components 如何鼓吹全栈边界模糊，强行在页面中穿插 SQL 都将导致文件职责极度劣化。`app/` 仅负责 URL 路由与数据组合，真正的查询操作必须拦截在 `server/` 或对应 `features/` 的数据服务中。
</details>

## 三、内容引擎：MDX 降容与升维

### 3.1 渲染管线切片

通过 Contentlayer 接管文件系统监听，配合 unified 生态体系构建重型解析管线：

```ts:contentlayer.config.ts
mdx: {
  remarkPlugins: [
    remarkExtractFrontmatter,
    remarkGfm,
    remarkCodeTitles,     // 支持代码块带文件名
    remarkAlert,          // 支持 GitHub Blockquote Alerts
    remarkCustomDirectives// 支持 :::info 等自定义指令
  ],
  rehypePlugins: [
    rehypeRemoveFirstH1,
    rehypeOptimization,   // 注入 img 防盗链与 a 标签外链隔绝
    rehypeSlug,
    [rehypePrettyCode, rehypePrettyCodeOptions],
  ],
}
```

### 3.2 Node hijacking and component projection

Standard MD elements are replaced by forced hijacking on the rendering side, injecting higher-order front-end features:

- `img` => was deprived of its native tag identity and instead integrated `referrerPolicy="no-referrer"`, first-screen lazy loading and Next.js-based image optimization component `MdxImage`.

:::success{title="Markdown is the interface"}
In this ecosystem, MDX is no longer "text data", but a **Server Component set** obtained through AST compilation. A component you insert may trigger a server-side database check, but what is ultimately returned to the browser is pure HTML that is extremely compressed.
:::

## 4. Data and runtime persistence

### 4.1 Runtime safe zone definition

> [!WARNING]
> All data generated during runtime must be soft-isolated. This requires that the system must establish impenetrable `storage/` boundaries.

Any data at the configuration level (such as page metadata, ad bitmaps, user-level friend links) or data generated by operations (comment records, likes) are all imported into the `./storage` isolation area.

```typescript:src/server/db/schema.ts
// 核心评论控制表，直接依托本地 SQLite 建立高效索引
export const comments = sqliteTable('comments', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  postId: text('post_id').notNull(),
  content: text('content').notNull(),
  status: text('status', { enum: ['pending', 'approved'] }).default('pending'),
  createdAt: integer('created_at', { mode: 'timestamp' }).default(sql`CURRENT_TIMESTAMP`),
});
```

### 4.2 数据流向管控

- 配置状态（JSON） => 负责极低频的字典数据，如全站设定，变更后通过后台触发重现管线。
- 业务持久化（SQLite/Drizzle） => 满足结构化查询所需，解决评论嵌套树等强关联性诉求。

## 五、发布体系：面向失败编程

### 5.1 原子化守护部署

一套合格的个人站点无需繁重的 CI/CD，但必须实现极端的环境一致性保护：

1. **环境检查段**：强制侦测关键的运行常量 `.env` 是否有效装载。
2. **基建组装段**：执行 `pnpm install`。
3. **数据预处理段**：处理 sqlite 的 schema 同步构建。
4. **内核重编译段**：生成 `search.json`，完成前端资产包的构建。
5. **守护重组段**：`pm2 reload` 实现平滑切换，断点接管进程。
6. **健康收尾段**：本地 127.0.0.1 发送健康拨测，成功后挂钩外网搜索引擎主动爬虫推送 `seo:push`。

:::important{title="不可变基建原则"}
哪怕只是最简单的 shell 交付通道，只要它切断了手动在线上跑命令的惯性，就彻底阻绝了“为什么本地能跑线上跑挂了”的薛定谔代码。
:::

## 六、结语

Coet 工作站的生命力并非源自任何时髦库的堆砌，而是来自于一种强迫症般的工程洁癖：明确前后端数据的分水岭、掌控每一次 AST 的底层编译转化、极度节约运算资源的渲染策略。

它解决了作为程序员独狼战场的终极矛盾：**在自由挥洒技术理想的同时，不用陷入到日复一日修补烂代码的泥潭之中。**[^note]

[^note]: 对待这类项目，写更少的代码，建更硬的墙，是最冷酷但也最有效的信条。
