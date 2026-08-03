# 可扩展社交图标

社交链接的 `icon` 字段支持四种格式，不需要修改组件注册表：

- `social:github`：项目内置品牌图标。
- `lucide:MessageCircle`：任意 `lucide-react` 图标名。
- `simple:gitlab`：Simple Icons 的品牌 slug，运行时从 `cdn.simpleicons.org` 加载。
- `https://…`、`data:image/svg+xml,…` 或 `/icons/custom.svg`：自定义图片地址。

未识别的名称会回退到 Lucide 的链接图标，因此新增平台不会让页面空白。品牌 SVG 可从 [Simple Icons](https://simpleicons.org/) 选择，界面图标可从 [Lucide](https://lucide.dev/icons/) 选择。
