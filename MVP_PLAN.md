# Your Wine Book — 完整 MVP 產品規劃

## Part 1 — 產品定義

### 1. 產品簡介
Your Wine Book 是面向香港消費者的葡萄酒探索平台。核心功能：選酒助手 + 比價工具 + 場景推薦引擎。讓不懂酒的人也能輕鬆買對酒、買到好價。

### 2. 目標用戶
| 用戶類型 | 特徵 | 場景 |
|----------|------|------|
| 入門消費者（核心） | 25-40歲香港上班族，對酒有興趣但不懂 | 送禮、約會、配餐、日常小酌 |
| 精明比價者 | 知道自己要什麼酒，想找最好價 | 搜酒名，比較各酒商價格 |
| 場景驅動者 | 不知道喝什麼，但知道場合 | 火鍋配什麼酒？生日送什麼？ |
| 酒商（B端） | 中小型酒商，想低成本獲客 | 上架產品、獲得曝光 |

### 3. 核心痛點
- 買貴了：同一支酒在不同酒商價差 30-50%
- 買錯了：面對幾百款酒不知從何選起
- 買得煩：要跨多個 app/網站查價
- 語言障礙：酒標全是英文/法文

### 4. 核心價值主張
> 一個平台比好價、選對酒、說好故事。

### 5. MVP 範圍
**Now：** 首頁、搜索+篩選、酒款詳情+比價、場景推薦（4場景）、酒商列表、AI酒顧問、酒商申請、繁中/英文雙語
**Later：** 用戶帳號+收藏、酒商後台、用戶評價、降價提醒、Blog/內容系統
**Not Now：** 站內支付、物流、社交、原生App

---

## Part 2 — 頁面結構

### 首頁 (/)
- 目的：第一印象 + 導流
- 模組：Hero+搜索框、場景卡片(4個)、精選推薦(3-6酒款)、AI預覽、合作酒商Logo牆、酒商招募CTA
- 數據：scenes表、wines+wine_prices(最低價)、merchants表
- 動作：搜索→搜索頁、選場景→場景頁、AI入口→AI頁

### 搜索頁 (/search)
- 目的：酒款探索核心
- 模組：搜索欄、篩選(類型/產區/價格/標籤)、排序、結果網格、分頁
- 數據：wines JOIN wine_prices、wine_tags、wine_regions
- 動作：搜索→篩選→點擊酒款→詳情頁

### 酒款詳情頁 (/wines/:slug)
- 目的：單一酒款完整資訊 + 比價
- 模組：主圖、基本資訊、生活化標籤、編輯描述、比價表(核心)、品酒筆記、產區故事、適合場景、相似推薦
- 數據：wines、wine_prices JOIN merchants、wine_tags、wine_regions、wine_scenes
- 動作：查看比價→跳轉購買、收藏(Phase2)

### 酒商頁面 (/merchants/:slug)
- 目的：酒商品牌展示 + 酒款列表
- 模組：Hero(Logo/名稱/簡介)、統計數據、酒款列表(可篩選)、購買方式
- 數據：merchants、wine_prices WHERE merchant_id
- 動作：瀏覽→點擊酒款→詳情頁

### AI 酒顧問 (/ai)
- 目的：對話式選酒助手
- 模組：介紹區、對話介面(streaming)、推薦卡片(可點擊)、快速問題按鈕
- 數據：Claude API + wines資料庫(tool use)
- 動作：輸入需求→收到推薦→點擊酒款→詳情頁

### 場景推薦頁 (/scenes/:slug)
- 目的：按場合推薦，降低選擇門檻
- 模組：場景頭部(emoji+描述)、子分類標籤、篩選(人數/預算/類型)、推薦列表
- 數據：scenes、wine_scenes JOIN wines
- 動作：選場景→子分類→篩選→點擊酒款

### 關於頁面 (/about)
- 純靜態：我們是誰、做什麼、原則、聯繫

### 酒商入駐 (/join)
- 模組：價值主張、權益卡片(3個)、申請表單(公司名/聯繫人/郵箱/酒款數)
- 數據：merchant_applications表
- 動作：填寫→提交申請

---

## Part 3 — 技術架構

### 技術棧
| 層級 | 技術 | 原因 |
|------|------|------|
| 前端框架 | Next.js 14 (App Router) + TypeScript | SEO+SSR+快速開發 |
| UI | Tailwind CSS + shadcn/ui | 復刻設計風格+組件複用 |
| 雙語 | next-intl | 路由級i18n，SEO友好 |
| 數據庫 | Supabase (PostgreSQL) | 免費額度大、Auth內建 |
| 搜索 | PostgreSQL full-text → Meilisearch | 漸進式升級 |
| AI | Claude API + tool use | 中文優秀、可查真實數據 |
| 部署 | Vercel + Supabase Cloud | 零運維、自動CI/CD |
| ORM | Prisma | 類型安全 |

