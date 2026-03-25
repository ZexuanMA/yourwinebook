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

---

## Phase 2D — 后台酒款管理闭环

（待开发）

---

## Phase 2E — UX 与错误处理

（待开发）

---

## Phase 2F — 增长与留存

（待开发）
