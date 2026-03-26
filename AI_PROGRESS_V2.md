# AI_PROGRESS_V2.md — Your Wine Book V2 执行进度

> 单一进度记录文件，与 `codex-V2.md` 配合使用。
> 起始日期：2026-03-25

---

## Phase 2A — AI 选酒助手

- [x] P2A-01 设计 AI Tool 定义
  - 完成时间：2026-03-25
  - 决策：
    - 安装 `@anthropic-ai/sdk` 到 web workspace
    - 5 个 tool 定义：search_wines / get_wine_detail / get_wine_prices / get_scene_wines / get_regions
    - search_wines 支持 query + type + region + min_price + max_price + sort 全维度筛选
    - system prompt 分中英文两版，严格遵循品牌调性（温暖朋友、不推销、不用广东话口语）
    - 配置常量通过环境变量可覆盖：AI_MAX_TOKENS(2048) / AI_RATE_LIMIT_AUTHED(20) / AI_RATE_LIMIT_ANON(5) / ANTHROPIC_MODEL(claude-sonnet-4-20250514)
  - 输出物：
    - `apps/web/src/lib/ai-tools.ts`
  - 自检：
    - `pnpm --filter web exec tsc --noEmit` ✅
  - 风险：无

- [x] P2A-02 开发 AI 对话 API 路由
  - 完成时间：2026-03-25
  - 决策：
    - SSE 流式响应（ReadableStream + `data:` JSON 事件）
    - 事件类型：text / status / done / error
    - tool use 循环最多 5 次迭代，防止无限循环
    - 每次 tool call 发送 `status: "searching"` 事件通知前端
    - assistant 消息包含 text + tool_use 混合内容块（修复了初版只传 tool_use 的 bug）
    - 历史消息截取最近 20 条，避免 token 溢出
    - 频率限制复用现有 `rate-limit.ts`：已登入 20 次/小时，未登入 5 次/小时
    - 无 API key 时返回 503，前端优雅降级
    - 输入长度限制 500 字符，最后一条必须是 user 角色
  - 输出物：
    - `apps/web/src/app/api/ai/chat/route.ts`
  - 自检：
    - `pnpm --filter web exec tsc --noEmit` ✅
    - 修复 2 个类型错误：WineFilters.sort 联合类型 + SDK ContentBlock.caller 字段
  - 风险：无

- [x] P2A-03 开发 AI 对话前端组件
  - 完成时间：2026-03-25
  - 决策：
    - ChatInterface.tsx：完整聊天 UI，支持流式渲染、sessionStorage 持久化、字数计数器、错误重试
    - AiWineCard.tsx：AI 推荐中的酒款卡片，带 emoji + 名称 + 产区 + 价格，可点击跳转详情页
    - AiPriceTable.tsx：比价表格，最低价标金色，可点击跳转酒商页
    - 输入框为 textarea 自动伸缩，支持 Enter 发送 / Shift+Enter 换行
    - 空状态显示 quick prompt 按钮
    - 未配置 API key 时显示友好提示 + 搜索引导
  - 输出物：
    - `apps/web/src/components/ai/ChatInterface.tsx`
    - `apps/web/src/components/ai/AiWineCard.tsx`
    - `apps/web/src/components/ai/AiPriceTable.tsx`
  - 自检：
    - `pnpm --filter web exec tsc --noEmit` ✅
  - 风险：无

- [x] P2A-04 升级 /ai 页面
  - 完成时间：2026-03-25
  - 决策：
    - 移除静态 Demo 对话和 disabled 输入框
    - 改为 ChatInterface 组件，全屏高度布局
    - 5 个快捷场景按钮（送礼 / 配餐 / 日常 / 嘗新 / 约会），中英文各有完整 prompt
    - i18n 更新：移除 comingSoon，新增 disclaimer / thinking / searching / errorTitle / retry / clearChat / notConfiguredTitle / notConfiguredDesc
    - 保留原有 AiRecItem 组件（首页 AI 预览区仍在使用）
  - 输出物：
    - 更新后的 `apps/web/src/app/[locale]/ai/page.tsx`
    - 更新后的 `apps/web/messages/zh-HK.json` 和 `apps/web/messages/en.json`
  - 自检：
    - `pnpm --filter web exec tsc --noEmit` ✅
    - `pnpm --filter web build` ✅（全部页面通过）
    - 首页 `/ai` 链接确认存在 ✅
    - 代码中无 "coming soon" 残留 ✅
  - 风险：无

- [x] P2A-05 AI 选酒 QA 与边界测试
  - 完成时间：2026-03-25
  - 决策：
    - PostHog 埋点：`ai_chat_started`（首次消息）、`ai_message_sent`（每条消息，含 locale / messageLength / turnNumber）
    - 边界情况已覆盖：无 API key(503) / 空消息(400) / 超长输入(400+前端计数器) / 频率限制(429+Retry-After) / 工具执行错误(返回 error 给 Claude) / 流错误(SSE error 事件) / 最大迭代(cap 5)
    - 修复 tool use 循环 bug：assistant 消息现在正确包含 text + tool_use 混合内容块
  - 输出物：
    - 更新后的 `apps/web/src/components/ai/ChatInterface.tsx`（添加 captureEvent）
    - 更新后的 `apps/web/src/app/api/ai/chat/route.ts`（修复 accumulatedText）
  - 自检：
    - `pnpm --filter web exec tsc --noEmit` ✅
    - `pnpm --filter web build` ✅
  - 风险：无
  - 备注：实际 AI 对话测试需要配置 ANTHROPIC_API_KEY，当前验证为代码层面完整性

