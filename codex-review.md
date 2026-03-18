# Codex Review

> 审查时间：2026-03-17
>
> 审查范围：现有代码、`AI_PROGRESS.md`、`codex-MVP.md`

## 1. 审查范围与方法

本次审查重点看了以下几类内容：

- 执行文档：`AI_PROGRESS.md`、`codex-MVP.md`
- Web 高风险模块：认证、中间件、admin/user/merchant store、相关 API route
- Supabase 底座：schema、RLS、seed、Edge Functions
- Mobile 基础设施：Auth Provider、Query Provider、i18n、上传 SDK

初次审查阶段没有做业务代码修改，只做了阅读、比对和验证。  
同日的线上故障修复与验证，补记在第 8 节。

## 2. 验证结果

已完成的验证：

- `pnpm --filter web exec tsc --noEmit` 通过
- `pnpm --filter @ywb/domain exec tsc --noEmit` 通过
- `pnpm --filter @ywb/query-keys exec tsc --noEmit` 通过
- `pnpm --filter @ywb/supabase-types exec tsc --noEmit` 通过
- `pnpm --filter mobile exec npx expo export --platform web` 通过
- `pnpm --filter web build` 在可联网环境下通过

需要单独说明的点：

- `pnpm --filter web build` 在沙箱内第一次失败，不是代码报错，而是 `next/font` 取 Google Fonts 被网络限制拦截
- `pnpm --filter web lint` 当前失败，主要是若干现存的 React hooks lint 问题和一个 `require()` 导入问题

## 3. 主要发现

### 3.1 严重：权限边界没有真正收口到 Supabase session

当前 Web 的部分认证已经迁到 Supabase，但大量业务接口仍然直接信任 `wb_session` / `wb_user_session` cookie。

典型位置：

- `apps/web/src/app/api/admin/accounts/route.ts:6`
- `apps/web/src/app/api/admin/users/route.ts:6`
- `apps/web/src/app/api/admin/reports/route.ts:6`
- `apps/web/src/app/api/merchant/wines/[slug]/price/route.ts:10`
- `apps/web/src/app/api/community/posts/route.ts:19`
- `apps/web/src/app/api/community/posts/[id]/comments/route.ts:19`

这些接口的判断方式基本是：

1. 读取 cookie 里的 slug 或 user id
2. 通过 `getMockAccount()` / `getUserById()` 找对象
3. 直接放行

问题在于这不是“当前真实登录用户”的校验，而只是“客户端带了什么 cookie”的校验。  
在 Supabase 模式下，这种做法会让认证层和业务层出现断裂。

影响最大的是高权限路径，因为有些管理动作已经接到 service-role：

- `apps/web/src/lib/merchant-store.ts:179`

这意味着一旦入口判断不严，后果会比较重。

### 3.2 高：后台登录没有校验账号状态

后台登录接口在 Supabase 模式下只判断角色，不判断状态：

- `apps/web/src/app/api/auth/login/route.ts:12`

这里允许 `admin` / `merchant_staff` 登录，但没有像用户端那样拦截被停用或封禁的账号。  
对比用户端登录已经显式拦了 `banned`：

- `apps/web/src/app/api/user/auth/login/route.ts:18`

同时，中间件仍依赖 `wb_role` 做快速放行：

- `apps/web/src/middleware.ts:52`

这会导致后台账号状态控制不完整。

### 3.3 中：收藏接口在 RLS 拒绝时可能返回“假成功”

收藏接口只读 cookie 中的用户 id：

- `apps/web/src/app/api/user/bookmarks/wines/route.ts:4`
- `apps/web/src/app/api/user/bookmarks/merchants/route.ts:4`

而 store 层的 Supabase 分支对 insert/delete 结果没有做错误判断：

- `apps/web/src/lib/user-store.ts:242`
- `apps/web/src/lib/user-store.ts:293`

如果当前 session 和传入 id 不一致，被 RLS 拦掉，接口仍可能返回已收藏/已取消的结果。  
这类问题不会立刻炸，但会造成前端状态和真实数据库状态不一致。

### 3.4 中：`createMerchant()` 是多步写入，但没有事务或补偿

建商户账号当前流程是：

1. 创建 auth user
2. 插入 profile
3. 插入 merchant
4. 插入 merchant_staff

代码位置：

- `apps/web/src/lib/merchant-store.ts:191`

其中任一步失败，前面已经成功的记录不会自动回滚。  
这会留下半成品账号或孤儿数据。

MVP 阶段可以接受“不是数据库事务”的实现，但这里至少应该：

- 明确标注风险
- 或补最基本的失败清理逻辑

### 3.5 中：文档对当前风险的描述偏乐观

`AI_PROGRESS.md` 中关于 Web 认证层和 merchant store 迁移的记录写得比较完整，但风险描述偏轻：

- `AI_PROGRESS.md:440`
- `AI_PROGRESS.md:469`

当前文档里写的是：

- API 路由通过 `supabaseGetUser()` 做完整验证
- `merchant-store` 迁移风险为无

