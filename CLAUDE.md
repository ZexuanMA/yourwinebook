# Your Wine Book — 項目完整指南

> 面向香港消費者的葡萄酒探索與比價平台。核心功能：選酒助手 + 跨酒商比價 + 場景推薦。

---

## 一、快速啟動

```bash
npm run dev          # 開發模式 → http://localhost:3000/zh-HK
npm run build        # 生產構建
npm run start        # 生產服務
npm run lint         # ESLint 檢查
```

無需配置任何環境變量即可運行（默認使用 mock 數據）。

---

## 二、技術棧

| 層級 | 技術 | 版本 |
|------|------|------|
| 框架 | Next.js (App Router) | 16.1.6 |
| 語言 | TypeScript + React 19 | — |
| 樣式 | Tailwind CSS 4 + shadcn/ui | — |
| 國際化 | next-intl | 4.8.3 |
| 圖表 | Recharts | 3.8.0 |
| 圖標 | lucide-react | — |
| 數據庫（可選） | Supabase (PostgreSQL) | — |
| 分析存儲 | better-sqlite3 (WAL 模式) | — |
| 持久化存儲 | JSON 文件 (`data/*.json`) | — |

---

## 三、架構概覽

### 3.1 三棵獨立的 Layout 樹

項目有三個完全獨立的佈局，各自包含 `<html>` + `<body>` + 字體 + CSS：

| Layout | 路徑 | 用途 |
|--------|------|------|
| 前台（公開） | `src/app/[locale]/layout.tsx` | 所有面向消費者的頁面，帶 Navbar + Footer + PageTracker + next-intl |
| 後台（管理） | `src/app/dashboard/layout.tsx` | 酒商/管理員後台，帶 DashboardSidebar + TopBar |
| 登入頁 | `src/app/login/layout.tsx` | 酒商/管理員登入，獨立最小化 layout |

根 `src/app/layout.tsx` 只是一個 pass-through（直接 return children），不渲染任何 HTML。

> **重要規則**：在 `[locale]` 路由之外新增任何頁面路由時，**必須**建立含字體和 CSS 的獨立 `layout.tsx`，否則頁面無樣式。

### 3.2 雙重數據層

所有數據查詢通過 `src/lib/queries.ts` 統一入口：
- **有 Supabase 環境變量** → 走 Supabase 查詢
- **無環境變量（默認）** → 走 `src/lib/mock-data.ts` 內存數據

### 3.3 雙重認證系統

| Cookie 名 | 用途 | 有效期 | 存儲內容 |
|-----------|------|--------|---------|
| `wb_session` | 酒商/管理員 | 7 天 | 帳號 slug |
| `wb_user_session` | 普通消費者 | 30 天 | 用戶 ID |

兩套認證完全獨立，互不干擾。

### 3.4 持久化存儲

| 文件 | 內容 | 對應 Store |
|------|------|-----------|
| `data/admin.json` | 管理員帳號（單個） | `lib/admin-store.ts` |
| `data/merchants.json` | 6 個酒商帳號 | `lib/merchant-store.ts` |
| `data/users.json` | 消費者帳號 | `lib/user-store.ts` |
| `data/applications.json` | 酒商入駐申請 | `lib/application-store.ts` |
| `data/analytics.db` | 分析事件（SQLite） | `lib/analytics-store.ts` |
| ~~`data/analytics.json`~~ | 已刪除（舊版備用，無代碼引用） | — |

---

## 四、目錄結構與文件說明

### 4.1 配置文件

| 文件 | 作用 |
|------|------|
| `next.config.ts` | Next.js 配置，啟用 next-intl 插件（指向 `src/i18n/request.ts`） |
| `package.json` | 依賴管理。開發命令：dev / build / start / lint |
| `tsconfig.json` | TypeScript 配置，定義 `@/` 路徑別名（指向 `./src`） |
| `components.json` | shadcn/ui 組件庫配置 |
| `postcss.config.mjs` | PostCSS 配置，啟用 Tailwind CSS |
| `eslint.config.mjs` | ESLint 規則 |
| `.gitignore` | Git 忽略規則 |

### 4.2 全局樣式 — `src/app/globals.css`

定義品牌色彩系統（Tailwind CSS 自定義主題）：

