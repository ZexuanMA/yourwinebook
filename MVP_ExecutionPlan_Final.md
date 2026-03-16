# Your Wine Book — MVP 落地执行方案（最终版）

> **基于现有代码审计 + 两份方案文档合并优化**
> **日期**: 2026-03-16
> **原则**: 不重建已有能力，只补缺口；先底座再闭环再稳定

---

## 0. 现状评估与方案定位

### 0.1 已有资产分层评估

**UI / 页面层 — 不动**

| 模块 | 完成度 | 说明 |
|------|--------|------|
| Next.js Web 框架 | ✅ 100% | App Router + TypeScript + Tailwind 4 + shadcn/ui |
| 国际化 | ✅ 100% | next-intl，zh-HK + en 双语完整 |
| 前台页面 | ✅ 100% | 首页/搜索/酒款详情/酒商/场景/AI/关于/入驻/账户 共 10+ 页面 |
| 后台 Dashboard | ✅ 100% | 酒款管理/分析/账户/管理员(账号/用户/申请) |
| 社区前端页面 | ✅ 90% | Feed 列表 + 发帖页 + 帖子详情页 |
| 搜索 + 筛选 UI | ✅ 100% | 多维筛选 + 自动补全 + URL 同步 + 分页 |
| API 路由入口 | ✅ 100% | 39 个 API endpoints（接口签名不变，底层切数据源） |

**数据层 — 必须迁移到 Supabase（否则双端数据不通）**

| 文件 | 当前方式 | 函数数 | Supabase 就绪度 | 迁移难度 |
|------|---------|--------|----------------|---------|
| `queries.ts` | Supabase/mock 双通道 | 16 | ✅ **已全部实现** | 零（加环境变量即切换） |
| `community-store.ts` | JSON 文件 | 11 | ❌ 纯文件 | **高** — 数据模型完全不同 |
| `user-store.ts` | JSON 文件 | 11 | ❌ 纯文件 | **高** — 需切到 Supabase Auth |
| `merchant-store.ts` | JSON 文件 | 8 | ❌ 纯文件 | **中** — 表结构变化 |
| `admin-store.ts` | JSON 文件 | 4 | ❌ 纯文件 | **低** — 单条记录 |
| `application-store.ts` | JSON 文件 | 3 | ❌ 纯文件 | **低** — 简单 CRUD |
| `analytics-store.ts` | SQLite | 4 | ❌ SQLite | **可延后** — 迁到 PostHog |
| `price-store.ts` | JSON 文件 | 5 | ❌ 纯文件 | **中** — 合并到 merchant_products |
| `mock-auth.ts` | 编排层 | 3 | ❌ 纯文件 | **中** — 替换为 Supabase Auth |
| `middleware.ts` | Cookie 检查 | — | ❌ 纯 cookie | **中** — 改为 Supabase session |

> **关键发现**: `queries.ts`（酒款/酒商/场景等公开数据查询）的 Supabase 分支**已全部写好**，加上环境变量即可切换。真正需要迁移的是认证层、社区层、用户层和商户管理层。

### 0.2 需要新建的部分

| 模块 | 优先级 | 工作量评估 |
|------|--------|-----------|
| C 端移动 App（Expo） | P0 | 最大单项，~50% 总工作量 |
| **Web 数据层迁移到 Supabase** | **P0** | **~15% 总工作量，不做则双端数据不通** |
| Supabase Schema + RLS | P0 | 数据库底座 |
| PostGIS 地理空间（找店闭环） | P0 | 门店坐标 + 附近查询 + 扩圈 |
| 安全上传链路 | P0 | 预签名 URL + 服务端校验 |
| 审核/举报/拉黑体系 | P0 | 原始举报 + 审核队列 + 封禁 |
| Monorepo 工程化 | P1 | pnpm workspace + Turborepo |
| 监控/埋点 | P1 | Sentry + PostHog |
| Deep Link | P1 | URL scheme + Universal Link |
| 推送通知 | P2 | Expo Push（Beta 增强项） |

### 0.3 Web 数据层迁移 — 为什么必须做

如果 Web 端继续用 JSON 文件、App 端用 Supabase，会出现**三个致命问题**：

**问题 1: 数据分裂 — 两个数据库各跑各的**
```
用户在 App 发帖 → 写入 Supabase → Web 社区页从 community.json 读 → 看不到
商户在 Web 后台改价格 → 写入 prices.json → App 从 Supabase 读 → 也看不到
```

**问题 2: 认证不通 — 两套用户体系**
```
Web 注册: 用户写入 data/users.json，cookie = wb_user_session
App 注册: 用户写入 Supabase Auth profiles 表，token = JWT
→ 同一个人在两端是两个账号，数据不互通
```

**问题 3: 商户/管理员操作割裂**
```
管理员在 Web 封禁用户 → 改 data/users.json status
但 App 端查 Supabase profiles → 该用户仍然正常
→ 封禁不生效
```

**迁移原则**: UI / 页面 / 组件不动，只替换底层数据源。所有 store 文件保持相同的导出函数签名，内部实现从「读写 JSON」切换为「调用 Supabase」。API routes 调用 store 函数，签名不变则不需改动。

### 0.3 复用策略

现有 Web 应用中可直接复用到移动端的逻辑：

| 可复用 | 复用方式 |
|--------|---------|
| TypeScript 类型定义 | 提取到 `packages/domain` |
| Zod 校验规则 | 提取到 `packages/domain` |
| 业务常量/枚举 | 提取到 `packages/domain` |
| React Query keys | 提取到 `packages/query-keys` |
| 营业状态判断逻辑 | 提取为纯函数 |
| 社区内容结构 | Supabase 迁移后两端共用 |
| i18n 文案 | Web 用 next-intl，App 用 i18next，JSON 结构可转换 |

不可复用（必须各端自行实现）：

| 不可复用 | 原因 |
|----------|------|
| Supabase client | Web 用 Cookie adapter，App 用 SecureStore |
| Auth Provider | 生命周期不同 |
| 定位 / 相机 hooks | 原生 API 不同 |
| 导航路由 | Next.js vs expo-router |
| 列表渲染 | Web DOM vs FlashList |

### 0.5 Web 端改动范围总结

| 层 | 动不动 | 说明 |
|----|--------|------|
| UI 页面 / 组件 | **不动** | 所有 `.tsx` 页面文件不改 |
| 路由结构 | **不动** | `app/` 目录不变 |
| i18n 文案 | **不动** | `messages/*.json` 不变 |
| Tailwind 样式 | **不动** | `globals.css` 不变 |
| `queries.ts` 查询层 | **不动** | Supabase 分支已全部实现，加环境变量自动切换 |
| `community-store.ts` | **必须重写** | 数据模型完全不同（嵌套→关系表） |
| `user-store.ts` | **必须重写** | 认证和书签模型变化 |
| `merchant-store.ts` | **必须重写** | 表结构变化，创建变为多表事务 |
| `admin-store.ts` | **必须重写** | 合并到 Supabase Auth |
| `application-store.ts` | **重写** | 简单 CRUD，工作量小 |
| `price-store.ts` | **重写** | overlay 概念消失，直接查 merchant_products |
| `mock-auth.ts` | **重写** | 替换为 Supabase Auth |
| `middleware.ts` | **重写** | Cookie 检查改为 Supabase session |
| `analytics-store.ts` | **不动** | 保留 SQLite，MVP 后再考虑迁移 |
| API routes (`/api/*`) | **部分改动** | 仅当 store 函数返回格式变化时需微调 |

---

## 1. MVP 范围定义（锁死不扩）

### 1.1 验证两个核心闭环

**闭环 1 — 找店**
```
打开 App → 授权定位 → 附近酒商列表 → 收藏 → 外部导航到店
```

**闭环 2 — 社区**
```
浏览 Feed → 发图文酒评 → 点赞/评论 → 举报/拉黑 → 回访
```

### 1.2 MVP 交付物

| 交付物 | 端 | 必须 |
|--------|----|----|
| 定位找店 + 手动选区降级 | C 端 App | ✅ |
| 门店收藏 + 外部导航 | C 端 App | ✅ |
| 时间倒序单列 Feed | C 端 App | ✅ |
| 图文发帖（至多 9 图） | C 端 App | ✅ |
| 点赞 / 评论 / 帖子收藏 | C 端 App | ✅ |
| 举报 / 拉黑 | C 端 App | ✅ |
| 门店管理（营业时间 + 坐标校准） | B 端 Web | ✅ |
| 官方发帖 | B 端 Web | ✅ |
| 审核后台（举报队列 + 下架 + 封禁） | B 端 Web | ✅ |
| 种子数据导入 | B 端 Web | ✅ |

### 1.3 明确不做

- 电商 / 支付 / 购物车
- 站内 IM
- 瀑布流
- 推荐算法
- App 内路线规划
- 短视频
- 话题热榜
- KOL 认证
- 自动翻译 UGC

---

## 2. 技术架构

### 2.1 总体架构

```
┌─────────────────────────────────────────────────┐
│                Supabase Cloud                    │
│  Auth(GoTrue) │ Database(PG+PostGIS) │ Storage  │
│  Edge Functions                                  │
└─────────┬──────────────────┬────────────────────┘
          │                  │
    ┌─────┴─────┐      ┌────┴──────────┐
    │ C端 App   │      │ B端 Web       │
    │ Expo/RN   │      │ Next.js       │
    │ (新建)    │      │ (演进现有)     │
    └───────────┘      └───────────────┘
```

### 2.2 技术栈

| 层级 | C 端 App（新建） | B 端 Web（现有演进） |
|------|-----------------|-------------------|
| 框架 | Expo SDK 52+ / React Native | Next.js 16 (App Router) |
| 状态(服务端) | TanStack React Query v5 | 保留现有 fetch + 迁移到 React Query |
| 状态(客户端) | Zustand | 按需 |
| 列表 | @shopify/flash-list | 现有 |
| 导航 | expo-router | App Router |
| i18n | i18next + react-i18next | next-intl（保留） |
| 图片压缩 | expo-image-manipulator | — |
| 崩溃监控 | Sentry | Sentry |
| 行为埋点 | PostHog | PostHog |

### 2.3 Monorepo 结构

```
your-wine-book/
├── apps/
│   ├── mobile/                  # Expo App（新建）
│   │   ├── app/                 # expo-router 文件路由
│   │   │   ├── (tabs)/
│   │   │   │   ├── index.tsx    # Feed 首页
│   │   │   │   ├── explore.tsx  # 找店
│   │   │   │   ├── post.tsx     # 发帖入口
│   │   │   │   └── profile.tsx  # 个人中心
│   │   │   ├── store/[id].tsx
│   │   │   ├── post/[id].tsx
│   │   │   └── auth/
│   │   ├── components/
│   │   ├── hooks/
│   │   └── lib/
│   │       ├── supabase.ts      # SecureStore adapter
│   │       ├── auth-provider.tsx
│   │       ├── upload.ts
│   │       └── location.ts
│   │
│   └── web/                     # 现有 Next.js（迁移过来）
│       └── (保留现有结构)
│
├── packages/
│   ├── domain/                  # 纯逻辑共享层
│   │   └── src/
│   │       ├── types/           # 从现有 types.ts 提取
│   │       ├── validators/      # Zod schema
│   │       ├── constants/       # 角色/状态枚举
│   │       └── rules/           # 纯函数(权限判断/营业状态等)
│   │
│   ├── query-keys/              # React Query key 常量
│   └── supabase-types/          # supabase gen types 输出
│
├── supabase/
│   ├── migrations/
│   ├── functions/               # Edge Functions
│   │   ├── create-upload-intent/
│   │   ├── finalize-post/
│   │   ├── moderate-content/
│   │   └── create-comment/
│   └── seed.sql
│
├── turbo.json
├── pnpm-workspace.yaml
└── .github/workflows/
```