这和实际实现不完全一致。  
现实情况是：auth route 基本切了，但大量业务 route 还停留在 legacy cookie 身份模型。

## 4. 文档与实现的一致性评价

### `codex-MVP.md`

这份文档整体写得好，强约束、顺序感、回退意识都很明确。  
优点有三点：

- 成功定义和范围锁得很清楚
- “先骨架、再底座、再闭环、最后加固”的顺序是对的
- 对高风险区的判断基本准确，尤其是 auth/store/community 的风险识别

### `AI_PROGRESS.md`

这份文档的执行记录密度很高，能看出开发过程是有纪律的。  
但它现在有一个明显问题：对“完成”和“可上线”的界限写得偏松。

更准确的表述应该是：

- 底座搭建完成度高
- 认证迁移完成一部分
- 业务接口的权限统一仍未闭环

## 5. 整体代码质量评价

### 优点

- 工程推进能力强：monorepo、shared package、Supabase schema、RLS、seed、test、mobile skeleton 都已经搭起来了
- 结构意识比较清楚：Phase 设计、shared types、feature 切换、文档留痕都做了
- 大方向正确：没有去重写 UI，而是在底座层和 store 层下手
- 基础设施完成度高：RLS 测试、storage policy、Edge Function、CI 都不是随手糊的

### 短板

- 现在最大的问题不是“代码风格”，而是“权限模型前后不一致”
- legacy cookie 身份模型和 Supabase session 模型并存，但业务接口没有彻底切齐
- lint 债务还在，说明静态质量门槛没有完全收紧

### 总评

如果只看工程骨架和推进质量，这套代码是中上水准。  
如果按“离可上线还有多远”来评，当前最需要补的不是页面，而是认证与权限边界收口。

一句话概括：

> 底座已经搭得像样，但最后那层安全封口还没做完。

## 6. 建议的下一步

建议优先级如下：

1. 把所有高权限和写操作接口统一收口到真实 Supabase session 校验
2. 让 admin/merchant/user 三类接口都不要再单独信任裸 cookie 身份
3. 修正 bookmark 这类“RLS 失败但接口仍返回成功”的逻辑
4. 给 `createMerchant()` 这类多步写入补偿清理或明确失败回滚
5. 修掉当前 lint 红灯，至少把新增路径附近的问题先清掉
6. 回写 `AI_PROGRESS.md`，把“已完成但仍有风险”的描述写准确

## 7. 结论

这不是“写得差”的项目。  
相反，基础工作做得比很多 MVP 项目扎实，尤其是 schema、RLS、seed、Edge Function、mobile scaffold 和执行文档。

但现在确实有一个关键短板：

- 认证已经开始迁 Supabase
- 权限却还没有彻底从 legacy cookie 模型退出

在这个点补完之前，我不建议把当前状态当成“认证层已稳定完成”。

## 8. 补充记录：2026-03-17 线上 Web 故障修复

### 8.1 线上症状

`https://yourwinebook.com/zh-HK` 在 2026-03-17 出现了两类连续故障：

- 首屏样式资源返回 500，页面看起来像“没有 UI”
- 浏览器控制台出现客户端异常，典型报错为：`Cannot read properties of undefined (reading '0')`

这说明问题不只是一层静态资源失效，还有当前前端 bundle 的运行时崩溃。

### 8.2 已确认的根因

这次事故最终确认有三层原因：

1. Web 生产构建使用 Turbopack 时，线上进程出现 `Module factory is not available`，导致 CSS chunk 直接 500
2. App Router 的布局结构不合法，根布局之外的 `[locale]/layout.tsx`、`login/layout.tsx`、`dashboard/layout.tsx` 也在输出 `<html>/<body>`，增加了 hydrate 和 chunk 异常风险
3. 多个页面直接写了 `user.name[0]`、`authorName[0]`。一旦登录用户或动态作者名称为空，当前 layout chunk 会在客户端直接崩掉

第三点就是用户后来看到的 `layout-*.js` 里 `reading '0'` 的直接来源。

### 8.3 本次修复

本次已经落地的修复如下：

- `apps/web/package.json`
  - `dev` / `build` 切到 `next --webpack`
- `apps/web/next.config.ts`
  - 增加 `generateBuildId()`，每次部署生成新的 buildId，避免新旧部署资源被浏览器混用
- `apps/web/src/app/layout.tsx`
  - 让根布局成为唯一输出 `<html>/<body>` 的布局
- `apps/web/src/app/[locale]/layout.tsx`
- `apps/web/src/app/login/layout.tsx`
- `apps/web/src/app/dashboard/layout.tsx`
  - 去掉重复的 `<html>/<body>` 包裹，保留各自的 provider / shell
- `apps/web/src/lib/display-name.ts`
  - 新增统一的显示名归一化与首字母兜底 helper
- `apps/web/src/app/api/user/auth/me/route.ts`
  - API 返回用户信息时统一补齐 `name`
