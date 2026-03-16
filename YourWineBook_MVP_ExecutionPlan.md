# Your Wine Book — 香港酒品垂直社區 App MVP 執行方案 (V2)

> **文檔版本**: 2.0
> **最後更新**: 2026-03-17
> **文檔性質**: 產品規劃 + 技術架構 + 執行拆解（非基於已有代碼，從零規劃）

---

## 目錄

1. [項目定位與 MVP 邊界](#一項目定位與-mvp-邊界)
2. [架構總覽](#二架構總覽)
3. [Monorepo 工程結構](#三monorepo-工程結構)
4. [狀態管理與認證體系](#四狀態管理與認證體系)
5. [數據模型完整定義](#五數據模型完整定義)
6. [關鍵技術方案](#六關鍵技術方案)
7. [權限與安全設計](#七權限與安全設計)
8. [分階段執行路線圖](#八分階段執行路線圖)
9. [任務拆解清單](#九任務拆解清單)
10. [驗收標準](#十驗收標準)
11. [風險登記與應對](#十一風險登記與應對)
12. [附錄：技術選型決策記錄](#附錄技術選型決策記錄)

---

## 一、項目定位與 MVP 邊界

### 1.1 核心願景

打造專注於香港市場的酒品垂直社區 App，連接本地酒商與消費者。消費者可找店、評酒、交流；酒商可展示門店、酒款、品牌故事，最終形成高黏性的垂直開放社區。

### 1.2 MVP 只驗證兩個閉環

一切功能服務於這兩個閉環，跑不通就不擴展：

**閉環 1 — 找店**
```
用戶打開 App → 授權定位 → 看到附近酒商列表 → 收藏 / 點擊外部導航到店
```

**閉環 2 — 社區**
```
用戶瀏覽 Feed → 發佈圖文酒評 → 獲得點讚/評論正向反饋 → 形成黏性再次回訪
```

### 1.3 MVP 明確包含

| 功能 | 端 | 說明 |
|---|---|---|
| 定位找店 | C端 App | 附近門店列表、自動擴圈、手動選區降級 |
| 門店收藏 | C端 App | 收藏/取消收藏門店 |
| 外部導航 | C端 App | Deep Link 喚起 Apple Maps / Google Maps |
| 單列 Feed | C端 App | 時間倒序，不做混排推薦 |
| 發圖文帖 | C端 App | 至多 9 張圖，客戶端壓縮，斷網重試 |
| 點讚/評論 | C端 App | 樂觀更新，冪等防護 |
| 帖子收藏 | C端 App | 收藏/取消收藏帖子 |
| 舉報/拉黑 | C端 App | 對帖子、評論、用戶的舉報與屏蔽 |
| 酒款關聯 | C端 App | 發帖時可選擇關聯酒款（非必填） |
| 門店管理 | B端 Web | 營業時間、拖拽校準坐標、基本信息 |
| 官方發帖 | B端 Web | 商戶員工以官方身份發帖 |
| 審核後台 | B端 Web | 舉報隊列、一鍵下架、封禁帳號 |
| 商戶/酒款導入 | B端 Web | 管理員批量導入種子數據 |

### 1.4 MVP 明確不做

- 電商交易、支付、購物車
- 站內 IM / 私信
- 瀑布流佈局
- 關注優先 + 地域補充混排推薦
- App 內路線規劃（Mapbox 等）
- 短視頻
- 話題標籤 / 熱榜
- KOL 認證
- AR 找店
- 自動翻譯用戶內容

### 1.5 冷啟動前置要求

MVP 上線前，運營團隊必須準備：

| 項目 | 數量 | 說明 |
|---|---|---|
| 種子商戶 | 30–50 家 | 已校準座標、有營業時間、有品牌簡介 |
| 基礎酒款 | 200–500 條 | 至少覆蓋種子商戶的主力酒款 |
| 初始內容 | 100–200 條 | 團隊或邀請用戶預先發佈的圖文酒評 |
| 內測用戶 | 20–50 人 | 通過邀請碼進入，提供早期反饋 |

**發佈策略**：首發採用邀請制灰度，不全量開放註冊。

---

## 二、架構總覽

### 2.1 雙端分離

```
┌─────────────────────────────────────────────────────────┐
│                      Supabase Cloud                      │
│  ┌──────────┐  ┌──────────┐  ┌───────────┐  ┌────────┐ │
│  │ Auth     │  │ Database │  │ Storage   │  │ Edge   │ │
│  │ (GoTrue) │  │ (Postgres│  │ (S3-like) │  │Functions│ │
│  │          │  │ +PostGIS)│  │           │  │        │ │
│  └────┬─────┘  └────┬─────┘  └─────┬─────┘  └───┬────┘ │
└───────┼──────────────┼──────────────┼────────────┼──────┘
        │              │              │            │
   ┌────┴──────────────┴──────────────┴────────────┴────┐
   │                    Supabase SDK                     │
   └────────────────┬───────────────────┬───────────────┘
                    │                   │
        ┌───────────┴───────┐   ┌───────┴───────────┐
        │   C端 App (Expo)  │   │  B端 Web (Next.js) │
        │   消費者           │   │  商戶 + 管理員      │
        └───────────────────┘   └───────────────────┘
```

### 2.2 技術棧一覽

| 層級 | 技術選型 | 說明 |
|---|---|---|
| C端 App | Expo SDK 52+ / React Native | 原生體驗、設備硬件調用 |
| B端 Web | Next.js 15 (App Router) | 保留並演進現有項目 |
| 後端/數據庫 | Supabase (PostgreSQL + PostGIS) | 認證、存儲、RLS、Edge Functions |
| 狀態管理(服務端) | TanStack React Query v5 | 緩存、分頁、樂觀更新 |
| 狀態管理(客戶端) | Zustand | 純 UI 狀態 |
| 列表渲染 | @shopify/flash-list | 高性能長列表 |
| 導航 | expo-router (file-based) | 類 Next.js 的文件路由 |
| 崩潰監控 | Sentry (React Native + Web) | 崩潰追蹤、性能追蹤 |
| 用戶行為埋點 | PostHog | 漏斗、留存、事件追蹤 |
| 圖片壓縮 | expo-image-manipulator | 客戶端壓縮 |
| 國際化 | i18next + react-i18next | 繁中為主、英文為輔 |
| 構建與分發 | EAS Build + EAS Update | 原生構建 + OTA 熱更新 |

---

## 三、Monorepo 工程結構

### 3.1 為什麼選 pnpm workspace + Turborepo

| 考量 | pnpm + Turbo | Nx | 結論 |
|---|---|---|---|
| 學習成本 | 低，配置簡單 | 高，概念多 | 當前只有 2 個 apps + 3 個 packages，Turbo 足夠 |
| 依賴隔離 | pnpm 天然嚴格 | 需額外配置 | pnpm 的 node_modules 結構更安全 |
| 構建緩存 | Turbo 核心能力 | Nx 也有 | 兩者都行，Turbo 更輕量 |
| Metro 兼容 | 需手動配置 | 需手動配置 | 兩者都要處理，沒有差異 |

### 3.2 目錄結構

```
your-wine-book/
├── apps/
│   ├── mobile/                    # Expo / React Native 消費者 App
│   │   ├── app/                   # expo-router 文件路由
│   │   │   ├── (tabs)/            # 底部 Tab 佈局
│   │   │   │   ├── index.tsx      # 首頁 Feed
│   │   │   │   ├── explore.tsx    # 找店/探索
│   │   │   │   ├── post.tsx       # 發帖入口
│   │   │   │   └── profile.tsx    # 個人中心
│   │   │   ├── store/[id].tsx     # 門店詳情
│   │   │   ├── post/[id].tsx      # 帖子詳情
│   │   │   ├── auth/              # 登入/註冊
│   │   │   └── _layout.tsx        # 根佈局
│   │   ├── components/            # App 專用組件
│   │   ├── hooks/                 # App 專用 hooks
│   │   ├── lib/                   # App 專用工具
│   │   │   ├── supabase.ts        # Supabase client (SecureStore adapter)
│   │   │   ├── auth-provider.tsx  # Auth context + SecureStore
│   │   │   ├── upload.ts          # 圖片壓縮 + 上傳邏輯
│   │   │   └── location.ts        # 定位封裝
│   │   ├── i18n/                  # 翻譯資源
│   │   ├── metro.config.js        # Metro monorepo 配置
│   │   ├── app.json
│   │   └── package.json
│   │
│   └── web/                       # Next.js 商戶 + 管理員後台
│       ├── app/                   # App Router
│       │   ├── (merchant)/        # 商戶後台路由組
│       │   │   ├── stores/        # 門店管理
│       │   │   ├── posts/         # 官方發帖
│       │   │   └── products/      # 酒款管理
│       │   ├── (admin)/           # 管理員路由組
│       │   │   ├── moderation/    # 審核隊列
│       │   │   ├── merchants/     # 商戶管理
│       │   │   └── import/        # 數據導入
│       │   └── (auth)/            # 登入/註冊
│       ├── components/
│       ├── lib/
│       │   └── supabase.ts        # Supabase client (Cookie adapter)
│       └── package.json
│
├── packages/
│   ├── domain/                    # 純邏輯共享層
│   │   ├── src/
│   │   │   ├── types/             # TypeScript 類型定義
│   │   │   │   ├── profile.ts
│   │   │   │   ├── merchant.ts
│   │   │   │   ├── post.ts
│   │   │   │   ├── product.ts
│   │   │   │   └── moderation.ts
│   │   │   ├── validators/        # Zod 校驗規則
│   │   │   │   ├── post.ts        # 發帖校驗（標題長度、圖片數量等）
│   │   │   │   ├── comment.ts
│   │   │   │   └── merchant.ts
│   │   │   ├── constants/         # 業務常量
│   │   │   │   ├── roles.ts       # 角色枚舉
│   │   │   │   ├── status.ts      # 狀態枚舉
│   │   │   │   └── limits.ts      # 業務限制（最大圖片數等）
│   │   │   └── rules/             # 純函數業務規則
│   │   │       ├── permissions.ts # 權限判斷邏輯
│   │   │       └── moderation.ts  # 審核規則
│   │   └── package.json
│   │
│   ├── query-keys/                # React Query key 常量
│   │   ├── src/
│   │   │   ├── posts.ts
│   │   │   ├── merchants.ts
│   │   │   ├── products.ts
│   │   │   └── profiles.ts
│   │   └── package.json
│   │
│   └── supabase-types/            # 數據庫生成類型
│       ├── src/
│       │   └── database.ts        # supabase gen types 輸出
│       └── package.json
│
├── supabase/                      # Supabase 本地開發配置
│   ├── migrations/                # 數據庫遷移文件
│   ├── functions/                 # Edge Functions
│   │   ├── create-upload-intent/  # 上傳意圖
│   │   ├── finalize-post/         # 確認發帖
│   │   ├── moderate-content/      # 審核操作
│   │   └── rate-limiter/          # 頻率限制中間件
│   ├── seed.sql                   # 種子數據
│   └── config.toml
│
├── turbo.json                     # Turborepo 任務配置
├── pnpm-workspace.yaml            # Workspace 聲明
├── package.json                   # Root scripts
└── .github/
    └── workflows/
        ├── ci.yml                 # lint + type-check + test
        └── deploy-web.yml         # Next.js 部署
```

### 3.3 共享層邊界規則

**共享（放進 packages/）：**
- TypeScript 類型定義
- Zod 校驗 schema
- 常量與枚舉
- React Query key factory
- 純函數業務規則（無副作用）

**不共享（各端自行封裝）：**
- Supabase client 實例化（移動端用 SecureStore，Web 用 Cookie）
- fetch / API client wrapper
- Auth Provider 實現
- Storage adapter
- 平台相關 hooks（如定位、相機）

### 3.4 Metro Bundler Monorepo 配置要點

在 `apps/mobile/metro.config.js` 中必須處理：

```js
// metro.config.js - 關鍵配置項
const { getDefaultConfig } = require('expo/metro-config');
const path = require('path');

const projectRoot = __dirname;
const monorepoRoot = path.resolve(projectRoot, '../..');

const config = getDefaultConfig(projectRoot);

// 1. watchFolders：讓 metro 監視 packages/ 目錄
config.watchFolders = [monorepoRoot];

// 2. nodeModulesPaths：解決 pnpm 嚴格依賴下的模塊查找
config.resolver.nodeModulesPaths = [
  path.resolve(projectRoot, 'node_modules'),
  path.resolve(monorepoRoot, 'node_modules'),
];

// 3. disableHierarchicalLookup：pnpm 環境建議開啟
config.resolver.disableHierarchicalLookup = true;

module.exports = config;
```

**Phase 0 必須驗證**：在 monorepo 中 `import { PostStatus } from '@ywb/domain'` 能在 iOS/Android 模擬器上正常解析。

---

## 四、狀態管理與認證體系

### 4.1 狀態分層

```
┌──────────────────────────────────────────────┐
│              Auth Provider (Context)          │
│  - Supabase Auth session 生命周期             │
│  - SecureStore 持久化 (移動端)               │
│  - Cookie/Server Session (Web 端)            │
│  - onAuthStateChange 監聽                    │
│  - token refresh / session expiry 處理       │
└──────────────────┬───────────────────────────┘
                   │
    ┌──────────────┴──────────────┐
    │                             │
┌───┴──────────────┐  ┌──────────┴──────────┐
│  React Query     │  │     Zustand         │
│  (服務端狀態)     │  │  (客戶端 UI 狀態)   │
│                  │  │                     │
│  - Feed 列表     │  │  - 篩選條件          │
│  - 門店列表      │  │  - 發帖草稿本地態    │
│  - 評論列表      │  │  - 臨時 UI 彈窗狀態  │
│  - 收藏狀態      │  │  - 未提交表單暫存    │
│  - 我的資料      │  │                     │
│  - 上傳狀態查詢   │  │                     │
│                  │  │                     │
│  緩存 + 分頁     │  │  不持久化到服務端    │
│  樂觀更新        │  │                     │
│  離線回顯        │  │                     │
└──────────────────┘  └─────────────────────┘
```

### 4.2 Auth Provider 設計

**移動端 (Expo)**：

```
AuthProvider
├── 初始化時從 SecureStore 讀取 session
├── 調用 supabase.auth.setSession() 恢復
├── 監聽 onAuthStateChange
│   ├── SIGNED_IN → 存 session 到 SecureStore，invalidate React Query
│   ├── TOKEN_REFRESHED → 更新 SecureStore
│   ├── SIGNED_OUT → 清除 SecureStore，reset React Query cache
│   └── USER_UPDATED → 更新本地 profile cache
├── 提供 signIn / signUp / signOut / session / user
└── 暴露 isLoading / isAuthenticated 供路由守衛使用
```

**Web 端 (Next.js)**：

```
AuthProvider
├── 使用 @supabase/ssr 的 Cookie-based adapter
├── Server Component 通過 cookies() 讀 session
├── Client Component 通過 createBrowserClient 操作
├── Middleware 驗證 session 有效性
└── 提供相同的 signIn / signUp / signOut 介面
```

**關鍵原則**：Auth 狀態不放進 Zustand。token refresh、session 過期恢復本質上是服務端狀態，由 Auth Provider 獨立管理。

### 4.3 React Query 離線策略

在 Phase 0 就接入 `persistQueryClient`：

```
App 啟動
├── 從 AsyncStorage 恢復上次 Query Cache
├── 立即渲染 stale 數據（門店列表、Feed、收藏）
├── 後台發起 revalidation
│   ├── 有網 → 更新數據，用戶無感
│   └── 無網 → 保持 stale 數據展示，不白屏
└── 斷網期間的寫操作（點讚、收藏）進入本地 mutation queue
    └── 恢復網絡後自動重試
```

**配置要點**：
- `gcTime`（原 `cacheTime`）設為 24 小時
- `staleTime` 按場景區分：Feed 30 秒，門店列表 5 分鐘，收藏 1 分鐘
- 使用 `createAsyncStoragePersister` 做本地持久化
- 設定 `maxAge` 為 7 天，超過自動清理

---

## 五、數據模型完整定義

### 5.1 ER 關係總覽

```
profiles ──────┬──── merchant_staff ──── merchant_entities
   │           │                              │
   │           │                              ├── merchant_locations
   │           │                              ├── merchant_products ── products
   │           │                              │
   │           ├── posts ────────────────────┤ (acting_merchant_id)
   │           │     │
   │           │     ├── post_media
   │           │     ├── post_likes
   │           │     ├── post_comments
   │           │     ├── post_bookmarks
   │           │     └── post_products ────── products
   │           │
   │           ├── merchant_bookmarks ─────── merchant_entities
   │           ├── follows
   │           ├── blocks
   │           └── reports ──────────────── moderation_cases
   │
   └── media_uploads
```

### 5.2 完整 Schema 定義

#### 5.2.1 身份與角色

```sql
-- ============================================================
-- 1. 用戶檔案
-- ============================================================
CREATE TABLE profiles (
  id            UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  nickname      TEXT NOT NULL,
  avatar_url    TEXT,
  bio           TEXT,
  default_role  TEXT NOT NULL DEFAULT 'consumer',  -- 僅做展示/默認身份，不做權限依據
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

COMMENT ON COLUMN profiles.default_role IS
  '僅做展示用途。真正的權限判斷基於 merchant_staff 和管理員關係表，不依賴此欄位。';

-- ============================================================
-- 2. 酒商主體（公司級別）
-- ============================================================
CREATE TABLE merchant_entities (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name          TEXT NOT NULL,
  brand_story   TEXT,
  logo_url      TEXT,
  status        TEXT NOT NULL DEFAULT 'pending',  -- pending | active | suspended
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ============================================================
-- 3. 商戶員工（profile ↔ merchant 的多對多關係）
-- ============================================================
CREATE TABLE merchant_staff (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id    UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  merchant_id   UUID NOT NULL REFERENCES merchant_entities(id) ON DELETE CASCADE,
  role          TEXT NOT NULL DEFAULT 'staff',  -- owner | manager | staff
  status        TEXT NOT NULL DEFAULT 'active', -- active | inactive
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),

  UNIQUE (profile_id, merchant_id)
);

COMMENT ON TABLE merchant_staff IS
  '一個用戶可以同時是消費者和商戶員工，甚至可以是多家商戶的員工。權限判定以此表為準。';
```

#### 5.2.2 地理空間與門店

```sql
-- 啟用 PostGIS
CREATE EXTENSION IF NOT EXISTS postgis;

-- ============================================================
-- 4. 門店
-- ============================================================
CREATE TABLE merchant_locations (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  merchant_id     UUID NOT NULL REFERENCES merchant_entities(id) ON DELETE CASCADE,
  name            TEXT,                              -- 分店名（如：中環店）
  address         TEXT NOT NULL,
  district        TEXT,                              -- 地區（港島/九龍/新界/離島）
  phone           TEXT,
  business_hours  JSONB NOT NULL DEFAULT '{}',       -- 結構化營業時間（見下方說明）
  location        GEOGRAPHY(Point, 4326) NOT NULL,   -- PostGIS 經緯度
  status          TEXT NOT NULL DEFAULT 'active',    -- active | closed | temporarily_closed
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 空間索引（核心性能保障）
CREATE INDEX idx_locations_geom ON merchant_locations USING GIST (location);

-- 按商戶查門店
CREATE INDEX idx_locations_merchant ON merchant_locations (merchant_id);

COMMENT ON COLUMN merchant_locations.business_hours IS
  '結構化 JSON，格式見下方說明。不要用自由文本，否則無法判斷「營業中/休息中」。';
```

**`business_hours` 結構化格式**：

```json
{
  "monday":    { "open": "10:00", "close": "22:00" },
  "tuesday":   { "open": "10:00", "close": "22:00" },
  "wednesday": { "open": "10:00", "close": "22:00" },
  "thursday":  { "open": "10:00", "close": "22:00" },
  "friday":    { "open": "10:00", "close": "23:00" },
  "saturday":  { "open": "11:00", "close": "23:00" },
  "sunday":    null,
  "holidays":  null,
  "notes":     "公眾假期休息"
}
```

- `null` 表示當日休息
- 前端可根據當前星期幾 + 當前時間判斷「營業中」/「已打烊」
- `notes` 供文字補充（如：需預約）

#### 5.2.3 酒款

```sql
-- ============================================================
-- 5. 酒款主數據（不綁定單一商戶，全局共用）
-- ============================================================
CREATE TABLE products (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name          TEXT NOT NULL,
  name_en       TEXT,                           -- 英文名（酒標常用）
  category      TEXT NOT NULL,                  -- red_wine | white_wine | sparkling | sake | whisky | beer | other
  subcategory   TEXT,                           -- cabernet_sauvignon | chardonnay | ...
  region        TEXT,                           -- 產區
  vintage       INT,                            -- 年份，null 表示無年份
  description   TEXT,
  image_url     TEXT,
  status        TEXT NOT NULL DEFAULT 'active',
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

COMMENT ON TABLE products IS
  '全局酒款主數據。同一款酒可被多家商戶上架，避免重複建模。MVP 階段由管理員維護。';

-- ============================================================
-- 6. 商戶-酒款關聯（哪家店賣哪些酒）
-- ============================================================
CREATE TABLE merchant_products (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  merchant_id   UUID NOT NULL REFERENCES merchant_entities(id) ON DELETE CASCADE,
  product_id    UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  display_price NUMERIC(10,2),                  -- 展示價格（非交易用途）
  is_available  BOOLEAN NOT NULL DEFAULT true,
  external_url  TEXT,                           -- 外部購買連結（如有）
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),

  UNIQUE (merchant_id, product_id)
);
```

#### 5.2.4 社區內容

```sql
-- ============================================================
-- 7. 帖子
-- ============================================================
CREATE TABLE posts (
  id                 UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  author_profile_id  UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  acting_merchant_id UUID REFERENCES merchant_entities(id) ON DELETE SET NULL,  -- 以哪家商戶身份發帖
  is_official        BOOLEAN NOT NULL DEFAULT false,  -- 是否為官方帖子
  content            TEXT NOT NULL,
  status             TEXT NOT NULL DEFAULT 'published', -- draft | published | hidden | deleted
  created_at         TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at         TIMESTAMPTZ NOT NULL DEFAULT now(),
  deleted_at         TIMESTAMPTZ                        -- 軟刪除時間

  -- 約束：官方帖子必須關聯商戶
  CONSTRAINT chk_official_merchant CHECK (
    (is_official = false) OR (acting_merchant_id IS NOT NULL)
  )
);

CREATE INDEX idx_posts_author ON posts (author_profile_id);
CREATE INDEX idx_posts_merchant ON posts (acting_merchant_id) WHERE acting_merchant_id IS NOT NULL;
CREATE INDEX idx_posts_created ON posts (created_at DESC, id DESC);  -- 游標分頁索引

COMMENT ON COLUMN posts.is_official IS
  '顯式標記官方帖子。不依賴 acting_merchant_id 是否為空的隱式約定。';

-- ============================================================
-- 8. 帖子媒體
-- ============================================================
CREATE TABLE post_media (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id        UUID NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
  original_url   TEXT NOT NULL,
  thumbnail_url  TEXT NOT NULL,
  width          INT NOT NULL,          -- 預防列表渲染佈局抖動
  height         INT NOT NULL,
  sort_order     INT NOT NULL DEFAULT 0,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_post_media_post ON post_media (post_id, sort_order);

-- ============================================================
-- 9. 帖子-酒款關聯
-- ============================================================
CREATE TABLE post_products (
  post_id     UUID NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
  product_id  UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  PRIMARY KEY (post_id, product_id)
);

-- ============================================================
-- 10. 點讚
-- ============================================================
CREATE TABLE post_likes (
  post_id     UUID NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
  profile_id  UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (post_id, profile_id)  -- 聯合主鍵天然防重複
);

-- ============================================================
-- 11. 評論
-- ============================================================
CREATE TABLE post_comments (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id     UUID NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
  profile_id  UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  content     TEXT NOT NULL,
  status      TEXT NOT NULL DEFAULT 'visible',  -- visible | hidden | deleted
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  deleted_at  TIMESTAMPTZ
);

CREATE INDEX idx_comments_post ON post_comments (post_id, created_at);
```

#### 5.2.5 社交與收藏

```sql
-- ============================================================
-- 12. 門店收藏
-- ============================================================
CREATE TABLE merchant_bookmarks (
  profile_id   UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  merchant_id  UUID NOT NULL REFERENCES merchant_entities(id) ON DELETE CASCADE,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (profile_id, merchant_id)
);

-- ============================================================
-- 13. 帖子收藏
-- ============================================================
CREATE TABLE post_bookmarks (
  profile_id  UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  post_id     UUID NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (profile_id, post_id)
);

-- ============================================================
-- 14. 關注
-- ============================================================
CREATE TABLE follows (
  follower_id           UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  following_profile_id  UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  created_at            TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (follower_id, following_profile_id),
  CONSTRAINT chk_no_self_follow CHECK (follower_id != following_profile_id)
);

-- ============================================================
-- 15. 拉黑/屏蔽
-- ============================================================
CREATE TABLE blocks (
  blocker_id          UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  blocked_profile_id  UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  created_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (blocker_id, blocked_profile_id),
  CONSTRAINT chk_no_self_block CHECK (blocker_id != blocked_profile_id)
);

COMMENT ON TABLE blocks IS
  '拉黑後：不顯示對方帖子/評論、對方無法評論自己的帖子、對方不出現在列表中。';
```

#### 5.2.6 審核與風控

```sql
-- ============================================================
-- 16. 用戶舉報（原始記錄，只增不改）
-- ============================================================
CREATE TABLE reports (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  reporter_id  UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  target_type  TEXT NOT NULL,  -- post | comment | user | merchant
  target_id    UUID NOT NULL,
  reason       TEXT NOT NULL,  -- spam | inappropriate | harassment | other
  detail       TEXT,           -- 用戶補充說明
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_reports_target ON reports (target_type, target_id);

COMMENT ON TABLE reports IS
  '用戶舉報的原始記錄。只增不改，作為審計日誌。';

-- ============================================================
-- 17. 審核工作隊列（由多來源寫入）
-- ============================================================
CREATE TABLE moderation_cases (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  target_type  TEXT NOT NULL,           -- post | comment | user | merchant
  target_id    UUID NOT NULL,
  source       TEXT NOT NULL,           -- user_report | ai_detection | manual_patrol
  risk_level   TEXT NOT NULL DEFAULT 'low',  -- low | medium | high | critical
  status       TEXT NOT NULL DEFAULT 'pending',  -- pending | reviewing | resolved | dismissed
  assigned_to  UUID REFERENCES profiles(id),  -- 處理人
  resolved_at  TIMESTAMPTZ,
  resolution   TEXT,                    -- hidden | deleted | warned | no_action
  notes        TEXT,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_moderation_status ON moderation_cases (status, risk_level DESC, created_at);

COMMENT ON TABLE moderation_cases IS
  '審核工作隊列。可由用戶舉報、AI 檢測、人工巡查等多個來源寫入。與 reports 表分離。';
```

#### 5.2.7 上傳管理

```sql
-- ============================================================
-- 18. 上傳意圖記錄（安全鏈路核心）
-- ============================================================
CREATE TABLE media_uploads (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  uploader_id   UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  object_path   TEXT NOT NULL,           -- Storage 中的對象路徑
  purpose       TEXT NOT NULL,           -- post_media | avatar | merchant_logo
  status        TEXT NOT NULL DEFAULT 'pending',  -- pending | uploaded | verified | failed | expired
  mime_type     TEXT,
  file_size     INT,
  width         INT,
  height        INT,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  expires_at    TIMESTAMPTZ NOT NULL DEFAULT (now() + interval '1 hour')  -- 未完成的意圖 1 小時後過期
);

CREATE INDEX idx_uploads_uploader ON media_uploads (uploader_id, status);

COMMENT ON TABLE media_uploads IS
  '上傳意圖記錄。客戶端先建立意圖，獲得上傳授權；上傳完成後由服務端校驗並標記 verified。防止客戶端偽造 post_media。';
```

### 5.3 需要的 Supabase 配置

```sql
-- 啟用必要擴展
CREATE EXTENSION IF NOT EXISTS postgis;
CREATE EXTENSION IF NOT EXISTS pg_trgm;  -- 模糊搜索用（未來）

-- 為所有表啟用 updated_at 自動更新
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 對需要 updated_at 的表分別建立觸發器
CREATE TRIGGER trg_profiles_updated BEFORE UPDATE ON profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER trg_merchant_entities_updated BEFORE UPDATE ON merchant_entities
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER trg_merchant_locations_updated BEFORE UPDATE ON merchant_locations
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER trg_products_updated BEFORE UPDATE ON products
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER trg_posts_updated BEFORE UPDATE ON posts
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER trg_post_comments_updated BEFORE UPDATE ON post_comments
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER trg_moderation_cases_updated BEFORE UPDATE ON moderation_cases
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
```

---

## 六、關鍵技術方案

### 6.1 地理空間查詢

#### 查詢策略：自動擴圈

```sql
-- 附近門店查詢 RPC
CREATE OR REPLACE FUNCTION get_nearby_stores(
  user_lat FLOAT,
  user_lng FLOAT,
  radius_km FLOAT DEFAULT 5,
  max_radius_km FLOAT DEFAULT 50,
  result_limit INT DEFAULT 20
)
RETURNS TABLE (
  id UUID,
  merchant_id UUID,
  merchant_name TEXT,
  name TEXT,
  address TEXT,
  district TEXT,
  phone TEXT,
  business_hours JSONB,
  latitude FLOAT,
  longitude FLOAT,
  distance_km FLOAT,
  is_bookmarked BOOLEAN
) AS $$
DECLARE
  current_radius FLOAT := radius_km;
  found_count INT := 0;
BEGIN
  -- 自動擴圈：5km → 10km → 20km → 50km（全港）
  WHILE current_radius <= max_radius_km AND found_count = 0 LOOP
    SELECT COUNT(*) INTO found_count
    FROM merchant_locations ml
    WHERE ml.status = 'active'
      AND ST_DWithin(
        ml.location,
        ST_SetSRID(ST_MakePoint(user_lng, user_lat), 4326)::geography,
        current_radius * 1000  -- 轉換為米
      );

    IF found_count = 0 THEN
      current_radius := current_radius * 2;
    END IF;
  END LOOP;

  -- 返回結果
  RETURN QUERY
  SELECT
    ml.id,
    ml.merchant_id,
    me.name AS merchant_name,
    ml.name,
    ml.address,
    ml.district,
    ml.phone,
    ml.business_hours,
    ST_Y(ml.location::geometry) AS latitude,
    ST_X(ml.location::geometry) AS longitude,
    ROUND((ST_Distance(
      ml.location,
      ST_SetSRID(ST_MakePoint(user_lng, user_lat), 4326)::geography
    ) / 1000)::numeric, 2)::FLOAT AS distance_km,
    EXISTS (
      SELECT 1 FROM merchant_bookmarks mb
      WHERE mb.merchant_id = ml.merchant_id
        AND mb.profile_id = auth.uid()
    ) AS is_bookmarked
  FROM merchant_locations ml
  JOIN merchant_entities me ON me.id = ml.merchant_id
  WHERE ml.status = 'active'
    AND me.status = 'active'
    AND ST_DWithin(
      ml.location,
      ST_SetSRID(ST_MakePoint(user_lng, user_lat), 4326)::geography,
      current_radius * 1000
    )
  ORDER BY distance_km
  LIMIT result_limit;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

#### 定位授權降級策略

```
用戶打開找店頁面
├── 請求精確定位權限
│   ├── 授權 → 使用 GPS 坐標查詢附近門店
│   └── 拒絕 → 顯示手動選區界面
│       ├── 港島
│       ├── 九龍
│       ├── 新界
│       └── 離島
│       └── 選中後以該區中心點座標查詢，半徑自動放大到覆蓋全區
└── GPS 漂移處理
    ├── 如果定位結果在海面上（離最近陸地 > 500m）→ 視為無效，觸發手動選區
    └── 定位精度 > 1000m → 提示用戶定位不精確，建議手動選區
```

### 6.2 媒體上傳安全鏈路

#### 完整流程

```
┌──────────────┐     ┌──────────────────┐     ┌────────────────┐
│   客戶端      │     │  Edge Function   │     │  Supabase      │
│   (App)      │     │  (服務端)         │     │  Storage       │
└──────┬───────┘     └────────┬─────────┘     └───────┬────────┘
       │                      │                        │
       │  1. 選擇多張圖片     │                        │
       │  2. 本地生成縮略圖    │                        │
       │     用於即時預覽      │                        │
       │                      │                        │
       │  3. POST /create-upload-intent               │
       │     { count: 3, purpose: 'post_media' }      │
       │ ─────────────────────>│                        │
       │                      │  4. 建立 media_uploads │
       │                      │     記錄（pending）     │
       │                      │  5. 生成預簽名 URL      │
       │  6. 返回 upload_intents                       │
       │     [{ id, object_path, signed_url }, ...]    │
       │ <─────────────────────│                        │
       │                      │                        │
       │  7. 客戶端壓縮圖片                             │
       │     (expo-image-manipulator)                   │
       │     max 1920px, quality 0.8                   │
       │                      │                        │
       │  8. 逐張上傳到 signed_url ──────────────────────>│
       │     (失敗自動重試，最多 3 次)                    │
       │                      │                        │
       │  9. 全部上傳完成後                              │
       │     POST /finalize-post                       │
       │     { content, upload_ids, product_ids? }     │
       │ ─────────────────────>│                        │
       │                      │ 10. 校驗 upload 歸屬    │
       │                      │     確認檔案已存在       │
       │                      │ 11. 建立 posts 記錄     │
       │                      │ 12. 建立 post_media     │
       │                      │ 13. 標記 uploads 為     │
       │                      │     verified            │
       │  14. 返回完整帖子數據  │                        │
       │ <─────────────────────│                        │
       │                      │                        │
```

**安全要點**：
- 客戶端**永遠不直接寫** `post_media` 表
- `finalize-post` 會校驗：upload 歸屬當前用戶、檔案確實存在於 Storage、未過期
- 過期未使用的 `media_uploads` 由定時任務清理

#### 圖片壓縮規則

| 場景 | 最大尺寸 | 質量 | 格式 |
|---|---|---|---|
| 帖子圖片 | 1920px (長邊) | 0.8 | JPEG |
| 縮略圖 | 400px (長邊) | 0.6 | JPEG |
| 頭像 | 512px | 0.8 | JPEG |
| 商戶 Logo | 1024px | 0.9 | PNG (保留透明) |

### 6.3 Feed 分頁策略

#### 游標分頁（嚴格時間倒序）

```sql
-- Feed 查詢 RPC
CREATE OR REPLACE FUNCTION get_feed(
  cursor_created_at TIMESTAMPTZ DEFAULT NULL,
  cursor_id UUID DEFAULT NULL,
  page_size INT DEFAULT 20
)
RETURNS TABLE (
  id UUID,
  author_profile_id UUID,
  author_nickname TEXT,
  author_avatar_url TEXT,
  acting_merchant_id UUID,
  merchant_name TEXT,
  is_official BOOLEAN,
  content TEXT,
  created_at TIMESTAMPTZ,
  like_count BIGINT,
  comment_count BIGINT,
  is_liked BOOLEAN,
  is_bookmarked BOOLEAN,
  media JSONB
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    p.id,
    p.author_profile_id,
    pr.nickname AS author_nickname,
    pr.avatar_url AS author_avatar_url,
    p.acting_merchant_id,
    me.name AS merchant_name,
    p.is_official,
    p.content,
    p.created_at,
    (SELECT COUNT(*) FROM post_likes pl WHERE pl.post_id = p.id) AS like_count,
    (SELECT COUNT(*) FROM post_comments pc
     WHERE pc.post_id = p.id AND pc.status = 'visible') AS comment_count,
    EXISTS (
      SELECT 1 FROM post_likes pl
      WHERE pl.post_id = p.id AND pl.profile_id = auth.uid()
    ) AS is_liked,
    EXISTS (
      SELECT 1 FROM post_bookmarks pb
      WHERE pb.post_id = p.id AND pb.profile_id = auth.uid()
    ) AS is_bookmarked,
    (
      SELECT jsonb_agg(jsonb_build_object(
        'id', pm.id,
        'original_url', pm.original_url,
        'thumbnail_url', pm.thumbnail_url,
        'width', pm.width,
        'height', pm.height
      ) ORDER BY pm.sort_order)
      FROM post_media pm WHERE pm.post_id = p.id
    ) AS media
  FROM posts p
  JOIN profiles pr ON pr.id = p.author_profile_id
  LEFT JOIN merchant_entities me ON me.id = p.acting_merchant_id
  WHERE p.status = 'published'
    AND p.deleted_at IS NULL
    -- 排除被拉黑的用戶
    AND NOT EXISTS (
      SELECT 1 FROM blocks b
      WHERE b.blocker_id = auth.uid() AND b.blocked_profile_id = p.author_profile_id
    )
    -- 游標條件
    AND (
      cursor_created_at IS NULL
      OR (p.created_at, p.id) < (cursor_created_at, cursor_id)
    )
  ORDER BY p.created_at DESC, p.id DESC
  LIMIT page_size;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;
```

**React Query 端配置**：

```typescript
// 使用 useInfiniteQuery 實現無限滾動
const feedQuery = useInfiniteQuery({
  queryKey: queryKeys.posts.feed(),
  queryFn: ({ pageParam }) => supabase.rpc('get_feed', {
    cursor_created_at: pageParam?.created_at ?? null,
    cursor_id: pageParam?.id ?? null,
    page_size: 20,
  }),
  getNextPageParam: (lastPage) => {
    if (!lastPage.data || lastPage.data.length < 20) return undefined;
    const last = lastPage.data[lastPage.data.length - 1];
    return { created_at: last.created_at, id: last.id };
  },
  staleTime: 30 * 1000,  // 30 秒
});
```

**MVP 階段排序規則**：嚴格時間倒序。不做「關注優先 + 地域補充」混排，避免游標分頁失效。混排策略留到 Phase 2。

### 6.4 點讚/評論冪等防護

#### 點讚

```typescript
// 樂觀更新 + 冪等
const likeMutation = useMutation({
  mutationFn: async (postId: string) => {
    // 使用 UPSERT 語義，天然冪等（聯合主鍵約束）
    const { error } = await supabase
      .from('post_likes')
      .upsert({ post_id: postId, profile_id: userId }, {
        onConflict: 'post_id,profile_id',
        ignoreDuplicates: true,
      });
    if (error) throw error;
  },
  onMutate: async (postId) => {
    // 取消正在進行的查詢
    await queryClient.cancelQueries({ queryKey: queryKeys.posts.feed() });
    // 快照
    const prev = queryClient.getQueryData(queryKeys.posts.feed());
    // 樂觀更新
    queryClient.setQueryData(queryKeys.posts.feed(), (old) => {
      // 更新對應帖子的 is_liked 和 like_count
      return updatePostInPages(old, postId, { is_liked: true, like_count: +1 });
    });
    return { prev };
  },
  onError: (_err, _postId, context) => {
    // 回滾
    queryClient.setQueryData(queryKeys.posts.feed(), context?.prev);
  },
});
```

#### 評論

```typescript
// 防止弱網雙擊：客戶端生成 idempotency key
const commentMutation = useMutation({
  mutationFn: async ({ postId, content, idempotencyKey }) => {
    const { error } = await supabase.functions.invoke('create-comment', {
      body: { post_id: postId, content, idempotency_key: idempotencyKey },
    });
    if (error) throw error;
  },
  // ... 樂觀更新同上
});
```

Edge Function 端用 `idempotency_key` 去重：

```sql
-- 評論表增加冪等鍵
ALTER TABLE post_comments ADD COLUMN idempotency_key TEXT;
CREATE UNIQUE INDEX idx_comments_idempotency ON post_comments (profile_id, idempotency_key)
  WHERE idempotency_key IS NOT NULL;
```

### 6.5 國際化 (i18n)

#### 方案

```
apps/mobile/i18n/
├── config.ts          # i18next 初始化
├── locales/
│   ├── zh-Hant.json   # 繁體中文（主語言）
│   └── en.json        # 英文（系統文案）
└── hooks/
    └── useTranslation.ts  # 封裝 hook
```

**規則**：
- 所有 UI 文案通過 `t('key')` 引用，不硬編碼中文字串
- 首發以繁中為主，關鍵系統文案（按鈕、導航、錯誤提示）補英文
- 用戶 UGC（帖子、評論）不做翻譯
- 商戶填寫的內容（品牌故事、門店名）不做翻譯
- 語言切換放在個人設置頁，默認跟隨系統語言

### 6.6 Deep Link / Universal Link

#### Phase 0 就必須配置

**URL 方案**：
```
https://yourwinebook.app/post/{postId}     → 帖子詳情
https://yourwinebook.app/store/{storeId}   → 門店詳情
https://yourwinebook.app/invite/{code}     → 邀請註冊
```

**Expo 配置**（`app.json`）：
```json
{
  "expo": {
    "scheme": "yourwinebook",
    "ios": {
      "associatedDomains": ["applinks:yourwinebook.app"]
    },
    "android": {
      "intentFilters": [{
        "action": "VIEW",
        "autoVerify": true,
        "data": [{ "scheme": "https", "host": "yourwinebook.app" }],
        "category": ["BROWSABLE", "DEFAULT"]
      }]
    }
  }
}
```

**服務端**：
- 在 `yourwinebook.app` 域名下放置 `/.well-known/apple-app-site-association` 和 `/.well-known/assetlinks.json`
- 未安裝 App 時 fallback 到 App Store / Google Play 下載頁

### 6.7 推送通知

**定位**：Phase 1C Beta 增強項，不作為首發阻塞項。

**技術方案**：
- 使用 Expo Push Notifications
- 服務端使用 Expo Push API 發送
- MVP 只推送以下場景：
  - 你的帖子被點讚
  - 你的帖子收到評論
  - 審核結果通知（帖子被隱藏/恢復）
  - 系統公告

---

## 七、權限與安全設計

### 7.1 權限判定原則

```
權限判定優先級：
1. merchant_staff 表 → 判斷是否為某商戶的員工及其角色
2. 管理員列表（可用 profiles 中的 flag 或獨立表）→ 判斷是否為管理員
3. auth.uid() → 判斷是否為資源所有者
4. profiles.default_role → 僅用於 UI 展示，不用於權限判斷
```

### 7.2 RLS 策略設計

```sql
-- ============================================================
-- profiles RLS
-- ============================================================
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- 所有人可讀公開檔案
CREATE POLICY "profiles_select" ON profiles FOR SELECT USING (true);

-- 只能改自己的
CREATE POLICY "profiles_update" ON profiles FOR UPDATE
  USING (id = auth.uid())
  WITH CHECK (id = auth.uid());

-- ============================================================
-- merchant_locations RLS
-- ============================================================
ALTER TABLE merchant_locations ENABLE ROW LEVEL SECURITY;

-- 所有人可讀活躍門店
CREATE POLICY "locations_select" ON merchant_locations FOR SELECT
  USING (status = 'active');

-- 只有該商戶的 manager/owner 可以改
CREATE POLICY "locations_update" ON merchant_locations FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM merchant_staff ms
      WHERE ms.profile_id = auth.uid()
        AND ms.merchant_id = merchant_locations.merchant_id
        AND ms.role IN ('owner', 'manager')
        AND ms.status = 'active'
    )
  );

-- ============================================================
-- posts RLS
-- ============================================================
ALTER TABLE posts ENABLE ROW LEVEL SECURITY;

-- 讀取已發佈的帖子（排除被拉黑的用戶 — 在 RPC 中處理更高效）
CREATE POLICY "posts_select" ON posts FOR SELECT
  USING (status = 'published' AND deleted_at IS NULL);

-- 只能改自己的帖子
CREATE POLICY "posts_update" ON posts FOR UPDATE
  USING (author_profile_id = auth.uid());

-- ============================================================
-- post_likes RLS
-- ============================================================
ALTER TABLE post_likes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "likes_select" ON post_likes FOR SELECT USING (true);
CREATE POLICY "likes_insert" ON post_likes FOR INSERT
  WITH CHECK (profile_id = auth.uid());
CREATE POLICY "likes_delete" ON post_likes FOR DELETE
  USING (profile_id = auth.uid());
```

### 7.3 敏感寫操作收歸 Edge Functions

以下操作**不通過客戶端直連**，統一由 Edge Functions 處理：

| 操作 | Edge Function | 原因 |
|---|---|---|
| 官方身份發帖 | `finalize-post` | 需校驗 merchant_staff 關係 |
| 上傳意圖建立 | `create-upload-intent` | 需生成預簽名 URL |
| 上傳確認+發帖 | `finalize-post` | 需校驗上傳歸屬 |
| 審核下架 | `moderate-content` | 需校驗管理員身份 |
| 封禁帳號 | `ban-user` | 需校驗管理員身份 |
| 評論建立 | `create-comment` | 需做冪等校驗和頻率限制 |

### 7.4 頻率限制（Rate Limiting）

在 Edge Functions 中實現，使用 Supabase 的 KV 或 Redis 計數：

| 操作 | 限制 | 窗口 |
|---|---|---|
| 發帖 | 10 次 | 每小時 |
| 評論 | 30 次 | 每小時 |
| 點讚 | 100 次 | 每小時 |
| 舉報 | 10 次 | 每天 |
| 上傳 | 50 張 | 每天 |

### 7.5 RLS 集成測試

Phase 0 必須編寫的測試場景：

```
✅ 普通用戶只能修改自己的 profile
✅ 普通用戶只能刪除自己的帖子
✅ 普通用戶無法修改他人帖子
✅ 商戶 staff 只能修改自家門店
✅ 商戶 staff 無法修改其他商戶門店
✅ 商戶 owner 可以管理自家員工
✅ 管理員可以隱藏任何帖子
✅ 管理員可以封禁用戶
✅ 被封禁用戶無法發帖/評論
✅ 被拉黑用戶的內容在 Feed 中不可見
```

---

## 八、分階段執行路線圖

### 總覽

```
Week 1    Week 2    Week 3    Week 4    Week 5    Week 6    Week 7    Week 8    Week 9    Week 10
|---------|---------|---------|---------|---------|---------|---------|---------|---------|---------|
|←─ Phase 0a ─→|←──── Phase 0b ────→|←──── Phase 1A ────→|←──────── Phase 1B ────────→|← 1C ──→|
|  項目骨架     |  底座與後台         |  找店 MVP           |  社區 MVP                   | 加固   |
|  1.5 週       |  2 週              |  2 週               |  3 週                       | 1.5-2週|
```

**串行總排期**：約 10–11 週（小團隊 1–2 前端 + 1 後端）
**有並行能力**：約 8–9 週（Phase 1A 和 1B 部分並行）

---

### Phase 0a：項目骨架（1–1.5 週）

**目標**：搭建雙端開發環境，確保 monorepo 構建鏈路跑通。

| 任務 | 產出物 | 驗收條件 |
|---|---|---|
| 初始化 pnpm + Turborepo monorepo | 項目骨架代碼 | `pnpm install` + `pnpm build` 通過 |
| 建立 Expo Development Build | `apps/mobile` 可在模擬器運行 | iOS/Android 模擬器正常啟動 |
| 確認 Next.js App 在 monorepo 中正常 | `apps/web` 可 `dev` 和 `build` | `pnpm --filter web dev` 正常 |
| 建立共享包 `packages/domain` | 類型、常量可跨端 import | 雙端都能 `import { PostStatus } from '@ywb/domain'` |
| 配置 Metro monorepo 解析 | `metro.config.js` | Expo 能正確解析 workspace packages |
| 接入 Sentry | 崩潰監控 | 觸發一個測試異常能在 Sentry 看到 |
| 接入 PostHog | 行為埋點 | 發送一個測試事件能在 PostHog 看到 |
| 接入 i18next | 國際化框架 | 切換語言 UI 文案跟著變 |
| 配置 Deep Link scheme | `app.json` + `.well-known` 文件 | `yourwinebook://post/123` 能喚起 App |
| 建立 Schema V1 遷移文件 | `supabase/migrations/` | `supabase db reset` 能建出所有表 |
| 配置基礎 RLS 策略 | RLS policies | RLS 集成測試通過 |
| 建立 CI 流水線 | `.github/workflows/ci.yml` | PR 提交觸發 lint + type-check |

---

### Phase 0b：底座與後台（2 週）

**目標**：上傳鏈路、審核後台、種子數據導入可用。

| 任務 | 產出物 | 驗收條件 |
|---|---|---|
| 啟用 PostGIS 擴展 | 空間索引可用 | `ST_DWithin` 查詢返回正確結果 |
| 啟用 Supabase Storage | Bucket 配置 | 文件可上傳到指定 bucket |
| 開發 `create-upload-intent` Edge Function | 上傳意圖 API | 返回預簽名 URL，可成功上傳 |
| 開發 `finalize-post` Edge Function | 發帖確認 API | 上傳 + 發帖完整鏈路跑通 |
| App 端圖片選擇 + 壓縮 | 上傳 SDK 封裝 | 選 3 張圖 → 壓縮 → 上傳 → 確認，全流程成功 |
| 開發審核後台 — 舉報隊列頁 | Web 頁面 | 管理員可看到所有待處理舉報 |
| 開發審核後台 — 一鍵隱藏帖子/評論 | Web 操作 | 點擊後帖子 status 變為 hidden，客戶端不可見 |
| 開發審核後台 — 封禁帳號 | Web 操作 | 封禁後該用戶無法登入/發帖 |
| 開發數據導入工具 — 商戶+門店 | Web 頁面或腳本 | 管理員可批量導入 CSV 格式的商戶和門店數據 |
| 開發數據導入工具 — 酒款 | Web 頁面或腳本 | 管理員可導入酒款主數據 |
| 建立 TestFlight / Internal Testing 通道 | EAS Build 配置 | 可分發測試版本給內測用戶 |
| 配置 React Query 離線持久化 | `persistQueryClient` | 斷網後重開 App 能看到上次數據 |

---

### Phase 1A：找店 MVP（2 週）

**目標**：跑通閉環 1（定位 → 找店 → 收藏 → 導航）。

| 任務 | 產出物 | 驗收條件 |
|---|---|---|
| B端 — 門店基本信息編輯 | Web 頁面 | 商戶可修改門店名稱、地址、電話 |
| B端 — 結構化營業時間編輯 | Web 組件 | 可設定每日營業時間，保存為結構化 JSON |
| B端 — 地圖拖拽校準坐標 | Web 組件 (Mapbox GL 或 Google Maps) | 拖拽圖釘後座標更新到 `merchant_locations.location` |
| C端 — 定位授權流程 | App 頁面 | 授權後獲取 GPS 坐標；拒絕後顯示手動選區 |
| C端 — 手動選區降級 | App 組件 | 選擇「港島/九龍/新界/離島」後按區域中心查詢 |
| 開發 `get_nearby_stores` RPC | 數據庫函數 | 自動擴圈查詢返回正確結果 |
| C端 — 附近門店列表頁 | App 頁面 (FlashList) | 分兩區：收藏的附近門店 + 所有附近門店 |
| C端 — 門店卡片組件 | App 組件 | 展示名稱、地址、距離、營業狀態、收藏按鈕 |
| C端 — 營業狀態計算 | 前端邏輯 | 根據 business_hours + 當前時間顯示「營業中/已打烊」 |
| C端 — 門店詳情頁 | App 頁面 | 展示完整信息、地圖、收藏、導航按鈕 |
| C端 — 收藏/取消收藏門店 | App 功能 | 樂觀更新，列表立刻響應 |
| C端 — 外部導航 Deep Link | App 功能 | 點擊導航按鈕喚起 Apple Maps / Google Maps |

---

### Phase 1B：社區 MVP（3 週）

**目標**：跑通閉環 2（瀏覽 Feed → 發帖 → 互動 → 審核）。

#### 第 1 週：Feed + 帖子展示

| 任務 | 產出物 | 驗收條件 |
|---|---|---|
| 開發 `get_feed` RPC | 數據庫函數 | 游標分頁返回正確結果，排除被拉黑用戶 |
| C端 — 單列 Feed 頁面 | App 頁面 (FlashList) | 時間倒序，上拉加載下一頁 |
| C端 — 帖子卡片組件 | App 組件 | 展示頭像、暱稱、官方標識、內容、圖片、點讚/評論數 |
| C端 — 圖片預覽組件 | App 組件 | 多圖佈局（1/2/3/4+）、點擊放大、左右滑動 |
| C端 — 帖子詳情頁 | App 頁面 | 完整內容、評論列表、關聯酒款 |
| C端 — 下拉刷新 | App 功能 | 下拉觸發重新加載最新數據 |

#### 第 2 週：發帖 + 互動

| 任務 | 產出物 | 驗收條件 |
|---|---|---|
| C端 — 發帖頁面 | App 頁面 | 文字輸入 + 多圖選擇（至多 9 張） |
| C端 — 圖片預覽 + 排序 + 刪除 | App 組件 | 可預覽縮略圖、拖拽排序、點擊刪除 |
| C端 — 上傳進度條 | App 組件 | 顯示每張圖的上傳進度，總體進度 |
| C端 — 上傳失敗自動重試 | App 邏輯 | 單張失敗自動重試 3 次，仍失敗提示用戶 |
| C端 — 關聯酒款（可選） | App 組件 | 可搜索選擇酒款，關聯到帖子 |
| C端 — 官方身份發帖 | App 功能 | 商戶員工可切換為官方身份發帖 |
| C端 — 點讚 | App 功能 | 樂觀更新，冪等防護 |
| C端 — 評論列表 + 發評論 | App 功能 | 游標分頁，冪等防護，樂觀更新 |
| C端 — 帖子收藏 | App 功能 | 收藏/取消收藏帖子 |
| 開發 `create-comment` Edge Function | 服務端 | 冪等校驗 + 頻率限制 |

#### 第 3 週：防護體系 + 個人中心

| 任務 | 產出物 | 驗收條件 |
|---|---|---|
| C端 — 舉報功能（帖子/評論/用戶） | App 組件 | 選擇原因 → 提交 → reports 表寫入 |
| C端 — 拉黑/屏蔽用戶 | App 功能 | 拉黑後對方內容不出現在 Feed |
| C端 — 個人中心頁 | App 頁面 | 我的帖子、我的收藏、我的關注、設置 |
| C端 — 用戶主頁 | App 頁面 | 他人的帖子列表、關注按鈕 |
| C端 — 關注/取消關注 | App 功能 | 樂觀更新 |
| C端 — 設置頁 | App 頁面 | 語言切換、登出、版本信息 |
| B端 — 官方發帖入口 | Web 頁面 | 商戶員工可在 Web 後台發帖 |
| 端到端測試 | 測試報告 | 發帖 → Feed 可見 → 點讚 → 評論 → 舉報 → 管理員下架，全流程通暢 |

---

### Phase 1C：上線加固（1.5–2 週）

**目標**：解決邊界情況，為灰度發佈做準備。

| 任務 | 產出物 | 驗收條件 |
|---|---|---|
| 草稿箱功能 | App 功能 | 退出發帖頁自動保存草稿，重新進入可恢復 |
| 弱網上傳恢復 | App 功能 | 網絡恢復後自動繼續上傳 |
| 頻率限制全面部署 | Edge Functions | 超頻返回 429，客戶端提示「操作過於頻繁」 |
| 過期上傳清理 | 定時任務/Cron | 超過 1 小時未完成的上傳意圖標記為 expired，Storage 清理 |
| 邀請碼機制 | 功能 | 註冊需輸入邀請碼，管理員可生成/管理邀請碼 |
| 灰度發佈配置 | EAS Build | TestFlight 分發 iOS，Internal Testing 分發 Android |
| 埋點校驗 | 報告 | PostHog 中可看到完整的五個核心漏斗 |
| Sentry 告警規則 | 配置 | 崩潰率 > 1% 或關鍵 API 錯誤率 > 5% 觸發告警 |
| 性能基線測量 | 報告 | 冷啟動 TTI 測量結果記錄 |
| Push 通知（Beta） | App 功能 | 點讚、評論、審核結果推送可選接入 |
| 合規文本 | 法律文件 | 用戶協議、隱私政策、年齡確認門檻（18+） |

---

### Phase 2：體驗增強（上線驗證數據後啟動，不在本文檔排期內）

- 高級地圖整合（Mapbox 自定義品牌色地圖、App 內路線）
- 瀑布流佈局升級
- 話題標籤 (Hashtags) + 熱榜
- 站內通知中心（點讚/評論未讀提醒）
- 受控 IM（用戶向商戶諮詢的聊天室）
- 關注優先 + 地域推薦混排 Feed

### Phase 3：商業化與壁壘（中長期規劃）

- 短視頻流處理與 CDN
- 智能推薦算法
- KOL / 達人認證系統
- AR 實景找店

---

## 九、任務拆解清單

以下是完整的、可直接分配的任務列表，按 Phase 和依賴關係排列。每個任務標記了前置依賴和交付產出。

### Phase 0a 任務清單

```
ID    任務                                    前置依賴    預估工時    負責角色
─────────────────────────────────────────────────────────────────────────────
0a-01 初始化 pnpm workspace + Turborepo       無          2h         前端
0a-02 建立 apps/mobile Expo 項目              0a-01       3h         前端
0a-03 配置 Metro monorepo 解析                0a-02       2h         前端
0a-04 確認 apps/web Next.js 正常              0a-01       1h         前端
0a-05 建立 packages/domain 共享包             0a-01       2h         前端
0a-06 建立 packages/query-keys               0a-05       1h         前端
0a-07 建立 packages/supabase-types           0a-01       1h         前端/後端
0a-08 驗證跨端 import                         0a-03,05    1h         前端
0a-09 接入 Sentry (Mobile + Web)              0a-02,04    3h         前端
0a-10 接入 PostHog                            0a-02,04    2h         前端
0a-11 接入 i18next + 翻譯資源結構             0a-02       3h         前端
0a-12 配置 Deep Link scheme                   0a-02       2h         前端
0a-13 編寫 Schema V1 遷移文件                 無          4h         後端
0a-14 配置基礎 RLS 策略                       0a-13       4h         後端
0a-15 編寫 RLS 集成測試                       0a-14       4h         後端
0a-16 建立 CI 流水線                          0a-01       2h         前端/DevOps
0a-17 建立 Auth Provider (Mobile)             0a-02       3h         前端
0a-18 建立 Auth Provider (Web)                0a-04       2h         前端
0a-19 配置 React Query + persistQueryClient   0a-02       2h         前端
```

### Phase 0b 任務清單

```
ID    任務                                    前置依賴        預估工時    負責角色
─────────────────────────────────────────────────────────────────────────────────
0b-01 啟用 PostGIS 擴展 + 驗證                0a-13           1h         後端
0b-02 配置 Supabase Storage bucket            0a-13           1h         後端
0b-03 開發 create-upload-intent EF            0b-02           4h         後端
0b-04 開發 finalize-post EF                   0b-03           6h         後端
0b-05 App 端圖片選擇封裝                      0a-02           3h         前端
0b-06 App 端圖片壓縮封裝                      0b-05           3h         前端
0b-07 App 端上傳 SDK（含重試）                0b-03,06        4h         前端
0b-08 上傳全流程端到端驗證                    0b-04,07        2h         全棧
0b-09 審核後台 — 舉報隊列頁                   0a-04,14        6h         前端(Web)
0b-10 審核後台 — 一鍵隱藏帖子/評論            0b-09           3h         前端(Web)
0b-11 審核後台 — 封禁帳號                     0b-09           3h         前端(Web)/後端
0b-12 開發 moderate-content EF                0a-14           4h         後端
0b-13 數據導入 — 商戶+門店批量導入            0a-04,0b-01     6h         前端(Web)/後端
0b-14 數據導入 — 酒款批量導入                 0a-04,13        4h         前端(Web)/後端
0b-15 配置 EAS Build + TestFlight 通道        0a-02           3h         前端/DevOps
0b-16 導入首批種子數據                        0b-13,14        運營配合   運營+後端
```

### Phase 1A 任務清單

```
ID    任務                                    前置依賴        預估工時    負責角色
─────────────────────────────────────────────────────────────────────────────────
1a-01 B端門店基本信息編輯頁                   0b-13           4h         前端(Web)
1a-02 B端結構化營業時間編輯組件               1a-01           4h         前端(Web)
1a-03 B端地圖拖拽校準坐標組件                 1a-01           6h         前端(Web)
1a-04 開發 get_nearby_stores RPC              0b-01           4h         後端
1a-05 C端定位授權流程                         0a-17           3h         前端(Mobile)
1a-06 C端手動選區降級                         1a-05           2h         前端(Mobile)
1a-07 C端門店卡片組件                         0a-11           3h         前端(Mobile)
1a-08 C端營業狀態計算邏輯                     0a-05           2h         前端
1a-09 C端附近門店列表頁                       1a-04,05,07     6h         前端(Mobile)
1a-10 C端門店詳情頁                           1a-07,08        4h         前端(Mobile)
1a-11 C端收藏/取消收藏門店                    1a-09           3h         前端(Mobile)
1a-12 C端外部導航 Deep Link                   1a-10           2h         前端(Mobile)
1a-13 找店閉環端到端測試                      1a-01~12        3h         QA/全棧
```

### Phase 1B 任務清單

```
ID    任務                                    前置依賴        預估工時    負責角色
─────────────────────────────────────────────────────────────────────────────────
-- 第 1 週：Feed + 帖子展示
1b-01 開發 get_feed RPC                       0a-14           4h         後端
1b-02 C端帖子卡片組件                         0a-11           4h         前端(Mobile)
1b-03 C端圖片預覽組件（多圖佈局+放大）        1b-02           4h         前端(Mobile)
1b-04 C端單列 Feed 頁面                       1b-01,02        6h         前端(Mobile)
1b-05 C端帖子詳情頁                           1b-02,03        4h         前端(Mobile)
1b-06 C端下拉刷新                             1b-04           1h         前端(Mobile)

-- 第 2 週：發帖 + 互動
1b-07 C端發帖頁面（文字+選圖）                0b-07           6h         前端(Mobile)
1b-08 C端圖片預覽+排序+刪除                   1b-07           3h         前端(Mobile)
1b-09 C端上傳進度條                           1b-07           2h         前端(Mobile)
1b-10 C端關聯酒款選擇                         0b-14           3h         前端(Mobile)
1b-11 C端官方身份切換                         0a-17           3h         前端(Mobile)
1b-12 C端點讚功能                             1b-02           3h         前端(Mobile)
1b-13 開發 create-comment EF                  0a-14           4h         後端
1b-14 C端評論列表+發評論                      1b-05,13        5h         前端(Mobile)
1b-15 C端帖子收藏                             1b-02           2h         前端(Mobile)

-- 第 3 週：防護 + 個人中心
1b-16 C端舉報功能（帖子/評論/用戶）           1b-05           4h         前端(Mobile)
1b-17 C端拉黑/屏蔽用戶                        1b-04           3h         前端(Mobile)
1b-18 C端個人中心頁                           0a-17           4h         前端(Mobile)
1b-19 C端用戶主頁                             1b-02           4h         前端(Mobile)
1b-20 C端關注/取消關注                        1b-19           2h         前端(Mobile)
1b-21 C端設置頁（語言/登出/版本）             0a-11,17        3h         前端(Mobile)
1b-22 B端官方發帖入口                         0b-04           4h         前端(Web)
1b-23 社區閉環端到端測試                      1b-01~22        4h         QA/全棧
```

### Phase 1C 任務清單

```
ID    任務                                    前置依賴        預估工時    負責角色
─────────────────────────────────────────────────────────────────────────────────
1c-01 草稿箱功能（本地持久化）                1b-07           4h         前端(Mobile)
1c-02 弱網上傳恢復                            0b-07           3h         前端(Mobile)
1c-03 頻率限制中間件部署                      0b-03,04,1b-13  4h         後端
1c-04 過期上傳清理定時任務                    0b-03           2h         後端
1c-05 邀請碼機制（生成+註冊校驗）             0a-17           4h         全棧
1c-06 灰度分發配置+內測                       0b-15           3h         前端/DevOps
1c-07 PostHog 埋點校驗（5個漏斗）             0a-10           3h         前端
1c-08 Sentry 告警規則配置                     0a-09           1h         DevOps
1c-09 冷啟動 TTI 性能測量                     1a-09           2h         前端
1c-10 合規文本（用戶協議/隱私/年齡門檻）      無              運營配合   產品/法務
1c-11 Push 通知接入（Beta，可延後）           0a-02           6h         前端(Mobile)/後端
1c-12 最終回歸測試                            全部            4h         QA/全棧
```

---

## 十、驗收標準

### 10.1 性能指標

| 指標 | 目標值 | 測量方式 |
|---|---|---|
| 冷啟動 TTI | ≤ 3s (4G 網絡) | 從點擊圖標到「附近門店列表」首屏可交互 |
| 熱啟動 TTI | ≤ 1s | 從後台切回到數據可見 |
| Feed 滾動幀率 | ≥ 55fps | FlashList 內建性能監控 |
| 圖片壓縮耗時 | ≤ 2s / 張 | 客戶端日誌 |

### 10.2 穩定性指標

| 指標 | 目標值 | 測量方式 |
|---|---|---|
| 多圖發帖成功率 | > 98% (1–9 張) | PostHog 發帖漏斗 |
| App 崩潰率 | < 1% | Sentry |
| API 錯誤率 | < 2% | Sentry / PostHog |
| 上傳失敗率 | < 5% | 服務端日誌 |

### 10.3 業務指標

| 指標 | 目標值 | 測量方式 |
|---|---|---|
| 審核 SLA | 管理員可在 60s 內隱藏違規內容 | 操作日誌 |
| 內容即時生效 | 隱藏後所有客戶端立刻不可見 | 端到端測試 |
| 商戶自服務 | 獨立完成營業時間修改+座標校準 | B端操作日誌 |

### 10.4 數據可觀測

必須在 PostHog 看到以下五個核心漏斗：

1. **定位授權率** (%) — 打開找店頁 → 同意定位
2. **外部導航點擊率** (%) — 查看門店 → 點擊導航
3. **發帖漏斗** — 點擊發佈 → 選圖 → 填寫內容 → 上傳完成 → 發帖成功
4. **互動率** (%) — 曝光帖子 → 點讚/評論/收藏
5. **留存** — D1 / D7 回訪率

額外工程指標：
- **上傳失敗率** — 按圖片數量、網絡類型分組
- **審核處理時長** — 從舉報提交到審核完成

---

## 十一、風險登記與應對

| # | 風險 | 影響 | 概率 | 應對措施 |
|---|---|---|---|---|
| R1 | Phase 0 排期溢出（RLS 策略複雜度超預期） | 整體延後 1–2 週 | 高 | 先做最小 RLS（讀公開+改自己），複雜寫操作走 Edge Function |
| R2 | 冷啟動內容不足，社區閉環驗證不了 | MVP 上線無意義 | 高 | 上線前 2 週啟動種子內容生產，團隊內部先跑 2 週 |
| R3 | GPS 漂移導致門店定位不準 | 用戶投訴、信任受損 | 中 | B端拖拽校準 + 客戶端異常檢測（海面/精度差） |
| R4 | 酒類合規要求（年齡門檻、內容限制） | App Store 拒審 | 中 | Phase 1C 前完成合規文本、年齡門檻、內容政策 |
| R5 | Metro monorepo 配置踩坑 | 開發環境無法啟動 | 中 | Phase 0a 第一優先級解決，必要時 fallback 到非 monorepo |
| R6 | UGC 違規內容（色情/廣告/引流） | App Store 下架 | 中 | 審核後台前置到 Phase 0b，舉報+拉黑是上線必備 |
| R7 | 圖片上傳 OOM | App 崩潰 | 中 | 嚴格控制壓縮規格，逐張上傳不並行，監控內存 |
| R8 | 「外部導航點擊率」≠ 真實到店 | 數據誤導決策 | 低 | 認知對齊：這是代理指標，不等於轉化。後期考慮門店打卡 |
| R9 | 商戶自服務意願低，早期不願自己維護 | 數據更新滯後 | 中 | 首期由平台代運營，invite-only 控制 B端複雜度 |

---

## 附錄：技術選型決策記錄

### A1. 為什麼 C 端選 Expo / React Native 而非 Flutter 或原生

| 因素 | Expo/RN | Flutter | 原生 (Swift+Kotlin) |
|---|---|---|---|
| 與現有 Next.js 技術棧一致性 | ✅ 同為 JS/TS 生態 | ❌ Dart | ❌ 需兩套語言 |
| 共享業務邏輯可行性 | ✅ packages/ 直接共享 | ❌ 需要橋接 | ❌ 無法共享 |
| 招聘難度（香港市場） | 較容易 | 較難 | 需兩組人 |
| 原生性能 | 足夠（FlashList 解決列表問題） | 更好 | 最好 |
| 開發效率 | 高 | 高 | 低 |

**結論**：技術棧一致性和共享邏輯是首要考量，Expo/RN 是最合理選擇。

### A2. 為什麼 Feed 不用瀑布流

| 因素 | 單列信息流 | 瀑布流 |
|---|---|---|
| 渲染複雜度 | 低，FlashList 直接支持 | 高，需自行計算瀑布佈局 |
| 掉幀風險 | 低 | 高（大圖混排 + 高度不一） |
| 開發工時 | 1 週 | 2–3 週 |
| MVP 驗證價值 | 相同 | 相同 |

**結論**：MVP 唯一目標是驗證社區閉環是否成立。佈局形式不影響驗證結果，選開發成本最低的。

### A3. 為什麼上傳不直接讓客戶端寫 post_media

**安全風險**：
- 客戶端可偽造 `original_url` 指向任意外部圖片（含違規內容）
- 客戶端可偽造 `width`/`height` 導致佈局異常
- 客戶端可跳過壓縮直接上傳超大文件

**受控鏈路方案**：
- 服務端生成上傳路徑和預簽名 URL（控制命名和存儲位置）
- 服務端校驗上傳歸屬和檔案存在（防偽造）
- 服務端寫 `post_media` 記錄（保證數據一致性）

### A4. 為什麼 Auth 不放 Zustand

| 因素 | Zustand | 獨立 Auth Provider |
|---|---|---|
| Token Refresh | 需手動處理 | Supabase SDK 自動處理 |
| Session Expiry | 需手動同步 | onAuthStateChange 自動回調 |
| SecureStore 集成 | 需額外膠水代碼 | 在 Provider 中自然整合 |
| 與 React Query 協作 | 需手動 invalidate | Provider 中統一 invalidate |
| 多 Tab/多窗口同步 (Web) | 不支持 | Cookie-based 天然同步 |

**結論**：Auth 狀態的生命周期由服務端驅動（token 過期、refresh、revoke），本質上是服務端狀態。獨立 Provider 更自然、更安全。

---

> **文檔結束**
> 本文檔應隨項目推進持續更新。每個 Phase 結束後，回顧並修訂後續 Phase 的任務和排期。