---

## 3. 数据模型（Supabase Schema）

### 3.1 核心表一览

共 18 张表，分 6 组：

| 组 | 表 | 核心字段 |
|----|----|---------|
| **身份** | `profiles` | id(=auth.users.id), nickname, avatar_url, bio, default_role |
| | `merchant_entities` | id, name, brand_story, logo_url, status |
| | `merchant_staff` | profile_id, merchant_id, role(owner/manager/staff) |
| **地理** | `merchant_locations` | merchant_id, address, district, phone, business_hours(JSONB), location(GEOGRAPHY Point 4326) |
| | `merchant_bookmarks` | profile_id, merchant_id |
| **酒款** | `products` | name, name_en, category, region, vintage, description |
| | `merchant_products` | merchant_id, product_id, display_price, is_available |
| **社区** | `posts` | author_profile_id, acting_merchant_id, is_official, content, status |
| | `post_media` | post_id, original_url, thumbnail_url, width, height, sort_order |
| | `post_likes` | post_id, profile_id (联合主键，天然幂等) |
| | `post_comments` | post_id, profile_id, content, status, idempotency_key |
| | `post_bookmarks` | profile_id, post_id |
| | `post_products` | post_id, product_id |
| | `follows` | follower_id, following_profile_id |
| **风控** | `reports` | reporter_id, target_type, target_id, reason (只增不改) |
| | `moderation_cases` | target_type, target_id, source, risk_level, status, resolution |
| | `blocks` | blocker_id, blocked_profile_id |
| **上传** | `media_uploads` | uploader_id, object_path, purpose, status, expires_at |

### 3.2 关键索引

| 索引 | 目的 |
|------|------|
| `merchant_locations.location` GIST | 空间查询性能 |
| `posts(created_at DESC, id DESC)` | Feed 游标分页 |
| `post_comments(post_id, created_at)` | 评论分页 |
| `post_likes(post_id, profile_id)` PK | 点赞幂等 |
| `merchant_bookmarks(profile_id, merchant_id)` PK | 收藏幂等 |
| `reports(target_type, target_id)` | 举报查询 |
| `moderation_cases(status, risk_level, created_at)` | 审核队列 |

### 3.3 从现有数据迁移

现有 JSON 文件 → Supabase 迁移对照：

| 现有 | 迁移到 |
|------|--------|
| `data/merchants.json` | `merchant_entities` + `profiles` + `merchant_staff` |
| `data/users.json` 中的用户 | `profiles`（通过 Supabase Auth） |
| `data/users.json` 中的书签 | `merchant_bookmarks` + `post_bookmarks` |
| `data/community.json` 中的帖子 | `posts` + `post_media` + `post_products` |
| `data/community.json` 中的评论 | `post_comments` |
| `data/community.json` 中的点赞 | `post_likes` |
| `data/admin.json` | `profiles`（管理员角色） |
| `data/applications.json` | 可保留 JSON 或迁入新表 |
| `data/analytics.db` | 保留 SQLite 或迁移到 PostHog |
| `src/lib/mock-data.ts` 中的酒款 | `products` + `merchant_products` |

---

## 4. 分阶段执行路线图

### 4.0 总览

```
Week 1-2     Week 3-5          Week 6-7     Week 8-10      Week 11-12
|-----------|-----------------|------------|--------------|-----------|
|← P0a ───→|← P0b ──────────────────────→|← P1A ───────→|← P1B ──────────────→|←P1C─→|
| 项目骨架   | 上传+审核+种子数据            | 找店闭环      | 社区闭环              | 加固  |
| +基础设施  | +⚠️ Web 数据层迁移           |               |                      |       |
| 1.5 周    | 3 周                        | 2 周          | 3 周                  |1.5-2周|
```

**串行总排期**: 约 11-12 周（P0b 因新增 Web 迁移多 0.5 周）
**有并行能力**: 约 9-10 周（P1A 后端/B端 与 P1B 部分并行；P0b 中上传/审核/迁移三组并行）

---

## 5. Phase 0a — 项目骨架与迁移准备（1.5 周）

> **目标**: Monorepo 跑通、Expo 可启动、共享包可引用、Schema V1 就绪

### P0a-01 初始化 Monorepo

**任务**: 将现有项目转为 `pnpm workspace + Turborepo` 结构

**具体操作**:
1. 在项目根目录创建 `pnpm-workspace.yaml`
2. 创建 `turbo.json` 定义 dev/build/lint pipeline
3. 将现有代码移入 `apps/web/`
4. 创建 `apps/mobile/` 和 `packages/` 空目录
5. 配置根 `package.json` 的 workspace scripts

**交付标准**:
- [ ] `pnpm install` 成功
- [ ] `pnpm --filter web dev` 可正常启动现有 Web 应用
- [ ] `pnpm --filter web build` 构建成功
- [ ] 根目录 `pnpm dev` 可同时启动 Web

**预估工时**: 4h

---

### P0a-02 初始化 Expo Mobile 项目

**任务**: 在 `apps/mobile/` 创建 Expo Development Build

**具体操作**:
1. `npx create-expo-app apps/mobile --template tabs`
2. 配置 `app.json`: scheme, bundle ID, 应用名
3. 安装核心依赖: expo-router, react-native-safe-area-context, expo-status-bar
4. 配置 TypeScript（引用根 tsconfig）
5. 创建基础 Tab 导航结构: Feed / 找店 / 发帖 / 我的

**交付标准**:
- [ ] `pnpm --filter mobile start` 可启动 Expo dev server
- [ ] iOS 模拟器/Android 模拟器可运行 Development Build
- [ ] Tab 导航可正常切换
- [ ] 不依赖 Expo Go（使用 development build）

**预估工时**: 3h

---

### P0a-03 配置 Metro Monorepo 解析

**任务**: 解决 Expo 在 monorepo 下的依赖解析问题

**具体操作**:
```js
// apps/mobile/metro.config.js 关键配置
const config = getDefaultConfig(projectRoot);
config.watchFolders = [monorepoRoot];
config.resolver.nodeModulesPaths = [
  path.resolve(projectRoot, 'node_modules'),
  path.resolve(monorepoRoot, 'node_modules'),
];
config.resolver.disableHierarchicalLookup = true;
```

**交付标准**:
- [ ] `import { PostStatus } from '@ywb/domain'` 在 App 中可正常解析
- [ ] 修改 packages/ 中代码后 App 可热更新
- [ ] 不出现重复依赖冲突

**预估工时**: 2h

---

### P0a-04 建立共享包 `packages/domain`

**任务**: 从现有 `src/lib/types.ts` 提取纯逻辑共享层

**具体操作**:
1. 创建 `packages/domain/package.json`（name: `@ywb/domain`）
2. 迁移类型定义:
   - `types/profile.ts` — 用户档案类型
   - `types/merchant.ts` — 商户/门店类型
   - `types/post.ts` — 帖子/评论/点赞类型
   - `types/product.ts` — 酒款类型
   - `types/moderation.ts` — 举报/审核类型
3. 创建 Zod 校验:
   - `validators/post.ts` — 内容长度、图片数量(1-9)
   - `validators/comment.ts` — 评论校验
   - `validators/merchant.ts` — 商户信息校验
4. 创建常量:
   - `constants/roles.ts` — consumer / owner / manager / staff / admin
   - `constants/status.ts` — draft / published / hidden / deleted / banned
   - `constants/limits.ts` — MAX_IMAGES=9, MAX_CONTENT_LENGTH=5000 等
5. 创建纯函数:
   - `rules/business-hours.ts` — 营业状态判断（从现有逻辑提取）
   - `rules/permissions.ts` — 权限判断

**交付标准**:
- [ ] Web 端可 `import { WineRow } from '@ywb/domain'`
- [ ] Mobile 端可 `import { PostStatus } from '@ywb/domain'`
- [ ] 不包含任何运行时耦合代码（无 fetch、无 DOM、无 RN API）
- [ ] 类型与现有 Supabase schema 完全对应

**预估工时**: 4h

---

### P0a-05 建立 `packages/query-keys`

**任务**: 统一 React Query key 命名

**具体操作**:
```typescript
// packages/query-keys/src/posts.ts
export const postKeys = {
  all: ['posts'] as const,
  feed: () => [...postKeys.all, 'feed'] as const,
  detail: (id: string) => [...postKeys.all, 'detail', id] as const,
  byAuthor: (profileId: string) => [...postKeys.all, 'author', profileId] as const,
};
```

**交付标准**:
- [ ] 双端查询 key 风格一致
- [ ] 每个业务实体都有 key factory

**预估工时**: 1h

---

### P0a-06 建立 `packages/supabase-types`

**任务**: 配置 Supabase 类型自动生成

**具体操作**:
1. 创建 `packages/supabase-types/`
2. 配置 `supabase gen types` 脚本
3. 添加到根 `package.json` scripts

**交付标准**:
- [ ] Schema 更新后可自动同步类型到 `database.ts`
- [ ] 双端可引用 `import { Database } from '@ywb/supabase-types'`

**预估工时**: 1h

---

### P0a-07 编写 Schema V1 迁移文件

**任务**: 创建 Supabase 数据库的完整 Schema

**具体操作**:
1. 创建 `supabase/migrations/001_init.sql`
2. 包含全部 18 张表 + PostGIS 扩展 + 索引 + 约束
3. 包含 `update_updated_at()` 触发器
4. 包含 `get_nearby_stores` RPC 函数
5. 包含 `get_feed` RPC 函数

**交付标准**:
- [ ] `supabase db reset` 成功建出所有表
- [ ] 所有约束和索引就位
- [ ] RPC 函数可执行

**预估工时**: 6h

---

### P0a-08 配置基础 RLS 策略

**任务**: 为所有表设置行级安全

**RLS 设计原则**:
- 底线安全放 RLS，复杂写操作走 Edge Function
- 读：公开数据所有人可读，私有数据只读自己
- 写：只能改自己的资料/帖子/评论/收藏

**核心策略**:
```
profiles:     SELECT 公开 | UPDATE 只能改自己
posts:        SELECT 已发布+未删除 | UPDATE 只能改自己 | INSERT 需登录
post_likes:   SELECT 公开 | INSERT/DELETE 只能操作自己
post_comments: SELECT 公开 | INSERT 需登录 | UPDATE 只能改自己
merchant_locations: SELECT status=active | UPDATE 只有该商户 manager/owner
reports:      INSERT 需登录 | SELECT 只能看自己的
```

