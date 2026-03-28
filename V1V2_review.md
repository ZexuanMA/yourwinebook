# Your Wine Book — 全面项目讲解与代码审查

> 本文面向第一次接触网站开发的初学者，从零开始，系统讲解这个项目是什么、怎么组织的、怎么跑起来的、哪里做得好、哪里可以改。
>
> 写作原则：少用抽象术语，用了就解释；多说"为什么这样做"，不只说"是什么"。

---

## 目录

1. [项目整体概览](#1-项目整体概览)
2. [目录与文件结构说明](#2-目录与文件结构说明)
3. [核心代码逻辑讲解](#3-核心代码逻辑讲解)
4. [文档说明](#4-文档说明)
5. [优点与问题](#5-优点与问题)
6. [改进建议](#6-改进建议)
7. [适配的业务场景分析](#7-适配的业务场景分析)
8. [给初学者的学习建议与总结](#8-给初学者的学习建议与总结)

---

## 1. 项目整体概览

### 1.1 这个项目是做什么的？

**Your Wine Book**（你的葡萄酒手册）是一个面向**香港消费者**的葡萄酒探索与比价平台。

用最简单的话说：它帮你在香港买酒时，**找到哪家酒商卖得最便宜、哪支酒最适合你**。

想象一下你去超市买酒，面对一大墙的酒完全不知道怎么选。这个平台就是帮你解决这个问题的：

- **选酒助手**：告诉它你的场景（送礼、聚餐、约会），它帮你推荐
- **跨酒商比价**：同一支酒，6 家酒商谁卖得最便宜，一目了然
- **AI 选酒**：用自然语言（像聊天一样）描述你的需求，AI 帮你推荐
- **社区**：用户可以发帖分享喝酒心得

### 1.2 核心功能一览

| 功能 | 面向谁 | 简单解释 |
|------|--------|---------|
| 酒款浏览 + 搜索 + 筛选 | 消费者 | 像淘宝搜商品一样搜酒 |
| 跨酒商比价 | 消费者 | 同一支酒比较 6 家店的价格 |
| 场景推荐 | 消费者 | 送礼选什么酒？聚餐选什么酒？ |
| AI 选酒助手 | 消费者 | 像跟朋友聊天一样说需求，AI 推荐 |
| 收藏功能 | 消费者 | 收藏喜欢的酒和酒商 |
| 社区发帖 | 消费者 | 分享品酒心得 |
| 酒商后台 | 酒商 | 管理自己的酒款和价格 |
| 管理员后台 | 平台管理员 | 管理所有酒商、用户、入驻申请 |
| 流量分析 | 酒商/管理员 | 看有多少人浏览了你的酒 |
| 中英双语 | 所有人 | 繁体中文和英文随时切换 |

### 1.3 技术栈概述（给新手的解释）

这个项目用到了很多工具和技术，我先解释几个最重要的概念：

| 技术 | 它是什么 | 在项目里做什么 |
|------|---------|--------------|
| **Next.js** | 一个用来做网站的"脚手架" | 项目的核心框架，负责页面渲染、路由（URL 和页面的对应关系）、API 接口 |
| **React** | 一个用来做网页界面的工具 | 所有你看到的页面、按钮、表格，都是用 React 写的 |
| **TypeScript** | 带"类型检查"的 JavaScript | JavaScript 是网页的编程语言，TypeScript 加了类型检查，能提前发现 bug |
| **Tailwind CSS** | 一个写样式的工具 | 控制颜色、大小、间距等外观，不用写单独的 CSS 文件 |
| **Supabase** | 一个"云数据库服务" | 存储用户数据、酒款数据等（项目也可以不连 Supabase，用本地文件代替） |
| **SQLite** | 一个轻量级数据库 | 存储页面访问统计数据 |
| **pnpm** | 包管理器 | 像 App Store 一样，帮你安装项目需要的各种工具包 |

### 1.4 各部分代码如何协作？

整个项目的工作方式，可以用一个**餐厅的比喻**来理解：

```
用户（顾客）
   ↓ 打开浏览器访问网站
Navbar + 页面（前厅服务员）
   ↓ 展示菜单（页面），接收点单（用户操作）
API 路由（传菜通道）
   ↓ 把"订单"传到后厨
queries.ts + Store 层（后厨）
   ↓ 从冰箱（数据库/文件）取食材，加工
数据层：JSON 文件 / Supabase / SQLite（冰箱/仓库）
   ↓ 返回做好的"菜"（数据）
页面组件拿到数据，渲染给用户看
```

更具体一点：

1. **用户打开页面** → Next.js 根据 URL 找到对应的页面文件（比如 `/wines/chateau-margaux` 会找到 `wines/[slug]/page.tsx`）
2. **页面需要数据** → 调用 `queries.ts` 里的函数（比如 `getWineBySlug("chateau-margaux")`）
3. **queries.ts 决定数据来源** → 如果配置了 Supabase 就去云数据库查，否则用本地的 mock 数据
4. **数据返回** → 页面组件用 React 把数据渲染成好看的界面
5. **用户操作**（比如收藏、搜索） → 通过 API 路由发送请求 → Store 层处理数据 → 更新文件/数据库

---

## 2. 目录与文件结构说明

### 2.1 最顶层：Monorepo（单仓库多项目）结构

```
wine-app/                          ← 整个项目的根目录
├── apps/                          ← 所有"应用程序"放这里
│   ├── web/                       ← 网站（Next.js）← 这是最主要的部分
│   └── mobile/                    ← 手机 App（React Native + Expo）
├── packages/                      ← 共享的代码包
│   ├── domain/                    ← 共享的数据类型定义
│   ├── query-keys/                ← 共享的查询键（用于缓存管理）
│   └── supabase-types/            ← 数据库的类型定义
├── supabase/                      ← 数据库配置、迁移脚本、云函数
├── scripts/                       ← 一些运维脚本
├── nginx/                         ← 网络服务器配置（用于部署）
├── past_md/                       ← 历史文档存档
├── package.json                   ← 根目录的项目配置
├── pnpm-workspace.yaml            ← 告诉 pnpm"哪些文件夹是子项目"
├── turbo.json                     ← Turborepo 配置（加速构建）
├── ecosystem.config.js            ← PM2 生产部署配置
├── CLAUDE.md                      ← 项目完整指南（你正在读的那个大文档）
├── codex-V2.md                    ← V2 升级计划
└── AI_PROGRESS_V2.md              ← V2 开发进度记录
```

**什么是 Monorepo？**

就是把"网站"和"手机 App"放在同一个文件夹里管理，而不是分成两个独立项目。好处是它们可以共享代码（比如数据类型定义），改一处两边都更新。

**关键配置文件解释：**

| 文件 | 通俗解释 |
|------|---------|
| `package.json` | 项目的"身份证"，记录了项目名字、启动命令、需要哪些工具 |
| `pnpm-workspace.yaml` | 告诉 pnpm：`apps/*` 和 `packages/*` 下面的每个文件夹都是一个子项目 |
| `turbo.json` | Turborepo 的配置，作用是加速构建——如果代码没改，就不重新构建 |
| `ecosystem.config.js` | PM2（一个进程管理工具）的配置，告诉服务器怎么运行生产环境 |

### 2.2 Web 应用的详细结构（最重要的部分）

```
apps/web/
├── src/                           ← 所有源代码
│   ├── app/                       ← 页面和 API（Next.js App Router）
│   │   ├── [locale]/              ← 前台页面（带语言前缀）
│   │   ├── dashboard/             ← 后台管理页面
│   │   ├── login/                 ← 酒商/管理员登入页
│   │   ├── api/                   ← 后端 API 接口
│   │   ├── layout.tsx             ← 根布局（字体 + 全局样式）
│   │   ├── globals.css            ← 全局 CSS 样式
│   │   ├── sitemap.ts             ← SEO 站点地图
│   │   └── robots.ts              ← SEO 爬虫规则
│   ├── components/                ← 可复用的 UI 组件
│   │   ├── layout/                ← 布局组件（Navbar、Footer）
│   │   ├── wine/                  ← 酒相关组件（WineCard）
│   │   ├── scene/                 ← 场景组件（SceneCard）
│   │   ├── search/                ← 搜索组件（HeroSearch、SearchInput）
│   │   ├── ai/                    ← AI 相关组件（ChatInterface 等）
│   │   ├── dashboard/             ← 后台组件（DashboardSidebar）
│   │   ├── analytics/             ← 分析组件（PageTracker）
│   │   └── ui/                    ← 通用 UI 组件（Button 等）
│   ├── lib/                       ← 工具函数和业务逻辑
│   │   ├── queries.ts             ← 数据查询统一入口（最核心的文件之一）
│   │   ├── mock-data.ts           ← 模拟数据（32 支酒、6 家酒商）
│   │   ├── types.ts               ← 类型定义
│   │   ├── locale-helpers.ts      ← 语言转换助手
│   │   ├── user-store.ts          ← 用户数据管理
│   │   ├── merchant-store.ts      ← 酒商数据管理
│   │   ├── wine-store.ts          ← 酒款数据管理
│   │   ├── price-store.ts         ← 价格数据管理
│   │   ├── analytics-store.ts     ← 分析数据（SQLite）
│   │   ├── community-store.ts     ← 社区帖子管理
│   │   ├── admin-store.ts         ← 管理员帐号管理
│   │   ├── application-store.ts   ← 入驻申请管理
│   │   ├── mock-auth.ts           ← 认证逻辑入口
│   │   ├── password.ts            ← 密码加密/验证
│   │   ├── rate-limit.ts          ← API 频率限制
│   │   ├── supabase.ts            ← Supabase 客户端
│   │   ├── ai-tools.ts            ← AI 工具定义
│   │   └── utils.ts               ← CSS 类名合并工具
│   ├── i18n/                      ← 国际化配置
│   │   ├── routing.ts             ← 语言路由定义
│   │   ├── request.ts             ← 服务端语言加载
│   │   └── navigation.ts          ← 带语言的导航工具
│   ├── middleware.ts              ← 请求中间件（认证 + 语言路由）
│   └── __tests__/                 ← 单元测试
├── messages/                      ← 翻译文本
│   ├── zh-HK.json                 ← 所有繁体中文文案
│   └── en.json                    ← 所有英文文案
├── data/                          ← 持久化数据存储
│   ├── wines.json                 ← 商家创建的酒款
│   ├── merchants.json             ← 酒商帐号
│   ├── users.json                 ← 消费者帐号
│   ├── prices.json                ← 价格覆盖数据
│   ├── admin.json                 ← 管理员帐号
│   ├── applications.json          ← 入驻申请
│   ├── community.json             ← 社区帖子
│   └── analytics.db               ← SQLite 分析数据库
├── e2e/                           ← 端到端测试
├── public/                        ← 静态资源（图片等）
└── package.json                   ← Web 应用的依赖清单
```

### 2.3 文件分类一览表

为了让你快速分辨"哪个文件是干什么的"，这里做一个分类：

#### 页面文件（用户看到的画面）

| 文件路径 | 对应 URL | 说明 |
|---------|---------|------|
| `app/[locale]/page.tsx` | `/zh-HK/` 或 `/en/` | 首页 |
| `app/[locale]/search/page.tsx` | `/zh-HK/search` | 搜索页 |
| `app/[locale]/wines/[slug]/page.tsx` | `/zh-HK/wines/cloudy-bay` | 酒款详情页 |
| `app/[locale]/merchants/page.tsx` | `/zh-HK/merchants` | 酒商列表页 |
| `app/[locale]/merchants/[slug]/page.tsx` | `/zh-HK/merchants/watsons-wine` | 酒商详情页 |
| `app/[locale]/scenes/[slug]/page.tsx` | `/zh-HK/scenes/gift` | 场景推荐页 |
| `app/[locale]/ai/page.tsx` | `/zh-HK/ai` | AI 选酒助手 |
| `app/[locale]/community/page.tsx` | `/zh-HK/community` | 社区列表 |
| `app/[locale]/account/page.tsx` | `/zh-HK/account` | 用户个人中心 |
| `app/dashboard/page.tsx` | `/dashboard` | 后台首页 |
| `app/dashboard/wines/page.tsx` | `/dashboard/wines` | 酒款管理 |
| `app/dashboard/analytics/page.tsx` | `/dashboard/analytics` | 流量分析 |
| `app/login/page.tsx` | `/login` | 酒商/管理员登入 |

#### 组件文件（可复用的 UI 零件）

| 组件 | 做什么 | 在哪里用 |
|------|--------|---------|
| `Navbar.tsx` | 顶部导航栏：Logo + 菜单 + 搜索 + 语言切换 + 用户头像 | 所有前台页面 |
| `Footer.tsx` | 底部页脚：链接 + 版权信息 | 所有前台页面 |
| `WineCard.tsx` | 酒款卡片：emoji + 名字 + 产区 + 价格 | 首页、搜索、酒商页 |
| `SceneCard.tsx` | 场景卡片：emoji + 标题 + 描述 | 首页 |
| `SearchInput.tsx` | 搜索框（带自动补全） | 搜索页、Navbar |
| `ChatInterface.tsx` | AI 聊天界面 | AI 页面 |
| `DashboardSidebar.tsx` | 后台侧边栏导航 | 所有后台页面 |
| `PageTracker.tsx` | 页面浏览追踪（用户看不到） | 前台 layout |

#### API 接口文件（前端和后端之间的"桥梁"）

| 接口路径 | 做什么 |
|---------|--------|
| `api/wines/route.ts` | 获取酒款列表（支持筛选、排序、分页） |
| `api/wines/[slug]/prices/route.ts` | 获取某支酒的跨酒商比价 |
| `api/auth/login/route.ts` | 酒商/管理员登入 |
| `api/user/auth/login/route.ts` | 消费者登入 |
| `api/user/bookmarks/wines/route.ts` | 收藏/取消收藏酒款 |
| `api/track/route.ts` | 记录用户行为（浏览了什么页面） |
| `api/ai/chat/route.ts` | AI 对话接口 |
| `api/admin/accounts/route.ts` | 管理员管理酒商帐号 |

#### 工具函数文件（"幕后工作者"）

| 文件 | 做什么 | 如果没有它会怎样 |
|------|--------|----------------|
| `queries.ts` | 统一的数据查询入口 | 每个页面都要自己写查数据库的代码，一改数据源要改几十处 |
| `mock-data.ts` | 提供 32 支酒、6 家酒商的模拟数据 | 没有 Supabase 时网站什么都显示不了 |
| `locale-helpers.ts` | 根据当前语言选择中文或英文字段 | 中英文切换失效 |
| `password.ts` | 密码加密（bcrypt）和验证 | 密码以明文存储，极不安全 |
| `utils.ts` | CSS 类名合并工具 | 样式冲突，按钮一会大一会小 |

### 2.4 三棵独立的 Layout 树

这是一个**非常重要的架构设计**。项目里有三个完全独立的页面"外壳"：

```
Layout 树 1：前台（消费者看的）
├── src/app/layout.tsx          ← 根布局：加载字体
└── src/app/[locale]/layout.tsx ← 语言布局：Navbar + Footer + 分析追踪
    └── 所有 /zh-HK/... 页面

Layout 树 2：后台（酒商/管理员用的）
└── src/app/dashboard/layout.tsx ← 侧边栏 + 顶部栏
    └── 所有 /dashboard/... 页面

Layout 树 3：登入页
└── src/app/login/layout.tsx    ← 极简布局
    └── /login 页面
```

**为什么要分三棵树？**

因为这三种页面的样子完全不同：
- 前台有 Navbar（导航栏）+ Footer（页脚），是消费者看的
- 后台有 Sidebar（侧边栏），是管理员用的
- 登入页既不需要导航栏也不需要侧边栏

如果用同一个 Layout，你就得在代码里写一堆 `if (是后台) { 不显示Navbar }` 这样的条件判断，很混乱。分开之后，每棵树各管各的，干净利落。

**新手注意事项**：如果你要在 `[locale]` 之外的地方新增页面（比如新增一个 `/register` 页面），你**必须**给它配一个独立的 `layout.tsx`，里面要加载字体和 CSS，否则页面会没有样式（白底黑字，非常丑）。

---

## 3. 核心代码逻辑讲解

### 3.1 页面是怎么被渲染出来的？

让我们以"用户打开首页"为例，一步步追踪整个过程：

**第 1 步：用户在浏览器输入 `yourwinebook.com`**

Next.js 收到请求后，中间件 `middleware.ts` 最先处理：
- 检测用户的浏览器语言
- 自动重定向到 `/zh-HK/`（默认中文）

**第 2 步：Next.js 根据 URL 找到对应文件**

`/zh-HK/` 对应 `app/[locale]/page.tsx`，其中 `[locale]` 就是 `zh-HK`。

**第 3 步：布局套娃**

Next.js 会从外到内套布局：
```
app/layout.tsx（加载字体）
  └── app/[locale]/layout.tsx（加载 Navbar、Footer、分析追踪）
      └── app/[locale]/page.tsx（首页内容）
```

就像俄罗斯套娃，最外面一层负责字体，中间一层负责导航栏和页脚，最里面一层是实际的页面内容。

**第 4 步：首页组件开始工作**

```typescript
// app/[locale]/page.tsx（简化版）
export default async function HomePage() {
  const t = await getTranslations();        // 获取翻译函数
  const locale = await getLocale();          // 获取当前语言（zh-HK）
  const featured = await getFeaturedWines(); // 从数据层获取精选酒款

  return (
    <>
      <HeroSearch />           {/* 搜索框 */}
      <SceneCard />            {/* 4 个场景卡片 */}
      <WineCard wine={...} />  {/* 精选酒款卡片 */}
    </>
  );
}
```

注意到 `async function` 了吗？这是一个 **Server Component**（服务端组件）——它在服务器上运行，直接查数据库拿数据，然后把已经渲染好的 HTML 发给用户浏览器。好处是用户打开页面就能直接看到内容，不用等 JavaScript 加载完。

**第 5 步：数据从哪来？**

`getFeaturedWines()` 定义在 `queries.ts` 里：
```typescript
export async function getFeaturedWines() {
  const supabase = getSupabase();
  if (supabase) {
    // 有 Supabase → 从云数据库查
    const { data } = await supabase.from("wines").select("*").eq("is_featured", true);
    return data.map(rowToWine);
  }
  // 没有 Supabase → 用模拟数据
  return wines.filter(w => w.is_featured);
}
```

这就是**双重数据层**的设计：有云数据库就用云的，没有就用本地文件，对上层代码完全透明。

### 3.2 用户操作后，数据是怎么流动的？

让我们以"用户收藏一支酒"为例：

```
用户点击收藏按钮 ♥
    ↓
前端发送 POST 请求到 /api/user/bookmarks/wines
请求体：{ wineSlug: "cloudy-bay" }
    ↓
API 路由接收请求：
  1. 从 cookie 读取用户 ID（wb_user_session）
  2. 调用 user-store.ts 的 toggleWineBookmark(userId, "cloudy-bay")
    ↓
user-store.ts 执行：
  1. 读取 data/users.json 文件
  2. 找到该用户的 bookmarks 数组
  3. 如果 "cloudy-bay" 已存在 → 删除（取消收藏）
     如果不存在 → 添加（收藏）
  4. 把修改后的数据写回 data/users.json
    ↓
API 返回 { added: true }（或 false）
    ↓
前端更新按钮状态：♥ 变成红色
```

整个流程就是：**前端操作 → API 接口 → Store 处理 → 文件/数据库更新 → 返回结果 → 前端更新界面**。

### 3.3 前端和后端是怎么交互的？

在这个项目里，"前端"和"后端"并没有像传统项目那样分成两个独立的服务器。它们都在同一个 Next.js 应用里：

| 角色 | 在项目里的对应 | 运行在哪 |
|------|-------------|---------|
| 前端 | `app/[locale]/*.tsx` 页面组件 | 浏览器（Client Component）或服务器（Server Component） |
| 后端 | `app/api/*/route.ts` API 路由 | 服务器 |
| 数据层 | `lib/*.ts` Store 和 queries | 服务器 |

交互方式有两种：

**方式 1：Server Component 直接调用函数（推荐）**

```typescript
// 首页是 Server Component，直接在服务器上调用函数
export default async function HomePage() {
  const wines = await getFeaturedWines(); // 直接调用，不需要 HTTP 请求
  return <WineCard wine={wines[0]} />;
}
```

这就像厨师直接从冰箱拿食材，不需要通过服务员传话。

**方式 2：Client Component 通过 API 请求（用于用户交互）**

```typescript
// 搜索页是 Client Component，需要通过 API 获取数据
"use client"; // ← 这个标记表示"在浏览器运行"

export default function SearchPage() {
  useEffect(() => {
    fetch("/api/wines?type=red&sort=price_asc") // HTTP 请求
      .then(res => res.json())
      .then(data => setWines(data.wines));
  }, []);
}
```

这像顾客通过服务员点餐——因为搜索需要响应用户的实时操作（输入关键词、选筛选条件），必须在浏览器里运行。

### 3.4 路由和 URL 是怎么对应的？

Next.js 使用**文件系统路由**——文件夹结构就是 URL 结构：

```
文件位置                                    URL
app/[locale]/page.tsx                → /zh-HK/        或 /en/
app/[locale]/search/page.tsx         → /zh-HK/search  或 /en/search
app/[locale]/wines/[slug]/page.tsx   → /zh-HK/wines/cloudy-bay
app/dashboard/page.tsx               → /dashboard
app/api/wines/route.ts               → /api/wines（API 接口）
```

方括号 `[locale]` 和 `[slug]` 是**动态参数**。就像一个"占位符"：
- `[locale]` 可以是 `zh-HK` 或 `en`
- `[slug]` 可以是任何酒的标识符，比如 `cloudy-bay` 或 `moet-chandon`

### 3.5 国际化（中英文切换）是怎么工作的？

这个项目支持繁体中文和英文两种语言。实现方式分几层：

**第 1 层：URL 区分语言**

```
/zh-HK/wines/cloudy-bay  → 中文版酒款页面
/en/wines/cloudy-bay      → 英文版酒款页面
```

`middleware.ts` 会自动检测用户语言，没有语言前缀的 URL 会重定向到 `/zh-HK/`。

**第 2 层：翻译文件**

所有文案存在 `messages/zh-HK.json` 和 `messages/en.json` 两个文件里：

```json
// messages/zh-HK.json
{
  "hero": {
    "title1": "Drink smarter.",
    "subtitle": "在香港，輕鬆喝對每一支。"
  },
  "nav": {
    "search": "搜尋酒款"
  }
}
```

页面里这样使用：

```typescript
const t = useTranslations("hero");
return <h1>{t("title1")}</h1>; // 显示 "Drink smarter."
```

**第 3 层：数据层的双语**

酒款数据里，产区、描述等字段都有中英文两个版本：

```typescript
{
  name: "Cloudy Bay Sauvignon Blanc",  // 酒名保留英文
  region_zh: "新西蘭 · 馬爾堡",
  region_en: "New Zealand · Marlborough",
  tags_zh: ["清爽", "果香"],
  tags_en: ["Crisp", "Fruity"]
}
```

`locale-helpers.ts` 负责根据当前语言选择正确的字段：

```typescript
export function toWineCard(wine, locale) {
  const isZh = locale === "zh-HK";
  return {
    region: isZh ? wine.region_zh : wine.region_en,
    tags: isZh ? wine.tags_zh : wine.tags_en,
    // ...
  };
}
```

### 3.6 认证系统是怎么工作的？

项目有**两套完全独立的认证系统**：

**系统 1：酒商/管理员认证**
```
登入页面：/login
Cookie 名：wb_session（存储帐号 slug）
有效期：7 天
保护的页面：/dashboard/*
```

**系统 2：消费者认证**
```
登入页面：/zh-HK/account/login
Cookie 名：wb_user_session（存储用户 ID）
有效期：30 天
保护的功能：收藏、发帖
```

**什么是 Cookie？**

Cookie 就像是一张"入场券"。你登入成功后，服务器发给你一张 Cookie，以后每次请求都自动带上这张票，服务器一看就知道你是谁。

**中间件的守门人角色**

`middleware.ts` 像大楼的保安：
- 访客来前台页面 → 放行
- 访客来后台 → 检查有没有 `wb_session`，没有就赶到登入页
- 非管理员访问 `/dashboard/admin/*` → 没权限，赶回普通后台

### 3.7 数据持久化：两种模式

这个项目有一个很巧妙的设计——**双重数据层**：

**模式 1：本地文件模式（默认，开发用）**

数据存储在 `data/` 目录下的 JSON 文件和 SQLite 数据库里：
```
data/users.json      ← 用户帐号数据
data/merchants.json  ← 酒商帐号数据
data/wines.json      ← 商家创建的酒款
data/analytics.db    ← 浏览统计（SQLite）
```

这种模式不需要配置任何外部服务，直接 `npm run dev` 就能用。

**模式 2：Supabase 模式（生产用）**

设置 `NEXT_PUBLIC_SUPABASE_URL` 和 `NEXT_PUBLIC_SUPABASE_ANON_KEY` 环境变量后，所有数据查询自动切换到 Supabase（一个云端的 PostgreSQL 数据库）。

**切换是无感的**——所有 Store 和 queries.ts 内部检查 `USE_SUPABASE_AUTH` 标志，自动选择数据源，上层代码完全不需要改。

### 3.8 AI 选酒助手的工作原理

这是项目的**核心差异化功能**。它的工作流程是：

```
用户输入："我想送朋友生日礼物，预算 500 左右，她喜欢甜的"
    ↓
前端发送消息到 /api/ai/chat（SSE 流式请求）
    ↓
API 路由做几件事：
  1. 频率限制检查（登入用户 20 次/小时，游客 5 次/小时）
  2. 把用户消息 + 历史对话 + 系统提示词发给 Claude API
  3. Claude 可能会调用"工具"（tool use）：
     - search_wines：按条件搜索酒款
     - get_wine_prices：获取某支酒的比价
     - get_scene_wines：获取场景推荐
  4. Claude 根据工具返回的数据，生成推荐回复
    ↓
前端实时显示 AI 的回复（像 ChatGPT 一样逐字出现）
```

**什么是 SSE？**

SSE（Server-Sent Events）就像是打电话时对方边说你边听。普通的 API 请求是"你问一个问题，等对方想好了一次性回答"；SSE 是"你问完之后，对方边想边说，你能听到他说的每一个字"。这样用户就不用看着空白屏幕等 AI 想完。

**什么是 Tool Use？**

Claude AI 本身不知道你的酒款数据。通过 Tool Use，我们告诉 Claude："嘿，你有这几个'工具'可以用——搜索酒款、查价格等"。Claude 在回答用户问题时，会自动决定要不要用这些工具，用哪个，传什么参数。就像给 AI 配了一套"操作手册"。

### 3.9 分析系统的工作原理

项目用 SQLite 数据库记录用户行为：

**前端追踪（`PageTracker.tsx`）**

这是一个"隐形组件"——用户看不到它，但它在每个前台页面的 layout 里默默工作：

```typescript
// 每次用户访问一个页面，就发送一个事件
fetch("/api/track", {
  method: "POST",
  body: JSON.stringify({
    type: "pageview",      // 事件类型
    path: "/wines/cloudy-bay",
    sessionId: "abc123",   // 匿名会话 ID
    timestamp: "2026-03-28T10:00:00"
  })
});
```

**后端存储（`analytics-store.ts`）**

收到事件后，直接写入 SQLite 数据库。选择 SQLite 是因为：
- 轻量：不需要额外安装数据库服务
- 快速：WAL 模式下读写互不阻塞
- 简单：一个 `.db` 文件就是整个数据库

**后台查看**

管理员在 `/dashboard/analytics` 看到的 30 天趋势图、热门酒款排行等，都是从 SQLite 里用 SQL 聚合查询出来的。

---

## 4. 文档说明

### 4.1 各文档的作用

| 文档 | 它是什么 | 什么时候看 |
|------|---------|-----------|
| `CLAUDE.md` | **项目完整指南**，22.9KB，非常详细 | 第一次接触项目时必看。它是整个项目的"说明书" |
| `codex-V2.md` | **V2 升级计划**，39.8KB | 想了解项目未来规划、还有什么要做时看 |
| `AI_PROGRESS_V2.md` | **V2 开发进度**，36.4KB | 想知道 V2 做到哪了、每一步的决策原因时看 |
| `README.md` | 基础说明 | 内容很少，只是 Next.js 默认的 README |
| `past_md/codex-MVP.md` | MVP 阶段的规划 | 想了解项目历史、早期是怎么规划的时看 |
| `past_md/AI_PROGRESS.md` | MVP 阶段的进度 | 想了解项目历史时看 |
| `past_md/codex-review.md` | 架构审查 | 想了解之前做过什么架构评估时看 |

### 4.2 文档质量评价

**写得好的地方：**

- `CLAUDE.md` 非常优秀——涵盖了快速启动、技术栈、架构、目录结构、API 一览、Demo 帐号、开发注意事项，几乎所有你需要知道的都在里面
- `AI_PROGRESS_V2.md` 记录了每一步的决策和原因，对理解"为什么这样做"非常有帮助
- `codex-V2.md` 对项目现状和缺口做了清晰的分析

**不够完善的地方：**

- `README.md` 内容太少，第一次来的开发者如果不知道看 `CLAUDE.md`，可能会困惑
- 没有专门的 API 文档（虽然 `CLAUDE.md` 有列表，但没有请求/响应示例）
- 没有部署文档（部署步骤散落在各处）
- 缺少架构图（目前都是文字描述，一张图胜过千言万语）

### 4.3 翻译文件（`messages/*.json`）

这两个文件虽然不是传统意义上的"文档"，但你会经常用到它们。**如果你想改页面上的任何文字，不需要动代码，只要改这两个 JSON 文件就行**。

比如想把首页的标语从"轻松喝对每一支"改成"发现你的好酒"，只需要：

```json
// messages/zh-HK.json
{
  "hero": {
    "subtitle": "发现你的好酒"  // ← 改这里
  }
}
```

---

## 5. 优点与问题

### 5.1 优点

**1. 双重数据层设计非常优雅**

```typescript
// queries.ts 里的典型模式
const supabase = getSupabase();
if (supabase) {
  // 生产环境：查 Supabase
} else {
  // 开发环境：用 mock 数据
}
```

这意味着：
- 新人 clone 项目后 `npm run dev` 就能跑，不用配数据库
- 生产环境用真正的云数据库，性能和可靠性有保障
- 切换只需要设/不设环境变量，不需要改任何代码

**2. 国际化做得非常完整**

不只是 UI 文案有中英文，连酒款数据都有 `_zh` 和 `_en` 两套。很多项目只翻译了界面，忘了翻译数据。

**3. 代码结构清晰，职责分明**

- 页面只负责渲染
- API 路由只负责接收请求和返回响应
- Store 层负责业务逻辑和数据操作
- queries.ts 是统一的数据入口

这种分层设计让"改一个功能只需要改一个地方"。

**4. 安全意识不错**

- 密码用 bcrypt 加密（单向哈希，即使数据库泄露也看不到原始密码）
- API 有频率限制（防止暴力破解和恶意刷接口）
- 中间件做权限检查（非管理员访问不了管理员页面）
- Cookie 设置了 `httpOnly`（JavaScript 无法读取，防止 XSS 攻击）

**5. 开发体验好**

- 有 Demo 帐号可以一键登入体验所有功能
- 有热重载（改代码保存后页面自动刷新）
- 有完善的 TypeScript 类型定义，IDE 有智能提示

**6. 文档质量高**

`CLAUDE.md` 是一份非常好的项目文档，涵盖面广、结构清晰。

### 5.2 问题

**1. 本地文件存储在生产环境不可靠**

```typescript
// user-store.ts
function writeStore(users: StoredUser[]) {
  fs.writeFileSync(STORE_PATH, JSON.stringify(users, null, 2));
}
```

用 `fs.writeFileSync` 写 JSON 文件有几个问题：
- **并发安全**：如果两个用户同时收藏，可能互相覆盖对方的数据
- **性能**：每次操作都要读写整个文件，用户一多就会变慢
- **持久性**：服务器重启或容器重建时，如果 `data/` 目录没有持久化卷，数据会丢失

**这在开发模式下完全没问题**，但如果要在生产环境真正使用，需要全面切换到 Supabase。

**2. 部分硬编码的中文错误信息**

```typescript
// api/auth/login/route.ts
return NextResponse.json({ error: "Email 或密碼錯誤" }, { status: 401 });
```

API 返回的错误信息是硬编码的中文，没有走国际化系统。如果英文用户遇到登入错误，看到的是中文提示。

**3. Client Component 过多使用 `useEffect` + `fetch` 模式**

搜索页、酒商详情页等都在 `useEffect` 里 `fetch` API，这种模式有几个缺点：
- 页面会先显示空白/加载状态，再显示数据（用户体验不好）
- 没有缓存机制——每次进入页面都重新请求
- 没有错误重试机制

更好的做法是用 Server Component 或 React Query 这样的数据获取库。

**4. 缺少输入验证**

```typescript
// api/wines/route.ts
const filters = {
  minPrice: searchParams.get("minPrice") ? Number(searchParams.get("minPrice")) : undefined,
};
```

API 接口没有系统性的输入验证。用户传入 `minPrice=abc` 会变成 `NaN`，可能导致意外行为。建议使用 `zod` 等验证库。

**5. 测试覆盖不够全面**

虽然有 Vitest 单元测试和 Playwright E2E 测试的配置，但测试文件主要集中在 `lib/` 层，页面组件和 API 路由的测试相对较少。

**6. 错误处理不够一致**

有些 API 路由有 try-catch，有些没有。如果数据库操作出错，可能返回 500 而不是友好的错误信息。

**7. mobile 端相对不完善**

手机 App 部分功能还不完整（Profile Tab、酒款标注等），和 Web 端的完成度差距较大。

---

## 6. 改进建议

### 6.1 优先级排序（如果你是初学者，从上到下依次处理）

#### 高优先级（影响基本功能和安全）

**1. 添加 API 输入验证**

```typescript
// 推荐使用 zod 库
import { z } from "zod";

const filterSchema = z.object({
  type: z.enum(["red", "white", "sparkling", "rosé", "dessert"]).optional(),
  minPrice: z.coerce.number().min(0).optional(),
  maxPrice: z.coerce.number().min(0).optional(),
  page: z.coerce.number().int().min(1).default(1),
});

export async function GET(request: NextRequest) {
  const result = filterSchema.safeParse(Object.fromEntries(request.nextUrl.searchParams));
  if (!result.success) {
    return NextResponse.json({ error: result.error.issues }, { status: 400 });
  }
  // 使用 result.data，类型安全
}
```

**为什么重要**：没有验证，用户可以传入任何数据，可能导致崩溃或安全漏洞。

**2. 统一错误处理**

建议创建一个统一的错误处理工具：

```typescript
// lib/api-response.ts
export function apiError(message: string, status: number, locale?: string) {
  return NextResponse.json({ error: message }, { status });
}

export function withErrorHandler(handler: Function) {
  return async (request: NextRequest) => {
    try {
      return await handler(request);
    } catch (error) {
      console.error(error);
      return apiError("Internal server error", 500);
    }
  };
}
```

**3. API 错误信息国际化**

把硬编码的中文错误信息改成根据用户语言返回。

#### 中优先级（影响用户体验和可维护性）

**4. 引入数据获取库**

对于 Client Component 的数据获取，建议使用 `SWR` 或 `TanStack Query`（React Query）：

```typescript
// 替代手写的 useEffect + fetch
import useSWR from "swr";

function SearchPage() {
  const { data, error, isLoading } = useSWR(`/api/wines?type=red`, fetcher);
  // 自动缓存、重试、去重
}
```

**5. 完善 README.md**

当前 README 太简单，建议包含：
- 一句话项目介绍
- 截图或 GIF 展示
- 快速启动步骤（指向 CLAUDE.md 即可）
- 项目架构简图

**6. 添加 API 响应示例到文档**

在 CLAUDE.md 或独立的 API 文档中，加上每个接口的请求和响应示例。

#### 低优先级（锦上添花）

**7. 组件库拆分**

目前 `components/ui/` 只有一个 `button.tsx`，随着项目增长，建议把常用的 UI 元素（Input、Modal、Toast 等）统一放到 `ui/` 下。

**8. 日志系统**

当前用 `console.log` 打印日志，建议使用结构化日志库（如 `pino`），方便生产环境排查问题。

**9. 环境变量验证**

在应用启动时验证必要的环境变量是否存在。

### 6.2 代码层面的具体改进点

| 文件 | 问题 | 建议 |
|------|------|------|
| `user-store.ts` | `writeFileSync` 可能并发冲突 | 使用文件锁或切换到数据库 |
| `mock-data.ts` | 文件太大（32 支酒的完整数据） | 考虑分拆成独立的数据文件 |
| `middleware.ts` | 逻辑较复杂，可读性一般 | 拆分成多个辅助函数 |
| 搜索页 | URL 状态管理手写较多 | 考虑用 `nuqs` 等 URL 状态管理库 |
| 登入流程 | 没有 CSRF 防护 | 添加 CSRF token |

---

## 7. 适配的业务场景分析

### 7.1 当前最适合的场景

**垂直领域的信息聚合 + 比价平台**

这个项目目前最适合做一个**小到中型规模的专业比价网站**，类似于：
- "香港红酒比价网"
- "某个品类的价格比较平台"
- "带 AI 推荐能力的导购网站"

它不是一个电商平台（用户不能在网站上直接购买），而是一个**信息平台**——帮用户找到最好的选择，然后引导他们去酒商的网站购买。

### 7.2 各场景的适配度

| 场景 | 适配度 | 原因 |
|------|--------|------|
| 垂直品类比价/导购网站 | ★★★★★ | 这就是它设计的核心用途 |
| 品牌官网 + 产品展示 | ★★★★☆ | 有精美的 UI、完善的 SEO、双语支持 |
| 商家管理后台 | ★★★★☆ | 完整的酒商 CRUD、分析看板、权限管理 |
| 社区/内容平台 | ★★★☆☆ | 社区功能已有基础框架，但还不够深（没有关注、推荐算法等） |
| 全功能电商平台 | ★★☆☆☆ | 缺少购物车、支付、订单、物流等核心电商功能 |
| 高并发/大规模应用 | ★★☆☆☆ | 文件存储模式不支持高并发，需要全面切换到 Supabase |

### 7.3 规模评估

| 指标 | 当前能力 | 瓶颈 |
|------|---------|------|
| 日活用户 | 几百到几千 | 超过几千后 JSON 文件读写成为瓶颈 |
| 酒款数量 | 几十到几百 | mock-data.ts 是内存数据，太多会占内存 |
| 酒商数量 | 几个到几十个 | 当前 6 家，架构支持扩展 |
| 并发请求 | 中等 | SQLite WAL 模式支持较高读并发，但写并发有限 |

### 7.4 业务增长时的瓶颈预测

**第一个瓶颈（用户 > 1000）：本地文件存储**

JSON 文件读写不支持并发，切换到 Supabase 是必要的。好消息是项目已经预留了 Supabase 的代码路径，切换成本不高。

**第二个瓶颈（酒款 > 500）：搜索性能**

当前的搜索是在内存中遍历所有酒款做 regex 匹配。酒款多了之后需要全文搜索引擎（Supabase 的 `tsvector` 或 Meilisearch）。

**第三个瓶颈（日活 > 10,000）：服务器架构**

单台服务器 + PM2 无法处理大量请求。需要考虑：
- 负载均衡（多台服务器分担请求）
- CDN（静态资源缓存）
- 数据库连接池

**第四个瓶颈（AI 使用量增加）：API 成本**

Claude API 按使用量收费，高频使用时成本可能不低。需要考虑：
- 更精细的频率限制
- 缓存常见问题的回答
- 考虑使用更轻量的模型处理简单查询

---

## 8. 给初学者的学习建议与总结

### 8.1 项目当前水平

这个项目处于**中等偏上的水平**：

- **功能完整度**：Web 端已经相当完整，从前台浏览到后台管理到 AI 助手都有
- **代码质量**：架构设计合理，分层清晰，但细节处还有改进空间
- **工程化程度**：有 TypeScript、ESLint、测试框架，但自动化测试覆盖还不够
- **生产就绪度**：已经可以用来做 Demo 和小规模运营，但离真正的高并发生产环境还有距离

用一句话概括：**这是一个设计用心、功能丰富、适合学习的全栈项目，也是一个有真实商业价值潜力的产品原型**。

### 8.2 学习路线图

#### 第一阶段：建立全局认识（1-2 天）

1. **读 `CLAUDE.md`**——通读一遍，建立全局印象
2. **跑起来看效果**——`npm run dev`，打开 `http://localhost:3001/zh-HK`，把每个页面都点一遍
3. **用 Demo 帐号体验后台**——用管理员帐号登入 `/login`，看看后台长什么样
4. **看 `package.json`**——了解项目用了哪些依赖

#### 第二阶段：理解数据流（3-5 天）

1. **从 `WineCard.tsx` 开始**——这是最简单的组件，看它接收什么数据、怎么渲染
2. **追踪首页数据流**——从 `page.tsx` 到 `queries.ts` 到 `mock-data.ts`，理解数据从哪来
3. **理解 `queries.ts`**——这是数据层的核心，理解"双重数据层"的设计
4. **理解 API 路由**——看 `api/wines/route.ts`，理解前端怎么通过 HTTP 请求获取数据

#### 第三阶段：理解用户交互（3-5 天）

1. **看搜索页**——理解 Client Component 的工作方式、URL 状态管理
2. **看登入流程**——从 `/login` 到 `api/auth/login` 到 `middleware.ts`，理解认证机制
3. **看收藏功能**——理解"用户操作 → API → Store → 文件更新"的完整链路
4. **看 AI 选酒**——理解 SSE 流式响应和 Tool Use 的概念

#### 第四阶段：理解工程化（3-5 天）

1. **理解 TypeScript 类型**——看 `types.ts` 和 `mock-data.ts` 里的接口定义
2. **理解国际化**——看 `i18n/` 目录和 `messages/*.json`
3. **理解中间件**——看 `middleware.ts` 是怎么做路由保护的
4. **看测试文件**——理解怎么用 Vitest 写单元测试

#### 第五阶段：尝试修改（持续）

1. **改文案**——修改 `messages/zh-HK.json` 里的文字，看效果
2. **改样式**——修改 `globals.css` 里的颜色变量，看全站颜色变化
3. **加一支酒**——在 `mock-data.ts` 里添加一支新酒
4. **加一个 API**——在 `api/` 下新建一个简单的接口
5. **加一个页面**——在 `[locale]/` 下新建一个页面

### 8.3 推荐先理解的概念

按照**先易后难**的顺序：

| 概念 | 为什么要先学 | 在项目里对应什么 |
|------|------------|----------------|
| React 组件 | 所有页面都是组件 | `WineCard.tsx`、`SceneCard.tsx` |
| Props（属性传递） | 组件之间怎么传数据 | `<WineCard wine={...} />` |
| Server vs Client Component | Next.js 的核心概念 | `"use client"` 标记 |
| 文件系统路由 | URL 和文件的关系 | `app/[locale]/wines/[slug]/page.tsx` |
| `fetch` API | 前端怎么和后端通信 | 搜索页的数据获取 |
| async/await | 异步操作 | `await getFeaturedWines()` |
| Cookie | 用户身份识别 | 登入后的 `wb_session` |
| JSON 文件读写 | 最简单的数据持久化 | `data/users.json` |

### 8.4 最终总结

**这个项目教会你的东西：**

1. **全栈开发的完整链路**——从用户看到的页面，到后端 API，到数据存储，每一层都有
2. **真实项目的架构设计**——不是教程里的 Todo App，而是有认证、权限、国际化、AI 集成的完整应用
3. **渐进式复杂度**——从简单的静态页面到复杂的 AI 聊天，难度递增
4. **工程化实践**——TypeScript、ESLint、测试、部署、文档，软件工程不只是写代码

**一句话建议：**

先跑起来，再看代码；先看整体，再看细节；先理解"为什么"，再记住"是什么"。不要试图一次看懂所有代码，从你最感兴趣的功能入手，沿着数据流一路追踪下去。

祝你学习顺利！