### API 結構
```
GET  /api/wines                    # 酒款列表(搜索+篩選+分頁)
GET  /api/wines/:id                # 酒款詳情
GET  /api/wines/:id/prices         # 酒款比價
GET  /api/merchants                # 酒商列表
GET  /api/merchants/:id            # 酒商詳情
GET  /api/merchants/:id/wines      # 酒商酒款
GET  /api/scenes                   # 場景列表
GET  /api/scenes/:id/wines         # 場景推薦酒款
POST /api/ai/chat                  # AI顧問對話
POST /api/merchant-applications    # 酒商申請
GET  /api/search?q=...             # 全文搜索
```

### 多語言路由
```
/zh-HK/              → 繁中首頁（預設）
/en/                  → 英文首頁
/zh-HK/wines/:slug    → 繁中酒款頁
/en/wines/:slug       → 英文酒款頁
```

---

## Part 4 — 數據模型

### wines 酒款主表
- id (UUID PK), slug, name_en, name_zh, type (red/white/rosé/sparkling/dessert)
- grape_variety, vintage, region_id (FK→wine_regions)
- description_en, description_zh, tasting_notes (JSONB)
- alcohol_pct, image_url, is_featured
- min_price (冗餘), merchant_count (冗餘)
- created_at, updated_at

### wine_regions 產區
- id, slug, name_en, name_zh, country, description_en, description_zh

### merchants 酒商
- id, slug, name, logo_url, description_en, description_zh
- website_url, features (JSONB), is_active, created_at

### wine_prices 比價表（核心）
- id, wine_id (FK), merchant_id (FK), price_hkd (整數分)
- buy_url, is_best_price, in_stock, last_checked
- UNIQUE(wine_id, merchant_id)

### tags 標籤
- id, name_en, name_zh, category (taste/occasion/food_pairing/level)

### wine_tags 酒款-標籤關聯
- wine_id, tag_id (composite PK)

### scenes 場景
- id, slug, name_en, name_zh, emoji, description_en, description_zh
- subcategories (JSONB), sort_order

### wine_scenes 酒款-場景關聯
- wine_id, scene_id (composite PK), relevance_score

### merchant_applications 酒商申請
- id, company_name, contact_name, email, phone
- wine_count, website_url, message, status (pending/contacted/approved/rejected)

### ai_recommendation_logs AI記錄
- id, session_id, user_message, ai_response
- recommended_wine_ids (UUID[]), model_used, tokens_used, created_at

### users + bookmarks (Phase 2)
- users: id, email, display_name, preferred_lang, preferences (JSONB)
- bookmarks: user_id, wine_id (composite PK)

---

## Part 5 — 實施路線圖

### Phase 1：靜態 MVP 前端遷移
- 目標：現有 HTML → Next.js + Tailwind，保留設計風格
- 交付：Next.js 14 項目、7頁面遷移、next-intl 雙語路由、組件抽取(WineCard/PriceTable/SceneCard/NavBar/Footer)、Vercel 部署
- 優先級：🔴 最高
- 依賴：無

### Phase 2：動態數據整合
- 目標：連接 Supabase，頁面動態渲染
- 交付：DB schema 創建、30-50支酒款 seed data、API Routes、SSR/ISR、酒商申請表單後端
- 優先級：🔴 最高
- 依賴：Phase 1

### Phase 3：搜索 + 篩選
- 目標：快速找到想要的酒
- 交付：PostgreSQL 全文搜索、多維篩選 UI、URL-based 篩選狀態、排序、自動補全
- 優先級：🟡 高
- 依賴：Phase 2

### Phase 4：AI 酒顧問上線
- 目標：真實可用的 AI 對話推薦
- 交付：Claude API 整合、system prompt 設計、tool use (search_wines等)、streaming UI、推薦記錄、rate limiting
- 優先級：🟡 高
- 依賴：Phase 2 + Phase 3

### Phase 5：酒商入駐 + 規模化
- 目標：酒商自助管理，平台規模化
- 交付：酒商登入+後台、自助上架、CSV導入、admin dashboard、用戶帳號+收藏、analytics
- 優先級：🟢 中
- 依賴：Phase 1-4 穩定
