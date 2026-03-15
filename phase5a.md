# Phase 5A 完成報告 — 酒商後台（登入 + 酒款管理）

## 做了什麼

在現有前台基礎上，新增了一套**酒商後台系統**：酒商可以用獨立帳號登入、查看自己的上架統計、瀏覽比價酒款列表、填寫新增酒款表單。整套系統目前使用虛擬數據運行，無需 Supabase，連接數據庫後即可無縫切換到真實數據。

---

## 新增文件一覽

| 文件 | 作用 |
|------|------|
| `src/lib/mock-auth.ts` | 虛擬帳號數據 + 驗證函數 |
| `src/app/api/auth/login/route.ts` | POST 登入 API，驗證成功後寫入 Cookie |
| `src/app/api/auth/logout/route.ts` | POST 登出 API，清除 Cookie |
| `src/app/api/auth/me/route.ts` | GET 當前登入帳號資料 |
| `src/app/login/page.tsx` | 登入頁（含 Demo 帳號列表） |
| `src/app/dashboard/layout.tsx` | 後台共用佈局（左側導航欄） |
| `src/app/dashboard/page.tsx` | 後台首頁（統計數字 + 比價酒款表格） |
| `src/app/dashboard/wines/page.tsx` | 酒款管理列表頁 |
| `src/app/dashboard/wines/new/page.tsx` | 新增酒款表單頁 |

## 修改文件

| 文件 | 改動內容 |
|------|----------|
| `src/middleware.ts` | 新增路由保護：未登入訪問 `/dashboard` 自動跳轉 `/login`；已登入訪問 `/login` 自動跳轉 `/dashboard` |

---

## 各功能詳解

### 1. 帳號系統（虛擬模式）

`src/lib/mock-auth.ts` 內建 6 個演示帳號，對應 6 家合作酒商：

| 酒商 | Email | 密碼 |
|------|-------|------|
| Watson's Wine | watsons@demo.com | demo123 |
| Wine & Co | wineandco@demo.com | demo123 |
| CellarDoor | cellardoor@demo.com | demo123 |
| VinHK | vinhk@demo.com | demo123 |
| Grape HK | grape@demo.com | demo123 |
| BottleShop | bottle@demo.com | demo123 |

### 2. Session 機制

登入成功後，伺服器在瀏覽器寫入一個 `wb_session` Cookie（存放酒商的 slug），有效期 7 天。之後每次訪問後台，middleware 讀取這個 Cookie 判斷是否已登入。

```
登入 → POST /api/auth/login → 寫入 Cookie(wb_session=watsons-wine)
登出 → POST /api/auth/logout → 清除 Cookie
讀取身份 → GET /api/auth/me → 根據 Cookie 返回帳號資料
```

### 3. 路由保護

`src/middleware.ts` 更新後同時處理兩件事：

- 訪問 `/dashboard/*` 但沒有 Cookie → 跳轉 `/login`
- 訪問 `/login` 但已有 Cookie → 跳轉 `/dashboard`
- 其他所有路由 → 交給 next-intl 處理語言路由（原有邏輯不變）

### 4. 登入頁 `/login`

- Email + 密碼輸入框（密碼可切換顯示/隱藏）
- 下方列出所有 Demo 帳號，**點擊任意一個自動填入**，方便演示
- 登入成功後跳轉 `/dashboard`

### 5. 後台佈局（左側導航欄）

所有後台頁面共用同一個 Layout，包含：
- 頂部：品牌 logo + 跳轉前台鏈接
- 中部：當前登入帳號名稱和 Email
- 導航項：總覽 / 酒款管理 / 新增酒款
- 底部：登出按鈕

當前頁面的導航項會高亮顯示（深紅色背景）。

### 6. 後台首頁 `/dashboard`

顯示 3 個統計卡：

| 統計項 | 數據來源 |
|--------|----------|
| 上架酒款數 | `merchants` mock 數據中的 `winesListed` |
| 最低價酒款數 | `winePrices` 中 `isBest === true` 的酒款數量 |
| 平台評分 | `merchants` mock 數據中的 `rating` |

下方列出該酒商有比價數據的酒款（從 `winePrices` 篩選），顯示酒名、類型、價格、是否最低價標籤。

### 7. 酒款管理 `/dashboard/wines`

完整的表格列表，顯示：酒款名稱 + 年份、類型、產區（取第一段）、價格、上架狀態、「查看頁面」鏈接（跳轉前台詳情頁）。

### 8. 新增酒款 `/dashboard/wines/new`

分兩個區塊的表單：

**基本資料**：酒款名稱（必填）、酒款類型（必填）、年份、產區（必填）、葡萄品種、中文簡介

**定價資料**：售價 HKD（必填）、購買連結 URL

提交後顯示成功畫面，可選擇「再新增一款」或「返回列表」。

> Demo 模式下表單提交不會真正保存數據，僅模擬流程。

---

## URL 結構

| URL | 說明 |
|-----|------|
| `/login` | 登入頁（在語言路由之外，不帶 `/zh-HK/` 前綴） |
| `/dashboard` | 後台首頁 |
| `/dashboard/wines` | 酒款管理列表 |
| `/dashboard/wines/new` | 新增酒款表單 |
| `/api/auth/login` | POST 登入 |
| `/api/auth/logout` | POST 登出 |
| `/api/auth/me` | GET 當前帳號 |

> 後台頁面不帶語言前綴，和前台的 `/zh-HK/`、`/en/` 路由完全分開。

---

## Demo 模式 vs 真實模式

| 功能 | Demo 模式（現在） | 真實模式（接 Supabase 後） |
|------|------------------|--------------------------|
| 帳號驗證 | 固定寫死在 `mock-auth.ts` | Supabase Auth（Email/Password） |
| Session | httpOnly Cookie 存 merchantSlug | Supabase JWT Token |
| 酒款列表 | 從 `winePrices` mock 數據篩選 | 從 `wine_prices` 表 JOIN `wines` 查詢 |
| 新增酒款 | 表單提交模擬成功，不入庫 | INSERT 到 `wines` + `wine_prices` 表 |
| 統計數字 | 從 `merchants` mock 數據讀取 | 從 Supabase 實時聚合查詢 |

每個後台頁面底部都有**黃色提示條**，告知用戶當前為 Demo 模式。

---

## 如何使用

```bash
npm run dev
```

1. 打開 `http://localhost:3000/login`
2. 點擊任意 Demo 帳號（自動填入）→ 點「登入」
3. 進入 `/dashboard` 查看統計
4. 點左側「酒款管理」查看上架酒款列表
5. 點左側「新增酒款」填寫並提交表單
6. 點左下角「登出」清除 Session

---

## 下一步（Phase 5B）

Phase 5B 將在後台新增：

1. **CSV 批量導入**：上傳 CSV 文件一次性導入多支酒款
2. **Admin 後台**：平台管理員視角（查看所有酒商、審核申請、管理全站酒款）
