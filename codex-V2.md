# Your Wine Book — V2 升级总控执行清单

> 基于 MVP 已完成的 Phase 0~1C，针对现有 Web + Mobile 全面审计后拟定的下一阶段升级计划。
>
> 核心目标：补齐 AI 选酒核心差异化能力、完善移动端体验、建立工程质量底线、提升用户留存与运营效率。

---

## 1. 现状总结

### 1.1 已完成资产

| 维度 | 数据 |
|------|------|
| Web 页面 | 36 页（前台 18 + 后台 10 + 登入 + API 47 条路由） |
| Mobile 页面 | 15 路由（4 Tab + 5 详情/设置 + 深链占位） |
| Supabase | 25 张表 + 75 条 RLS + 8 次迁移 + 5 个 Edge Function |
| 共享包 | @ywb/domain（692 LOC） + query-keys + supabase-types |
| 测试 | RLS 105 断言 + 集成测试 87 项 + 埋点 29 事件 |
| 监控 | Sentry 三端配置（未启用 DSN）+ PostHog 双端（未启用 Key） |

### 1.2 关键缺口（按影响排序）

| # | 缺口 | 影响 | 当前状态 |
|---|------|------|---------|
| 1 | AI 选酒助手 | 产品核心差异化为零 | /ai 页面纯静态 Demo，输入框 disabled |
| 2 | 自动化测试 | 无法安全重构，CI 仅跑 lint+build | 0 个 test 文件，手动 bash 脚本 |
| 3 | Mobile Profile Tab | 4 个菜单项全为空回调 | 40% 完成度 |
| 4 | 发帖酒款标注 | 社区内容无法关联酒款 | 硬编码 `product_ids: []` |
| 5 | 酒款 CRUD | 后台新增酒款为 Demo 模式不入库 | 表单存在但不持久化 |
| 6 | CSV 批量导入 | 酒商无法批量上架 | 完全未实现 |
| 7 | 404 / Error 页面 | 用户遇到空白或系统错误 | 无 not-found.tsx，global-error 无品牌样式 |
| 8 | 邀请码闭环 | Mobile 深链不处理邀请 | /invite/[code] 仅 redirect |
| 9 | 推送通知 | 用户无回访驱动力 | 完全未实现 |
| 10 | Staging 环境 | 变更直接上生产 | 无 staging，手动 PM2 部署 |

---

## 2. 成功定义

本次 V2 只有五个成功标准：

1. **AI 选酒助手可用**
   - 用户输入自然语言（场景/预算/偏好），AI 返回酒款推荐 + 比价信息。
   - 基于 Claude API + tool use，可调用现有 queries.ts 数据层。
   - 支持多轮对话和中英文。

2. **Mobile 可提交 App Store 审核**
   - Profile Tab 完整可用（我的帖子、收藏、黑名单、设置全部可导航）。
   - 发帖支持酒款标注。
   - 邀请码深链可处理。
   - 有独立的登入/注册页面（不依赖外部 Edge Function）。

3. **工程质量有底线**
   - 核心业务路径有自动化测试（>= 60% 关键路径覆盖）。
   - CI 跑测试，红灯不能合。
   - 有 Staging 环境可预览。

4. **后台酒款管理闭环**
   - 酒商可真正新增/编辑/下架酒款。
   - 支持 CSV 批量导入。
   - 价格变动前台实时生效。

5. **用户有理由回来**
   - 推送通知可触达（点赞/评论/关注）。
   - 关注 Feed（只看关注的人）。
   - 酒款收藏列表可分享。

---

## 3. 范围锁定

### 3.1 必做范围

- AI 选酒助手（Claude API + tool use + 流式输出）。
- Mobile 补完（Profile、登入、发帖酒款标注、邀请码）。
- 自动化测试基建（Vitest + Playwright + CI 集成）。
- 酒款 CRUD 闭环（新增/编辑/下架/CSV 导入）。
- 404 / Error 页面 + 全局错误边界。
- 推送通知基础（Expo Notifications + 后台触发）。
- Staging 环境。

### 3.2 明确不做

- 电商 / 支付 / 购物车
- 站内 IM / 私信
- 推荐算法 / 个性化 Feed
- 瀑布流 / 短视频
- KOL 认证 / UGC 自动翻译
- Web 端社区重写（保持现有实现）
- App 内路线规划
- 多语言扩展（保持 zh-HK + en）

---

## 4. 阶段总览

| 阶段 | 目标 | 排期参考 | 退出条件 |
|------|------|----------|----------|
| Phase 2A | AI 选酒助手 | 1.5 周 | 用户可多轮对话获取酒款推荐 + 比价 |
| Phase 2B | Mobile 补完 | 1.5 周 | Profile 完整 + 登入注册 + 酒款标注 + 邀请码 |
| Phase 2C | 测试与质量基建 | 1 周 | Vitest + Playwright + CI 绿灯 + Staging |
| Phase 2D | 后台酒款管理闭环 | 1 周 | 酒款 CRUD + CSV 导入 + 价格实时生效 |
| Phase 2E | UX 与错误处理 | 0.5 周 | 404 页面 + Error 边界 + 全局优化 |
| Phase 2F | 增长与留存 | 1.5 周 | 推送通知 + 关注 Feed + 收藏分享 |

---

## 5. 执行铁律

### 5.0 基础规则（承继自 MVP 阶段）

以下规则在 V2 阶段继续生效：

**任务颗粒**
- 以"一个可验证任务单元"为最小执行颗粒。
- 不允许跨阶段跳做。
- 不允许把多个高风险改动捆成一次大提交。

**先读再改**
- 每个任务开始前，先确认相关文件、依赖关系、导出函数、环境变量、现有脚本。
- 不在不了解上下文的前提下直接写代码。

**保持外部接口稳定**
- 迁移或升级时，导出函数签名尽量不变。
- 能通过内部适配层解决的问题，不要扩散到页面和 API route。

