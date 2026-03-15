# 用戶數據交互說明

## 問題背景

原有架構中，後台管理頁面（`/dashboard/admin/users`）是一個 Client Component，
直接從 `mock-users.ts` 靜態導入 `getAllUsers()`。當頁面在瀏覽器端渲染時，
它讀取的是打包進客戶端 JS 的**初始靜態資料**，與伺服器端 API route 的記憶體狀態完全隔離。
因此，用戶在前台注冊後，後台看不到新帳號。

## 修復方案

### 1. 文件持久化存儲（`src/lib/user-store.ts`）

新建 `user-store.ts`，所有用戶讀寫操作都通過 Node.js `fs` 模塊對
`data/users.json` 進行讀寫：

- `getAllUsers()` — 讀取文件，返回全部用戶（不含密碼）
- `getUserById(id)` — 按 ID 查找用戶
- `verifyCredentials(email, password)` — 驗證登入
- `registerUser(name, email, password)` — 注冊並寫入文件
- `setUserStatus(id, status)` — 修改狀態並寫回文件
- `updateLastSeen(id)` — 更新最後上線時間

好處：伺服器重啓、Hot Module Reload 後數據不丟失。

### 2. API Endpoints

| 方法 | 路徑 | 功能 |
|------|------|------|
| `POST` | `/api/user/auth/register` | 前台用戶注冊（已更新，密碼真實存儲） |
| `POST` | `/api/user/auth/login` | 前台用戶登入（已更新，同步最後上線時間） |
| `GET`  | `/api/user/auth/me` | 取得當前登入用戶資料 |
| `GET`  | `/api/admin/users` | 管理員取得所有用戶列表（需 admin session） |
| `PATCH`| `/api/admin/users/[id]` | 管理員修改用戶狀態（啓用/停用） |

所有 `/api/admin/*` 端點均驗證 `wb_session` cookie，確認是 admin 角色才放行。

### 3. 後台頁面改造（`/dashboard/admin/users`）

- **之前**：直接 import `getAllUsers()`，數據在客戶端 bundle 中固化
- **之後**：`useEffect` 在組件掛載時呼叫 `/api/admin/users`，數據實時從文件讀取
- 停用/啓用按鈕改為呼叫 `PATCH /api/admin/users/[id]`，結果持久化到文件
- 新增「刷新」按鈕，可手動重新拉取最新用戶列表

## 數據流程圖

```
前台注冊/登入
    │
    ▼
POST /api/user/auth/register
POST /api/user/auth/login
    │  (fs write)
    ▼
data/users.json  ◄──────────────────────────────────┐
    │                                                │
    │  (fs read)                                     │
    ▼                                                │
GET /api/admin/users                          PATCH /api/admin/users/[id]
    │                                                │
    ▼                                                │
後台用戶管理頁面  ──── 管理員點擊「停用/啓用」 ───────────┘
```

## 文件一覽

```
src/
  lib/
    user-store.ts          ← 新增：文件持久化存儲核心
    mock-users.ts          ← 更新：改為 user-store 的兼容 shim
  app/
    api/
      user/auth/
        register/route.ts  ← 更新：改用 user-store.registerUser
        login/route.ts     ← 更新：登入時更新 lastSeen
      admin/
        users/
          route.ts         ← 新增：GET 全部用戶（admin only）
          [id]/route.ts    ← 新增：PATCH 修改用戶狀態（admin only）
    dashboard/admin/users/
      page.tsx             ← 更新：改為 API fetch，實時數據
data/
  users.json               ← 新增：用戶持久化數據文件
```

## Demo 帳號

**管理員登入**（`/login`）：
- Email: `admin@yourwinebook.com`
- 密碼: `admin123`

**前台用戶登入**（`/zh-HK/account/login`）：
- `david@demo.com` / `user123`
- `mary@demo.com` / `user123`
- `james@demo.com` / `user123`
- `sophie@demo.com` / `user123`

新注冊的用戶會立即出現在後台用戶管理列表中。