### Phase 2A 总结

| 指标 | 结果 |
|------|------|
| 新增文件 | 5 个（ai-tools.ts / route.ts / ChatInterface.tsx / AiWineCard.tsx / AiPriceTable.tsx） |
| 修改文件 | 3 个（ai/page.tsx / zh-HK.json / en.json） |
| 新增代码 | ~1,177 行 |
| TypeScript | 通过 |
| 生产构建 | 通过 |
| Git 提交 | `b2722f2` feat(P2A): AI wine advisor — Claude API + tool use + streaming chat |

---

## Phase 2B — Mobile 补完

- [x] P2B-01 Mobile 登入/注册页面
  - 完成时间：2026-03-25
  - 决策：
    - 新建 `app/auth/_layout.tsx`（Stack navigator，品牌样式）
    - 登入页：Email/密码表单，错误提示，成功后 goBack 或 replace 到 feed
    - 注册页：暱称/Email/密码 + 密码强度指示条（4 段 Weak/Fair/Good/Strong）
    - 注册页包含邀请码输入（从 AsyncStorage 或 URL params 预填）
    - 注册页包含年龄确认 checkbox + 法律声明
    - Profile Tab 登入按钮改为导航到 `/auth/login`
    - Root layout 注册 `auth` Stack.Screen
  - 输出物：
    - `app/auth/_layout.tsx` / `app/auth/login.tsx` / `app/auth/register.tsx`
  - 自检：
    - `npx expo export --platform web` ✅（包含 /auth/login 和 /auth/register）
  - 风险：无

- [x] P2B-02 Profile Tab — 我的帖子页面
  - 完成时间：2026-03-25
  - 决策：
    - 查询当前用户所有帖子（含 hidden 状态），复用 PostCard 组件
    - hidden 帖子显示半透明 + "已隐藏" badge
    - 支持下拉刷新，空状态带"去发帖"按钮
  - 输出物：
    - `app/my-posts.tsx`
  - 自检：
    - `npx expo export --platform web` ✅
  - 风险：无

- [x] P2B-03 Profile Tab — 收藏页面
  - 完成时间：2026-03-25
  - 决策：
    - 三 Tab 切换：帖子 / 酒款 / 门店
    - 帖子收藏：从 post_bookmarks join posts 查询，复用 PostCard
    - 酒款收藏：从 wine_bookmarks join wines 查询，自定义行（emoji + 名称 + 产区 + 价格）
    - 门店收藏：从 store_bookmarks join merchant_locations 查询
    - 三种数据并行加载，各 Tab 支持下拉刷新和空状态
  - 输出物：
    - `app/bookmarks.tsx`
  - 自检：
    - `npx expo export --platform web` ✅
  - 风险：无

- [x] P2B-04 Profile Tab — 导航修复
  - 完成时间：2026-03-25
  - 决策：
    - 我的帖子 → `/my-posts`
    - 收藏 → `/bookmarks`
    - 黑名单 → `/settings`（settings 页面已有黑名单管理功能）
    - 设置 → `/settings`
    - 4 个空回调全部替换为 router.push
  - 输出物：
    - 更新后的 `app/(tabs)/profile.tsx`
  - 自检：
    - 代码中无 TODO 残留（profile.tsx）✅
  - 风险：无

- [x] P2B-05 发帖 — 酒款搜索与标注
  - 完成时间：2026-03-25
  - 决策：
    - WineSearchPicker 组件：搜索框 + 下拉结果 + 已选 tag 列表（可移除）
    - 从 Supabase wines 表模糊搜索（name + grape_variety），最多 8 条结果
    - 最多选 10 款酒
    - 集成到 create.tsx，替换硬编码 `product_ids: []`
  - 输出物：
    - `components/WineSearchPicker.tsx`
    - 更新后的 `app/(tabs)/create.tsx`
  - 自检：
    - `npx expo export --platform web` ✅
  - 风险：无

- [x] P2B-06 发帖 — 标签输入
  - 完成时间：2026-03-25
  - 决策：
    - TagInput 组件：预设标签（中英文各 12 个）+ 自定义输入
    - 已选标签以 pill 形式展示，酒红背景白色文字，可点击移除
    - 最多 5 个标签
    - 集成到 create.tsx，替换硬编码 `tags: []`
  - 输出物：
    - `components/TagInput.tsx`
    - 更新后的 `app/(tabs)/create.tsx`
  - 自检：
    - `npx expo export --platform web` ✅
  - 风险：无

- [x] P2B-07 邀请码深链处理
  - 完成时间：2026-03-25
  - 决策：
    - 重写 `app/invite/[code].tsx`，移除 redirect stub
    - 4 种状态：loading / valid / invalid / logged_in
    - 验证流程：查 invite_codes 表 → 检查过期 → 检查用量 → 有效则存 AsyncStorage 并导航到注册页
    - 已登入用户显示"你已經登入了"提示
    - 无效码显示友好错误 + 前往首页按钮
  - 输出物：
    - 更新后的 `app/invite/[code].tsx`
  - 自检：
    - 代码中无 TODO 残留 ✅
  - 风险：无

