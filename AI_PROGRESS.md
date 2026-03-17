# AI_PROGRESS.md — Your Wine Book MVP 执行进度

> 单一进度记录文件，与 `codex-MVP.md` 配合使用。

---

## Phase 0 — 状态初始化

- [x] Task 0.1 创建状态追踪文件
  - 完成时间：2026-03-17
  - 决策：按 codex-MVP.md 约定格式建立，含全阶段任务骨架
  - 自检：`cat AI_PROGRESS.md | grep "Task 0.1"` ✅
  - 风险：无

---

## Phase 0a — 项目骨架与迁移准备

- [x] P0a-01 初始化 Monorepo
  - 完成时间：2026-03-17
  - 决策：
    - pnpm v10 + turbo 作为 monorepo 基础
    - Web 迁入 `apps/web/`，根目录只承担工程层职责
    - PM2 通过 `ecosystem.config.js` 管理，cwd 指向 `apps/web`
    - 根 `package.json` 提供 `dev`/`build`/`deploy` 统一入口
    - `pnpm.onlyBuiltDependencies` 白名单 native 模块
  - 自检：
    - `pnpm install` ✅
    - `pnpm --filter web build` ✅（39 页面全部通过）
    - `curl https://yourwinebook.com/zh-HK` → 200 ✅
    - `curl https://yourwinebook.com/api/wines` → 200 ✅
    - `pm2 status` → online, 0 restarts ✅
  - 风险：PM2 配置因 cwd 变化做了 delete + 重建（计划内，非调试操作）
- [x] P0a-02 初始化 Expo Mobile 项目
  - 完成时间：2026-03-17
  - 决策：
    - 使用 `create-expo-app` tabs 模板，Expo SDK 55
    - 4 个 Tab：探索(Feed) / 找店(Stores) / 發帖(Create) / 我的(Profile)
    - app scheme: `yourwinebook`，bundleId: `com.yourwinebook.app`
    - 品牌色 #FAF8F5 背景，#5B2E35 酒红主色
    - 删除模板多余文件（modal, dark theme），保持最小骨架
  - 自检：
    - `npx expo export --platform web` ✅（4 个 tab 页面全部导出）
    - Web 生产不受影响 ✅
  - 风险：无
- [x] P0a-03 配置 Metro Monorepo 解析
  - 完成时间：2026-03-17
  - 决策：
    - 添加 `@expo/metro-config` 为 devDependency（pnpm strict isolation 需显式声明）
    - `watchFolders` 设为 workspace root，Metro 可监听 `packages/*` 变更
    - `nodeModulesPaths` 指向 mobile 和 root 两级 node_modules
    - `extraNodeModules` 锁定 react/react-native/react-dom 到 mobile 的副本，防止多实例
    - 不使用 `disableHierarchicalLookup`（与 pnpm .pnpm store 结构冲突）
    - 创建 `packages/domain` 最小骨架用于验证解析（P0a-04 将完善）
  - 自检：
    - `npx expo export --platform web` ✅（10 页面全部导出）
    - 从 tab 页 import `@ywb/domain` 并成功打入 bundle ✅
    - `pnpm --filter web build` 不受影响 ✅
  - 风险：无
- [x] P0a-04 建立共享包 `packages/domain`
  - 完成时间：2026-03-17
  - 决策：
    - 包名 `@ywb/domain`，纯类型 + 常量包，零运行时依赖
    - 按领域实体拆分：wine / merchant / scene / user / application / community / analytics / common
    - 提取 23 个 interface/type + 8 个 const 数组（WINE_TYPES, MERCHANT_STATUSES 等）
    - Web 的 `types.ts` 改为从 `@ywb/domain` 再导出，现有 import 路径不变
    - `mock-data.ts` 保持原样（结构兼容，避免大范围 import 变更）
    - Mobile 已有 `@ywb/domain` workspace 依赖
  - 自检：
    - `npx tsc --noEmit`（domain 包）✅
    - `pnpm --filter web build` ✅（39 页面全部通过）
    - `npx expo export --platform web` ✅（10 页面全部导出）
  - 风险：无
