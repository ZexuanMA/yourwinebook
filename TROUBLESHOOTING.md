# 故障排查記錄

## 2026-03-16：網站無法訪問（HTTP 500）

### 現象
所有前台頁面返回 500，API 路由正常。

### 根因（兩個獨立問題同時出現）

#### 問題 1：端口 3000 被佔用
PM2 管理著一個名為 `wine-prod` 的生產進程，持續在 3000 端口運行 `next start`。開發時如果 `npm run dev` 啟動不了 3000，會自動跳到 3001，容易讓人以為服務掛了。

**解決：** 不要刪除 PM2 進程。開發時用 `pm2 stop wine-prod` 暫停，完成後 `pm2 restart wine-prod` 恢復。

```bash
# 查看 PM2 進程
pm2 list

# 開發時暫停生產服務
pm2 stop wine-prod
npm run dev

# 開發完畢，重新部署
npm run build
pm2 restart wine-prod
```

#### 問題 2：首頁 React "Expected a suspended thenable" 錯誤
`src/app/[locale]/page.tsx` 是一個 `async` Server Component（因為裡面 `await getFeaturedWines()`），但使用了 `useTranslations()` 和 `useLocale()` 這兩個同步 hook。

在 Next.js 16 + React 19 中，**async Server Component 不能使用同步 hook**，必須改用 async 版本。

**修復：**
```diff
- import { useTranslations, useLocale } from "next-intl";
+ import { getTranslations, getLocale } from "next-intl/server";

  export default async function HomePage() {
-   const t = useTranslations();
-   const locale = useLocale();
+   const t = await getTranslations();
+   const locale = await getLocale();
```

### 規則總結

| 場景 | 正確做法 | 錯誤做法 |
|------|---------|---------|
| async Server Component 取翻譯 | `await getTranslations()` (from `next-intl/server`) | `useTranslations()` |
| async Server Component 取語言 | `await getLocale()` (from `next-intl/server`) | `useLocale()` |
| Client Component 取翻譯 | `useTranslations()` | `await getTranslations()` |
| 開發時需要用 3000 端口 | `pm2 stop wine-prod` | `pm2 delete wine-prod` |
| 部署到生產 | `npm run build && pm2 restart wine-prod` | 直接 `npm run start`（不會被 PM2 管理） |