- [x] P2B-08 Mobile 个人资料编辑
  - 完成时间：2026-03-25
  - 决策：
    - 新建 `app/edit-profile.tsx`
    - 修改显示名称 + 头像（ImagePicker → upload to avatars bucket）+ 修改密码
    - Profile Tab 新增"编辑个人资料"按钮（outline 样式）
  - 输出物：
    - `app/edit-profile.tsx`
    - 更新后的 `app/(tabs)/profile.tsx`
  - 自检：
    - `npx expo export --platform web` ✅
  - 风险：无

- [x] P2B-09 Mobile 补完 QA 回归
  - 完成时间：2026-03-25
  - 决策：
    - `npx expo export --platform web` 通过，20 个路由全部导出
    - 新增路由：/auth/login, /auth/register, /my-posts, /bookmarks, /edit-profile
    - Profile Tab 4 个菜单项全部可导航
    - create.tsx 中 tags 和 product_ids 已替换为真实状态
    - invite/[code].tsx 已实现完整验证流程
    - 唯一剩余 TODO：`is_official` 商家官方发帖开关（out of scope）
  - 自检：
    - `npx expo export --platform web` 20 routes ✅
    - profile.tsx 无 TODO ✅
    - invite/[code].tsx 无 TODO ✅
  - 风险：无

### Phase 2B 总结

| 指标 | 结果 |
|------|------|
| 新增文件 | 8 个（auth/_layout + login + register / my-posts / bookmarks / edit-profile / WineSearchPicker / TagInput） |
| 修改文件 | 4 个（profile.tsx / create.tsx / invite/[code].tsx / _layout.tsx） |
| Expo 路由 | 20 个（新增 5 个） |
| Expo Export | 通过 |

---

## Phase 2C — 测试与质量基建

- [x] P2C-01 Vitest 基础设施
  - 完成时间：2026-03-25
  - 决策：
    - 沿用已有配置：`vitest.config.ts` + `setup.ts` + path alias `@/`
    - 已安装 vitest 4.1.1 + @testing-library/react + jsdom
    - 已有 3 个测试文件（utils / password / display-name），27 个测试全部通过
    - package.json 已配置 `test` / `test:watch` / `test:coverage` 脚本
    - 覆盖率使用 v8 provider，reporter 为 text + lcov
  - 输出物：
    - `apps/web/vitest.config.ts`（已存在）
    - `apps/web/src/__tests__/setup.ts`（已存在）
    - 3 个测试文件：utils.test.ts / password.test.ts / display-name.test.ts
  - 自检：
    - `pnpm --filter web test` → 3 files, 27 tests passed ✅
  - 风险：无

- [x] P2C-02a 纯函数单元测试（locale-helpers / dashboard-i18n / rate-limit）
  - 完成时间：2026-03-25
  - 输出物：
    - `locale-helpers.test.ts` — 16 个测试：toWineCard / getMerchantLocale / getSceneLocale / getTastingNotes / getRegionStory / getFullRegion / formatMerchantPrices
    - `dashboard-i18n.test.ts` — 8 个测试：t() / tf() 的语言切换、fallback、参数替换
    - `rate-limit.test.ts` — 8 个测试：限流允许/拒绝/窗口过期/多 key 隔离 + getClientIp
  - 自检：
    - `pnpm --filter web test` → 6 files, 60 tests passed ✅

- [x] P2C-02b 数据层 + Domain 包单元测试
  - 完成时间：2026-03-25
  - 输出物：
    - `queries.test.ts` — 21 个测试：getWinesPaginated（筛选/排序/分页）/ getWineBySlug / getFeaturedWines / getSimilarWines / getMerchants / getScenes / getRegions / getSearchSuggestions / getPartners
    - `domain/media.test.ts` — 15 个测试：validateFiles 全场景 + BUCKET_CONFIGS + POST_LIMITS + COMPRESSION_TARGETS
    - `domain/business-hours.test.ts` — 10 个测试：getBusinessStatus 正常/关闭/即将关闭/跨日/无数据
    - `domain/districts.test.ts` — 5 个测试：数据完整性 + 坐标范围 + slug 唯一性
  - 自检：
    - `pnpm --filter web test` → 10 files, 111 tests passed ✅

- [x] P2C-02c 数据完整性 + AI 工具 + 分析数据测试
  - 完成时间：2026-03-25
  - 输出物：
    - `ai-tools.test.ts` — 10 个测试：5 个 tool 定义验证 + system prompt 中英文 + 常量默认值
    - `mock-data.test.ts` — 16 个测试：wines/merchants/scenes/winePrices/partners 数据完整性、slug 唯一性、类型一致性
    - `mock-analytics.test.ts` — 8 个测试：dailyStats 30 天 / topPages / topWines / summaryStats / trafficSources + deviceBreakdown 百分比求和
    - `domain/analytics.test.ts` — 4 个测试：STORE_EVENTS / COMMUNITY_EVENTS / AUTH_EVENTS / EVENT_TYPES
    - `domain/wine-types.test.ts` — 5 个测试：WINE_TYPES / MERCHANT_STATUSES / APPLICATION_STATUSES / USER_STATUSES / LOCALES
  - 自检：
    - `pnpm --filter web test` → 15 files, 158 tests passed ✅

### P2C-02 总结

| 指标 | 结果 |
|------|------|
| 测试文件 | 15 个（3 个已有 + 12 个新增） |
| 测试用例 | 158 个（27 个已有 + 131 个新增） |
| 覆盖范围 | locale-helpers / dashboard-i18n / rate-limit / queries / mock-data / mock-analytics / ai-tools / password / display-name / utils + domain (media / business-hours / districts / analytics / wine-types) |
| 全部通过 | ✅ |