| 變量 | 顏色 | 用途 |
|------|------|------|
| `--color-bg` | `#FAF8F5` 暖白 | 主背景色 |
| `--color-bg-card` | `#F3F0EB` 米色 | 卡片背景 |
| `--color-text` | `#2C2C2C` 深灰 | 主文字 |
| `--color-text-sub` | `#6B6560` 中灰 | 次要文字 |
| `--color-wine` | `#5B2E35` 酒紅 | 品牌主色、按鈕、強調 |
| `--color-wine-dark` | `#4A242B` 深酒紅 | Hover 狀態 |
| `--color-green` | `#3A4A3C` 墨綠 | 輔助色 |
| `--color-gold` | `#B8956A` 銅金 | 點綴色、最低價標記 |

字體系統：
- 英文：DM Sans（`--font-en`）
- 中文：Noto Sans TC + DM Sans fallback（`--font-zh`）

### 4.3 國際化 — `src/i18n/` + `messages/`

| 文件 | 作用 |
|------|------|
| `src/i18n/routing.ts` | 定義支持語言 `["zh-HK", "en"]`，默認 `zh-HK` |
| `src/i18n/request.ts` | 服務端：根據 URL locale 加載對應的 `messages/{locale}.json` |
| `src/i18n/navigation.ts` | 提供帶語言的 `Link`、`useRouter`、`usePathname`、`redirect` |
| `messages/zh-HK.json` | 所有繁體中文文案（按頁面分組） |
| `messages/en.json` | 所有英文文案（結構與中文完全一致） |

> **修改頁面文字**：只需編輯 `messages/zh-HK.json` 或 `messages/en.json`，無需動代碼。

### 4.4 中間件 — `src/middleware.ts`

處理三件事：
1. `/dashboard/*` 路由保護 → 需要 `wb_session` cookie，否則跳 `/login`
2. `/dashboard/admin/*` 權限保護 → slug 必須是 `"admin"`，否則跳 `/dashboard`
3. `/login` 頁面 → 已登入則跳 `/dashboard`
4. 其他路由 → 交給 next-intl 處理語言路由

---

## 五、前台頁面

### 5.1 首頁 — `src/app/[locale]/page.tsx`

Server Component。展示：
- Hero 區（品牌標語 + `HeroSearch` 搜索框 + AI 入口按鈕）
- 4 個場景卡片（`SceneCard`）：送禮、聚餐、日常、嘗新
- 精選酒款（`WineCard`，從 `getFeaturedWines()` 獲取 `is_featured=true` 的酒款）
- AI 選酒預覽（靜態示範對話 + `AiRecItem`）
- 合作酒商 Logo 牆
- 酒商招募 CTA

### 5.2 搜索頁 — `src/app/[locale]/search/page.tsx`

Client Component。功能：
- `SearchInput` 帶自動補全（debounce 200ms，從 `/api/search?q=` 獲取建議）
- 多維篩選：酒類型 / 產區（動態加載） / 價格範圍 / 排序
- 所有篩選狀態同步到 URL query string（可分享、支持前進/後退）
- 分頁（每頁 12 款）
- 從 `/api/wines` 獲取數據
- 骨架屏加載 + 空狀態友好提示

### 5.3 酒款詳情頁 — `src/app/[locale]/wines/[slug]/`

由兩個文件組成：
- `page.tsx` — 入口，從 mock 數據查找酒款，傳給 `WineDetailClient`
- `WineDetailClient.tsx` — Client Component，展示：
  - 酒款信息（名稱、產區、年份、類型、標籤）
  - 跨酒商比價表（核心功能，從 `winePrices` 讀取）
  - 可展開的品酒筆記 + 產區故事
  - 相似酒款推薦
  - 收藏按鈕（需用戶登入，調用 `/api/user/bookmarks/wines`）
  - 埋點追蹤（`wine_view` + `price_click` 事件，發送到 `/api/track`）

### 5.4 酒商列表頁 — `src/app/[locale]/merchants/page.tsx`

Server Component。從 `getMerchants()` 獲取 6 家酒商，以卡片網格展示。

### 5.5 酒商詳情頁 — `src/app/[locale]/merchants/[slug]/page.tsx`