**交付标准**:
- [ ] 普通用户越权写入失败
- [ ] 商户员工不能访问其他商户数据
- [ ] 每张表都有明确的读写策略

**预估工时**: 4h

---

### P0a-09 编写 RLS 集成测试

**任务**: 防止权限回归

**测试场景**:
```
✅ 普通用户只能修改自己的 profile
✅ 普通用户只能删除自己的帖子
✅ 普通用户无法修改他人帖子
✅ 商户 staff 只能修改自家门店
✅ 商户 staff 无法修改其他商户门店
✅ 管理员可以隐藏任何帖子
✅ 管理员可以封禁用户
✅ 被封禁用户无法发帖/评论
✅ 被拉黑用户的内容在 Feed 中不可见
```

**交付标准**:
- [ ] 所有越权场景测试覆盖
- [ ] CI 中可自动运行

**预估工时**: 4h

---

### P0a-10 Mobile 端 Auth Provider

**任务**: 定义移动端登录态生命周期

**设计**:
```
AuthProvider
├── 初始化从 SecureStore 读取 session
├── supabase.auth.setSession() 恢复
├── onAuthStateChange 监听
│   ├── SIGNED_IN → 存 session
│   ├── TOKEN_REFRESHED → 更新
│   ├── SIGNED_OUT → 清除 + reset Query cache
│   └── USER_UPDATED → 更新 profile cache
├── 暴露 signIn / signUp / signOut / session / user
└── 暴露 isLoading / isAuthenticated
```

**交付标准**:
- [ ] 可模拟 session restore 流程
- [ ] 登出后 React Query 缓存清除
- [ ] SecureStore 持久化可靠

**预估工时**: 3h

---

### P0a-11 Web 端 Supabase Client 初始化

**任务**: 建立 Web 端 Supabase 连接层（为后续所有 store 迁移提供基础）

**具体操作**:
1. 安装 `@supabase/ssr` + `@supabase/supabase-js`
2. 创建 `lib/supabase-server.ts`（服务端 Cookie adapter，用于 Server Component + API Route）
3. 创建 `lib/supabase-browser.ts`（客户端 Browser client，用于 Client Component）
4. 配置环境变量 `NEXT_PUBLIC_SUPABASE_URL` + `NEXT_PUBLIC_SUPABASE_ANON_KEY`
5. 验证连接：在一个测试 API route 中成功查询 Supabase

**交付标准**:
- [ ] 服务端可通过 `createServerClient()` 执行查询
- [ ] 客户端可通过 `createBrowserClient()` 执行查询
- [ ] 现有 `queries.ts` 加上环境变量后自动切换到 Supabase 分支（已预置）
- [ ] 现有 mock fallback 保留可用（无环境变量时）

**预估工时**: 3h

---

### P0a-12 React Query 基础设施

**任务**: 统一数据请求层

**具体操作**:
1. Mobile: 初始化 QueryClient + `persistQueryClient` + AsyncStorage persister
2. Web: 初始化 QueryClient（可后续逐步替换现有 fetch）
3. 配置策略:
   - `gcTime`: 24 小时
   - `staleTime`: Feed 30s / 门店列表 5min / 收藏 1min
   - 离线持久化 `maxAge`: 7 天
   - 默认重试: 3 次 + 指数退避

**交付标准**:
- [ ] Mobile: 断网后重开可回显最近列表
- [ ] Web: 示例查询可跑通

**预估工时**: 3h

---

### P0a-13 i18n 接入（Mobile）

**任务**: 移动端国际化框架

**具体操作**:
1. 安装 `i18next` + `react-i18next`
2. 创建翻译资源文件（可从现有 `messages/zh-HK.json` 转换格式）
3. 配置默认繁中 + 英文
4. 语言跟随系统设置

**交付标准**:
- [ ] 至少 1 个页面可切换语言
- [ ] 翻译 key 与 Web 端保持一致

**预估工时**: 3h

---

### P0a-14 CI 基础流程

**任务**: 建立最小 CI

**具体操作**:
1. `.github/workflows/ci.yml`
2. lint + typecheck + test 占位
3. 支持 monorepo 并行

**交付标准**:
- [ ] PR 自动触发检查

**预估工时**: 2h

---

### P0a-15 Deep Link 基础配置

**任务**: 配置 App URL scheme

**具体操作**:
1. `app.json` 配置 scheme: `yourwinebook`
2. iOS: associatedDomains
3. Android: intentFilters
4. expo-router 路由映射

**URL 方案**:
```
yourwinebook://post/{id}    → 帖子详情
yourwinebook://store/{id}   → 门店详情
yourwinebook://invite/{code} → 邀请注册
```

**交付标准**:
- [ ] 测试链接可打开指定页面

**预估工时**: 2h

---

### P0a 阶段总结

| ID | 任务 | 前置 | 工时 | 角色 |
|----|------|------|------|------|
| P0a-01 | Monorepo 初始化 | 无 | 4h | BE/全栈 |
| P0a-02 | Expo 项目初始化 | 01 | 3h | MOB |
| P0a-03 | Metro Monorepo 配置 | 02 | 2h | MOB |
| P0a-04 | 共享包 domain | 01 | 4h | BE |
| P0a-05 | Query Keys 包 | 04 | 1h | BE |
| P0a-06 | Supabase Types 包 | 01 | 1h | BE |
| P0a-07 | Schema V1 迁移文件 | 无 | 6h | BE |
| P0a-08 | RLS 策略 | 07 | 4h | BE |
| P0a-09 | RLS 集成测试 | 08 | 4h | BE/QA |
| P0a-10 | Mobile Auth Provider | 02 | 3h | MOB |
| P0a-11 | Web Supabase Client 初始化 | 07 | 3h | WEB |
| P0a-12 | React Query 基础 | 02,04 | 3h | MOB/WEB |
| P0a-13 | Mobile i18n | 02 | 3h | MOB |
| P0a-14 | CI 流程 | 01 | 2h | BE |
| P0a-15 | Deep Link 配置 | 02 | 2h | MOB |

**可并行组**:
- 组 A（后端）: 07 → 08 → 09（可与组 B 并行）
- 组 B（前端）: 01 → 02 → 03, 04, 10, 13, 15
- 组 C（Web）: 11（依赖 07，为 P0b Web 迁移打基础）

---

## 6. Phase 0b — 底座: 上传 + 审核 + 种子数据 + Web 数据层迁移（3 周）

> **目标**: 上传链路跑通、审核后台可用、种子数据可导入、**Web 端数据层切到 Supabase（双端数据统一）**

### P0b-01 配置 Supabase Storage

**任务**: 创建存储 bucket 和路径规范

**路径规范**:
```
posts/{user_id}/{upload_id}.jpg          # 帖子图片
posts/{user_id}/{upload_id}_thumb.jpg    # 缩略图
avatars/{user_id}.jpg                    # 头像
merchants/{merchant_id}/logo.png         # 商户 Logo
```

**交付标准**:
- [ ] Storage bucket 创建成功
- [ ] RLS 策略: 只能上传到自己的目录
- [ ] 文件大小限制: 10MB

**预估工时**: 2h

---

### P0b-02 开发 `create-upload-intent` Edge Function

**任务**: 为客户端发帖生成上传授权

**输入**:
```json
{ "count": 3, "purpose": "post_media" }
```

**输出**:
```json
{
  "intents": [
    { "id": "uuid", "object_path": "posts/{uid}/{id}.jpg", "signed_url": "..." },
    ...
  ]
}
```

**逻辑**:
1. 验证用户已登录
2. 检查频率限制（每天 50 张）
3. 创建 `media_uploads` 记录（status=pending, expires_at=1h后）
4. 生成预签名上传 URL
5. 返回意图列表

**交付标准**:
- [ ] 返回有效的预签名 URL
- [ ] `media_uploads` 记录创建成功
- [ ] 未登录返回 401
- [ ] 超频率返回 429

**预估工时**: 4h

---

### P0b-03 开发 `finalize-post` Edge Function

**任务**: 服务端校验上传后正式创建帖子

**输入**:
```json
{
  "content": "文字内容",
  "upload_ids": ["id1", "id2"],
  "product_ids": ["wine-id"],   // 可选
  "is_official": false,
  "acting_merchant_id": null    // 官方发帖时必填
}
```

**校验步骤**:
1. 所有 `upload_ids` 的 uploader_id = 当前用户
2. 所有上传的 status = "uploaded"（文件确实存在）
3. 所有上传未过期
4. 如果 `is_official=true`，校验用户是该商户的 staff
5. 事务写入: `posts` + `post_media` + `post_products`
6. 标记 `media_uploads` 为 verified

**交付标准**:
- [ ] 未上传完成的文件不能创建帖子
- [ ] 非法 upload_id 返回 400
- [ ] 官方发帖权限校验正确
- [ ] 事务失败时回滚

**预估工时**: 6h

---

### P0b-04 媒体安全校验

**任务**: 限制非法媒体写入

**规则**:
| 场景 | 最大尺寸 | 质量 | 格式 | 文件限制 |
|------|---------|------|------|---------|
| 帖子图片 | 1920px 长边 | 0.8 | JPEG | 10MB |
| 缩略图 | 400px 长边 | 0.6 | JPEG | 1MB |
| 头像 | 512px | 0.8 | JPEG | 5MB |
| 商户 Logo | 1024px | 0.9 | PNG | 5MB |

**交付标准**:
- [ ] 非法 MIME 类型被拒绝
- [ ] 超大文件被拒绝
- [ ] 越权路径无法 finalize

**预估工时**: 2h

---

### P0b-05 App 端图片选择 + 压缩 + 上传 SDK

**任务**: 客户端完整上传链路

**具体操作**:
1. 图片选择器（expo-image-picker, 至多 9 张）
2. 压缩（expo-image-manipulator, 按上表规格）
3. 上传 SDK:
   - 调用 `create-upload-intent` 获取授权
   - 逐张上传到 signed_url（不并行，防 OOM）
   - 单张失败自动重试 3 次
   - 显示每张进度 + 总进度
   - 全部完成后调用 `finalize-post`
4. 本地低清预览（上传前即时显示）

**交付标准**:
- [ ] 选 3 张图 → 压缩 → 上传 → finalize 全流程成功
- [ ] 单张失败可重试
- [ ] 上传中有进度显示
- [ ] 不出现 OOM

**预估工时**: 8h

---

### P0b-06 审核后台 — 举报队列页

**任务**: 管理员查看待处理举报案件

**设计**:
- 列表展示: 风险等级标签 + 目标类型 + 举报理由 + 时间
- 筛选: 按状态(pending/reviewing/resolved) + 按风险等级 + 按目标类型
- 排序: 高风险优先 + 时间倒序

**交付标准**:
- [ ] 管理员可查看全部案件列表
- [ ] 筛选和排序正常工作
- [ ] 非管理员无法访问

**预估工时**: 6h

---

### P0b-07 审核后台 — 案件详情 + 一键隐藏

**任务**: 管理员查看目标内容并执行下架操作

**功能**:
1. 展示被举报的原始内容（帖子/评论预览）
2. 展示举报理由和补充说明
3. 一键隐藏: 将帖子/评论 status 改为 hidden
4. 审核状态回写: moderation_cases.status → resolved, resolution → hidden