- [x] P2C-03 API 路由集成测试
  - 完成时间：2026-03-25
  - 决策：
    - 直接导入 route handler 函数，用 NextRequest 构造请求对象
    - Mock supabase 返回 null 强制走 mock 数据路径
    - Mock next/headers cookies 模拟不同登入状态
  - 输出物：
    - `api/wines.test.ts` — 6 个测试：列表/筛选/排序/分页
    - `api/merchants.test.ts` — 2 个测试：列表 + 字段完整性
    - `api/scenes.test.ts` — 2 个测试：列表 + 字段完整性
    - `api/search.test.ts` — 4 个测试：regions / suggestions / 短查询 / 空查询
    - `api/auth.test.ts` — 5 个测试：错误凭证 401 / 商户登入 200+cookie / me 无 session 401 / me 有 session 200 / me 无效 session 401
    - `api/admin-auth.test.ts` — 3 个测试：无 session 401 / 商户 session 401 / admin session 200
  - 自检：
    - `pnpm --filter web test` → 21 files, 180 tests passed ✅
  - 部署检查点：
    - `npm run build` ✅ 生产构建通过
    - `git push` ❌ Git token 已过期，无法推送远程。需要用户更新 GitHub token 后重试。
    - 本地验证全部通过，代码已就绪待推送。

- [x] P2C-04 Playwright E2E 测试
  - 完成时间：2026-03-25
  - 决策：
    - 安装 @playwright/test + Chromium headless
    - playwright.config.ts 支持 PLAYWRIGHT_BASE_URL 环境变量指定测试目标
    - 默认启动 dev server 在 3001，也可指向生产 3000
    - 6 个 E2E 测试文件覆盖 17 个场景
  - 输出物：
    - `apps/web/playwright.config.ts`
    - `apps/web/e2e/homepage.spec.ts` — 6 个测试：标题/搜索框/场景卡/酒款/语言切换/AI 入口
    - `apps/web/e2e/search.spec.ts` — 3 个测试：页面加载/输入框/酒款卡片
    - `apps/web/e2e/wine-detail.spec.ts` — 1 个测试：搜索→酒款详情导航
    - `apps/web/e2e/merchants.spec.ts` — 2 个测试：列表加载/详情导航
    - `apps/web/e2e/scenes.spec.ts` — 2 个测试：页面加载/4 个场景全部 200
    - `apps/web/e2e/dashboard-login.spec.ts` — 3 个测试：页面加载/错误凭证/成功登入跳转
  - 自检：
    - `PLAYWRIGHT_BASE_URL=http://localhost:3000 npx playwright test` → 17 tests passed ✅

- [x] P2C-05 CI 集成测试步骤
  - 完成时间：2026-03-25
  - 决策：
    - 新增 `test` job：运行 Vitest 单元 + API 集成测试
    - `build-web` job 新增 `needs: [lint-and-typecheck, test]`，测试不通过则不构建
    - E2E 测试暂不加入 CI（需要 dev server + Playwright deps），留作本地/staging 手动运行
  - 输出物：
    - 更新后的 `.github/workflows/ci.yml`
  - 自检：
    - CI 流水线：lint → test → build（test 失败阻止 build）✅

- [x] P2C-06 Staging 环境
  - 完成时间：2026-03-25
  - 决策：
    - 新增 `ecosystem.staging.config.js`：PM2 进程 `wine-staging`，端口 3002
    - 新增 `npm run deploy:staging` 脚本：build + pm2 startOrRestart
    - 新增 `nginx/staging.conf`：staging.yourwinebook.com → localhost:3002
    - DNS + SSL 需要用户手动配置（A 记录 + certbot）
  - 输出物：
    - `ecosystem.staging.config.js`
    - `nginx/staging.conf`
    - 更新后的 `package.json`（新增 deploy:staging 脚本）
  - 自检：
    - `pm2 startOrRestart ecosystem.staging.config.js` → wine-staging online ✅
    - `curl http://localhost:3002/zh-HK` → 200 ✅
  - 待用户操作：
    - DNS 添加 A 记录 staging.yourwinebook.com
    - `sudo cp nginx/staging.conf /etc/nginx/sites-enabled/staging`
    - `sudo certbot --nginx -d staging.yourwinebook.com`
    - `sudo nginx -t && sudo nginx -s reload`

### Phase 2C 总结

| 指标 | 结果 |
|------|------|
| Vitest 测试文件 | 21 个 |
| Vitest 测试用例 | 180 个 |
| Playwright E2E 场景 | 17 个 |
| CI pipeline | lint → test → build（红灯阻止构建） |
| Staging 环境 | PM2 wine-staging:3002 在线运行 |
| 全部通过 | ✅ |

---

## Phase 2D — 后台酒款管理闭环