Client Component。展示：
- 酒商基本信息 + 統計（上架數、最低價數、評分、收藏數）
- 收藏按鈕（需用戶登入）
- 該酒商的所有酒款（從 `/api/merchants/[slug]/wines` 獲取）

### 5.6 場景推薦頁 — `src/app/[locale]/scenes/[slug]/page.tsx`

4 個場景（gift / dinner / everyday / explore）。展示場景描述 + 分類標籤 + 篩選 + 推薦酒款列表。

### 5.7 AI 選酒助手 — `src/app/[locale]/ai/page.tsx`

目前為靜態 Demo 頁面（展示示範對話），輸入框標記 "coming soon"。未來將接入 Claude API + tool use。

### 5.8 關於我們 — `src/app/[locale]/about/page.tsx`

純靜態 i18n 頁面：我們是誰、做什麼、原則、聯繫方式。

### 5.9 酒商入駐 — `src/app/[locale]/join/page.tsx`

申請表單（公司名、聯繫人、Email、電話、網站、酒款數、留言）。提交到 `/api/merchant-applications`。

### 5.10 用戶帳號 — `src/app/[locale]/account/`

| 頁面 | 路徑 | 功能 |
|------|------|------|
| 登入 | `account/login/page.tsx` | Email/密碼登入，4 個 Demo 帳號一鍵填入 |
| 注冊 | `account/register/page.tsx` | 暱稱/Email/密碼，帶密碼強度指示條 |
| 個人主頁 | `account/page.tsx` | 三 Tab：收藏酒款、收藏酒商、個人資料+改密碼 |

---

## 六、後台頁面（`/dashboard`）

### 6.1 登入頁 — `src/app/login/page.tsx`

Split-screen 設計（左側品牌面板 + 右側表單）。管理員帳號單獨展示，酒商帳號 2×3 網格。

### 6.2 Sidebar — `src/components/dashboard/DashboardSidebar.tsx`

根據角色（admin / merchant）顯示不同導航：
- **酒商**：總覽 / 酒款管理 / 新增酒款 / 流量分析 / 帳號設置
- **管理員**：總覽 / 酒商帳號 / 用戶管理 / 入駐申請 / 流量分析 / 帳號設置

### 6.3 後台首頁 — `src/app/dashboard/page.tsx`

統計卡（上架數、最低價數、評分、收藏數）+ 平均定價 Banner + 比價酒款明細表。

### 6.4 酒款管理 — `src/app/dashboard/wines/page.tsx`

酒商的所有上架酒款列表。顯示：你的價格 vs 市場最低、比價排名、狀態。

### 6.5 新增酒款 — `src/app/dashboard/wines/new/page.tsx`

表單：酒類型選擇卡片 + 基本資料 + 定價。目前 Demo 模式不入庫。

### 6.6 流量分析 — `src/app/dashboard/analytics/page.tsx`

角色感知：
- **管理員視角 (AdminAnalytics)**：全局統計、30 天趨勢圖（Recharts）、熱門酒款、各酒商收藏數
- **酒商視角 (MerchantAnalytics)**：自家酒款瀏覽/點擊數據、轉化率、最近點擊記錄

數據源：`/api/admin/analytics` + `/api/admin/analytics/merchants` 或 `/api/merchant/analytics`

### 6.7 帳號設置 — `src/app/dashboard/account/page.tsx`

個人資料編輯 + 改密碼 + 危險操作（暫停帳號，僅酒商）。管理員帳號顯示盾牌徽章。

### 6.8 管理員專屬頁面

| 頁面 | 路徑 | 功能 |
|------|------|------|
| 酒商帳號管理 | `dashboard/admin/accounts/page.tsx` | CRUD 酒商帳號，篩選狀態，可展開詳情，創建新帳號 |
| 用戶管理 | `dashboard/admin/users/page.tsx` | 查看/搜索所有註冊用戶，停用/啟用，展開看收藏酒款 |
| 入駐申請 | `dashboard/admin/applications/page.tsx` | 狀態工作流（待處理→已聯繫→已批准/已拒絕），搜索，展開查看留言 |

---

## 七、可複用組件