**交付标准**:
- [ ] 管理员能定位具体违规对象
- [ ] 执行隐藏后客户端立即不可见
- [ ] 操作记录审计可查

**预估工时**: 4h

---

### P0b-08 审核后台 — 封禁账号

**任务**: 支持管理员封禁违规用户

**逻辑**:
1. 封禁后用户无法登录/发帖/评论
2. 用户的所有已发内容自动隐藏
3. 记录封禁原因和时间

**交付标准**:
- [ ] 被封禁用户无法继续操作
- [ ] 封禁/解封可操作
- [ ] 操作记录可查

**预估工时**: 4h

---

### P0b-09 开发 `moderate-content` Edge Function

**任务**: 审核操作的服务端逻辑

**功能**:
- 隐藏帖子/评论
- 封禁/解封用户
- 驳回举报（no_action）

**交付标准**:
- [ ] 校验管理员身份
- [ ] 操作记录写入 moderation_cases
- [ ] 非管理员调用返回 403

**预估工时**: 4h

---

### P0b-10 种子数据导入工具 — 商户 + 门店

**任务**: 管理员批量导入商户和门店数据

**设计**: Web 管理后台页面，支持 CSV 上传

**CSV 格式**:
```csv
merchant_name,store_name,address,district,phone,latitude,longitude,mon_open,mon_close,...
Watson's Wine,中環店,中環德輔道中68號,港島,2521-1234,22.2834,114.1561,10:00,22:00,...
```

**交付标准**:
- [ ] CSV 解析正确
- [ ] 数据写入 `merchant_entities` + `merchant_locations`
- [ ] 坐标转换为 PostGIS geography 类型
- [ ] 导入结果有成功/失败统计

**预估工时**: 6h

---

### P0b-11 种子数据导入工具 — 酒款

**任务**: 管理员批量导入酒款数据

**可复用**: 现有 `mock-data.ts` 中 32 支酒款的数据结构

**交付标准**:
- [ ] 酒款写入 `products`
- [ ] 商户-酒款关联写入 `merchant_products`
- [ ] 可从现有 mock 数据一键迁移

**预估工时**: 4h

---

### P0b-12 数据迁移脚本

**任务**: 将现有 JSON/Mock 数据迁移到 Supabase

**具体操作**:
1. 创建 `supabase/seed.sql`（与现有 `src/lib/seed.sql` 对应）
2. 编写 Node.js 迁移脚本: 读取 JSON 文件 → 批量 INSERT
3. 迁移顺序: profiles → merchant_entities → merchant_staff → merchant_locations → products → merchant_products → posts → comments → likes

**交付标准**:
- [ ] 所有现有数据成功迁移
- [ ] 数据完整性校验通过
- [ ] 迁移可重复执行（幂等）

**预估工时**: 4h

---

### ── Web 数据层迁移（P0b-13 ~ P0b-19）──

> 以下 7 个任务是本次方案修正新增的核心内容。目标: 将 Web 端所有 JSON 文件 store 切换到 Supabase，使 Web 和 App 共用一个数据源。
>
> **迁移原则**:
> - 保持所有 store 文件的**导出函数签名不变**
> - 内部实现从「读写 JSON 文件」改为「调用 Supabase」
> - API routes 调用 store 函数，签名不变则不需改动
> - 保留 mock fallback 开关（无环境变量时回退到 JSON）

---

### P0b-13 Web 认证层迁移（mock-auth + middleware）

**任务**: 将三套独立认证（admin/merchant/user）统一到 Supabase Auth

**当前状态**:
- `mock-auth.ts` — 编排 admin-store + merchant-store，返回 MockAccount
- `middleware.ts` — 检查 `wb_session` cookie 判断是否已登录
- `user-store.ts` — 用户登录通过 `verifyCredentials()` 比对 JSON 文件中的密码
- 三套认证各自独立，互不相通

**迁移方案**:

```
迁移前                              迁移后
─────────────────                   ─────────────────
登录 → verifyCredentials()          登录 → supabase.auth.signInWithPassword()
     → 比对 JSON 中密码                  → Supabase Auth 统一验证
     → 手动设 cookie                     → 自动管理 session cookie

middleware:                          middleware:
  检查 wb_session cookie              检查 Supabase session (via @supabase/ssr)
  slug == "admin" → 管理员权限         查询 merchant_staff 表 → 判断角色

用户注册 → registerUser()            用户注册 → supabase.auth.signUp()
        → 写入 users.json                    → 自动创建 auth.users
        → 手动生成 ID                        → 触发 profiles 表 INSERT
```

**具体操作**:

1. **修改 `middleware.ts`**（~40行，改动小）:
   - 替换 `cookies.get("wb_session")` → `supabase.auth.getUser()`
   - 通过 `merchant_staff` 表查询判断是否商户/管理员
   - 保留路由守卫逻辑不变

2. **修改 `mock-auth.ts`** → 重命名为 `auth.ts`（~58行）:
   - `verifyCredentials(email, password)`:
     - 改为调用 `supabase.auth.signInWithPassword()`
     - 登录后查 `merchant_staff` 表判断 role
   - `getMockAccount(slug)`:
     - 改为查 `profiles` + `merchant_staff` + `merchant_entities` 联合查询
   - `getAllMerchants()`:
     - 改为查 `merchant_entities` WHERE status = 'active'

3. **修改 `/api/auth/login` route**:
   - 当前: 调用 `verifyCredentials()` → 手动设 cookie
   - 改为: 调用 Supabase Auth → session 自动管理

4. **修改 `/api/user/auth/login` + `/register` route**:
   - 当前: 调用 `user-store.verifyCredentials()` → 手动设 cookie
   - 改为: 调用 Supabase Auth → 注册时自动创建 `profiles` 记录

5. **修改 `/api/auth/me` + `/api/user/auth/me` route**:
   - 当前: 从 cookie 读 slug → 查 JSON
   - 改为: 从 Supabase session 获取 user → 查 profiles 表

**保持不变的部分**:
- 所有 Dashboard 页面的 UI 代码
- 所有前台页面的 UI 代码
- 登录/注册页面的表单 UI（只改 onSubmit 逻辑）

**风险控制**:
- 保留 `mock-auth.ts` 原文件为 `mock-auth.legacy.ts`（不删除，回退用）
- 环境变量 `USE_SUPABASE_AUTH=true` 控制切换（过渡期）

**交付标准**:
- [ ] Demo 帐号（admin@yourwinebook.com / watsons@demo.com / david@demo.com）可通过 Supabase Auth 登录
- [ ] middleware 权限检查正常（管理员/商户/消费者三级）
- [ ] 登出后 session 清除
- [ ] 无环境变量时 fallback 到旧逻辑

**预估工时**: 8h

---

### P0b-14 user-store 迁移

**任务**: 将用户 CRUD 和书签操作从 JSON 文件切到 Supabase

**当前状态**（11 个导出函数）:
| 函数 | 当前 | 迁移后 |
|------|------|--------|
| `getAllUsers()` | 读 users.json | `SELECT * FROM profiles` |
| `getUserById(id)` | 读 users.json | `SELECT FROM profiles WHERE id = ?` |
| `verifyCredentials(email, pwd)` | 比对 JSON 密码 | **已在 P0b-13 迁移到 Supabase Auth** |
| `registerUser(name, email, pwd)` | 写 users.json | **已在 P0b-13 迁移到 Supabase Auth** |
| `setUserStatus(id, status)` | 改 users.json | `UPDATE profiles SET status = ?` |
| `toggleWineBookmark(id, slug)` | 改 users.json 嵌套数组 | `INSERT/DELETE post_bookmarks` |
| `toggleMerchantBookmark(id, slug)` | 改 users.json 嵌套数组 | `INSERT/DELETE merchant_bookmarks` |
| `getMerchantFavoriteCount(slug)` | 遍历 users.json | `SELECT COUNT(*) FROM merchant_bookmarks` |
| `verifyUserPassword(id, pwd)` | 比对 JSON 密码 | Supabase Auth API |
| `updateUserPassword(id, newPwd)` | 写 users.json | `supabase.auth.admin.updateUserById()` |
| `updateLastSeen(id)` | 改 users.json | `UPDATE profiles SET updated_at = now()` |

**关键变更 — 书签模型**:
```
迁移前: users.json → user.bookmarkedWines = ["slug1", "slug2"]  (嵌套数组)
迁移后: post_bookmarks 表 (profile_id, post_id)                 (独立表)
        merchant_bookmarks 表 (profile_id, merchant_id)          (独立表)

→ toggleWineBookmark: INSERT ON CONFLICT DELETE (UPSERT 反转)
→ toggleMerchantBookmark: INSERT ON CONFLICT DELETE
→ getUserById 返回值中 bookmarks 改为从关联表查询
```

**交付标准**:
- [ ] 所有 11 个函数签名不变，内部切到 Supabase
- [ ] 书签操作正确（收藏/取消收藏酒款和酒商）
- [ ] 管理员「用户管理」页面功能正常（列表/停用/启用）
- [ ] 用户「个人主页」书签展示正常
- [ ] `/api/user/bookmarks/*` 路由正常（无需改动 route 代码）

**预估工时**: 6h

---

### P0b-15 merchant-store 迁移

**任务**: 将商户 CRUD 从 JSON 文件切到 Supabase

**当前状态**（8 个导出函数）:
| 函数 | 当前 | 迁移后 |
|------|------|--------|
| `getAllMerchantsFromStore()` | 读 merchants.json | `SELECT FROM merchant_entities JOIN merchant_staff` |
| `getMerchantBySlug(slug)` | 读 merchants.json | `SELECT FROM merchant_entities WHERE slug = ?` |
| `verifyMerchantCredentials(email, pwd)` | 比对 JSON 密码 | **已在 P0b-13 迁移到 Supabase Auth** |
| `verifyMerchantPassword(slug, pwd)` | 比对 JSON 密码 | Supabase Auth API |
| `updateMerchantPassword(slug, newPwd)` | 写 merchants.json | `supabase.auth.admin.updateUserById()` |
| `createMerchant(data)` | 写 merchants.json | `INSERT merchant_entities` + `INSERT profiles` + `INSERT merchant_staff` |
| `setMerchantStatus(slug, status)` | 改 merchants.json | `UPDATE merchant_entities SET status = ?` |
| `updateMerchantPreferredLang(slug, lang)` | 改 merchants.json | `UPDATE profiles SET preferred_lang = ?` |

**关键变更 — 创建商户变为多表操作**:
```
迁移前: merchants.json 一条扁平记录
迁移后:
  1. supabase.auth.admin.createUser()     → auth.users
  2. INSERT profiles                       → 用户档案
  3. INSERT merchant_entities              → 商户主体
  4. INSERT merchant_staff (role='owner')  → 关联关系
```

**交付标准**:
- [ ] 管理员「酒商帐号管理」页面功能正常（列表/创建/状态变更）
- [ ] 商户登录后 Dashboard 数据正确
- [ ] 创建商户后可立即登录

**预估工时**: 5h

---

