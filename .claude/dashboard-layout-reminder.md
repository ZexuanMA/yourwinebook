# ⚠️ 後台頁面必須加獨立 Layout

## 問題

`/dashboard`、`/login` 等頁面在 `[locale]` 路由之外，不會繼承 `[locale]/layout.tsx` 的設置。
如果忘記加獨立 layout，這些頁面會：
- 沒有 Tailwind CSS（看起來像裸 HTML）
- 沒有 DM Sans / Noto Sans TC 字體
- 沒有 `<html>` 和 `<body>` 標籤

## 解決方法

每新增一個在 `[locale]` 之外的路由段（如 `/dashboard`、`/login`、`/admin`），
必須在對應目錄建立 `layout.tsx`，包含以下內容：

```tsx
import type { Metadata } from "next";
import { DM_Sans, Noto_Sans_TC } from "next/font/google";
import "../globals.css"; // 根據層級調整路徑

const dmSans = DM_Sans({ subsets: ["latin"], variable: "--font-dm-sans", weight: ["300","400","500","600","700"] });
const notoSansTC = Noto_Sans_TC({ subsets: ["latin"], variable: "--font-noto-sans-tc", weight: ["300","400","500","700"] });

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="zh-HK">
      <body className={`${dmSans.variable} ${notoSansTC.variable} font-zh bg-bg text-text antialiased`}>
        {children}
      </body>
    </html>
  );
}
```

如果 layout 本身需要是 Client Component（用了 hooks），
把 UI 邏輯抽成獨立的 Client Component，讓 layout.tsx 保持 Server Component。

## 受影響的現有頁面

- `/login` → `src/app/login/layout.tsx` ✅ 已修復
- `/dashboard` → `src/app/dashboard/layout.tsx` ✅ 已修復