| 組件 | 路徑 | 功能 | 使用位置 |
|------|------|------|---------|
| `Navbar` | `components/layout/Navbar.tsx` | 頂部導航：搜索 overlay、語言切換、用戶菜單 | 所有前台頁面 |
| `Footer` | `components/layout/Footer.tsx` | 頁腳：導航鏈接 + 版權 | 所有前台頁面 |
| `WineCard` | `components/wine/WineCard.tsx` | 酒款卡片：emoji + 名稱 + 產區 + 標籤 + 價格 | 首頁、搜索、酒商、場景 |
| `SceneCard` | `components/scene/SceneCard.tsx` | 場景卡片：emoji + 標題 + 描述 | 首頁 |
| `HeroSearch` | `components/search/HeroSearch.tsx` | 首頁搜索框，Enter 跳轉搜索頁 | 首頁 |
| `SearchInput` | `components/search/SearchInput.tsx` | 帶自動補全的搜索框（debounce + 鍵盤導航） | 搜索頁、Navbar |
| `AiRecItem` | `components/ai/AiRecItem.tsx` | AI 推薦條目（酒名 + 價格 + 理由） | 首頁 AI 預覽、AI 頁面 |
| `PageTracker` | `components/analytics/PageTracker.tsx` | 隱形組件，追蹤 pageview 事件到 `/api/track` | 前台 layout |
| `DashboardSidebar` | `components/dashboard/DashboardSidebar.tsx` | 後台側邊欄 + 頂部欄，角色感知 | 後台 layout |
| `Button` | `components/ui/button.tsx` | shadcn 按鈕（variants: default/outline/ghost 等） | 各處 |

---

## 八、核心庫文件（`src/lib/`）

### 8.1 數據類型 — `types.ts`

定義與 Supabase schema 對應的 TypeScript 接口：
- `WineRow`、`MerchantRow`、`SceneRow`、`MerchantPriceRow`、`TagRow`
- `MerchantApplicationInput`、`WineFilters`、`PaginatedWines`

### 8.2 Mock 數據 — `mock-data.ts`

內存數據（不連 Supabase 時的數據源）：
- 6 家酒商、32 支酒款（含中英文品酒筆記和產區故事）
- 4 個場景、20+ 標籤
- 6 支酒的跨酒商比價數據
- 合作酒商 logo 列表

### 8.3 數據查詢層 — `queries.ts`

統一數據入口，每個函數都走 Supabase → mock fallback：

| 函數 | 功能 |
|------|------|
| `getWinesPaginated(filters?)` | 帶篩選/排序/分頁的酒款列表 |
| `getWineBySlug(slug)` | 單支酒款 |
| `getFeaturedWines()` | 精選酒款（`is_featured=true`） |
| `getSimilarWines(slug)` | 同類型相似酒款 |
| `getWinePrices(slug)` | 某支酒的多酒商比價 |
| `getMerchants()` | 所有酒商 |
| `getMerchantBySlug(slug)` | 單個酒商 |
| `getMerchantWines(slug)` | 某酒商的所有酒款 |
| `getScenes()` | 所有場景 |
| `getSceneWines(slug)` | 某場景的推薦酒款 |
| `getRegions()` | 所有去重產區（篩選下拉用） |
| `getSearchSuggestions(q)` | 自動補全建議（最多 6 條） |
| `submitMerchantApplication(data)` | 提交酒商申請 |

### 8.4 語言助手 — `locale-helpers.ts`

將原始數據轉換為當前語言的顯示格式：
- `toWineCard()` — 酒款數據 → WineCard 組件所需 props
- `getMerchantLocale()` — 酒商數據 → 當前語言的名稱/描述
- `getSceneLocale()` — 場景數據 → 當前語言的標題/描述
- `getTastingNotes()` / `getRegionStory()` — 品酒筆記/產區故事的語言切換
- `formatMerchantPrices()` — 格式化比價數據

### 8.5 認證層 — `mock-auth.ts`

統一認證入口，從 `admin-store` 和 `merchant-store` 查詢帳號：
- `verifyCredentials(email, password)` — 驗證登入
- `getMockAccount(slug)` — 根據 slug 獲取帳號信息
- `getAllMerchants()` — 獲取所有酒商（用於登入頁展示）

### 8.6 各 Store