### P0b-16 admin-store 迁移

**任务**: 将管理员帐号从 JSON 文件切到 Supabase

**当前状态**（4 个导出函数，单条记录）:
| 函数 | 迁移后 |
|------|--------|
| `getAdminPublic()` | 查 `profiles` WHERE role flag = admin |
| `verifyAdminCredentials(email, pwd)` | **已在 P0b-13 统一** |
| `verifyAdminPassword(pwd)` | Supabase Auth API |
| `updateAdminPassword(newPwd)` | `supabase.auth.admin.updateUserById()` |

**实现方式**: 管理员判定通过 `profiles` 表的 `default_role = 'admin'` 或独立的 `admin_flags` 表

**交付标准**:
- [ ] 管理员可正常登录 Dashboard
- [ ] 管理员「帐号设置」页面可改密码
- [ ] 管理员权限检查正常

**预估工时**: 2h

---

### P0b-17 community-store 迁移

**任务**: 将社区帖子/评论/点赞从 JSON 文件切到 Supabase

**这是工作量最大的 store 迁移**，因为数据模型完全不同。

**当前状态**（11 个导出函数）:
| 函数 | 当前数据模型 | Supabase 数据模型 |
|------|-------------|------------------|
| `getAllPosts(options?)` | community.json 扁平数组 | `SELECT FROM posts JOIN profiles` + 分页 |
| `getPostById(id)` | community.json 查找 | `SELECT FROM posts WHERE id = ?` + media + products |
| `createPost(input)` | 写 community.json | **走 finalize-post Edge Function** |
| `updatePost(id, authorId, updates)` | 改 community.json | `UPDATE posts WHERE id = ? AND author_profile_id = ?` |
| `deletePost(id, authorId)` | 删 community.json | `UPDATE posts SET deleted_at = now()` (软删除) |
| `toggleLike(postId, actorId)` | community.json 嵌套 likes 数组 | `INSERT/DELETE post_likes` (联合主键幂等) |
| `getComments(postId)` | community.json 扁平数组 | `SELECT FROM post_comments WHERE post_id = ?` |
| `addComment(input)` | 写 community.json | **走 create-comment Edge Function** |
| `deleteComment(commentId, authorId)` | 删 community.json | `UPDATE post_comments SET deleted_at = now()` |
| `getUserStats(userId)` | 遍历 community.json | `SELECT COUNT(*) FROM posts/comments/post_likes` |
| `getMerchantMentions(merchantSlug)` | 遍历 community.json | `SELECT FROM posts WHERE acting_merchant_id = ?` |

**关键数据模型变更**:
```
迁移前 (community.json):
{
  "id": "p1710000001",
  "authorId": "u1",
  "authorType": "user",
  "authorName": "陈大文",
  "title": "...",
  "content": "...",
  "likes": ["u1", "u2"],           ← 嵌套数组
  "commentCount": 3                ← 手动维护的计数
}

迁移后 (Supabase):
posts:        { id, author_profile_id, content, status, ... }
post_likes:   { post_id, profile_id }                        ← 独立表
post_media:   { post_id, original_url, thumbnail_url, ... }  ← 独立表
post_comments: { post_id, profile_id, content, ... }         ← 独立表
→ commentCount 和 likeCount 通过 COUNT() 聚合查询
→ authorName 通过 JOIN profiles 获取
```

**API routes 影响评估**:
| Route | 需要改动吗 |
|-------|-----------|
| `GET /api/community/posts` | **可能需要** — 如果返回格式变了 |
| `POST /api/community/posts` | **需要** — 创建逻辑变为调用 Edge Function |
| `GET /api/community/posts/[id]` | **可能需要** — 返回格式 |
| `POST /api/community/posts/[id]/like` | **需要** — 从数组操作变为表操作 |
| `POST /api/community/posts/[id]/comments` | **需要** — 调用 Edge Function |

**兼容层设计**: 在 store 函数返回值中做格式适配，使其符合现有 `CommunityPost` 类型：
```typescript
// community-store.ts 迁移后
export async function getAllPosts(options?) {
  const { data } = await supabase
    .from('posts')
    .select('*, profiles(*), post_likes(profile_id), post_comments(count)')
    ...

  // 适配层：将 Supabase 结构转换为现有 CommunityPost 格式
  return data.map(post => ({
    id: post.id,
    authorId: post.author_profile_id,
    authorName: post.profiles.nickname,
    likes: post.post_likes.map(l => l.profile_id),  // 重建数组格式
    commentCount: post.post_comments[0].count,       // 聚合结果
    ...
  }));
}
```

**交付标准**:
- [ ] 社区 Feed 页面数据正常展示
- [ ] 发帖功能正常（Web 端通过 Edge Function）
- [ ] 评论功能正常
- [ ] 点赞切换正常
- [ ] 管理员 Dashboard 社区页面正常
- [ ] 前端页面零代码改动（通过 store 适配层兼容）

**预估工时**: 10h（最大单项）

---

### P0b-18 application-store + price-store 迁移

**任务**: 将申请管理和价格覆盖切到 Supabase

**application-store（3 个函数，简单 CRUD）**:
| 函数 | 迁移后 |
|------|--------|
| `getAllApplications()` | `SELECT FROM merchant_applications` |
| `createApplication(input)` | `INSERT INTO merchant_applications` |
| `updateApplicationStatus(id, status)` | `UPDATE merchant_applications SET status = ?` |

**price-store（5 个函数）**:
| 函数 | 迁移后 |
|------|--------|
| `updatePrice(wineSlug, merchantSlug, price)` | `UPDATE merchant_products SET display_price = ?` |
| `getMergedPrices(wineSlug)` | 不再需要 merge — 直接查 `merchant_products` |
| `getAllMergedPrices()` | `SELECT FROM merchant_products` |
| `getPriceOverride(wineSlug, merchantSlug)` | `SELECT FROM merchant_products WHERE ...` |
| `getUpdatedMinPrice(wineSlug)` | `SELECT MIN(display_price) FROM merchant_products WHERE product_id = ?` |

**关键**: price-store 的 "overlay" 概念消失——迁移后只有 `merchant_products` 一个价格来源，不再有 mock 底价 + JSON 覆盖的双层结构。

**交付标准**:
- [ ] 管理员「入驻申请」页面功能正常
- [ ] 商户编辑酒款价格后，前台比价数据即时更新
- [ ] Dashboard 价格编辑功能正常

**预估工时**: 4h

---

### P0b-19 analytics-store 决策 + 迁移

**任务**: 决定分析数据的去向

**方案 A — 保留 SQLite（推荐，MVP 阶段）**:
- 分析数据与业务数据独立，不影响双端统一
- SQLite WAL 模式性能足够
- 前端埋点已接入 PostHog（P0b-22），SQLite 仅做 Dashboard 展示
- **工作量: 0h**（不动）

**方案 B — 迁移到 Supabase（后续优化）**:
- 创建 `analytics_events` 表
- 重写 4 个聚合查询
- **工作量: 6h**

**推荐**: MVP 阶段选方案 A，上线稳定后再考虑迁移。PostHog 才是真正的分析工具，SQLite 仅用于 Dashboard 内部指标展示。

**交付标准**:
- [ ] Dashboard 分析页面继续正常工作
- [ ] `/api/track` 继续写入 SQLite
- [ ] PostHog 负责面向产品的行为分析

**预估工时**: 0h（选方案 A）

---

### P0b-20 Web 数据层迁移集成测试

**任务**: 验证所有 store 迁移后 Web 端功能完整

**测试清单**:
```
认证:
✅ 管理员可登录 Dashboard
✅ 商户可登录 Dashboard
✅ 消费者可登录前台
✅ 消费者可注册
✅ 各角色改密码正常
✅ 登出后 session 清除

社区:
✅ Feed 页面帖子列表正常
✅ 发新帖正常
✅ 评论正常
✅ 点赞/取消点赞正常
✅ 帖子删除正常

用户:
✅ 收藏酒款正常
✅ 收藏酒商正常
✅ 个人主页书签展示正常

商户管理:
✅ 管理员创建商户帐号正常
✅ 管理员变更商户状态正常
✅ 管理员查看用户列表正常

入驻申请:
✅ 前台提交申请正常
✅ 管理员审批申请正常

价格:
✅ 商户编辑酒款价格正常
✅ 前台比价数据正确

公开数据:
✅ 酒款搜索/筛选/分页正常
✅ 酒商列表/详情正常
✅ 场景推荐正常
```

**回退策略**: 如果某个 store 迁移后出现严重问题:
1. 通过环境变量 `USE_SUPABASE_[MODULE]=false` 回退单个 store
2. 所有 store 保留 mock fallback 代码（注释保留，不删除）
3. 回退不影响其他已迁移的 store

**交付标准**:
- [ ] 上述全部测试用例通过
- [ ] 回退机制验证可用
- [ ] 现有前端页面零代码改动

**预估工时**: 4h

---

### P0b-21 配置 EAS Build + 内测通道

**任务**: 打通移动端测试分发

**具体操作**:
1. 配置 `eas.json`
2. 创建 Development / Preview / Production profile
3. 配置 TestFlight（iOS）+ Internal Testing（Android）

**交付标准**:
- [ ] 可向测试用户分发安装包
- [ ] OTA 更新可用

**预估工时**: 3h

---

### P0b-22 接入 Sentry

**任务**: 崩溃监控

**交付标准**:
- [ ] Mobile + Web 都接入
- [ ] 手动抛错可在 Sentry 看到
- [ ] 区分 dev/staging/prod 环境

**预估工时**: 3h

---

### P0b-23 接入 PostHog

**任务**: 行为埋点

**交付标准**:
- [ ] 基础页面访问事件可追踪
- [ ] 可在 PostHog 仪表板查看

**预估工时**: 2h

---

### P0b 阶段总结

| ID | 任务 | 前置 | 工时 | 角色 |
|----|------|------|------|------|
| | **上传 + 审核** | | | |
| P0b-01 | Storage 配置 | P0a-07 | 2h | BE |
| P0b-02 | create-upload-intent EF | 01 | 4h | BE |
| P0b-03 | finalize-post EF | 02 | 6h | BE |
| P0b-04 | 媒体安全校验 | 03 | 2h | BE |
| P0b-05 | App 上传 SDK | P0a-02, 02 | 8h | MOB |
| P0b-06 | 审核队列页 | P0a-08,11 | 6h | WEB |
| P0b-07 | 案件详情+一键隐藏 | 06 | 4h | WEB |
| P0b-08 | 封禁账号 | 06 | 4h | WEB/BE |
| P0b-09 | moderate-content EF | P0a-08 | 4h | BE |
| | **种子数据** | | | |
| P0b-10 | 商户+门店导入 | P0a-07 | 6h | WEB/BE |
| P0b-11 | 酒款导入 | P0a-07 | 4h | WEB/BE |
| P0b-12 | 数据迁移脚本 | 10,11 | 4h | BE |
| | **⚠️ Web 数据层迁移（新增）** | | | |
| P0b-13 | Web 认证层迁移 | P0a-07,08,11 | 8h | 全栈 |
| P0b-14 | user-store 迁移 | 13 | 6h | 全栈 |
| P0b-15 | merchant-store 迁移 | 13 | 5h | 全栈 |
| P0b-16 | admin-store 迁移 | 13 | 2h | 全栈 |
| P0b-17 | community-store 迁移 | 13, P0b-03 | 10h | 全栈 |
| P0b-18 | application + price store 迁移 | 13 | 4h | 全栈 |
| P0b-19 | analytics-store 决策 | — | 0h | — |
| P0b-20 | **迁移集成测试** | 13-19 | 4h | QA |
| | **基础设施** | | | |
| P0b-21 | EAS Build | P0a-02 | 3h | MOB |
| P0b-22 | Sentry | P0a-02 | 3h | MOB/WEB |
| P0b-23 | PostHog | P0a-02 | 2h | MOB/WEB |