- [x] P0a-05 建立 `packages/query-keys`
  - 完成时间：2026-03-17
  - 决策：
    - 包名 `@ywb/query-keys`，纯 TypeScript key factory，零依赖
    - 覆盖 8 个实体：wine / merchant / scene / store / post / profile / application / analytics
    - 每个实体提供 all / detail / 特定查询的 key 函数
    - store 和 post keys 为 Phase 1A/1B 预留
  - 自检：
    - `npx tsc --noEmit`（query-keys 包）✅
    - `pnpm --filter web build` ✅
    - `npx expo export --platform web` ✅
  - 风险：无
- [x] P0a-06 建立 `packages/supabase-types`
  - 完成时间：2026-03-17
  - 决策：
    - 包名 `@ywb/supabase-types`，占位骨架
    - `Database` 接口为最小形状（空 Tables），P0a-07 后用 `supabase gen types` 填充
    - 导出 `Database` 和 `Json` 类型
    - `gen` 脚本已预留
  - 自检：
    - `npx tsc --noEmit`（supabase-types 包）✅
  - 风险：P0a-07 之前仅为占位，不能实际使用
- [x] P0a-07 编写 Schema V1 迁移文件
  - 完成时间：2026-03-17
  - 决策：
    - Supabase CLI v2.78.1 + Docker 本地实例
    - 25 张业务表（含 profiles、merchant_locations、posts、comments、bookmarks 等）
    - PostGIS 扩展用于门店定位，pg_trgm 用于模糊搜索
    - `get_nearby_stores` RPC：自动扩圈（5km→10km→20km→50km），含收藏状态
    - `get_feed` RPC：(created_at, id) 游标分页，过滤拉黑，聚合媒体/产品/点赞/收藏
    - 3 个触发器：updated_at 自动更新、帖子点赞计数、帖子评论计数
    - 所有表已启用 RLS（策略在 P0a-08 配置）
    - `supabase-types` 包已用 `supabase gen types` 填充真实类型
  - 自检：
    - `supabase db reset` ✅（迁移完整应用）
    - 25 张表 + spatial_ref_sys 验证存在 ✅
    - `get_nearby_stores` 和 `get_feed` RPC 注册成功 ✅
    - `@ywb/supabase-types` tsc --noEmit ✅
    - `pnpm --filter web build` ✅
  - 风险：RLS 策略尚未配置（P0a-08）
- [x] P0a-08 配置基础 RLS 策略
  - 完成时间：2026-03-17
  - 决策：
    - 75 条 RLS 策略覆盖所有 25 张业务表
    - `is_admin()` 和 `is_merchant_staff(merchant_id)` 两个 helper 函数（SECURITY DEFINER）
    - 公开数据（wines, merchants, scenes, regions, tags）：匿名可读
    - 私有数据（bookmarks, blocks, reports, media_uploads）：仅本人 / 管理员
    - 社区（posts, comments）：visible 可读，auth 可写，admin 可管理
    - 门店（merchant_locations）：公开可读，staff / admin 可写
    - 商户应用（merchant_applications）：匿名可提交，admin 可管理
  - 自检：
    - `supabase db reset` ✅（两个迁移文件全部通过）
    - 75 条 policy 创建验证 ✅
    - 匿名读 wines 成功 ✅
    - 匿名/普通用户读 reports 被拦截（返回 0 行）✅
    - 管理员读 reports 成功（返回 1 行）✅
    - 普通用户写 merchants 被拦截 ✅
  - 风险：Edge Function 的 service_role 绕过 RLS 需在 P0b 阶段确认
- [ ] P0a-09 编写 RLS 集成测试
- [ ] P0a-10 Mobile 端 Auth Provider
- [ ] P0a-11 Web 端 Supabase Client 初始化
- [ ] P0a-12 React Query 基础设施
- [ ] P0a-13 Mobile i18n 接入
- [ ] P0a-14 CI 基础流程
- [ ] P0a-15 Deep Link 基础配置

---

