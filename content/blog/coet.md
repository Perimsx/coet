---
title: Coet 个人工作站：全栈架构设计与工程化规范白皮书
date: '2026-03-20'
lastmod: '2026-03-20T11:30:00+08:00'
draft: false
authors:
  - default
tags:
  - 全栈架构
  - 工程化
  - Next.js
  - MDX
categories:
  - 系统设计
summary: 从内容建模、渲染管线、后台控制、部署链路到运维策略，系统拆解 Coet 个人工作站的架构边界、工程规范与演进路径，给出一套适用于个人站点长期演化的工程化蓝图。
---

# Coet 个人工作站：全栈架构设计与工程化规范白皮书

> **当前版本**：v2.4.x  
> **技术骨架**：Next.js 15 App Router、Contentlayer 2、MDX、Drizzle ORM、SQLite  
> **核心目标**：内容优先、结构清晰、低成本上线、长期可维护

Coet 并非一个简单的“博客加后台”堆砌产物，而是一套聚焦内容流转、交互沉淀与自动化交付的全栈个人工作站。其核心工程命题在于：当系统需并存纯静态生成、动态交互与长期状态管理时，如何通过克制的架构分层维持项目的心智负担底线。

:::info{title="阅读提示"}
本文依循“定位 -> 架构 -> 内容 -> 数据 -> 运维”演进推导。所有技术决策皆以**单人长期维护可用性**为锚点，拒绝任何为了炫技而脱离业务的过度设计。
:::

## 一、系统边界定义

一言以蔽之：**Coet 是以 MDX 内容引擎为基石、以 Feature-based 目录组织为骨架的重内容型独立工作站。**

| 维度 | 技术栈与选型 | 设计边界考量 |
| --- | --- | --- |
| 内容引擎 | `Contentlayer 2 + MDX` | 赋予文本组件级渲染能力，打破静态内容与动态组件的壁垒 |
| 渲染管线 | `Next.js 15 App Router + RSC` | 极致压缩客户端 JS 负载，实现 SSR/SSG 混合渲染最优解 |
| 数据持久化 | `SQLite + 本地 JSON` | 砍掉重型数据库运维成本，保留核心的关联查询能力 |
| 模块化组织 | `src/features/*` | 废弃扁平铺开模式，强制功能内聚，按业务域而非技术栈隔离 |
| 运维链路 | `Shell + PM2` | 拔除繁重的 K8s/Docker 组装，回归 Unix 哲学的流水线部署 |

> [!TIP]
> 架构设计的终极奥义是取舍。个人工作站不需要多租户隔离，也不需要分布式高并发，它需要的是极致的单实例稳定性与最低的维护疲劳度。

## 二、架构拓扑与领域划分

### 2.1 目录拓扑图

采用极简但高内聚的 Feature-based 架构：

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

### 3.2 节点劫持与组件投射

标准的 MD 元素在渲染侧被强制劫持替换，注入更高阶的前端特性：

- `img` => 被剥夺原生标签身份，替以集成 `referrerPolicy="no-referrer"`、首屏懒加载与基于 Next.js 的图片优化组件 `MdxImage`。
- `a` => 如果是外链，则强制挂载 `target="_blank" rel="noopener noreferrer"` 以物理阻断跨站脚本污染。
- `pre` => 包裹为带有复制按钮和语言标识的 `CodeBlockPre` 交互容器。

:::success{title="Markdown即界面"}
在这套生态下，MDX 不再是“文字数据”，而是通过 AST 编译得到的 **Server Component 树**。你插入的一个组件可能引发一次服务端查库，但其最终回传给浏览器的，只是被极致压缩的纯 HTML。
:::

## 四、数据与运行时持久化

### 4.1 运行时安全区定义

> [!WARNING]
> 一切运行时生成的数据必须被软隔离。这就要求系统必须建立坚不可摧的 `storage/` 边界。

任何属于配置层面（例如页面元数据、广告位图、用户层级友链）或操作产生的数据（评论记录、点赞）全部导入至 `./storage` 隔离区。

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