- [x] P2D-01 酒款新增 API
  - 完成时间：2026-03-26
  - 决策：
    - 新建 `wine-store.ts`，遵循 merchant-store / price-store 同样的双模式设计（Legacy 文件 + Supabase）
    - Legacy 模式：酒商创建的酒款写入 `data/wines.json`，与 mock-data.ts 种子数据合并展示
    - Supabase 模式：写入 wines 表 + merchant_prices 表
    - slug 从酒名自动生成，去重检查（重复则追加数字后缀）
    - emoji 按酒类型自动映射（红🍷 白🍾 气泡🥂 桃红🌸 甜酒🍯）
    - POST `/api/merchant/wines` 需要活跃酒商身份验证
    - 必填字段：name、type、region_zh、region_en、price（>0）
    - 可选字段：grape_variety、vintage、description、tags、tasting_notes、buy_url
    - GET 端点已从静态 `wines` 数组升级为动态 `getAllWines()`，可返回种子+自建酒款
    - wine-store 同时包含 updateWine / delistWine / getWineBySlug / slugExists 等完整 CRUD 函数（供 P2D-02 使用）
  - 输出物：
    - `apps/web/src/lib/wine-store.ts`（新建，~270 行）
    - 更新后的 `apps/web/src/app/api/merchant/wines/route.ts`（新增 POST handler）
  - 自检：
    - `pnpm --filter web exec tsc --noEmit` ✅
    - `pnpm --filter web test` → 21 files, 180 tests passed ✅
  - 风险：无

- [x] P2D-02 酒款编辑 API
  - 完成时间：2026-03-26
  - 决策：
    - PATCH `/api/merchant/wines/[slug]` — 编辑酒款信息（name、region、description、tags、vintage、grape_variety、tasting_notes）
    - 不可更改：slug、type（不变量）
    - DELETE `/api/merchant/wines/[slug]` — 软删除（delist），酒款标记为下架但不物理删除
    - Legacy 模式下只有创建者（createdBy === merchantSlug）可编辑/下架自建酒款
    - Supabase 模式下通过 RLS 控制权限
    - 编辑时先检查酒款是否存在（404），无更新字段返回 400
  - 输出物：
    - `apps/web/src/app/api/merchant/wines/[slug]/route.ts`（新建，PATCH + DELETE）
  - 自检：
    - `pnpm --filter web exec tsc --noEmit` ✅
    - `pnpm --filter web test` → 21 files, 180 tests passed ✅
  - 风险：无

- 部署检查点（P2D-01 ~ P2D-03）
  - 时间：2026-03-26
  - `npm run deploy` ✅ — wine-prod PM2 重启成功
  - `git push` ❌ — GitHub token 已过期，需用户更新
  - 生产验证：
    - `curl http://localhost:3000/zh-HK` → 200 ✅
    - `curl http://localhost:3000/api/wines` → 200 ✅
    - `curl http://localhost:3000/api/merchants` → 200 ✅
    - `curl http://localhost:3000/login` → 200 ✅
    - POST `/api/merchant/wines`（无 auth）→ 401 ✅
    - POST `/api/merchant/wines`（Watson's Wine 登入后）→ 201，酒款创建成功 ✅
    - GET 列表确认新酒款出现（32→33）✅
    - PATCH 编辑酒款名称成功 ✅
    - DELETE 下架酒款成功（33→32）✅
    - `/dashboard/wines` + `/dashboard/wines/new` 页面加载 200 ✅
  - 结论：全部生产验证通过，继续下一批任务

- [x] P2D-03 升级 /dashboard/wines/new 页面
  - 完成时间：2026-03-26
  - 决策：
    - 移除 Demo 模式（原来的 setTimeout 假提交），改为真正调用 POST `/api/merchant/wines`
    - 产区字段拆分为中英文双栏（region_zh + region_en）
    - 描述字段拆分为中英文双栏
    - 年份字段改为非必填（部分无年份酒款）
    - 错误提示：红色 alert 框 + API 返回的错误消息
    - i18n 更新：移除"审核"相关文案，改为"直接上架"；新增双语字段标签
    - 提交按钮文案从"提交审核"改为"新增酒款"
    - 成功后可选择"再新增一款"或"返回列表"
  - 输出物：
    - 更新后的 `apps/web/src/app/dashboard/wines/new/page.tsx`
    - 更新后的 `apps/web/src/lib/dashboard-i18n.ts`（新增/修改 8 条 i18n）
  - 自检：
    - `pnpm --filter web exec tsc --noEmit` ✅
    - `pnpm --filter web test` → 21 files, 180 tests passed ✅
    - `pnpm --filter web build` ✅
  - 风险：无

- [x] P2D-04 酒款编辑页面
  - 完成时间：2026-03-26
  - 决策：
    - 新建 `/dashboard/wines/[slug]/edit` 页面，完整编辑表单
    - 表单预填现有数据，只发送有变更的字段（diff 检测）
    - 酒类型和 slug 显示为只读（不可更改的不变量）
    - 保存成功后显示绿色提示 2 秒后自动消失
    - 下架按钮 + 确认弹窗（modal），确认后调用 DELETE API 并跳转回列表
    - 酒款列表页每行新增「编辑」按钮，跳转到编辑页
    - i18n 新增 12 条编辑页文案
  - 输出物：
    - `apps/web/src/app/dashboard/wines/[slug]/edit/page.tsx`（新建）
    - 更新后的 `apps/web/src/app/dashboard/wines/page.tsx`（列表增加编辑按钮）
    - 更新后的 `apps/web/src/lib/dashboard-i18n.ts`
  - 自检：
    - `pnpm --filter web exec tsc --noEmit` ✅
    - `pnpm --filter web build` ✅（含新路由 /dashboard/wines/[slug]/edit）
  - 风险：无