## Phase 0b — 底座：上传、审核、种子数据、Web 数据层迁移

- [ ] P0b-01 配置 Supabase Storage
- [ ] P0b-02 开发 `create-upload-intent` Edge Function
- [ ] P0b-03 开发 `finalize-post` Edge Function
- [ ] P0b-04 媒体安全校验
- [ ] P0b-05 App 端图片选择、压缩与上传 SDK
- [ ] P0b-06 审核后台：举报队列页
- [ ] P0b-07 审核后台：案件详情与一键隐藏
- [ ] P0b-08 审核后台：封禁账号
- [ ] P0b-09 开发 `moderate-content` Edge Function
- [ ] P0b-10 种子数据导入：商户与门店
- [ ] P0b-11 种子数据导入：酒款
- [ ] P0b-12 数据迁移脚本
- [ ] P0b-13 Web 认证层迁移
- [ ] P0b-14 `user-store` 迁移
- [ ] P0b-15 `merchant-store` 迁移
- [ ] P0b-16 `admin-store` 迁移
- [ ] P0b-17 `community-store` 迁移
- [ ] P0b-18 `application-store` 与 `price-store` 迁移
- [ ] P0b-19 `analytics-store` 决策
- [ ] P0b-20 Web 数据层迁移集成测试
- [ ] P0b-21 配置 EAS Build 与内测通道
- [ ] P0b-22 接入 Sentry
- [ ] P0b-23 接入 PostHog

---

## Phase 1A — 找店 MVP 闭环

- [ ] P1A-01 B 端门店基本信息编辑页
- [ ] P1A-02 B 端结构化营业时间编辑器
- [ ] P1A-03 B 端地图拖拽校准坐标
- [ ] P1A-04 开发 `get_nearby_stores` RPC
- [ ] P1A-05 C 端定位授权流程
- [ ] P1A-06 C 端手动选区降级
- [ ] P1A-07 C 端门店卡片组件
- [ ] P1A-08 C 端营业状态计算逻辑
- [ ] P1A-09 C 端附近门店列表页
- [ ] P1A-10 C 端门店详情页
- [ ] P1A-11 C 端收藏/取消收藏门店
- [ ] P1A-12 C 端外部导航唤起
- [ ] P1A-13 找店漏斗埋点
- [ ] P1A-14 找店链路 QA 回归

---

## Phase 1B — 社区 MVP 闭环

- [ ] P1B-01 开发 `get_feed` RPC
- [ ] P1B-02 C 端帖子卡片组件
- [ ] P1B-03 C 端图片预览组件
- [ ] P1B-04 C 端单列 Feed 页面
- [ ] P1B-05 C 端帖子详情页
- [ ] P1B-06 C 端发帖页面
- [ ] P1B-07 C 端上传进度与重试
- [ ] P1B-08 C 端点赞功能
- [ ] P1B-09 开发 `create-comment` Edge Function
- [ ] P1B-10 C 端评论列表与发评论
- [ ] P1B-11 C 端帖子收藏
- [ ] P1B-12 C 端举报功能
- [ ] P1B-13 C 端拉黑/屏蔽用户
- [ ] P1B-14 C 端个人中心页
- [ ] P1B-15 C 端用户主页
- [ ] P1B-16 C 端关注/取消关注
- [ ] P1B-17 C 端设置页
- [ ] P1B-18 B 端官方发帖入口
- [ ] P1B-19 社区漏斗埋点
- [ ] P1B-20 社区链路 QA 回归

---

## Phase 1C — 加固、灰度与上线准备

- [ ] P1C-01 草稿箱功能
- [ ] P1C-02 弱网上传恢复
- [ ] P1C-03 频率限制全面部署
- [ ] P1C-04 过期上传清理
- [ ] P1C-05 邀请码机制
- [ ] P1C-06 灰度分发配置
- [ ] P1C-07 埋点校验
- [ ] P1C-08 Sentry 告警规则
- [ ] P1C-09 性能基线测量
- [ ] P1C-10 合规文本
- [ ] P1C-11 最终回归测试
