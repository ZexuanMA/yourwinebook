# Your Wine Book — 後台管理系統功能總覽

> 目前為 Demo 模式，使用虛擬數據。連接 Supabase 後可切換至真實數據。

---

## 一、帳號體系

### 三類帳號

| 角色 | 說明 | 入口 |
|------|------|------|
| **管理員 (Admin)** | 平台方，管理所有酒商和用戶帳號、審核申請 | `/login` |
| **酒商 (Merchant)** | 入駐酒商，管理自己的酒款和資料 | `/login` |
| **用戶 (User)** | 普通消費者，收藏酒款、管理個人資料 | 前台 Navbar 登入 |

### Demo 帳號

**管理員**

| Email | 密碼 |
|-------|------|
| admin@yourwinebook.com | admin123 |

**酒商（6個，密碼均為 demo123）**

| 名稱 | Email | 狀態 |
|------|-------|------|
| Watson's Wine | watsons@demo.com | 正常 |
| Wine & Co | wineandco@demo.com | 正常 |
| CellarDoor | cellardoor@demo.com | 正常 |
| VinHK | vinhk@demo.com | 正常 |
| Grape HK | grape@demo.com | 已停用 |
| BottleShop | bottle@demo.com | 待審核 |

**用戶（6個，密碼均為 user123）**

| 名稱 | Email | 收藏數 |
|------|-------|--------|
| 陳大文 | david@demo.com | 3 |
| 李美玲 | mary@demo.com | 2 |
| James Wong | james@demo.com | 2 |
| Sophie Lam | sophie@demo.com | 3 |
| 王建國 | wang@demo.com | 1 |
| 張志強（已停用） | zhang@demo.com | 0 |

---

## 二、Session 機制

| Cookie | 用途 | 有效期 |
|--------|------|--------|
| `wb_session` | 酒商 / 管理員登入狀態（存 slug） | 7 天 |
| `wb_user_session` | 普通用戶登入狀態（存 user id） | 30 天 |

**Middleware 路由保護：**
- `/dashboard/*` — 必須有 `wb_session`，否則跳轉 `/login`
- `/dashboard/admin/*` — 必須是管理員角色，否則跳轉 `/dashboard`
- 普通用戶的 `/account` 在前台路由內，由頁面自身檢查登入狀態

---

## 三、API 路由

### 管理員 / 酒商 Auth

| 方法 | 路徑 | 說明 |
|------|------|------|
| POST | `/api/auth/login` | 登入，寫入 `wb_session` Cookie |
| POST | `/api/auth/logout` | 登出，清除 Cookie |
| GET | `/api/auth/me` | 返回當前帳號資料（含 role 字段） |

### 普通用戶 Auth

| 方法 | 路徑 | 說明 |
|------|------|------|
| POST | `/api/user/auth/login` | 登入，寫入 `wb_user_session` Cookie |
| POST | `/api/user/auth/logout` | 登出，清除 Cookie |
| POST | `/api/user/auth/register` | 注冊新帳號，注冊後自動登入 |
| GET | `/api/user/auth/me` | 返回當前用戶資料（含收藏列表） |

---

## 四、前台用戶功能

### 4.1 Navbar 用戶入口

- 未登入：顯示「登入」按鈕（酒紅色），點擊跳轉 `/account/login`
- 已登入：顯示用戶頭像（首字母圓形），點擊展開下拉選單：
  - 顯示用戶名稱和 Email
  - 我的收藏 → `/account`
  - 帳號設置 → `/account`
  - 登出

### 4.2 用戶登入頁 `/[locale]/account/login`

- 走前台樣式（有 Navbar / Footer）
- Email + 密碼輸入框（密碼可顯示/隱藏）
- 4 個 Demo 帳號卡片，點擊自動填入
- 底部「還沒有帳號？立即注冊」跳轉注冊頁

### 4.3 用戶注冊頁 `/[locale]/account/register`

