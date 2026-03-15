# Phase 3 完成報告 — 搜索 + 篩選

## 做了什麼

在 Phase 2 的數據層基礎上，實現了完整的**搜索與篩選系統**：用戶可以輸入關鍵字、按酒類型/產區/價格範圍篩選、排序結果，並通過分頁瀏覽所有 32 支酒款。所有篩選狀態都同步到 URL，支持分享和瀏覽器前進/後退。

---

## 新增與修改的文件

### 新增文件

| 文件 | 作用 |
|------|------|
| `src/components/search/SearchInput.tsx` | 帶自動補全下拉的搜索框組件 |

### 修改文件

| 文件 | 改動內容 |
|------|----------|
| `src/app/[locale]/search/page.tsx` | 完整重寫：從靜態展示改為完整搜索/篩選/排序/分頁的 Client 組件 |
| `src/app/api/wines/route.ts` | 改用 `getWinesPaginated`，支持 `type/region/search/minPrice/maxPrice/sort/page/limit` 全部參數 |
| `src/app/api/search/route.ts` | 新增兩個 action：自動補全建議（`?q=`）+ 產區列表（`?action=regions`） |
| `src/lib/queries.ts` | 新增 `getWinesPaginated`、`getRegions`、`getSearchSuggestions` 三個函數 |

---

## 各功能詳解

### 1. 搜索框與自動補全（`SearchInput.tsx`）

- 用戶輸入 2 個字符後，以 200ms debounce 向 `/api/search?q=` 請求補全建議
- 下拉最多顯示 6 個匹配酒款（含酒類 emoji 標識）
- 支持鍵盤操作：`↑↓` 選擇、`Enter` 確認、`Escape` 關閉
- 選中建議直接跳轉酒款詳情頁（`/wines/:slug`）
- 點擊輸入框外部自動關閉下拉

### 2. 多維篩選（URL-based）

所有篩選條件都寫入 URL query string，實現可分享、可回退：

| 參數 | 說明 | 取值示例 |
|------|------|---------|
| `q` | 關鍵字搜索（酒名、產區、葡萄品種） | `?q=sauvignon` |
| `type` | 酒款類型 | `red / white / sparkling / rosé / dessert` |
| `region` | 產區（從數據動態加載） | `France / Australia` 等 |
| `price` | 價格段 | `under200 / 200to500 / 500to1000 / over1000` |
| `sort` | 排序方式 | 見下方 |
| `page` | 當前頁碼（默認 1） | `?page=2` |

切換任何篩選條件時自動重置到第 1 頁。有激活的篩選條件時顯示「清除篩選 (n)」按鈕，一鍵重置所有篩選（保留搜索詞）。

### 3. 排序

5 種排序方式，Supabase 和 mock 數據都支持：

| key | 說明 |
|-----|------|
| `name_asc` | 名稱 A-Z（默認） |
| `name_desc` | 名稱 Z-A |
| `price_asc` | 價格低到高 |
| `price_desc` | 價格高到低 |
| `newest` | 最新年份 |

### 4. 分頁

- 每頁顯示 12 款（`PAGE_SIZE = 12`）
- 分頁欄顯示上一頁 / 頁碼按鈕 / 下一頁
- 當前頁按鈕高亮（wine red 背景）
- 只有超過 1 頁時才顯示分頁欄

### 5. 加載與空狀態

- 請求期間顯示 6 個骨架屏（灰色佔位卡片，帶 `animate-pulse`）
- 無結果時顯示友好提示和建議文案（中/英文各一套）

---

## 新增 DAL 函數（`src/lib/queries.ts`）

```typescript
// 帶完整篩選、排序、分頁的酒款列表
getWinesPaginated(filters?: WineFilters): Promise<PaginatedWines>

// 返回所有去重產區名（用於篩選下拉）
getRegions(): Promise<string[]>

// 自動補全建議（最多 6 條，匹配酒名或葡萄品種）
getSearchSuggestions(query: string): Promise<{ name, slug, type }[]>
```

三個函數都遵循 Phase 2 的模式：**優先走 Supabase，無連接自動 fallback 到 mock 數據**，開發時無需任何配置。

---

## API 端點更新

### `GET /api/wines`（升級）

新增支持的查詢參數：

```
?type=red
&region=France
&search=cloudy+bay
&minPrice=200
&maxPrice=1000
&sort=price_asc
&page=2
&limit=12
```

響應格式（新增分頁信息）：

```json
{
  "wines": [...],
  "total": 32,
  "page": 2,
  "limit": 12,
  "totalPages": 3
}
```

### `GET /api/search`（新增）

```
?q=sauv          → { suggestions: [{ name, slug, type }, ...] }
?action=regions  → { regions: ["Australia", "France", ...] }
```

---

## 技術說明

- **搜索頁改為 Client Component**（`"use client"`）：需要在瀏覽器端讀寫 URL params、響應用戶操作，所以不能用 Server Component
- **URL 作為唯一數據源**：篩選狀態只存在 URL 中，組件 state 只做臨時 buffer（如輸入框打字中），避免 URL 和 state 不同步的問題
- **`router.replace` 而非 `router.push`**：切換篩選不留瀏覽記錄（防止用戶要連按多次後退才能離開搜索頁）
- **產區篩選動態加載**：`/api/search?action=regions` 在頁面掛載時請求一次，確保篩選選項和實際數據一致

---

## 如何驗證

```bash
# 1. 關鍵字搜索
/zh-HK/search?q=cloudy      → 顯示 Cloudy Bay

# 2. 類型篩選
/zh-HK/search?type=sparkling → 只顯示氣泡酒

# 3. 組合篩選
/zh-HK/search?type=red&price=200to500&sort=price_asc → 紅酒按價格排序

# 4. 自動補全
搜索頁或首頁搜索框輸入 "cha" → 下拉出現 Chardonnay 系列酒款

# 5. 分頁（mock 數據 32 款，每頁 12，共 3 頁）
/zh-HK/search?page=2 → 第 2 頁酒款
```

---

## 下一步（Phase 4）

Phase 4 將實現 **AI 酒顧問**：
1. 接入 Claude API（串流輸出）
2. 設計 system prompt（熟悉 32 支酒款和 6 家酒商）
3. Tool use：讓 AI 調用 `search_wines` 查詢實際數據
4. 串流 UI：對話框即時顯示回覆
5. 推薦卡片可點擊跳轉酒款詳情頁
