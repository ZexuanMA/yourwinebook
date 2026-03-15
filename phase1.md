# Phase 1 完成報告 — 靜態 MVP 前端遷移

## 做了什麼

把你原來的純 HTML/CSS 靜態網站遷移到了 **Next.js**（一個現代 React 框架）。
遷移後你擁有：
- 一個組件化、可擴展的項目結構（後續加數據庫、API、AI 都很方便）
- 自動的繁中/英文雙語路由（`/zh-HK/` 和 `/en/` 各一套頁面，SEO 友好）
- 所有 7 個頁面 + 首頁都完整遷移，視覺風格保持一致
- 構建通過，可直接部署到 Vercel

---

## 項目結構總覽

```
Wine/
├── _static_backup/          ← 你原來的 HTML 文件備份（不動）
├── MVP_PLAN.md              ← 完整 MVP 規劃文檔
├── phase1.md                ← 本文件
└── app/                     ← 新的 Next.js 項目（所有開發在這裡進行）
    ├── package.json          ← 項目依賴配置
    ├── next.config.ts        ← Next.js 配置（含雙語插件）
    ├── components.json       ← shadcn/ui 組件庫配置
    ├── messages/             ← 翻譯文件（雙語文案都在這裡）
    │   ├── zh-HK.json        ← 所有繁體中文文案
    │   └── en.json            ← 所有英文文案
    └── src/                  ← 源代碼
        ├── middleware.ts
        ├── i18n/
        ├── lib/
        ├── components/
        └── app/
```

---

## 每個文件的作用

### 配置文件（不需要經常改動）

| 文件 | 作用 |
|------|------|
| `next.config.ts` | Next.js 的主配置，這裡啟用了雙語插件 `next-intl` |
| `package.json` | 列出項目用到的所有依賴包（npm install 時讀取） |
| `components.json` | shadcn/ui 組件庫的配置，定義了組件的安裝路徑 |
| `tsconfig.json` | TypeScript 配置，定義了 `@/` 路徑別名等 |

### 雙語系統 (`messages/` + `src/i18n/`)

| 文件 | 作用 |
|------|------|
| `messages/zh-HK.json` | **所有繁體中文文案**，按頁面分組。想改任何中文字，改這個文件就行 |
| `messages/en.json` | **所有英文文案**，結構和中文完全一樣。改英文就改這個文件 |
| `src/i18n/routing.ts` | 定義支持的語言列表（`zh-HK` 和 `en`）和預設語言 |
| `src/i18n/request.ts` | 告訴 Next.js 如何根據 URL 加載對應的翻譯文件 |
| `src/i18n/navigation.ts` | 提供帶語言功能的 `Link`（連結）和 `useRouter`（路由跳轉） |
| `src/middleware.ts` | 用戶訪問 `/` 時自動跳轉到 `/zh-HK/`，處理語言路由邏輯 |

> **簡單說**：你想改頁面上的文字，只需要改 `messages/zh-HK.json` 或 `messages/en.json`，不需要動任何代碼。

### 全局樣式和佈局

| 文件 | 作用 |
|------|------|
| `src/app/globals.css` | **全局樣式**，定義了品牌色彩系統（wine red、gold、warm beige 等），就是你原來 `style.css` 裡的 CSS 變量，轉成了 Tailwind 格式 |
| `src/app/layout.tsx` | 根佈局（技術性的殼，不顯示內容） |
| `src/app/[locale]/layout.tsx` | **主佈局**——每個頁面都共用的外殼。加載字體（DM Sans + Noto Sans TC）、包裹 Navbar 和 Footer、注入翻譯 |

> `[locale]` 是 Next.js 的「動態路由」語法——URL 中 `/zh-HK/` 或 `/en/` 會被自動填入這個位置。

### 可複用組件 (`src/components/`)

這些是「積木塊」，多個頁面共用同一個組件，改一處全站生效。

| 文件 | 作用 | 用在哪裡 |
|------|------|----------|
| `components/layout/Navbar.tsx` | **頂部導航欄**——固定在頂部、半透明毛玻璃效果、搜索入口、語言切換按鈕 | 所有頁面 |
| `components/layout/Footer.tsx` | **頁腳**——導航連結 + 版權信息 | 所有頁面 |
| `components/wine/WineCard.tsx` | **酒款卡片**——顯示酒名、產區、標籤、價格、酒商數。你在首頁精選、搜索結果、場景推薦裡看到的每一張卡片都是這個組件 | 首頁、搜索頁、酒商頁、場景頁 |
| `components/scene/SceneCard.tsx` | **場景卡片**——帶 emoji + 標題 + 描述的可點擊卡片（送禮、聚餐、日常、嘗新） | 首頁 |
| `components/ai/AiRecItem.tsx` | **AI 推薦項**——AI 回覆中的單個酒款推薦小卡（酒名 + 價格 + 推薦理由） | 首頁 AI 預覽、AI 頁面 |
| `components/ui/button.tsx` | shadcn/ui 的基礎按鈕組件（預裝的，備用） | 未來使用 |