- 暱稱、Email、密碼、確認密碼
- **密碼強度指示條**：太短 / 一般 / 良好 / 強（根據長度和複雜度）
- 確認密碼一致時顯示綠色 ✓ 圖標
- 前端驗證：密碼長度 ≥ 6、兩次一致、Email 唯一
- 注冊成功後自動登入，跳轉 `/account`

### 4.4 用戶個人主頁 `/[locale]/account`

三個 Tab 頁面：

**收藏酒款**
- 以卡片網格展示用戶收藏的酒款（emoji、名稱、產區、最低價、酒商數）
- 點擊卡片跳轉酒款詳情頁
- 空狀態引導至搜索頁

**個人資料**
- 修改暱稱、慣用語言（繁中/英）
- Email 唯讀不可修改
- 保存成功顯示「已保存」提示，3 秒後消失

**安全設置（改密碼）**
- 當前密碼、新密碼、確認新密碼
- 前端驗證：當前密碼正確、新密碼 ≥ 6 位、兩次一致
- 成功顯示「密碼已更新」提示

---

## 五、後台頁面（管理員 + 酒商）

後台入口：`/login`（酒紅色 split-screen 佈局）

### 5.1 登入頁 `/login`

- 左側：品牌面板（深酒紅背景 + 文案 + emoji 裝飾）
- 右側：Email + 密碼表單
- 管理員帳號：單獨展示，帶「管理員」標籤
- 酒商帳號：2×3 卡片網格，點擊自動填入

### 5.2 後台 Sidebar（左側導航）

- 顯示當前帳號名稱和角色（管理員有盾牌徽章）
- 根據角色顯示不同導航項（見下表）
- 頂部 bar 顯示當前頁面名稱和「Demo 模式」呼吸燈

**酒商帳號導航：**

| 頁面 | URL |
|------|-----|
| 總覽 | `/dashboard` |
| 酒款管理 | `/dashboard/wines` |
| 新增酒款 | `/dashboard/wines/new` |
| 流量分析 | `/dashboard/analytics` |
| 帳號設置 | `/dashboard/account` |

**管理員帳號導航：**

| 頁面 | URL |
|------|-----|
| 總覽 | `/dashboard` |
| 酒商帳號 | `/dashboard/admin/accounts` |
| 用戶管理 | `/dashboard/admin/users` |
| 入駐申請 | `/dashboard/admin/applications` |
| 流量分析 | `/dashboard/analytics` |
| 帳號設置 | `/dashboard/account` |

---

### 5.3 後台首頁 `/dashboard`

- 3 個統計卡：上架酒款數、最低價數量、平台評分
- 平均定價 Banner
- 比價酒款明細表：類型彩色 Pill、你的價格 vs 市場最低、最低價 🏆 標籤

### 5.4 酒款管理 `/dashboard/wines`

- 顯示上架款數和最低價款數
- 搜索框按酒名/類型過濾
- 表格列：酒款、類型、產區、你的價格、市場最低（超出金額標紅）、比價名次（第 N / 共 M 家）、查看按鈕

### 5.5 新增酒款 `/dashboard/wines/new`

- 酒款類型：5 個可點選卡片（紅酒 🍷 / 白酒 🍾 / 氣泡酒 🥂 / 玫瑰酒 🌸 / 甜酒 🍯）
- 基本資料：名稱、年份、葡萄品種
- 產區資料：產區（建議格式：國家 · 地區 · 子產區）
- 定價資料：售價 HKD、購買連結
- 提交後顯示成功畫面，可選「再新增一款」或「返回列表」

### 5.6 流量分析 `/dashboard/analytics`

- **6 個統計卡**（帶漲跌百分比）：頁面瀏覽量、獨立訪客、跳出率、平均時長、比價點擊數、總會話數
- **30 天趨勢折線圖**：頁面瀏覽 vs 獨立訪客雙線
- **熱門頁面表格**：瀏覽量、平均時長、跳出率（顏色標識）
- **流量來源進度條**：直接訪問、Google、社交媒體、推薦連結
- **裝置類型進度條**：手機 📱、桌面 💻、平板 📟
- **熱門酒款**：瀏覽量 + 購買點擊轉化率
- **本週每日柱狀圖**：最近 7 天雙柱對比
- **實時訪問記錄**：地區旗幟、裝置圖標、入口頁面、時長、頁數