**P0b 总工时**: 原有 60h + Web 迁移新增 39h = **99h**（约 12.5 人天）

**可并行组**:
- 组 A（后端/上传）: 01 → 02 → 03 → 04, 09
- 组 B（移动/基础）: 05（依赖 02）, 21, 22, 23
- 组 C（Web/审核）: 06 → 07 → 08
- 组 D（数据导入）: 10, 11 → 12
- **组 E（⚠️ Web 迁移，关键路径）**: 13 → 14, 15, 16 并行 → 17 → 18 → 20
- 组 D 和 E 可在组 A 完成后并行启动

---

## 7. Phase 1A — 找店 MVP（2 周）

> **目标**: 跑通闭环 1 — 定位 → 门店列表 → 收藏 → 外部导航

### P1A-01 B 端 — 门店基本信息编辑页

**任务**: 商户可查看和编辑自家门店列表

**功能**:
1. 门店列表（仅显示自家门店）
2. 编辑: 门店名称、地址、电话
3. 数据写入 `merchant_locations`

**交付标准**:
- [ ] 商户仅可查看自家门店
- [ ] 数据可保存并回显
- [ ] 权限校验正确

**预估工时**: 4h

---

### P1A-02 B 端 — 结构化营业时间编辑器

**任务**: 按周编辑营业时间

**UI 设计**:
```
周一  [10:00] - [22:00]  ☑ 营业
周二  [10:00] - [22:00]  ☑ 营业
...
周日  [休息]              ☐ 休息
备注  [公众假期休息]
```

**存储格式**:
```json
{
  "monday": { "open": "10:00", "close": "22:00" },
  "sunday": null,
  "notes": "公众假期休息"
}
```

**交付标准**:
- [ ] 7 天可分别设置
- [ ] 保存为结构化 JSON
- [ ] C 端可正确展示"营业中/已打烊"

**预估工时**: 4h

---

### P1A-03 B 端 — 地图拖拽校准坐标

**任务**: 商户手动修正门店坐标

**设计**:
1. 地图组件（Google Maps JS API 或 Mapbox GL）
2. 加载时定位到门店现有坐标
3. 可拖拽图钉到正确位置
4. 保存更新 `merchant_locations.location`

**交付标准**:
- [ ] 拖拽后坐标更新到数据库
- [ ] 更新后的坐标可参与附近检索
- [ ] 保存有确认提示

**预估工时**: 6h

---

### P1A-04 开发 `get_nearby_stores` RPC

**任务**: 地理空间检索接口

**核心逻辑**:
1. 接收用户坐标 (lat, lng)
2. ST_DWithin 按半径过滤
3. 自动扩圈: 5km → 10km → 20km → 50km（全港兜底）
4. 按距离排序
5. 返回: 门店信息 + 距离 + 营业时间 + 是否已收藏

**交付标准**:
- [ ] 5km 内有结果时不扩圈
- [ ] 无结果时逐级扩圈
- [ ] 50km 仍无结果时返回全港精选
- [ ] 性能: <200ms（有 GIST 索引）

**预估工时**: 4h

---

### P1A-05 C 端 — 定位授权流程

**任务**: 请求并处理定位权限

**流程**:
```
打开找店页
├── 请求精确定位权限
│   ├── 授权 → GPS 坐标查询
│   └── 拒绝 → 显示手动选区
├── GPS 漂移处理
│   ├── 定位在海面上(离陆地>500m) → 无效，触发手动选区
│   └── 精度 >1000m → 提示不精确，建议手动选区
└── 定位 hook:
    - useLocation() → { coords, error, isLoading, requestPermission }
```

**交付标准**:
- [ ] 授权后获取坐标
- [ ] 拒绝后不阻塞进入列表
- [ ] 异常坐标有降级处理

**预估工时**: 3h

---

### P1A-06 C 端 — 手动选区降级

**任务**: 用户拒绝定位时仍可找店

**设计**: 选择区域 → 使用区域中心点坐标查询

| 区域 | 中心坐标 |
|------|---------|
| 港岛 | 22.2780, 114.1655 |
| 九龙 | 22.3193, 114.1694 |
| 新界 | 22.3700, 114.1200 |
| 离岛 | 22.2600, 113.9500 |

**交付标准**:
- [ ] 选区后可驱动门店检索
- [ ] 自动放大搜索半径覆盖全区

**预估工时**: 2h

---

### P1A-07 C 端 — 门店卡片组件

**任务**: 可复用的门店卡片

**展示内容**:
- 商户名称 + 分店名
- 地址摘要
- 距离（如: 1.2km）
- 营业状态标签（绿色"营业中" / 灰色"已打烊"）
- 收藏按钮

**交付标准**:
- [ ] 不同状态展示正确
- [ ] 收藏按钮可交互
- [ ] 性能: 列表渲染流畅

**预估工时**: 3h

---

### P1A-08 C 端 — 营业状态计算逻辑

**任务**: 根据 business_hours JSON + 当前时间判断营业状态

**逻辑**: 提取到 `packages/domain/rules/business-hours.ts`

```typescript
function getBusinessStatus(hours: BusinessHours): 'open' | 'closed' | 'closing_soon'
```

**交付标准**:
- [ ] 正确判断当前是否营业
- [ ] 处理 null（休息日）
- [ ] 处理跨午夜营业
- [ ] 双端共用一套逻辑

**预估工时**: 2h

---

### P1A-09 C 端 — 附近门店列表页

**任务**: FlashList 展示附近门店

**设计**:
1. 两区列表: "已收藏的附近门店" + "所有附近门店"
2. 使用 `useInfiniteQuery` + `get_nearby_stores` RPC
3. 下拉刷新
4. 空状态: "附近暂无酒商，试试手动选区？"

**交付标准**:
- [ ] 首屏展示前 10 家
- [ ] 已收藏优先展示
- [ ] 下拉刷新可用
- [ ] 滚动 ≥55fps

**预估工时**: 6h

---

### P1A-10 C 端 — 门店详情页

**任务**: 展示门店完整信息

**内容**:
- 商户品牌故事
- 门店地址 + 小地图预览
- 电话（可点击拨打）
- 完整营业时间表
- 收藏按钮
- "导航到店"按钮（突出显示）
- 该门店上架的酒款列表

**交付标准**:
- [ ] 所有信息展示完整
- [ ] 电话可拨打
- [ ] 收藏可交互

**预估工时**: 4h

---

### P1A-11 C 端 — 收藏/取消收藏门店

**任务**: 幂等收藏操作 + 乐观更新

**实现**:
- UPSERT 语义（联合主键约束天然幂等）
- 乐观更新: 立即显示状态变化
- 失败时回滚

**交付标准**:
- [ ] 重复请求不产生脏数据
- [ ] 列表和详情页收藏状态同步
- [ ] 弱网重试不重复

**预估工时**: 3h

---

### P1A-12 C 端 — 外部导航唤起

**任务**: 拉起 Apple Maps / Google Maps

**实现**:
```typescript
// iOS 优先 Apple Maps，Android 优先 Google Maps
function openNavigation(lat: number, lng: number, name: string) {
  const scheme = Platform.select({
    ios: `maps:0,0?q=${name}&ll=${lat},${lng}`,
    android: `google.navigation:q=${lat},${lng}`,
  });
  Linking.openURL(scheme);
}
```

**交付标准**:
- [ ] iOS 跳转 Apple Maps
- [ ] Android 跳转 Google Maps
- [ ] 目标地点正确

**预估工时**: 2h

---

### P1A-13 找店漏斗埋点

**任务**: 记录核心漏斗数据

**埋点事件**:
| 事件 | 触发时机 |
|------|---------|
| `location_permission_requested` | 请求定位权限 |
| `location_permission_granted` | 用户授权 |
| `location_permission_denied` | 用户拒绝 |
| `manual_district_selected` | 手动选区 |
| `store_list_viewed` | 门店列表加载 |
| `store_detail_viewed` | 查看门店详情 |
| `store_bookmarked` | 收藏门店 |
| `store_navigation_clicked` | 点击导航 |

**交付标准**:
- [ ] PostHog 可查看完整漏斗
- [ ] 可按授权/拒绝分组分析

**预估工时**: 2h

---

### P1A-14 找店链路 QA 回归

**任务**: 验证不同权限、网络、定位场景

**测试用例**:
```
✅ 授权定位 → 附近有门店 → 列表展示正确
✅ 授权定位 → 附近无门店 → 自动扩圈
✅ 拒绝定位 → 手动选区 → 列表展示正确
✅ GPS 漂移（海面坐标）→ 降级到手动选区
✅ 收藏门店 → 列表中优先展示
✅ 取消收藏 → 回到普通排序
✅ 导航按钮 → 正确跳转外部地图
✅ 弱网 → 缓存数据回显
✅ 断网 → 不白屏，有友好提示
```

**交付标准**:
- [ ] 核心场景全部通过
- [ ] 缺陷已记录并修复

**预估工时**: 3h

---

### P1A 阶段总结

| ID | 任务 | 前置 | 工时 | 角色 |
|----|------|------|------|------|
| P1A-01 | B 端门店编辑 | P0b-10 | 4h | WEB |
| P1A-02 | 营业时间编辑器 | 01 | 4h | WEB |
| P1A-03 | 地图拖拽坐标 | 01 | 6h | WEB |
| P1A-04 | get_nearby_stores RPC | P0a-07,08 | 4h | BE |
| P1A-05 | C 端定位授权 | P0a-10 | 3h | MOB |
| P1A-06 | 手动选区 | 05 | 2h | MOB |
| P1A-07 | 门店卡片组件 | P0a-13 | 3h | MOB |
| P1A-08 | 营业状态逻辑 | P0a-04 | 2h | 全栈 |
| P1A-09 | 附近门店列表页 | 04,05,07 | 6h | MOB |
| P1A-10 | 门店详情页 | 07,08 | 4h | MOB |
| P1A-11 | 收藏门店 | 09 | 3h | MOB |
| P1A-12 | 外部导航 | 10 | 2h | MOB |
| P1A-13 | 找店漏斗埋点 | P0b-23 | 2h | MOB |
| P1A-14 | QA 回归 | 01-13 | 3h | QA |

**关键路径**: 04 → 09 → 11 → 14

---

## 8. Phase 1B — 社区 MVP（3 周）

> **目标**: 跑通闭环 2 — Feed → 发帖 → 互动 → 举报/拉黑