**Do No Harm**
- 已有 Web 的页面、组件、样式、i18n、路由结构尽量不动。
- 只在必要处调整调用逻辑或兼容层。

**遇错即停**
- 任何 `build`、`typecheck`、`db reset`、集成测试失败，必须立即修。
- 不允许带着红灯进入下一任务。
- 不允许用注释掉报错、跳过脚本、临时删类型等方式假装通过。

**所有命令非交互**
- 初始化、安装、迁移、构建、测试都使用非交互命令。

**高风险任务留回退路径**
- 新增环境变量控制的功能必须在无变量时优雅降级。

**标准开发与部署工作流**
```
开发：npm run dev → localhost:3001
生产：PM2 wine-prod → localhost:3000
部署：npm run deploy → build + pm2 restart wine-prod
```
- 开发与生产端口隔离。不要 `pm2 delete wine-prod`，只 `stop` / `restart`。

### 5.1 测试先行

- Phase 2C 完成后，后续每个 Phase 必须同步补测试。
- 新增 API 路由必须有对应的集成测试。
- 修 bug 必须先写失败测试，再修复。

### 5.2 AI 功能的安全边界

- Claude API 调用必须有 token 限制（单次对话 max_tokens）和费用预估。
- 用户输入必须有长度限制和基础内容过滤。
- AI 回复必须标注"仅供参考"免责声明。
- 不允许 AI 生成酒精推销语言或绕过年龄门槛。

### 5.3 Mobile 发版纪律

- 每个 Phase 结束后产出一次 EAS Preview build。
- 功能合入前必须通过 `expo export --platform web` 验证。
- 原生权限变更（推送、相机等）必须在 app.json 中显式声明。

---

## 6. 详细任务清单

---

## Phase 2A — AI 选酒助手

### 阶段目标

- 将 /ai 页面从静态 Demo 升级为真正可用的 AI 选酒对话。
- 基于 Claude API + tool use，让 AI 能查询酒款、比价、推荐。
- 支持流式输出，用户体验自然。

### 关键原则

- AI 是"朋友推荐酒"的语气，不是销售机器人。
- 必须复用现有 queries.ts 数据层，不另建数据通道。
- 必须支持中英文对话（根据当前 locale 自动切换）。
- 每条推荐必须附带真实比价数据。

### 退出条件

- 用户可输入自然语言描述场景/偏好/预算。
- AI 返回 1~5 款酒的推荐，含名称、价格范围、推荐理由。
- 可进行多轮对话（最少 5 轮）。
- 流式输出，首字节 < 2 秒。
- 移动端和桌面端均可用。

### [ ] P2A-01 设计 AI Tool 定义

- 前置：无
- 动作：
  1. 定义 Claude tool use 的工具集：
     - `search_wines(query, filters?)` — 搜索酒款（关键词 + 类型/产区/价格筛选）
     - `get_wine_detail(slug)` — 获取酒款详情（含品酒笔记）
     - `get_wine_prices(slug)` — 获取跨酒商比价
     - `get_scene_wines(scene)` — 获取场景推荐
     - `get_regions()` — 获取所有产区
  2. 编写 tool 的 JSON Schema 定义。
  3. 编写 system prompt，定义 AI 人格：温暖朋友、懂酒但不端架子、不推销。
  4. 定义 locale 感知逻辑：zh-HK locale 用中文回复，en 用英文。
- 输出物：
  - `apps/web/src/lib/ai-tools.ts` — tool 定义 + system prompt
- 自检：
  - TypeScript 类型正确
  - tool schema 符合 Claude API tool_use 规范
- 完成标准：
  - 5 个 tool 定义完整，每个 tool 有清晰的 description 和参数 schema。

### [ ] P2A-02 开发 AI 对话 API 路由

- 前置：P2A-01
- 动作：
  1. 新增 `/api/ai/chat` POST 路由。
  2. 接收 `messages[]` + `locale` 参数。
  3. 调用 Claude API（Anthropic SDK），使用 P2A-01 的 tool 定义。
  4. 实现 tool use 回调：当 Claude 请求调用 tool 时，执行对应的 queries.ts 函数，返回结果。
  5. 支持流式响应（ReadableStream / SSE）。
  6. 添加 token 限制（max_tokens: 2048）。
  7. 添加频率限制（每用户 20 次/小时，未登入 5 次/小时）。
  8. 添加输入长度限制（单条消息 500 字）。
- 输出物：
  - `/api/ai/chat` 路由
- 自检：
  - curl 测试：发送消息 → 收到流式推荐
  - tool use 回调正确执行（可看到 queries.ts 日志）
  - 超频返回 429
  - 超长输入返回 400
- 完成标准：
  - API 能完成至少 3 轮对话，每轮能正确调用 tool 获取数据。

### [ ] P2A-03 开发 AI 对话前端组件

- 前置：P2A-02
- 动作：
  1. 新建 `components/ai/ChatInterface.tsx` — Client Component。
  2. 消息列表：用户消息 + AI 消息（支持流式渲染）。
  3. 输入框：带发送按钮、字数限制、Enter 发送。
  4. AI 消息中的酒款推荐以卡片形式展示（复用 WineCard 或精简版）。
  5. AI 消息中的比价数据以表格展示。
  6. 加载状态：AI 思考中的动画。
  7. 免责声明："AI 推荐仅供参考，请以实际酒商信息为准"。
  8. 历史对话保存在 sessionStorage（刷新不丢失，关闭清除）。
- 输出物：
  - `components/ai/ChatInterface.tsx`
  - `components/ai/AiWineCard.tsx` — AI 推荐中的酒款卡片
  - `components/ai/AiPriceTable.tsx` — AI 推荐中的比价表
- 自检：
  - 流式渲染无闪烁
  - 酒款卡片可点击跳转详情页
  - 移动端宽度适配