- [x] P2D-05 CSV 批量导入
  - 完成时间：2026-03-26
  - 决策：
    - 新建 `/dashboard/wines/import` 页面，完整 CSV 导入功能
    - CSV 解析：客户端 JavaScript 解析（支持引号内逗号），无需后端解析
    - 必填栏位验证：name、type、region_zh、region_en、price
    - 类型验证：type 必须是 red/white/sparkling/rosé/dessert
    - 上限 500 行，逐条调用 POST API（进度显示）
    - 结果报告：成功数 + 失败数 + 每条失败的行号/酒名/错误原因
    - CSV 模板下载：含 2 行示例数据，10 个栏位
    - 预览表格：前 10 行展示
    - 侧边栏新增「批量导入」导航项（Upload 图标）
    - i18n 新增 19 条文案
  - 输出物：
    - `apps/web/src/app/dashboard/wines/import/page.tsx`（新建，~280 行）
    - 更新后的 `apps/web/src/components/dashboard/DashboardSidebar.tsx`
    - 更新后的 `apps/web/src/lib/dashboard-i18n.ts`
  - 自检：
    - `pnpm --filter web exec tsc --noEmit` ✅
    - `pnpm --filter web build` ✅（含新路由 /dashboard/wines/import）
  - 风险：无

- [x] P2D-06 酒款管理 QA 回归
  - 完成时间：2026-03-26
  - 决策：
    - 发现关键 bug：公开 API（`/api/wines`）在 Legacy 模式下仍从 `mock-data.ts` 静态数组读取，不包含新建酒款
    - 修复：`queries.ts` 中所有 `mockWines` 引用替换为 `await getAllWines()`（来自 wine-store）
    - 影响范围：getWinesPaginated / getRegions / getSearchSuggestions / getWineBySlug / getFeaturedWines / getSimilarWines / getMerchantWines
  - QA 测试结果：
    - ✅ 创建酒款 → 前台 API 可见（32→33）
    - ✅ 编辑酒款 → 前台 API 反映更新后的名称
    - ✅ 下架酒款 → 前台 API 不再可见（33→32）
    - ✅ 权限隔离：A 酒商无法编辑/下架 B 酒商创建的酒款
    - ✅ 无 auth 请求 → 401
    - ✅ 所有页面 200：首页、搜索、酒商列表、API、后台列表、新增、导入
    - ✅ Vitest 21 files, 180 tests passed
  - 部署检查点（P2D-04 ~ P2D-06）：
    - `npm run deploy` ✅ — wine-prod PM2 重启成功
    - `git push` ❌ — GitHub token 已过期
    - 完整 CRUD 闭环生产验证通过
  - 输出物：
    - 更新后的 `apps/web/src/lib/queries.ts`（7 处 mockWines → getAllWines）
  - 风险：无

### Phase 2D 总结

| 指标 | 结果 |
|------|------|
| 新增文件 | 4 个（wine-store.ts / [slug]/route.ts / [slug]/edit/page.tsx / import/page.tsx） |
| 修改文件 | 5 个（merchant/wines/route.ts / wines/page.tsx / wines/new/page.tsx / DashboardSidebar.tsx / dashboard-i18n.ts / queries.ts） |
| 新增代码 | ~1,400 行 |
| 新增页面路由 | 2 个（/dashboard/wines/[slug]/edit / /dashboard/wines/import） |
| 新增 API 端点 | 3 个（POST+PATCH+DELETE /api/merchant/wines） |
| i18n 新增 | ~30 条（编辑页 + 导入页） |
| TypeScript | 通过 |
| 生产构建 | 通过 |
| 生产 QA | CRUD 闭环 + 权限隔离 + 所有页面 200 ✅ |
| Vitest | 21 files, 180 tests ✅ |

---

## Phase 2E — UX 与错误处理

- [x] P2E-01 404 Not Found 页面
  - 完成时间：2026-03-26
  - 决策：
    - 前台 `[locale]/not-found.tsx`：使用 next-intl，品牌设计（🍷 emoji + 友好文案 + 返回首页/搜索按钮）
    - 后台 `dashboard/not-found.tsx`：静态文案（后台无 next-intl），返回后台首页按钮
    - i18n 新增 notFound 命名空间：title / description / backHome / backSearch
    - dashboard-i18n 新增 3 条 404 文案
  - 输出物：
    - `apps/web/src/app/[locale]/not-found.tsx`
    - `apps/web/src/app/dashboard/not-found.tsx`
    - 更新后的 `messages/zh-HK.json` + `messages/en.json`
    - 更新后的 `dashboard-i18n.ts`
  - 自检：
    - `pnpm --filter web exec tsc --noEmit` ✅
  - 风险：无

- [x] P2E-02 全局错误页面升级
  - 完成时间：2026-03-26
  - 决策：
    - 品牌配色：暖白背景 #FAF8F5、酒红按钮 #5B2E35、中灰文字 #6B6560
    - 使用 inline styles（global-error 无法依赖 CSS 文件加载）
    - 🍷 emoji + 友好文案 + "Try Again" + "Back to Home" 按钮
    - 保留 Sentry 错误上报
  - 输出物：
    - 更新后的 `apps/web/src/app/global-error.tsx`
  - 自检：
    - `pnpm --filter web exec tsc --noEmit` ✅
  - 风险：无

