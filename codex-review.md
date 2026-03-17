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

本次没有做业务代码修改，只做了阅读、比对和验证。

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