- 完成标准：
  - 对话体验自然流畅，推荐内容有数据支撑。

### [ ] P2A-04 升级 /ai 页面

- 前置：P2A-03
- 动作：
  1. 将 /ai 页面从静态 Demo 改为使用 ChatInterface。
  2. 保留示范对话作为首屏引导（"你可以这样问我..."），但改为可交互。
  3. 添加快捷场景按钮（"200 元以下适合约会的红酒"、"送给懂酒朋友的礼物"等）。
  4. 首页 AI 入口按钮链接到 /ai 页面。
  5. 更新 i18n 文案：移除 "coming soon"，添加引导语和免责声明。
- 输出物：
  - 更新后的 `/[locale]/ai/page.tsx`
  - 更新后的 `messages/zh-HK.json` 和 `messages/en.json`
- 自检：
  - `pnpm --filter web build` 通过
  - 页面可正常对话
  - 快捷按钮可触发预设查询
- 完成标准：
  - AI 选酒页面从 Demo 升级为真正可用的交互功能。

### [ ] P2A-05 AI 选酒 QA 与边界测试

- 前置：P2A-04
- 动作：
  1. 测试 10 种典型场景（送礼、约会、聚餐、日常、预算内、特定产区、特定类型等）。
  2. 测试边界情况：空输入、超长输入、无关话题、恶意输入。
  3. 测试多轮对话连贯性（"再推荐一款"、"比这个便宜的"）。
  4. 测试双语切换（中文页面中文回复、英文页面英文回复）。
  5. 验证推荐的酒款在数据库中真实存在。
  6. 验证比价数据与酒款详情页一致。
  7. 新增 PostHog 埋点：`ai_chat_started` / `ai_message_sent` / `ai_recommendation_clicked`。
- 输出物：
  - QA 测试报告
  - 埋点验证通过
- 自检：
  - 10 个场景全部产出合理推荐
  - 推荐酒款全部可跳转
  - 集成测试脚本新增 AI 相关检查
- 完成标准：
  - AI 功能具备上线质量。

---

## Phase 2B — Mobile 补完

### 阶段目标

- 补齐 Mobile App 所有功能缺口，达到可提交 App Store 审核的状态。
- Profile Tab 从 40% 提升到 100%。
- 发帖页面支持酒款标注。
- 有独立的登入/注册流程。

### 退出条件

- Profile Tab 4 个菜单项全部可导航并有对应页面。
- 发帖可选关联酒款（搜索 + 选中 + 展示）。
- 邀请码深链可验证并引导注册。
- 有独立的登入/注册页面。
- EAS Preview build 可产出。

### [ ] P2B-01 Mobile 登入/注册页面

- 前置：无
- 动作：
  1. 新建 `app/auth/login.tsx` — 登入页面。
  2. 新建 `app/auth/register.tsx` — 注册页面。
  3. Email/密码表单，品牌样式。
  4. 注册页面包含邀请码输入（若 REQUIRE_INVITE_CODE 启用）。
  5. 注册页面包含年龄确认声明和法律链接。
  6. 密码强度指示条。
  7. 错误提示（账号不存在、密码错误、邮箱已注册）。
  8. 成功后调用 AuthProvider 的 signIn/signUp，自动回到之前页面。
  9. Profile Tab 的"登入"按钮改为导航到 `/auth/login`。
- 输出物：
  - `app/auth/login.tsx`
  - `app/auth/register.tsx`
  - `app/auth/_layout.tsx`
- 自检：
  - `npx expo export --platform web` 通过
  - 登入/注册流程完整
- 完成标准：
  - 用户可在 App 内完成完整的认证流程。

### [ ] P2B-02 Profile Tab — 我的帖子页面

- 前置：P2B-01
- 动作：
  1. 新建 `app/my-posts.tsx` — 我的帖子列表。
  2. 查询当前用户的所有帖子（含 hidden 状态的显示为灰色）。
  3. 复用 PostCard 组件。
  4. 支持下拉刷新。
  5. 空状态："还没有发过帖子，去发一条吧"。
  6. Profile Tab 的"我的帖子"菜单导航到此页面。
- 输出物：
  - `app/my-posts.tsx`
- 自检：
  - 导航正确，返回正确
  - 帖子列表完整
- 完成标准：
  - 用户可查看自己的所有帖子。

### [ ] P2B-03 Profile Tab — 收藏页面

- 前置：P2B-01
- 动作：
  1. 新建 `app/bookmarks.tsx` — 收藏页面。
  2. 三个 Tab：收藏帖子 / 收藏酒款 / 收藏门店。
  3. 帖子收藏：查询 `post_bookmarks` + posts 关联。
  4. 酒款收藏：查询 `wine_bookmarks` + wines 关联。
  5. 门店收藏：查询 `store_bookmarks` + merchant_locations 关联。
  6. 各 Tab 支持下拉刷新和空状态。
  7. Profile Tab 的"收藏"菜单导航到此页面。
- 输出物：
  - `app/bookmarks.tsx`
- 自检：
  - 三个 Tab 切换正常
  - 取消收藏后列表实时更新
- 完成标准：
  - 用户可统一管理所有收藏内容。

### [ ] P2B-04 Profile Tab — 导航修复

- 前置：P2B-02, P2B-03
- 动作：
  1. 修复 profile.tsx 中 4 个空回调。
  2. "我的帖子" → `/my-posts`
  3. "收藏" → `/bookmarks`
  4. "黑名单" → `/settings`（复用 settings 页面的黑名单区域）
  5. "设置" → `/settings`
  6. 添加菜单项右箭头指示。
- 输出物：
  - 更新后的 `app/(tabs)/profile.tsx`
- 自检：
  - 4 个菜单项全部可导航
  - 返回键行为正确
- 完成标准：
  - Profile Tab 功能完整度 100%。

### [ ] P2B-05 发帖 — 酒款搜索与标注