| Store | 文件 | 對應 JSON | 功能 |
|-------|------|----------|------|
| Admin | `admin-store.ts` | `data/admin.json` | 管理員帳號 CRUD + 密碼驗證 |
| Merchant | `merchant-store.ts` | `data/merchants.json` | 酒商帳號 CRUD、狀態管理、密碼管理 |
| User | `user-store.ts` | `data/users.json` | 用戶 CRUD、登入驗證、書籤管理、狀態管理 |
| Application | `application-store.ts` | `data/applications.json` | 申請 CRUD、狀態工作流 |
| Analytics | `analytics-store.ts` | `data/analytics.db` | SQLite 事件追蹤、聚合統計、分商戶分析 |

### 8.7 其他

| 文件 | 作用 |
|------|------|
| `supabase.ts` | Supabase 單例客戶端，無環境變量時返回 `null` |
| `utils.ts` | `cn()` 函數（clsx + tailwind-merge） |
| `mock-users.ts` | `user-store.ts` 的兼容層，導出 `DEMO_USERS` 和 `registerUser()` |
| `mock-analytics.ts` | 靜態模擬分析數據（30 天統計、熱門頁面等，作為 fallback） |
| `schema.sql` | Supabase DDL（10 張表 + RLS 策略 + 索引） |
| `seed.sql` | 種子數據 INSERT 語句（與 mock-data.ts 內容一致） |

---

## 九、API 路由一覽

### 9.1 酒商/管理員認證

| 方法 | 路徑 | 說明 |
|------|------|------|
| POST | `/api/auth/login` | 登入，寫 `wb_session` cookie |
| POST | `/api/auth/logout` | 登出，清 cookie |
| GET | `/api/auth/me` | 當前帳號信息（含 role） |
| POST | `/api/auth/verify-password` | 改密碼（admin/merchant 共用） |

### 9.2 用戶認證

| 方法 | 路徑 | 說明 |
|------|------|------|
| POST | `/api/user/auth/login` | 登入，寫 `wb_user_session` cookie |
| POST | `/api/user/auth/logout` | 登出 |
| POST | `/api/user/auth/register` | 注冊（自動登入） |
| GET | `/api/user/auth/me` | 當前用戶信息（含書籤列表） |
| POST | `/api/user/auth/change-password` | 改密碼 |

### 9.3 用戶書籤

| 方法 | 路徑 | 說明 |
|------|------|------|
| POST | `/api/user/bookmarks/wines` | 切換酒款收藏 |
| POST | `/api/user/bookmarks/merchants` | 切換酒商收藏 |

### 9.4 公開數據

| 方法 | 路徑 | 說明 |
|------|------|------|
| GET | `/api/wines` | 酒款列表（帶篩選/排序/分頁） |
| GET | `/api/wines/[slug]` | 單支酒款詳情 |
| GET | `/api/wines/[slug]/prices` | 酒款比價數據 |
| GET | `/api/merchants` | 所有酒商 |
| GET | `/api/merchants/[slug]` | 單個酒商 |
| GET | `/api/merchants/[slug]/wines` | 酒商的酒款 |
| GET | `/api/merchants/[slug]/stats` | 酒商統計（收藏數等） |
| GET | `/api/scenes` | 所有場景 |
| GET | `/api/scenes/[slug]/wines` | 場景推薦酒款 |
| GET | `/api/search` | 自動補全（`?q=`）或產區列表（`?action=regions`） |
| POST | `/api/merchant-applications` | 提交酒商入駐申請 |

### 9.5 分析

| 方法 | 路徑 | 說明 |
|------|------|------|
| POST | `/api/track` | 接收前端追蹤事件（pageview / wine_view / price_click） |
| GET | `/api/merchant/analytics` | 當前酒商的分析數據 |

### 9.6 管理員專用

| 方法 | 路徑 | 說明 |
|------|------|------|
| GET | `/api/admin/accounts` | 所有酒商帳號列表 |
| POST | `/api/admin/accounts` | 創建新酒商帳號 |
| PATCH | `/api/admin/accounts/[slug]` | 更改酒商狀態 |
| GET | `/api/admin/applications` | 所有入駐申請 |
| PATCH | `/api/admin/applications/[id]` | 更改申請狀態 |
| GET | `/api/admin/users` | 所有註冊用戶 |
| PATCH | `/api/admin/users/[id]` | 更改用戶狀態 |
| GET | `/api/admin/analytics` | 全局分析摘要 |
| GET | `/api/admin/analytics/merchants` | 各酒商分析統計 |