### 5.7 帳號設置 `/dashboard/account`（酒商 & 管理員）

- 帳號概覽卡（頭像、名稱、狀態、入駐日期）
- 基本資料表單：暱稱、Email（唯讀）、電話、網站、商家簡介
- 修改密碼（帶顯示/隱藏和前端驗證）
- 危險操作——暫停帳號（僅酒商顯示）

---

### 5.8 酒商帳號管理 `/dashboard/admin/accounts`（管理員專用）

- **4 個篩選統計卡**：全部 / 正常 / 已停用 / 待審核
- 搜索框（名稱或 Email）
- 表格列：酒商名稱（帶網站連結）、Email、上架數、評分、狀態標籤、入駐日期、操作
- **可展開行**：顯示聯繫資料、平台數據、商家簡介
- **操作**：停用 / 啟用 / 審核通過（按當前狀態動態顯示）

### 5.9 用戶管理 `/dashboard/admin/users`（管理員專用）

- **3 個篩選統計卡**：全部 / 正常 / 已停用
- 搜索框（姓名或 Email）
- 表格列：用戶名稱+Email、慣用語言、收藏數、加入日期、最後上線、狀態標籤、操作
- **可展開行**：顯示用戶所有收藏酒款（emoji + 名稱 + 最低價）
- **操作**：停用 / 啟用

### 5.10 入駐申請管理 `/dashboard/admin/applications`（管理員專用）

- **狀態標籤篩選**（帶數量）：全部 / 待處理 / 已聯繫 / 已批准 / 已拒絕
- 搜索框（公司名、聯繫人或 Email）
- 每條申請一張卡片：
  - 公司名、聯繫人、酒款數、提交時間、狀態標籤
  - 聯繫資料 Pill（Email 可直接點擊發郵件、電話、網站連結）
  - 可展開查看「申請說明」
  - 底部操作欄（按狀態顯示不同按鈕）：
    - 待處理：標記已聯繫 / 拒絕申請 / 批准入駐
    - 已聯繫：拒絕申請 / 批准入駐
    - 已批准/已拒絕：重置為待處理

---

## 六、技術說明

### 路由結構

```
/login                               酒商/管理員登入
/dashboard                           後台首頁
/dashboard/wines                     酒款管理
/dashboard/wines/new                 新增酒款
/dashboard/analytics                 流量分析
/dashboard/account                   帳號設置
/dashboard/admin/accounts            酒商帳號管理（管理員）
/dashboard/admin/users               用戶管理（管理員）
/dashboard/admin/applications        入駐申請審核（管理員）

/[locale]/account/login              用戶登入（前台）
/[locale]/account/register           用戶注冊（前台）
/[locale]/account                    用戶個人主頁（前台）
```

### 重要：後台頁面必須有獨立 Layout

`/dashboard` 和 `/login` 在 `[locale]` 路由之外，必須各自建立含 `<html>`、`<body>`、字體變量（DM Sans + Noto Sans TC）和 `globals.css` 的獨立 `layout.tsx`。否則頁面沒有任何樣式。

---

## 七、後續開發計劃

| 功能 | 說明 |
|------|------|
| 接入 Supabase Auth | 替換所有 mock-auth / mock-users，使用真實帳號系統 |
| 用戶收藏持久化 | 目前為 mock 數據，接 DB 後寫入 `bookmarks` 表 |
| 酒款收藏按鈕 | 在酒款詳情頁和搜索結果加「收藏」按鈕 |
| CSV 批量導入 | 酒商上傳 CSV 一次性導入多支酒款 |
| 管理員開通帳號 | 批准申請後自動創建酒商帳號並發送郵件 |
| 操作日誌 | 記錄管理員的所有操作 |
| 降價提醒 | 用戶收藏的酒款價格下降時通知 |