- 前置：无
- 动作：
  1. 新建 `components/WineSearchPicker.tsx` — 酒款搜索选择器。
  2. 搜索框 + 下拉结果列表（调用 `/api/search?q=` 或 Supabase wines 表模糊查询）。
  3. 选中的酒款以 tag 形式显示在发帖表单中（最多 10 款）。
  4. 每个 tag 可点击移除。
  5. 集成到 create.tsx，替换硬编码的 `product_ids: []`。
  6. finalize-post Edge Function 已支持 product_ids，无需修改。
- 输出物：
  - `components/WineSearchPicker.tsx`
  - 更新后的 `app/(tabs)/create.tsx`
- 自检：
  - 搜索可返回结果
  - 选中酒款可正确传给 finalize-post
  - 帖子详情页可展示关联酒款
- 完成标准：
  - 社区内容与酒款数据形成关联。

### [ ] P2B-06 发帖 — 标签输入

- 前置：无
- 动作：
  1. 新建 `components/TagInput.tsx` — 标签输入组件。
  2. 预设标签列表（来自 @ywb/domain tags 常量）+ 自定义输入。
  3. 已选标签以 pill 形式展示，可点击移除。
  4. 最多 5 个标签。
  5. 集成到 create.tsx，替换硬编码的 `tags: []`。
- 输出物：
  - `components/TagInput.tsx`
  - 更新后的 `app/(tabs)/create.tsx`
- 自检：
  - 标签可选可删
  - 帖子详情页可展示标签
- 完成标准：
  - 帖子内容可被标签分类。

### [ ] P2B-07 邀请码深链处理

- 前置：P2B-01
- 动作：
  1. 重写 `app/invite/[code].tsx`，移除 redirect stub。
  2. 调用 `/api/invite-code?code=XXX` 验证码有效性。
  3. 有效 → 存入 AsyncStorage → 导航到注册页面（自动填入邀请码）。
  4. 无效/过期 → 显示错误提示 + "前往首页"按钮。
  5. 已登入用户打开邀请链接 → 显示"已登入"提示。
- 输出物：
  - 更新后的 `app/invite/[code].tsx`
- 自检：
  - 有效码 → 注册页面
  - 无效码 → 错误提示
- 完成标准：
  - 邀请码闭环在 Mobile 端完整可用。

### [ ] P2B-08 Mobile 个人资料编辑

- 前置：P2B-01
- 动作：
  1. 新建 `app/edit-profile.tsx` — 编辑资料页面。
  2. 修改显示名称。
  3. 修改头像（调用 pickAvatar + 上传到 avatars bucket）。
  4. 修改密码（调用 Supabase Auth updateUser）。
  5. Profile Tab 添加编辑入口。
- 输出物：
  - `app/edit-profile.tsx`
- 自检：
  - 修改后返回 Profile 页可见更新
- 完成标准：
  - 用户可在 App 内完成基本的资料修改。

### [ ] P2B-09 Mobile 补完 QA 回归

- 前置：P2B-01 ~ P2B-08
- 动作：
  1. 验证完整登入→注册→浏览→发帖→互动→编辑资料流程。
  2. 验证 Profile Tab 所有菜单项。
  3. 验证发帖酒款标注 + 标签输入。
  4. 验证邀请码深链。
  5. EAS Preview build 产出。
- 输出物：
  - QA 清单 + EAS build
- 自检：
  - `npx expo export --platform web` 通过
  - 所有 TODO 标记清除
- 完成标准：
  - Mobile App 可提交 App Store 审核。

---

## Phase 2C — 测试与质量基建

### 阶段目标

- 建立自动化测试基础设施。
- CI 能跑测试，红灯阻止合并。
- 有 Staging 环境可预览。

### 退出条件

- Vitest 单元测试覆盖核心 lib 函数（>= 20 个测试文件）。
- Playwright E2E 覆盖核心用户路径（>= 10 个场景）。
- CI pipeline 跑测试，失败不合。
- Staging 环境可独立访问。

### [ ] P2C-01 Vitest 基础设施

- 前置：无
- 动作：
  1. 安装 `vitest` + `@testing-library/react` 到 web workspace。
  2. 配置 `vitest.config.ts`，支持 path alias 和 TypeScript。
  3. 编写第一个测试文件验证配置可用。
  4. 根 `package.json` 添加 `test` script。
- 输出物：
  - `apps/web/vitest.config.ts`
  - `apps/web/src/__tests__/setup.ts`
- 自检：
  - `pnpm --filter web test` 可执行
- 完成标准：
  - 测试基础设施可用。

### [ ] P2C-02 核心 Lib 单元测试

- 前置：P2C-01
- 动作：
  1. `locale-helpers.test.ts` — toWineCard / getMerchantLocale / formatMerchantPrices。
  2. `queries.test.ts` — getWinesPaginated / getWineBySlug（mock 数据路径）。
  3. `rate-limit.test.ts` — checkRateLimit 窗口滑动和过期清理。
  4. `password.test.ts` — hash 和 verify。
  5. `@ywb/domain` 测试：validateFiles / getBusinessStatus / districts。
- 输出物：
  - >= 15 个测试文件
- 自检：
  - 全部通过
- 完成标准：
  - 核心数据处理逻辑有回归保护。

### [ ] P2C-03 API 路由集成测试

- 前置：P2C-01
- 动作：
  1. 使用 Vitest 的 Node 环境模拟 Next.js API 路由。
  2. 测试公开数据 API（wines, merchants, scenes, search）。
  3. 测试认证 API（login, logout, me）。
  4. 测试权限边界（非 admin 访问 admin API → 403）。
  5. 测试频率限制（超频 → 429）。
- 输出物：
  - `src/__tests__/api/` 目录
- 自检：
  - 全部通过
- 完成标准：
  - API 层有自动化回归保护。

### [ ] P2C-04 Playwright E2E 测试