---

## 十、Demo 帳號

### 管理員（`/login`）
- Email: `admin@yourwinebook.com` / 密碼: `admin123`

### 酒商（`/login`，密碼均為 `demo123`）
| 名稱 | Email | 狀態 |
|------|-------|------|
| Watson's Wine | watsons@demo.com | 正常 |
| Wine & Co | wineandco@demo.com | 正常 |
| CellarDoor | cellardoor@demo.com | 正常 |
| VinHK | vinhk@demo.com | 正常 |
| Grape HK | grape@demo.com | 已停用 |
| BottleShop | bottle@demo.com | 待審核 |

### 消費者（`/zh-HK/account/login`，密碼均為 `user123`）
| 名稱 | Email |
|------|-------|
| 陳大文 | david@demo.com |
| 李美玲 | mary@demo.com |
| James Wong | james@demo.com |
| Sophie Lam | sophie@demo.com |

---

## 十一、開發注意事項

### 品牌調性
- **溫暖朋友**（4/5 偏親切）：從容有品味但不端架子
- 書面中文為主，**不用廣東話口語**（不用「啲」「嘅」「唔」）
- 不用推銷壓力語言（「限時搶購」「今日必搶」）
- 不用奢侈排他語言（「尊享」「臻選」）
- 酒名、術語保留英文原文

### Layout 規則
在 `[locale]` 路由之外新增頁面時，必須建立含字體和 CSS 的獨立 `layout.tsx`：
```tsx
import { DM_Sans, Noto_Sans_TC } from "next/font/google";
import "../globals.css";
// 包含 <html> + <body> + 字體變量 + font-zh bg-bg text-text antialiased
```

### 數據流模式
- 前台頁面 → 通過 `/api/*` fetch 數據（Client Component）或直接調用 `queries.ts`（Server Component）
- 後台頁面 → 通過 `/api/*` fetch 數據
- 管理員 API → 都有 `requireAdmin()` 權限檢查
- Store 層 → Node.js `fs` 讀寫 JSON 文件，保證重啟後數據不丟失

### Supabase 切換
要從 mock 切換到真實數據庫：
1. 創建 Supabase 項目
2. 設置環境變量 `NEXT_PUBLIC_SUPABASE_URL` + `NEXT_PUBLIC_SUPABASE_ANON_KEY`
3. 在 SQL Editor 中執行 `src/lib/schema.sql` 再執行 `src/lib/seed.sql`
4. 重啟 dev server

---

## 十二、路由結構總覽

```
前台（帶語言前綴 /zh-HK/ 或 /en/）
├── /                           首頁
├── /search                     搜索 + 篩選
├── /wines/[slug]               酒款詳情 + 比價
├── /merchants                  酒商列表
├── /merchants/[slug]           酒商詳情
├── /scenes/[slug]              場景推薦
├── /ai                         AI 選酒助手（Demo）
├── /about                      關於我們
├── /join                       酒商入駐申請
├── /account                    用戶個人主頁
├── /account/login              用戶登入
└── /account/register           用戶注冊

後台（無語言前綴）
├── /login                      酒商/管理員登入
├── /dashboard                  後台首頁
├── /dashboard/wines            酒款管理
├── /dashboard/wines/new        新增酒款
├── /dashboard/analytics        流量分析
├── /dashboard/account          帳號設置
├── /dashboard/admin/accounts   酒商帳號管理（管理員）
├── /dashboard/admin/users      用戶管理（管理員）
└── /dashboard/admin/applications 入駐申請（管理員）
```

---

## 十三、開發階段記錄

| 階段 | 內容 | 狀態 |
|------|------|------|
| Phase 1 | 靜態 HTML → Next.js 遷移，7 個頁面 + 雙語 | 已完成 |
| Phase 2 | Supabase 數據層 + Mock fallback，32 酒款/6 酒商 | 已完成 |
| Phase 3 | 搜索 + 多維篩選 + 排序 + 分頁 | 已完成 |
| Phase 4 | AI 酒顧問（Claude API + tool use） | 待開發 |
| Phase 5A | 酒商後台（登入 + 酒款管理 + 帳號管理 + Admin + 分析） | 已完成 |
| Phase 5B | CSV 批量導入、用戶系統完善 | 部分完成 |