- [x] P2E-03 API 错误消息标准化
  - 完成时间：2026-03-26
  - 决策：
    - 新建 `api-errors.ts` 统一错误工具函数：`apiError(code, detail?, headers?)`
    - 所有错误响应格式统一为 `{ error: string, code: string }`
    - 定义 12 个错误码：UNAUTHORIZED / INVALID_CREDENTIALS / FORBIDDEN / ADMIN_ONLY / MERCHANT_INACTIVE / RATE_LIMIT / VALIDATION / INVALID_JSON / MISSING_FIELD / NOT_FOUND / CONFLICT / INTERNAL / SERVICE_UNAVAILABLE
    - 首批迁移 4 个最关键的路由文件（merchant/wines CRUD + price）
    - 所有 `NextResponse.json({ error: "..." })` 替换为 `apiError("CODE", "detail")`
    - 前端可根据 code 字段做 locale 映射（向后兼容：error 字段仍可直接显示）
  - 输出物：
    - `apps/web/src/lib/api-errors.ts`（新建）
    - 更新后的 4 个 API 路由文件
  - 自检：
    - `pnpm --filter web exec tsc --noEmit` ✅
    - `pnpm --filter web test` → 21 files, 180 tests passed ✅
  - 风险：无

### 部署检查点 3（P2E-01 ~ P2E-03）

- 时间：2026-03-26
- git push：超时（GitHub token/网络问题，同上次）
- 本地部署：`npm run deploy` → build 成功（39.4s）→ PM2 restart wine-prod ✅
- 验证结果：
  - 首页 `/zh-HK` → 200 ✅
  - 公开 API `/api/wines` → 200 ✅
  - 404 页面 `/zh-HK/nonexistent-page` → 404 ✅
  - 商户 API 带 session → 200 ✅
  - 商户 API 无 session → 401 + `{"error":"Unauthorized","code":"UNAUTHORIZED"}` ✅
  - apiError 标准化格式已在生产环境生效

- [x] P2E-04 Dashboard 移动端适配
  - 完成时间：2026-03-26
  - 决策：
    - Sidebar 移动端改为抽屉式（hamburger 触发）：
      - 新增 `DrawerProvider` + `useDrawer` context 管理开关状态
      - 桌面端 `hidden lg:block`，移动端 `fixed inset-0 z-50` 覆盖层
      - 半透明黑色背景 + 左滑动画 `animate-slide-in`（0.2s ease-out）
      - 路由切换自动关闭抽屉
      - 关闭按钮定位在抽屉右侧外部
    - TopBar 移动端新增 hamburger 按钮（`lg:hidden`），桌面端自动隐藏
    - Layout 主内容区 padding 响应式：`p-4 sm:p-6 lg:p-8`
    - 所有 Dashboard 页面 header 区改为 `flex-col sm:flex-row` 移动端堆叠
    - 统计卡片网格全部添加 `grid-cols-1 sm:grid-cols-N` 移动端单列
    - 所有数据表格添加 `overflow-x-auto` + `min-w-[Npx]` 防止挤压
    - 表格 td/th 间距改为 `px-4 sm:px-6` 响应式
  - 涉及文件：
    - `DashboardSidebar.tsx`（DrawerProvider + 抽屉逻辑 + TopBar hamburger）
    - `dashboard/layout.tsx`（DrawerProvider 包裹 + 响应式 padding）
    - `globals.css`（slide-in keyframes）
    - `dashboard/page.tsx`（header + skeleton + table）
    - `dashboard/wines/page.tsx`（header + table）
    - `dashboard/analytics/page.tsx`（两个视图 header + stat cards + 两个表格）
    - `dashboard/account/page.tsx`（overview flex + form grid）
    - `dashboard/stores/page.tsx`（header + form grids）
    - `dashboard/community/page.tsx`（header + stat grid）
    - `dashboard/admin/accounts/page.tsx`（header）
    - `dashboard/admin/users/page.tsx`（header + stat grid + table）
  - 自检：
    - `pnpm --filter web exec tsc --noEmit` ✅
    - `pnpm --filter web test` → 21 files, 180 tests passed ✅
  - 风险：无

- [x] P2E-05 搜索体验优化
  - 完成时间：2026-03-26
  - 决策：
    - **最近搜索记录**（localStorage `wb_recent_searches`，最多 5 条）：
      - `SearchInput` 聚焦时、无输入 → 显示最近搜索（带 Clock 图标 + 清除按钮）
      - 每次提交搜索或点击建议 → 自动保存到 localStorage
      - Navbar 搜索 overlay 也显示最近搜索标签
    - **热门搜索词**（静态双语）：
      - 无最近搜索时显示热门标签（zh-HK/en 各 5 个）
      - 点击标签即触发搜索
    - **空结果增强**：
      - 有筛选条件时显示"清除所有篩選條件"按钮
      - 始终显示推荐搜索词标签（"試試搜索：Sauvignon Blanc / Pinot Noir…"）
    - **URL 分享验证**：已确认所有 6 个筛选维度（q/type/region/price/sort/page）均同步到 query string，可直接复制分享
  - 输出物：
    - 更新后的 `SearchInput.tsx`（recent + hot 逻辑）
    - 更新后的 `Navbar.tsx`（overlay recent + hot 标签）
    - 更新后的 `search/page.tsx`（空结果增强）
  - 自检：
    - `pnpm --filter web exec tsc --noEmit` ✅
    - `pnpm --filter web test` → 21 files, 180 tests passed ✅
  - 风险：无

### Phase 2E 完成总结

| 任务 | 内容 | 状态 |
|------|------|------|
| P2E-01 | 404 Not Found 页面（前台 + 后台） | ✅ |
| P2E-02 | 全局错误页面升级（品牌化） | ✅ |
| P2E-03 | API 错误消息标准化（apiError 工具函数） | ✅ |
| P2E-04 | Dashboard 移动端适配（Sidebar 抽屉 + 11 页响应式） | ✅ |
| P2E-05 | 搜索体验优化（最近搜索 + 热门词 + 空结果建议） | ✅ |