- 前置：P2C-01
- 动作：
  1. 安装 `@playwright/test`。
  2. 配置 `playwright.config.ts`，baseURL 指向 dev server。
  3. 编写核心用户路径 E2E：
     - 首页 → 搜索 → 酒款详情 → 比价
     - 首页 → 场景 → 推荐酒款
     - 登入 → Dashboard → 酒款管理
     - 注册 → 收藏酒款 → 个人中心查看
     - AI 对话（若 API key 可用）
  4. 截图对比用于视觉回归（可选）。
- 输出物：
  - `apps/web/e2e/` 目录
  - `apps/web/playwright.config.ts`
- 自检：
  - `pnpm --filter web test:e2e` 通过
- 完成标准：
  - 核心用户路径有 E2E 保护。

### [ ] P2C-05 CI 集成测试步骤

- 前置：P2C-02, P2C-03
- 动作：
  1. 更新 `.github/workflows/ci.yml`。
  2. 新增 `test` job：运行 Vitest 单元测试 + API 测试。
  3. 新增 `e2e` job（可选，需要 dev server）：运行 Playwright。
  4. 测试失败时阻止 PR 合并（required status check）。
  5. 生成覆盖率报告并注释到 PR。
- 输出物：
  - 更新后的 `.github/workflows/ci.yml`
- 自检：
  - Push 后 CI 触发测试
- 完成标准：
  - 红灯不能合。

### [ ] P2C-06 Staging 环境

- 前置：无
- 动作：
  1. 配置第二个 PM2 进程 `wine-staging`，端口 3002。
  2. Nginx 添加 `staging.yourwinebook.com` → localhost:3002。
  3. Staging 使用独立的 `.env.staging`（可以使用生产 Supabase 的只读副本或继续用 mock）。
  4. 添加 `npm run deploy:staging` 脚本。
  5. CI 通过后自动部署到 Staging（可选）。
- 输出物：
  - `ecosystem.staging.config.js`
  - Nginx 配置更新
  - deploy:staging script
- 自检：
  - `staging.yourwinebook.com` 可访问
- 完成标准：
  - 变更可先在 Staging 验证再上生产。

---

## Phase 2D — 后台酒款管理闭环

### 阶段目标

- 酒商可在后台真正新增、编辑、下架酒款。
- 支持 CSV 批量导入。
- 价格变动前台实时生效。

### 退出条件

- 新增酒款可持久化到数据库。
- 编辑酒款信息可保存。
- 下架/上架切换生效。
- CSV 导入可批量处理（含错误报告）。

### [ ] P2D-01 酒款新增 API

- 前置：无
- 动作：
  1. 新增 `/api/merchant/wines` POST — 创建酒款。
  2. Legacy 模式：写入 mock-data（运行时追加，重启丢失，加提示）。
  3. Supabase 模式：写入 wines 表 + merchant_prices + wine_tags。
  4. 字段：名称（中/英）、slug（自动生成）、类型、产区、年份、描述、品酒笔记、价格。
  5. slug 去重检查。
  6. 权限：仅已认证的活跃酒商。
- 输出物：
  - 更新后的 `/api/merchant/wines` 路由
- 自检：
  - 创建后可在酒款列表中查到
- 完成标准：
  - 酒商可通过 API 新增酒款。

### [ ] P2D-02 酒款编辑 API

- 前置：P2D-01
- 动作：
  1. 新增 `/api/merchant/wines/[slug]` PATCH — 编辑酒款信息。
  2. 可更新：名称、描述、品酒笔记、标签、产区、年份。
  3. 不可更改：slug、类型。
  4. 新增 `/api/merchant/wines/[slug]` DELETE — 下架（soft delete）。
- 输出物：
  - 更新后的 API 路由
- 自检：
  - 编辑后前台页面可见更新
  - 下架后搜索不可见
- 完成标准：
  - 酒款信息管理完整。

### [ ] P2D-03 升级 /dashboard/wines/new 页面

- 前置：P2D-01
- 动作：
  1. 将现有 "Demo mode" 页面升级为真正可提交的表单。
  2. 表单提交调用 POST /api/merchant/wines。
  3. 成功后跳转到酒款管理列表。
  4. 添加产区下拉选择（从 /api/search?action=regions 获取）。
  5. 添加标签多选。
  6. 添加品酒笔记 textarea（中/英双栏）。
  7. 移除 "Demo mode" 相关标记。
- 输出物：
  - 更新后的 `/dashboard/wines/new/page.tsx`
- 自检：
  - `pnpm --filter web build` 通过
  - 新增酒款可在列表中查到
- 完成标准：
  - 新增酒款流程真正可用。

### [ ] P2D-04 酒款编辑页面

- 前置：P2D-02
- 动作：
  1. 新增 `/dashboard/wines/[slug]/edit` 页面 或 列表行内编辑模式。
  2. 预填现有数据。
  3. 保存调用 PATCH API。
  4. 下架按钮 + 确认弹窗。
- 输出物：
  - 酒款编辑 UI
- 自检：
  - 编辑保存后列表同步更新
- 完成标准：
  - 酒商可编辑和下架已有酒款。

### [ ] P2D-05 CSV 批量导入

- 前置：P2D-01
- 动作：
  1. 新增 `/dashboard/wines/import` 页面。
  2. 文件上传区（接受 .csv）。
  3. CSV 解析 + 预览表格（前 10 行预览，显示字段映射）。
  4. 字段映射确认界面。
  5. 批量提交（逐条调用 POST API，统计成功/失败数）。
  6. 导入结果报告：成功数、失败数、失败原因（slug 重复、必填字段缺失等）。
  7. 提供 CSV 模板下载。
- 输出物：
  - `/dashboard/wines/import` 页面
  - CSV 模板文件
- 自检：
  - 10 条数据 CSV 可成功导入
  - 错误行有明确报告
- 完成标准：
  - 酒商可批量上架酒款。