### Week 1: Feed + 帖子展示

---

### P1B-01 开发 `get_feed` RPC

**任务**: 游标分页的 Feed 查询

**核心逻辑**:
- 基于 `(created_at DESC, id DESC)` 游标分页
- 排除: 被拉黑用户的内容, status != published, 已软删除
- 返回: 帖子 + 作者 + 商户名 + 媒体 + 点赞/评论数 + 是否已赞/收藏
- page_size = 20

**交付标准**:
- [ ] 分页稳定，无漏数据/重复
- [ ] 被拉黑用户内容不出现
- [ ] 性能 <100ms（有索引）

**预估工时**: 4h

---

### P1B-02 C 端 — 帖子卡片组件 (PostCard)

**任务**: Feed 中的帖子卡片

**展示内容**:
- 用户头像 + 昵称（官方帖子显示商户名 + 官方徽章）
- 帖子正文（截断展示）
- 图片（1 张 / 2 张 / 3 张 / 4+ 张不同布局）
- 关联酒款标签（如有）
- 互动条: ❤️ 点赞数 | 💬 评论数 | 🔖 收藏
- 时间（相对时间: 刚刚 / 5分钟前 / 2小时前 / 昨天）

**交付标准**:
- [ ] 不同图片数量布局正确
- [ ] 官方标识正确显示
- [ ] 互动条可点击

**预估工时**: 4h

---

### P1B-03 C 端 — 图片预览组件

**任务**: 多图布局 + 放大浏览

**布局规则**:
- 1 张: 全宽展示
- 2 张: 2 列等分
- 3 张: 左大右二小
- 4+ 张: 2×2 网格，右下角显示 "+N"
- 点击放大: 全屏 + 左右滑动

**交付标准**:
- [ ] 各种图片数量展示正常
- [ ] 放大/滑动流畅
- [ ] 图片加载有 placeholder

**预估工时**: 4h

---

### P1B-04 C 端 — 单列 Feed 页面

**任务**: FlashList 渲染 Feed

**功能**:
1. `useInfiniteQuery` + `get_feed` RPC
2. 上拉加载下一页
3. 下拉刷新
4. 骨架屏加载态
5. 空状态: "还没有内容，成为第一个发帖的人吧"

**交付标准**:
- [ ] 平滑渲染，滚动 ≥55fps
- [ ] 上拉加载 + 下拉刷新可用
- [ ] 无重复/漏数据

**预估工时**: 6h

---

### P1B-05 C 端 — 帖子详情页

**任务**: 完整帖子 + 评论列表

**内容**:
- 完整帖子内容（不截断）
- 所有图片
- 关联酒款信息
- 互动条
- 评论列表（游标分页）
- 评论输入框（吸底）

**交付标准**:
- [ ] 完整展示
- [ ] 评论分页可用
- [ ] 可进入评论输入

**预估工时**: 4h

---

### Week 2: 发帖 + 互动

---

### P1B-06 C 端 — 发帖页面

**任务**: 文字输入 + 多图管理 + 酒款关联

**功能**:
1. 文字输入区（最大 5000 字）
2. 图片选择（至多 9 张）
3. 图片预览 + 拖拽排序 + 删除
4. 酒款关联搜索（可选）
5. 官方身份切换（商户员工可见）
6. 发布按钮 → 触发上传流程（P0b-05 的 SDK）

**交付标准**:
- [ ] 文字 + 图片可填写
- [ ] 图片可预览/删除/排序
- [ ] 酒款搜索可选择
- [ ] 发布调用上传 SDK 全流程

**预估工时**: 6h

---

### P1B-07 C 端 — 上传进度 + 重试

**任务**: 发帖上传过程的 UI 反馈

**设计**:
- 每张图片的独立进度条
- 总体进度百分比
- 单张失败: 自动重试 3 次
- 仍失败: 提示用户，提供手动重试按钮
- 发帖成功: 跳转到 Feed 页，新帖置顶

**交付标准**:
- [ ] 进度条准确反映上传状态
- [ ] 失败可重试
- [ ] 成功后跳转

**预估工时**: 3h

---

### P1B-08 C 端 — 点赞功能

**任务**: 幂等点赞 + 乐观更新

**实现**:
```typescript
// UPSERT 语义，联合主键约束天然幂等
const { error } = await supabase
  .from('post_likes')
  .upsert({ post_id: postId, profile_id: userId }, {
    onConflict: 'post_id,profile_id',
    ignoreDuplicates: true,
  });
```

- 乐观更新: 立即切换心形 + 计数 +1/-1
- 失败时回滚

**交付标准**:
- [ ] 点赞反馈即时
- [ ] 重复请求不产生脏数据
- [ ] 弱网失败可恢复

**预估工时**: 3h

---

### P1B-09 开发 `create-comment` Edge Function

**任务**: 评论发布的服务端逻辑

**功能**:
1. 校验 idempotency_key 防重复
2. 频率限制（30次/小时）
3. 写入 `post_comments`
4. 返回完整评论数据

**交付标准**:
- [ ] 幂等防重复
- [ ] 超频返回 429
- [ ] 被封禁用户返回 403

**预估工时**: 4h

---

### P1B-10 C 端 — 评论列表 + 发评论

**任务**: 帖子详情中的评论功能

**功能**:
1. 评论列表: 游标分页 + 时间正序
2. 评论输入框: 吸底键盘
3. 发表后即时可见（乐观更新）
4. 客户端生成 idempotency_key 防双击

**交付标准**:
- [ ] 评论分页加载正确
- [ ] 发表后即时显示
- [ ] 双击不会重复发送

**预估工时**: 5h

---

### P1B-11 C 端 — 帖子收藏

**任务**: 收藏/取消收藏帖子

**交付标准**:
- [ ] 乐观更新
- [ ] Feed 和详情页状态同步

**预估工时**: 2h

---

### Week 3: 防护体系 + 个人中心

---

### P1B-12 C 端 — 举报功能

**任务**: 对帖子/评论/用户发起举报

**设计**:
1. 长按/点击"..." 弹出举报选项
2. 选择原因: 垃圾内容 / 不当内容 / 骚扰 / 其他
3. 可选补充说明
4. 提交到 `reports` 表
5. 自动关联或创建 `moderation_cases`

**交付标准**:
- [ ] 三类对象（帖子/评论/用户）都能举报
- [ ] 举报后后台可见
- [ ] 重复举报有提示

**预估工时**: 4h

---

### P1B-13 C 端 — 拉黑/屏蔽用户

**任务**: 用户拉黑后对方内容不可见

**影响范围**:
1. Feed 中不显示被拉黑用户的帖子
2. 评论区不显示被拉黑用户的评论
3. 对方主页降级展示
4. 可在设置页管理拉黑名单

**交付标准**:
- [ ] 拉黑后 Feed 立即过滤
- [ ] 可取消拉黑
- [ ] 拉黑名单可管理

**预估工时**: 3h

---

### P1B-14 C 端 — 个人中心页

**任务**: "我的" Tab 页

**内容**:
- 头像 + 昵称 + 简介
- 统计: 帖子数 / 收藏数 / 关注数
- 子页入口:
  - 我的帖子
  - 我的收藏（帖子 + 门店）
  - 设置

**交付标准**:
- [ ] 统计数据正确
- [ ] 各子页可进入

**预估工时**: 4h

---

### P1B-15 C 端 — 用户主页

**任务**: 查看其他用户的帖子列表

**内容**:
- 头像 + 昵称 + 简介
- 帖子列表（时间倒序）
- 关注按钮
- "..." 菜单: 举报 / 拉黑

**交付标准**:
- [ ] 帖子列表展示正确
- [ ] 关注可交互

**预估工时**: 4h

---

### P1B-16 C 端 — 关注/取消关注

**任务**: 用户关注功能

**交付标准**:
- [ ] 乐观更新
- [ ] 自己不能关注自己（约束）

**预估工时**: 2h

---

### P1B-17 C 端 — 设置页

**任务**: App 设置

**内容**:
- 语言切换（繁中/英文）
- 拉黑名单管理
- 登出
- 版本信息

**交付标准**:
- [ ] 语言切换即时生效
- [ ] 登出清除所有状态

**预估工时**: 3h

---

### P1B-18 B 端 — 官方发帖入口

**任务**: 商户员工在 Web 后台发帖

**设计**: 复用现有 Dashboard 页面结构

**功能**:
1. 文字输入 + 图片上传
2. 自动以官方身份发帖（`is_official=true`）
3. 权限校验: 仅该商户的 staff

**交付标准**:
- [ ] 仅合法商户员工可发帖
- [ ] 帖子在 C 端 Feed 显示官方标识
- [ ] 图片上传走安全链路

**预估工时**: 4h

---

### P1B-19 社区漏斗埋点

**任务**: 记录社区核心指标

**埋点事件**:
| 事件 | 触发时机 |
|------|---------|
| `feed_viewed` | 进入 Feed 页 |
| `post_viewed` | 查看帖子详情 |
| `post_create_started` | 点击发帖按钮 |
| `post_image_selected` | 选择图片 |
| `post_upload_started` | 开始上传 |
| `post_upload_completed` | 上传完成 |
| `post_published` | 帖子发布成功 |
| `post_liked` | 点赞 |
| `post_commented` | 发评论 |
| `post_bookmarked` | 收藏帖子 |
| `post_reported` | 举报 |
| `user_blocked` | 拉黑用户 |

**交付标准**:
- [ ] PostHog 可查看发帖漏斗
- [ ] 可查看互动率

**预估工时**: 2h

---

### P1B-20 社区链路 QA 回归

**任务**: 端到端验证社区闭环

**测试用例**:
```
✅ 发帖(纯文字) → Feed 可见
✅ 发帖(3张图) → 图片展示正确
✅ 发帖(9张图) → 全部上传成功
✅ 发帖失败 → 草稿不丢失（P1C 实现）
✅ 点赞 → 计数+1 → 取消 → 计数-1
✅ 评论 → 即时可见
✅ 双击评论 → 不重复
✅ 收藏帖子 → 个人中心可见
✅ 举报帖子 → 管理后台可见
✅ 管理员隐藏帖子 → C 端不可见
✅ 拉黑用户 → Feed 过滤生效
✅ 官方发帖 → 显示官方标识
✅ 弱网 → 缓存回显不白屏
```

**交付标准**:
- [ ] 全部核心场景通过

**预估工时**: 4h

---

### P1B 阶段总结

