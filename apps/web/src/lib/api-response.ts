import { NextRequest, NextResponse } from "next/server";

// ── Bilingual error message map ──────────────────────────────────────────────

const ERROR_MESSAGES: Record<string, { zh: string; en: string }> = {
  // Auth
  invalid_credentials: { zh: "Email 或密碼錯誤", en: "Invalid email or password" },
  no_dashboard_access: { zh: "此帳號無後台權限", en: "This account has no dashboard access" },
  account_suspended: { zh: "此帳號已被停用", en: "This account has been suspended" },
  account_banned: { zh: "帳號已被停用，請聯繫客服", en: "Account suspended. Please contact support" },

  // Password
  current_password_required: { zh: "請輸入當前密碼", en: "Current password is required" },
  password_min_length: { zh: "新密碼至少需要 6 個字符", en: "New password must be at least 6 characters" },
  wrong_current_password: { zh: "當前密碼不正確", en: "Current password is incorrect" },
  password_update_failed: { zh: "密碼更新失敗", en: "Failed to update password" },

  // Register
  missing_required_fields: { zh: "請填寫所有必填項", en: "Please fill in all required fields" },
  password_too_short: { zh: "密碼至少需要 6 個字符", en: "Password must be at least 6 characters" },
  invite_code_required: { zh: "需要邀請碼才能注冊", en: "An invite code is required to register" },
  invite_code_invalid: { zh: "邀請碼無效或已被使用", en: "Invite code is invalid or already used" },
  invite_code_expired: { zh: "邀請碼已過期", en: "Invite code has expired" },
  email_already_registered: { zh: "該 Email 已被注冊", en: "This email is already registered" },

  // Generic
  unauthorized: { zh: "未授權", en: "Unauthorized" },
  internal_error: { zh: "伺服器錯誤", en: "Internal server error" },
  invalid_input: { zh: "輸入無效", en: "Invalid input" },
};

/**
 * Detect preferred language from request.
 * Checks: cookie `NEXT_LOCALE` → Accept-Language header → defaults to "zh".
 */
function detectLocale(request?: NextRequest): "zh" | "en" {
  if (!request) return "zh";

  // 1. Check cookie (set by next-intl)
  const cookie = request.cookies.get("NEXT_LOCALE")?.value;
  if (cookie === "en") return "en";
  if (cookie?.startsWith("zh")) return "zh";

  // 2. Check Referer for /en/ path prefix
  const referer = request.headers.get("referer") ?? "";
  if (referer.includes("/en/")) return "en";

  // 3. Check Accept-Language header
  const accept = request.headers.get("accept-language") ?? "";
  if (accept.startsWith("en")) return "en";

  return "zh";
}

/**
 * Return a JSON error response with i18n message.
 *
 * @param key - Error key from ERROR_MESSAGES, or a plain string fallback
 * @param status - HTTP status code
 * @param request - Optional NextRequest for locale detection
 */
export function apiError(
  key: string,
  status: number,
  request?: NextRequest
): NextResponse {
  const locale = detectLocale(request);
  const entry = ERROR_MESSAGES[key];
  const message = entry
    ? locale === "en" ? entry.en : entry.zh
    : key; // fallback: use key as literal message
  return NextResponse.json({ error: message }, { status });
}

/**
 * Wrap an API route handler with top-level try-catch.
 */
export function withErrorHandler<TArgs extends unknown[]>(
  handler: (request: NextRequest, ...args: TArgs) => Promise<NextResponse>
) {
  return async (request: NextRequest, ...args: TArgs): Promise<NextResponse> => {
    try {
      return await handler(request, ...args);
    } catch (error) {
      console.error("[API Error]", error);
      return apiError("internal_error", 500, request);
    }
  };
}