### [ ] P2D-06 酒款管理 QA 回归

- 前置：P2D-01 ~ P2D-05
- 动作：
  1. 验证：新增 → 列表可见 → 编辑 → 前台更新 → 下架 → 前台不可见。
  2. 验证：CSV 导入 → 批量上架 → 逐条检查。
  3. 验证：价格更新 → 比价页面实时更新。
  4. 验证：权限边界（A 酒商不能改 B 酒商的酒）。
  5. 集成测试新增对应检查。
- 输出物：
  - QA 清单全部通过
- 自检：
  - 集成测试通过
- 完成标准：
  - 酒款管理闭环完整。

---

## Phase 2E — UX 与错误处理

### 阶段目标

- 消灭用户可能遇到的空白页面和裸错误。
- 提升整体打磨度。

### 退出条件

- 所有路由有 404 处理。
- 全局错误页面有品牌样式。
- API 错误消息支持 i18n。
- Dashboard 在移动端可用。

### [ ] P2E-01 404 Not Found 页面

- 前置：无
- 动作：
  1. 新增 `src/app/[locale]/not-found.tsx` — 前台 404 页面。
  2. 新增 `src/app/dashboard/not-found.tsx` — 后台 404 页面。
  3. 品牌设计：emoji + 友好文案 + 返回首页按钮。
  4. 双语支持。
- 输出物：
  - 两个 not-found.tsx 文件
- 自检：
  - 访问不存在的路由显示 404 页面（非空白）
- 完成标准：
  - 无路由死角。

### [ ] P2E-02 全局错误页面升级

- 前置：无
- 动作：
  1. 升级 `src/app/global-error.tsx`。
  2. 使用品牌配色（暖白背景、酒红强调）。
  3. 添加友好错误文案 + "重试"按钮 + "返回首页"按钮。
  4. 保留 Sentry 上报。
- 输出物：
  - 更新后的 `global-error.tsx`
- 自检：
  - 触发错误时显示品牌风格的错误页面
- 完成标准：
  - 系统错误不再暴露裸 HTML。

### [ ] P2E-03 API 错误消息 i18n

- 前置：无
- 动作：
  1. 审计所有 API 路由中的硬编码错误消息。
  2. 统一错误响应格式：`{ error: string, code: string }`。
  3. 前端根据 code 显示对应 locale 的错误提示（或直接使用 error 字段）。
  4. 至少覆盖：认证错误、权限错误、频率限制、输入校验。
- 输出物：
  - 更新后的 API 路由
- 自检：
  - 错误消息格式统一
- 完成标准：
  - 用户看到的所有错误消息有意义且语言正确。

### [ ] P2E-04 Dashboard 移动端适配

- 前置：无
- 动作：
  1. 审计 Dashboard 所有页面在 375px 宽度下的显示。
  2. 修复溢出、表格横滚、按钮挤压问题。
  3. Sidebar 在移动端改为抽屉式（hamburger 触发）。
  4. 统计卡片改为纵向堆叠。
- 输出物：
  - 更新后的 Dashboard 组件
- 自检：
  - 手机浏览器可正常操作后台
- 完成标准：
  - 酒商可在手机上管理后台。

### [ ] P2E-05 搜索体验优化

- 前置：无
- 动作：
  1. 搜索结果页：空结果时显示建议（"试试放宽条件"）。
  2. Navbar 搜索 overlay 添加最近搜索记录（localStorage）。
  3. 搜索页 URL 支持分享（所有筛选条件已在 query string 中，验证完整性）。
  4. 搜索框聚焦时显示热门搜索词。
- 输出物：
  - 更新后的搜索组件
- 自检：
  - 搜索体验顺畅
- 完成标准：
  - 搜索是用户找酒的高效通道。

---

## Phase 2F — 增长与留存

### 阶段目标

- 给用户回来的理由。
- 推送通知可触达。
- 社交关系驱动内容消费。

### 退出条件

- 推送通知基础可用（点赞/评论/关注触发）。
- 关注 Feed 可切换。
- 酒款收藏列表可分享。

### [ ] P2F-01 推送通知基础设施

- 前置：无
- 动作：
  1. 安装 `expo-notifications`。
  2. 新增 Supabase 迁移：`push_tokens` 表（user_id, token, platform, created_at）。
  3. 新增 `hooks/usePushNotifications.ts`：请求权限 + 注册 token + 存入 DB。
  4. Root layout 集成：登入后自动注册 token。
  5. 新增 `supabase/functions/send-notification/` Edge Function：接收 user_id + 标题 + 内容 → 查询 token → 调用 Expo Push API。
- 输出物：
  - push_tokens 迁移
  - Edge Function
  - Client hook
- 自检：
  - Token 注册成功
  - Edge Function 可调用
- 完成标准：
  - 推送基础设施就绪。

### [ ] P2F-02 互动推送触发

- 前置：P2F-01
- 动作：
  1. `create-comment` Edge Function：评论写入成功后 → 发推送给帖子作者。
  2. `post_likes` 触发器（或在 Feed 页点赞逻辑中）：点赞 → 发推送给帖子作者。
  3. `follows` 写入后：关注 → 发推送给被关注者。
  4. 推送内容模板："{用户名} 评论了你的帖子" / "{用户名} 赞了你的帖子" / "{用户名} 关注了你"。
  5. 防骚扰：同一用户对同一目标 24 小时内只触发一次推送。
- 输出物：
  - 更新后的 Edge Function / API 路由
- 自检：
  - 评论/点赞/关注后对方收到推送
  - 重复操作不重复推送
- 完成标准：
  - 互动行为可触达对方。

### [ ] P2F-03 关注 Feed

- 前置：无
- 动作：
  1. 新增 `get_following_feed` RPC：仅返回当前用户关注的人的帖子。
  2. Feed 页面顶部添加切换 Tab："全部" / "关注"。
  3. "关注" Tab 调用新 RPC，共用 PostCard 和分页逻辑。
  4. 未关注任何人时显示引导："关注感兴趣的人，这里会出现他们的动态"。