### 部署检查点 4（P2E-04 ~ P2E-05 + Phase 2E 完结）

- 时间：2026-03-26
- git push：超时（同前）
- 本地部署：`npm run deploy` → build 成功（38.6s）→ PM2 restart wine-prod ✅
- 验证结果：
  - 首页 `/zh-HK` → 200 ✅
  - 搜索页 `/zh-HK/search` → 200 ✅
  - 带筛选搜索 `?q=Pinot&type=red&price=200to500&sort=price_asc` → 200 ✅
  - 搜索 API 带多维筛选 → 正确返回 total=2, wines=2 ✅
  - Dashboard → 307（未登录跳转登录页，正常）✅
- Phase 2E 全部 5 个任务部署完成

---

## Phase 2F — 增长与留存

> 注：P2F-01（推送通知基础设施）和 P2F-02（互动推送触发）需要 Expo + Supabase 真实环境，暂跳过。
> P2F-03（关注 Feed）需要 Supabase RPC，暂跳过。
> 优先完成 Web 端可独立实现的 P2F-04、P2F-05。

- [x] P2F-04 收藏分享 + OG Meta Tags
  - 完成时间：2026-03-26
  - 决策：
    - **酒款详情页重构为 Server Component**：
      - `page.tsx` 导出 `generateMetadata`（server-side），渲染 `WineDetailLoader`（client）
      - OG tags：og:title（酒名+年份）、og:description（产区+价格范围）、og:type=article
      - Twitter card: summary
    - **社区帖子详情页同理**：
      - `page.tsx` → `generateMetadata` + `PostDetailClient`
      - OG tags：帖子标题 + 内容前 160 字
    - **Share 按钮**：
      - 酒款详情页：Share2 图标按钮，置于标题右侧（与收藏按钮并排）
      - 帖子详情页：Share2 图标按钮，置于作者头像行右侧
      - 优先使用 Web Share API（`navigator.share`），fallback 复制链接到剪贴板
  - 输出物：
    - `wines/[slug]/page.tsx`（重写为 Server Component + generateMetadata）
    - `wines/[slug]/WineDetailLoader.tsx`（新建，client-side data fetch）
    - `wines/[slug]/WineDetailClient.tsx`（新增 Share 按钮）
    - `community/[id]/page.tsx`（重写为 Server Component + generateMetadata）
    - `community/[id]/PostDetailClient.tsx`（新建，原 page 逻辑 + Share 按钮）
  - 自检：
    - `pnpm --filter web exec tsc --noEmit` ✅
    - `pnpm --filter web test` → 21 files, 180 tests passed ✅
  - 风险：无

- [x] P2F-05 SEO 基础优化
  - 完成时间：2026-03-26
  - 决策：
    - **robots.txt**：允许 `/`，禁止 `/api/`、`/dashboard/`、`/login`
    - **sitemap.xml**：动态生成，覆盖双语（zh-HK + en）：
      - 静态页 11 个 × 2 语言 = 22 条
      - 动态酒款页（wine-store 获取所有 slug）
      - 动态酒商页（queries.ts 获取 6 家酒商 slug）
      - 动态场景页（4 个场景 slug）
    - **酒商详情页 OG 增强**：重构为 Server Component + generateMetadata + MerchantDetailClient
    - **全局 layout metadata 增强**：title template + OG defaults + Twitter card
  - 输出物：
    - `src/app/robots.ts`（新建）
    - `src/app/sitemap.ts`（新建）
    - `merchants/[slug]/page.tsx`（重写）
    - `merchants/[slug]/MerchantDetailClient.tsx`（新建）
    - `[locale]/layout.tsx`（metadata 增强）
  - 自检：
    - `pnpm --filter web exec tsc --noEmit` ✅
    - `pnpm --filter web test` → 21 files, 180 tests passed ✅
  - 风险：无

### 部署检查点 5（P2F-04 ~ P2F-05）

- 时间：2026-03-26
- 本地部署：`npm run deploy` → build 成功（35.2s）→ PM2 restart wine-prod ✅
- 验证结果：
  - `/robots.txt` → 正确显示 User-Agent / Allow / Disallow / Sitemap ✅
  - `/sitemap.xml` → 106 条 URL（双语 × 静态 + 动态酒款/酒商/场景）✅
  - 酒款 OG meta → og:title / og:description / og:url / og:site_name / og:type ✅
  - 酒商 OG meta → og:title（酒商名）/ og:description（中文描述）✅
  - OG title 去重修复（名称已含年份时不重复追加）✅

### Phase 2F（Web 部分）完成总结

| 任务 | 内容 | 状态 |
|------|------|------|
| P2F-01 | 推送通知基础设施（需 Expo + Supabase） | ⏳ 待 Expo 环境 |
| P2F-02 | 互动推送触发（依赖 P2F-01） | ⏳ 待 Expo 环境 |
| P2F-03 | 关注 Feed（需 Supabase RPC） | ⏳ 待 Supabase |
| P2F-04 | 收藏分享 + OG Meta Tags | ✅ |
| P2F-05 | SEO 基础优化（sitemap + robots + meta） | ✅ |
| P2F-06 | 增长功能 QA 回归（待全部完成后执行） | ⏳ |
