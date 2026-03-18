# 剩余待办事项

> Phase 0b 残留风险已全部修复，以下为外部服务配置项，按需处理。

---

## 1. Sentry Source Map 配置（Low）

让 Sentry 错误报告显示原始代码而非压缩后的代码。

**步骤：**
1. 在 [sentry.io](https://sentry.io) 创建项目（或使用已有项目）
2. 获取以下三个值：
   - `SENTRY_AUTH_TOKEN`：Settings → Auth Tokens → Create New Token
   - `SENTRY_ORG`：组织 slug（URL 中的 `sentry.io/organizations/<这个>/`）
   - `SENTRY_PROJECT`：项目 slug
3. 在服务器上设置环境变量：
   ```bash
   # Web（Next.js）
   NEXT_PUBLIC_SENTRY_DSN=https://xxx@sentry.io/xxx
   SENTRY_AUTH_TOKEN=sntrys_xxx
   SENTRY_ORG=your-org
   SENTRY_PROJECT=your-wine-book-web

   # Mobile（Expo）
   EXPO_PUBLIC_SENTRY_DSN=https://xxx@sentry.io/xxx
   ```
4. 重新 build 即可自动上传 source map

---

## 2. Supabase Mobile 环境变量（当需要 Mobile 连接 Supabase 时）

在 `apps/mobile/eas.json` 的对应 build profile 中添加：
```json
"env": {
  "EXPO_PUBLIC_SUPABASE_URL": "https://xxx.supabase.co",
  "EXPO_PUBLIC_SUPABASE_ANON_KEY": "eyJxxx..."
}
```

---

## 3. App Store / Play Store 提交配置（正式上架时）

### iOS
1. 获取 Apple Developer 账号
2. 在 `eas.json` 的 `submit.production.ios` 中填入：
   - `appleId`：Apple ID 邮箱
   - `ascAppId`：App Store Connect 中的 App ID
   - `appleTeamId`：开发者 Team ID

### Android
1. 在 Google Play Console 创建服务账号
2. 下载 JSON key 文件
3. 在 `eas.json` 的 `submit.production.android` 中填入：
   - `serviceAccountKeyPath`：key 文件路径

---

## 4. CI 验证（首次 PR 时自动触发）

GitHub Actions workflow 已配置好，推送后 CI 会在以下情况自动运行：
- Push to `main`
- PR targeting `main`

**当前状态**：代码已推送到 GitHub，CI 应该已经在跑了。
检查：https://github.com/ZexuanMA/yourwinebook/actions