- 输出物：
  - 新 RPC
  - 更新后的 Feed 页面
- 自检：
  - 关注某人后其帖子出现在关注 Feed
  - 取消关注后消失
- 完成标准：
  - 社交关系驱动内容消费。

### [ ] P2F-04 收藏分享

- 前置：无
- 动作：
  1. 酒款详情页添加"分享"按钮（调用系统 Share API）。
  2. 帖子详情页添加"分享"按钮。
  3. 分享内容：标题 + 链接（Web URL 格式，如 `yourwinebook.com/zh-HK/wines/xxx`）。
  4. Web 端酒款详情页添加 Open Graph meta tags（og:title, og:description, og:image）。
  5. 帖子分享同理。
- 输出物：
  - 更新后的详情页
  - OG meta tags
- 自检：
  - 分享到微信/WhatsApp 可展示卡片预览
- 完成标准：
  - 内容可在社交媒体传播。

### [ ] P2F-05 SEO 基础优化

- 前置：P2F-04
- 动作：
  1. 为所有公开页面添加 `<head>` meta tags（title, description）。
  2. 酒款详情页：动态 meta（酒名 + 产区 + 价格范围）。
  3. 酒商详情页：动态 meta（酒商名 + 简介）。
  4. 生成 `sitemap.xml`（静态页面 + 动态酒款/酒商 slug）。
  5. 生成 `robots.txt`。
  6. 验证 Google Search Console（预留）。
- 输出物：
  - `src/app/sitemap.ts`
  - `src/app/robots.ts`
  - 更新后的页面 metadata
- 自检：
  - Google Rich Results Test 通过
  - sitemap.xml 可访问
- 完成标准：
  - 搜索引擎可索引核心内容。

### [ ] P2F-06 增长功能 QA 回归

- 前置：P2F-01 ~ P2F-05
- 动作：
  1. 推送通知端到端测试（需真机或 Expo Go）。
  2. 关注 Feed 切换 + 数据一致性。
  3. 分享链接 + OG 预览。
  4. SEO meta tags + sitemap 验证。
  5. 集成测试更新。
- 输出物：
  - QA 清单全部通过
- 自检：
  - 集成测试通过
- 完成标准：
  - 增长功能具备上线质量。

---

## 7. 阶段门槛与验收标准

### 7.1 Phase 2A 验收

- 用户可与 AI 对话获取酒款推荐。
- AI 推荐的酒款在数据库中真实存在。
- 比价数据与酒款详情页一致。
- 流式输出，首字节 < 2 秒。
- 中英文对话均可用。
- 频率限制生效。

### 7.2 Phase 2B 验收

- Profile Tab 4 个菜单项全部可用。
- App 内可完成登入/注册。
- 发帖可关联酒款和标签。
- 邀请码深链完整可用。
- EAS Preview build 可安装。

### 7.3 Phase 2C 验收

- Vitest 测试 >= 50 个 test case，全部通过。
- Playwright E2E >= 10 个场景，全部通过。
- CI 跑测试，红灯阻止合并。
- Staging 环境可独立访问。

### 7.4 Phase 2D 验收

- 酒商可新增/编辑/下架酒款，前台实时生效。
- CSV 10 条数据可成功导入，有错误报告。
- 权限隔离：酒商只能管理自己的酒。

### 7.5 Phase 2E 验收

- 访问不存在路由 → 品牌 404 页面（非空白）。
- 系统错误 → 品牌错误页面（非裸 HTML）。
- Dashboard 在 375px 宽度下可用。

### 7.6 Phase 2F 验收

- 评论/点赞触发推送到达（真机验证）。
- 关注 Feed 数据正确。
- 分享到 WhatsApp 可展示预览卡片。
- sitemap.xml 包含所有酒款和酒商 slug。

---

## 8. 风险与回退策略

| 风险 | 概率 | 影响 | 应对 |
|------|------|------|------|
| Claude API 成本超预期 | 中 | 运营成本 | 设 token 上限 + 频率限制 + 缓存常见问答 |
| Claude API 延迟过高 | 中 | 用户体验 | 流式输出 + 超时兜底 + 离线推荐降级 |
| AI 输出不合规 | 中 | 法律风险 | system prompt 严格限制 + 免责声明 + 监控采样 |
| 推送通知被用户关闭 | 高 | 留存受损 | 非强依赖，应用内通知 badge 作为降级 |
| CSV 导入格式混乱 | 高 | 酒商体验 | 严格校验 + 错误报告 + 模板下载 |
| Playwright 在 CI 中不稳定 | 中 | CI 信任度 | 重试机制 + 截图保存 + 可选步骤 |
| App Store 审核被拒 | 中 | 上架延迟 | 提前检查 Apple 审核指南（酒类 App 需年龄门槛） |

### 回退规则

1. AI 功能：ANTHROPIC_API_KEY 未配置时 /ai 页面优雅降级为静态推荐。
2. 推送通知：无 push token 时不发推送，不报错。
3. CSV 导入：出错中断时已导入的数据保留，不回滚。
4. 测试：E2E 失败不阻塞部署（仅阻塞 PR 合并），单元测试失败阻塞一切。

---

## 9. 环境变量新增清单

| 变量 | 用途 | 必需 | 默认行为 |
|------|------|------|---------|
| `ANTHROPIC_API_KEY` | Claude API 调用 | Phase 2A 必需 | AI 页面降级为静态 |
| `ANTHROPIC_MODEL` | Claude 模型选择 | 否 | `claude-sonnet-4-20250514` |
| `AI_MAX_TOKENS` | AI 单次回复 token 上限 | 否 | `2048` |
| `AI_RATE_LIMIT_AUTHED` | 已登入用户每小时 AI 对话次数 | 否 | `20` |
| `AI_RATE_LIMIT_ANON` | 未登入用户每小时 AI 对话次数 | 否 | `5` |
| `EXPO_PUBLIC_EXPO_PUSH_PROJECT_ID` | Expo Push Notifications | Phase 2F 必需 | 不发推送 |