### 頁面文件 (`src/app/[locale]/*/page.tsx`)

每個 `page.tsx` 文件就是一個頁面。Next.js 用**文件夾結構 = URL 路徑**的約定。

| 文件路徑 | 對應 URL | 頁面內容 |
|----------|----------|----------|
| `[locale]/page.tsx` | `/zh-HK/` 或 `/en/` | **首頁**——Hero 區（搜索框 + 品牌標語）、場景卡片（4個）、精選酒款（3支）、AI 預覽對話、合作酒商 Logo 牆、酒商招募 CTA |
| `[locale]/search/page.tsx` | `/zh-HK/search` | **搜索頁**——搜索框 + 類型/產區/價格篩選 + 酒款網格列表 |
| `[locale]/wines/[slug]/page.tsx` | `/zh-HK/wines/cloudy-bay...` | **酒款詳情頁**——酒款大圖 + 標籤 + 描述 + **跨酒商比價表**（6 家酒商價格）+ 可展開的品酒筆記和產區故事 + 相似酒款推薦 |
| `[locale]/merchants/page.tsx` | `/zh-HK/merchants` | **酒商列表頁**——6 家合作酒商的卡片網格 |
| `[locale]/merchants/[slug]/page.tsx` | `/zh-HK/merchants/watsons-wine` | **酒商詳情頁**——Watson's Wine 的品牌頁：Logo + 簡介 + 統計數據（126 酒款、23 最低價、4.6 評分）+ 店內酒款列表 |
| `[locale]/ai/page.tsx` | `/zh-HK/ai` | **AI 選酒助手**——示範對話（送禮推薦 → 追問甜酒）、帶 "coming soon" 標記 |
| `[locale]/scenes/[slug]/page.tsx` | `/zh-HK/scenes/dinner` | **場景推薦頁**——聚餐配酒為例，帶子分類標籤（火鍋/BBQ/中餐等）+ 篩選 + 推薦酒款 |
| `[locale]/about/page.tsx` | `/zh-HK/about` | **關於我們**——我們是誰、做什麼、原則（中立/透明/親切）、聯繫方式 |
| `[locale]/join/page.tsx` | `/zh-HK/join` | **酒商入駐**——3 個好處卡片 + CTA 聯繫郵箱 |

> `[slug]` 也是動態路由——比如 `/wines/cloudy-bay-sauvignon-blanc-2023`，`slug` 就是酒款的 URL 標識符。未來接數據庫後，會根據 slug 從數據庫查詢對應酒款。

### 數據文件

| 文件 | 作用 |
|------|------|
| `src/lib/mock-data.ts` | **模擬數據**——6 支酒款（含中英文名稱、產區、標籤、描述、價格）、6 家酒商、Cloudy Bay 的 6 個酒商比價數據。目前頁面都從這裡讀取數據。**Phase 2 會把這些替換成真實數據庫** |
| `src/lib/utils.ts` | shadcn/ui 的工具函數（預裝的，處理 CSS class 合併） |

---

## 技術棧說明（用大白話解釋）

| 技術 | 是什麼 | 為什麼用它 |
|------|--------|-----------|
| **Next.js** | React 的「全套框架」 | 既能做前端頁面，又能做後端 API，還能做 SEO 優化。一個框架搞定所有事 |
| **TypeScript** | 帶「類型檢查」的 JavaScript | 寫代碼時自動提示錯誤，減少 bug |
| **Tailwind CSS** | 「實用類」CSS 框架 | 直接在 HTML 上寫樣式（如 `text-red-500`），不用寫單獨的 CSS 文件，開發很快 |
| **shadcn/ui** | 預製的 UI 組件庫 | 提供按鈕、輸入框、對話框等現成組件，不用從頭寫 |
| **next-intl** | Next.js 的國際化（多語言）方案 | 讓網站支持中文和英文，每種語言有獨立的 URL（對 Google SEO 友好） |

---

## 如何啟動

```bash
cd app
npm run dev      # 啟動開發服務器（修改代碼後自動刷新）
                 # 打開 http://localhost:3000/zh-HK 看中文版
                 # 打開 http://localhost:3000/en 看英文版

npm run build    # 構建生產版本（部署前用）
npm run start    # 啟動生產版本
```

---

## 下一步（Phase 2）

目前所有數據都是寫死在 `mock-data.ts` 裡的。Phase 2 要做的是：
1. 接入 Supabase 數據庫
2. 創建真實的數據表（wines、merchants、prices 等）
3. 灌入 30-50 支真實酒款數據
4. 把頁面改為從數據庫動態讀取