| ID | 任务 | 前置 | 工时 | 角色 |
|----|------|------|------|------|
| P1B-01 | get_feed RPC | P0a-08 | 4h | BE |
| P1B-02 | 帖子卡片组件 | P0a-13 | 4h | MOB |
| P1B-03 | 图片预览组件 | 02 | 4h | MOB |
| P1B-04 | 单列 Feed 页 | 01,02 | 6h | MOB |
| P1B-05 | 帖子详情页 | 02,03 | 4h | MOB |
| P1B-06 | 发帖页面 | P0b-05 | 6h | MOB |
| P1B-07 | 上传进度+重试 | 06 | 3h | MOB |
| P1B-08 | 点赞 | 02 | 3h | MOB |
| P1B-09 | create-comment EF | P0a-08 | 4h | BE |
| P1B-10 | 评论列表+发评论 | 05,09 | 5h | MOB |
| P1B-11 | 帖子收藏 | 02 | 2h | MOB |
| P1B-12 | 举报 | 05 | 4h | MOB |
| P1B-13 | 拉黑 | 04 | 3h | MOB |
| P1B-14 | 个人中心 | P0a-10 | 4h | MOB |
| P1B-15 | 用户主页 | 02 | 4h | MOB |
| P1B-16 | 关注 | 15 | 2h | MOB |
| P1B-17 | 设置页 | P0a-13 | 3h | MOB |
| P1B-18 | B 端官方发帖 | P0b-03 | 4h | WEB |
| P1B-19 | 社区埋点 | P0b-23 | 2h | MOB |
| P1B-20 | QA 回归 | 01-19 | 4h | QA |

---

## 9. Phase 1C — 加固与灰度发布（1.5-2 周）

### P1C-01 草稿箱功能

**任务**: 发帖失败不丢内容

**实现**:
- 退出发帖页自动保存草稿到 AsyncStorage
- 重新进入发帖页可恢复草稿
- 上传失败的帖子保存到草稿箱
- 草稿箱入口在个人中心

**交付标准**:
- [ ] 退出自动保存
- [ ] 可恢复编辑
- [ ] 失败帖子不丢失

**预估工时**: 4h

---

### P1C-02 弱网上传恢复

**任务**: 网络恢复后自动继续

**实现**:
- 监听网络状态变化
- 恢复后自动重新上传未完成的图片
- 指数退避策略

**交付标准**:
- [ ] 断网→恢复后继续上传
- [ ] 重试逻辑稳定

**预估工时**: 3h

---

### P1C-03 频率限制全面部署

**任务**: 防滥用

**限制规则**:
| 操作 | 限制 | 窗口 |
|------|------|------|
| 发帖 | 10 次 | 每小时 |
| 评论 | 30 次 | 每小时 |
| 点赞 | 100 次 | 每小时 |
| 举报 | 10 次 | 每天 |
| 上传 | 50 张 | 每天 |

**交付标准**:
- [ ] 超频返回 429
- [ ] 客户端提示"操作过于频繁"

**预估工时**: 4h

---

### P1C-04 过期上传清理

**任务**: 清理未完成的上传

**实现**: 定时任务/Supabase Cron

- 超过 1 小时未 finalize 的 `media_uploads` → status = expired
- 对应 Storage 文件清理

**交付标准**:
- [ ] 过期记录标记正确
- [ ] 不影响正常帖子

**预估工时**: 2h

---

### P1C-05 邀请码机制

**任务**: 灰度控制注册

**实现**:
1. 管理员可生成邀请码（批量）
2. 注册时必须输入邀请码
3. 邀请码用后失效

**交付标准**:
- [ ] 无邀请码无法注册
- [ ] 邀请码一次性使用

**预估工时**: 4h

---

### P1C-06 灰度分发配置

**任务**: 配置 TestFlight / Internal Testing

**交付标准**:
- [ ] iOS TestFlight 可分发
- [ ] Android 内测可分发
- [ ] OTA 更新可用

**预估工时**: 3h

---

### P1C-07 埋点校验

**任务**: 验证 PostHog 中五个核心漏斗

**五个核心漏斗**:
1. 定位授权率
2. 外部导航点击率
3. 发帖漏斗（点击→选图→填写→上传→成功）
4. 互动率（曝光→点赞/评论/收藏）
5. D1/D7 留存

**交付标准**:
- [ ] 每个漏斗数据完整可查

**预估工时**: 3h

---

### P1C-08 Sentry 告警规则

**任务**: 配置崩溃和错误告警

**规则**:
- 崩溃率 > 1% → 告警
- 关键 API 错误率 > 5% → 告警
- 上传失败率 > 10% → 告警

**交付标准**:
- [ ] 告警可触发

**预估工时**: 1h

---

### P1C-09 性能基线测量

**任务**: 记录 MVP 首版性能

| 指标 | 目标值 |
|------|--------|
| 冷启动 TTI | ≤ 3s (4G) |
| 热启动 TTI | ≤ 1s |
| Feed 滚动 | ≥ 55fps |
| 图片压缩 | ≤ 2s/张 |
| 发帖成功率 | > 98% |

**交付标准**:
- [ ] 各指标测量并记录

**预估工时**: 2h

---

### P1C-10 合规文本

**任务**: 用户协议 + 隐私政策 + 年龄门槛

**交付标准**:
- [ ] 注册时展示并确认
- [ ] 年龄 18+ 确认
- [ ] 满足 App Store / Google Play 要求

**预估工时**: 运营配合

---

### P1C-11 最终回归测试

**任务**: 覆盖两个核心闭环

**测试范围**:
- 找店闭环全链路
- 社区闭环全链路
- 权限和安全
- 弱网和边界情况

**交付标准**:
- [ ] 核心路径无阻塞级问题
- [ ] 已知问题记录并分级

**预估工时**: 4h

---

### P1C 阶段总结

| ID | 任务 | 前置 | 工时 | 角色 |
|----|------|------|------|------|
| P1C-01 | 草稿箱 | P1B-06 | 4h | MOB |
| P1C-02 | 弱网恢复 | P0b-05 | 3h | MOB |
| P1C-03 | 频率限制 | P0b-02,03 | 4h | BE |
| P1C-04 | 过期清理 | P0b-02 | 2h | BE |
| P1C-05 | 邀请码 | P0a-10 | 4h | 全栈 |
| P1C-06 | 灰度分发 | P0b-21 | 3h | MOB |
| P1C-07 | 埋点校验 | P0b-23 | 3h | MOB |
| P1C-08 | 告警规则 | P0b-22 | 1h | DevOps |
| P1C-09 | 性能基线 | P1A-09 | 2h | MOB |
| P1C-10 | 合规文本 | 无 | 运营 | 产品/法务 |
| P1C-11 | 最终回归 | 全部 | 4h | QA |

---

## 10. 验收标准总表

### 10.1 闭环 1 — 找店

| 验收项 | 标准 |
|--------|------|
| 授权定位后看到附近门店 | ≤3s 首屏展示 |
| 拒绝定位后可手动选区 | 选区后列表正确 |
| 门店列表信息完整 | 名称+地址+距离+营业状态 |
| 已收藏门店优先展示 | 分区列表 |
| 门店详情页信息完整 | 地址+营业时间+电话+导航 |
| 外部导航跳转正确 | iOS→Apple Maps, Android→Google Maps |
| B 端可独立维护门店 | 编辑+营业时间+坐标校准 |

### 10.2 闭环 2 — 社区

| 验收项 | 标准 |
|--------|------|
| 可发布图文帖子 | 纯文字 + 至多 9 张图 |
| 发帖失败不丢内容 | 草稿箱可恢复 |
| Feed 时间倒序展示 | 游标分页，无重复/漏数据 |
| 点赞/评论即时可用 | 乐观更新，弱网可重试 |
| 举报可用 | 帖子/评论/用户三类 |
| 拉黑可用 | Feed 过滤生效 |
| 管理员可下架违规内容 | 隐藏后 C 端不可见 |
| 管理员可封禁用户 | 封禁后无法操作 |

### 10.3 性能指标

| 指标 | 目标 |
|------|------|
| 冷启动 TTI | ≤ 3s (4G) |
| 热启动 | ≤ 1s |
| Feed 滚动 | ≥ 55fps |
| 发帖成功率 | > 98% |
| App 崩溃率 | < 1% |
| API 错误率 | < 2% |
| 审核 SLA | 管理员 60s 内可下架 |

### 10.4 数据可观测

必须在 PostHog 看到以下五个漏斗:

1. **定位授权率** — 打开找店 → 同意定位
2. **导航点击率** — 查看门店 → 点击导航
3. **发帖漏斗** — 点击发布 → 选图 → 填写 → 上传 → 成功
4. **互动率** — 帖子曝光 → 点赞/评论/收藏
5. **留存** — D1 / D7

---

## 11. 风险登记与应对

| # | 风险 | 概率 | 影响 | 应对 |
|---|------|------|------|------|
| R1 | RLS 复杂度超预期 | 高 | 底座延期 1-2 周 | 先做最小 RLS，复杂写操作走 Edge Function |
| R2 | 冷启动内容不足 | 高 | MVP 无意义 | 上线前 2 周启动种子内容，团队先内测 |
| R3 | GPS 漂移 | 中 | 用户不信任 | B 端拖拽校准 + 客户端异常检测 |
| R4 | Metro monorepo 踩坑 | 中 | 开发环境无法启动 | P0a 第一优先级解决，必要时 fallback |
| R5 | 图片上传 OOM | 中 | App 崩溃 | 严格压缩规格，逐张上传 |
| R6 | UGC 违规内容 | 中 | App Store 下架 | 审核后台前置到 P0b |
| R7 | Web→Supabase 迁移导致功能回归 | **高** | 现有 Web 功能受损 | 每个 store 保留 fallback 开关；迁移完立即跑 P0b-20 集成测试；community-store 是最高风险项（数据模型完全不同），优先做适配层 |
| R8 | 酒类合规 | 中 | 拒审 | P1C 前完成合规文本+年龄门槛 |
| R9 | 商户自服务意愿低 | 中 | 数据更新滞后 | 首期平台代运营 |

---

## 12. 首发前检查清单

### 技术检查
- [ ] Schema 迁移文件冻结
- [ ] RLS 测试全部通过
- [ ] 上传链路压测通过
- [ ] Sentry 错误监控验证
- [ ] PostHog 埋点验证
- [ ] Deep Link 验证
- [ ] i18n 验证
- [ ] 过期上传清理任务运行正常

### 产品检查
- [ ] 找店闭环全路径走通
- [ ] 社区闭环全路径走通
- [ ] 拒绝定位场景验证
- [ ] 发帖失败恢复验证
- [ ] 举报+隐藏验证
- [ ] B 端可独立维护门店

### 运营检查
- [ ] 种子商户已导入（30-50 家，坐标已校准）
- [ ] 种子酒款已导入（200-500 条）
- [ ] 种子内容已准备（100-200 条）
- [ ] 邀请码已生成
- [ ] 内测用户名单确认
- [ ] 合规文本就位

---

## 13. 上线后 2 周观察重点

不急着扩需求，先盯以下指标:

1. 定位授权率是否 >60%
2. 门店列表是否真的被点击和收藏
3. 导航点击率是否有意义
4. 发帖成功率是否 >98%
5. 用户发帖后是否获得互动
6. 举报量和审核压力是否可控
7. D1 留存是否 >30%

**如果这些指标不成立，Phase 2 暂停，先修闭环和冷启动。**

---

## 14. Phase 2 预告（不在本文档排期内）

上线验证数据后才启动:
- 高级地图整合（Mapbox 品牌色地图）
- 瀑布流布局
- 话题标签 + 热榜
- 站内通知中心
- 受控 IM（用户→商户咨询）
- 关注优先 + 地域推荐混排 Feed
- AI 选酒助手接入 Claude API