---

## 10. 首发前检查清单（V2）

### 技术检查

- [ ] AI 对话 10 场景全部产出合理推荐
- [ ] AI token 限制和频率限制生效
- [ ] Mobile EAS Preview build 可安装运行
- [ ] Vitest >= 50 test case 全部通过
- [ ] Playwright >= 10 场景全部通过
- [ ] CI 绿灯
- [ ] Staging 环境功能正常
- [ ] 酒款 CRUD 闭环验证通过
- [ ] CSV 导入可处理 50 条数据
- [ ] 推送通知端到端可达（若 Phase 2F 完成）

### 产品检查

- [ ] AI 选酒推荐与实际数据一致
- [ ] AI 免责声明到位
- [ ] 所有路由有 404 处理
- [ ] 错误页面有品牌样式
- [ ] Dashboard 手机可用
- [ ] Profile Tab 完整可用
- [ ] 发帖酒款标注可用
- [ ] 搜索体验顺畅

### 合规检查

- [ ] AI 不生成酒精推销语言
- [ ] AI 不绕过年龄门槛
- [ ] 隐私政策覆盖 AI 数据使用
- [ ] App Store 年龄分级正确标注

---

## 11. MVP 遗留问题（来自 codex-review.md 审查）

以下问题在 MVP 阶段被标记，部分已修复，部分需在 V2 中继续关注。

### 11.1 已修复

- 后台登录 Supabase 路径未校验帐号状态 → P0b-16 已补 `status !== 'active'` 拦截。
- `wb_role` cookie 与 Supabase session 联动过期 → middleware 已补删除逻辑。
- `finalize-post` 非事务性写入 → 已补 try-catch + 孤立 post 清理。
- `community-store` wineSlug post-query 性能 → 已改为先查 post_products 再 `.in()` 约束。
- 线上 Turbopack 崩溃 → 已切回 webpack，根 layout 统一 `<html>/<body>`。
- 头像首字母 `[0]` 空值崩溃 → 已统一用 `display-name.ts` 安全 helper。

### 11.2 仍需关注

| 问题 | 严重度 | 说明 | 建议处理阶段 |
|------|--------|------|-------------|
| 业务接口仍信任裸 cookie 身份 | 高 | 大量 API route 直接读 `wb_session`/`wb_user_session` cookie 做身份判断，未统一走 Supabase session 校验 | V2 期间逐步收口，优先处理写操作接口 |
| 收藏接口 RLS 拒绝时返回"假成功" | 中 | user-store.ts 的 Supabase 分支对 insert/delete 未检查错误，RLS 拦截后前端状态不一致 | Phase 2C 测试覆盖时修复 |
| `createMerchant()` 多步写入无事务 | 中 | auth user → profile → merchant → merchant_staff 任一步失败不回滚 | 补偿清理逻辑，或标注为已知风险 |
| Mobile TypeScript 门禁未通过 | 中 | `ExternalLink.tsx` typed routes 不兼容、`posthog.ts` 属性类型不匹配 | Phase 2B 开始前修复 |
| Expo SDK 依赖版本漂移 | 中 | `@sentry/react-native` 等多个包版本与 SDK 55 推荐不一致 | Phase 2B 开始前执行 `expo install --fix` |
| ESLint 红灯 | 低 | React hooks lint 问题和 require() 导入 | Phase 2C 测试基建时一并清理 |

---

## 12. 外部服务配置待办

以下为外部服务配置项，按需处理，不阻塞开发。

### 12.1 Sentry Source Map（优先级：低）

让错误报告显示原始代码而非压缩后代码。

```bash
# Web
NEXT_PUBLIC_SENTRY_DSN=https://xxx@sentry.io/xxx
SENTRY_AUTH_TOKEN=sntrys_xxx
SENTRY_ORG=your-org
SENTRY_PROJECT=your-wine-book-web

# Mobile
EXPO_PUBLIC_SENTRY_DSN=https://xxx@sentry.io/xxx
```

重新 build 即可自动上传 source map。

### 12.2 Supabase Mobile 环境变量（连接 Supabase 时需要）

在 `apps/mobile/eas.json` 的 build profile 中添加：
```json
"env": {
  "EXPO_PUBLIC_SUPABASE_URL": "https://xxx.supabase.co",
  "EXPO_PUBLIC_SUPABASE_ANON_KEY": "eyJxxx..."
}
```

### 12.3 App Store / Play Store 提交配置（正式上架时）

- **iOS**：Apple Developer 账号 → `eas.json` 填入 `appleId` / `ascAppId` / `appleTeamId`
- **Android**：Google Play Console 服务账号 → `eas.json` 填入 `serviceAccountKeyPath`

### 12.4 CI 验证

GitHub Actions workflow 已配置，push/PR to main 自动触发。
检查地址：https://github.com/ZexuanMA/yourwinebook/actions

---

## 13. 历史文档索引

以下文档已归档至 `past_md/` 目录，供追溯参考：

| 文件 | 内容 | 时间跨度 |
|------|------|---------|
| `past_md/codex-MVP.md` | MVP 阶段执行规划（Phase 0~1C 全部任务定义） | 2026-03-16 ~ 2026-03-21 |
| `past_md/AI_PROGRESS.md` | MVP 阶段执行进度（87/87 测试通过，全部完成） | 2026-03-17 ~ 2026-03-21 |
| `past_md/codex-review.md` | MVP 阶段代码审查报告 + 线上故障修复记录 | 2026-03-17 ~ 2026-03-18 |
| `past_md/TODO-remaining.md` | MVP 残留外部服务配置待办 | 2026-03-18 |