- `apps/web/src/components/layout/Navbar.tsx`
- `apps/web/src/app/[locale]/account/page.tsx`
- `apps/web/src/app/[locale]/community/page.tsx`
- `apps/web/src/app/[locale]/community/[id]/page.tsx`
- `apps/web/src/app/dashboard/account/page.tsx`
- `apps/web/src/app/dashboard/community/page.tsx`
- `apps/web/src/app/dashboard/admin/users/page.tsx`
- `apps/web/src/app/dashboard/admin/accounts/page.tsx`
- `apps/web/src/app/dashboard/admin/applications/page.tsx`
  - 所有头像首字母渲染改成安全 helper，不再直接裸读 `[0]`

### 8.4 修复后验证

已完成的验证：

- `pnpm --filter web build` 通过
- `npm run deploy` 通过
- PM2 中 `wine-prod` 进程重启成功
- `https://yourwinebook.com/zh-HK` 返回 `200 OK`
- 当前线上 HTML 已切到新 buildId，layout chunk 可正常返回 `200`

### 8.5 这次故障暴露出的工程问题

这次线上问题说明，除了权限模型之外，当前 Web 还存在两类需要继续收口的风险：

- Next 16 + Turbopack 的生产稳定性在当前项目上还不够可靠，短期内不建议贸然切回
- 前端展示层对“脏数据 / 空值”的防御仍然偏弱，尤其是头像、名称、文案类字段

如果继续推进上线，建议把“生产构建稳定性”和“显示层空值兜底”都纳入回归检查项。

## 9. 补充记录：2026-03-18 Mobile Expo / QR 故障与复查

### 9.1 已修复项

本次先处理了 mobile 端“二维码可扫但 app 打不开”的入口配置问题。

已确认并修复：

- `apps/mobile/app.json:45` 的 `updates.url` 原来是空字符串
- 这会让 EAS Update 相关二维码配置本身处于无效状态，尤其不应该再配合 `qr.expo.dev/eas-update?url=exp://...` 这种开发期 URL 用法
- 现在已改为项目真实的 update 地址：`https://u.expo.dev/a573b88a-c637-4613-a7ab-3f82b8d5d7e2`
- Expo tunnel 已在 `8081` 正常拉起，当前开发地址为 `exp://rewp4bw-anonymous-8081.exp.direct`

### 9.2 新发现 1：高，Expo SDK 依赖存在明显漂移，当前 mobile 运行稳定性有风险

`expo install --check` 已明确报出当前 mobile 依赖和 Expo SDK 55 的推荐版本不一致。

最明显的一项是：

- `apps/mobile/package.json:13` 的 `@sentry/react-native` 当前是 `^8.4.0`
- Expo 检查结果期望版本是 `~7.11.0`

同时还有多项 Expo 官方包也落后于当前 SDK 55 的推荐 patch：

- `apps/mobile/package.json:18`
- `apps/mobile/package.json:20`
- `apps/mobile/package.json:21`
- `apps/mobile/package.json:23`
- `apps/mobile/package.json:24`
- `apps/mobile/package.json:25`
- `apps/mobile/package.json:26`
- `apps/mobile/package.json:29`

这类问题未必每次都立刻白屏，但它会让 Expo Go、开发构建和后续原生构建都处在“不保证兼容”的状态。  
如果后面继续碰到“扫码后打不开”或某些设备上偶发启动失败，这一项应优先清理。

### 9.3 新发现 2：中，mobile 当前没有通过 TypeScript 静态门禁

`pnpm --filter mobile exec tsc --noEmit` 当前失败，至少有两处现存类型错误：

- `apps/mobile/components/ExternalLink.tsx:7`
- `apps/mobile/lib/posthog.ts:21`
- `apps/mobile/lib/posthog.ts:26`

具体表现是：

- `ExternalLink` 把 `href` 放宽成了裸 `string`，和 `expo-router` typed routes 不兼容
- PostHog 封装把事件属性声明成 `Record<string, unknown>`，但 SDK 期望的是可序列化的 JSON 属性类型

这不是“只影响类型提示”的小问题，因为 mobile 端当前等于没有一个通过中的静态质量门。  
后续如果继续在此基础上改页面或接功能，回归风险会被放大。

### 9.4 新发现 3：低，mobile 缺少独立自动化验证

仓库里目前能看到的是 Supabase RLS SQL 测试与一个集成脚本：

- `supabase/tests/00_rls_setup.sql`
- `supabase/tests/01_rls_public_data.sql`
- `supabase/tests/02_rls_user_operations.sql`
- `supabase/tests/03_rls_merchant_staff.sql`
- `supabase/tests/04_rls_admin.sql`
- `supabase/tests/05_rls_cross_role.sql`
- `scripts/integration-test.sh`

但 `apps/mobile` 下没有看到对应的测试文件或启动自检。  
这意味着像今天这种 Expo 配置、typed routes、埋点封装、provider 初始化问题，基本只能靠手工扫码和运行期暴露。
