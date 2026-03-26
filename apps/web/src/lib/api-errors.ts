/**
 * Standardized API error responses with error codes.
 *
 * Usage: return apiError("UNAUTHORIZED") or apiError("VALIDATION", "Name is required")
 */
import { NextResponse } from "next/server";

interface ApiErrorDef {
  status: number;
  message: string;
}

const ERRORS: Record<string, ApiErrorDef> = {
  // Auth errors (401)
  UNAUTHORIZED: { status: 401, message: "Unauthorized" },
  INVALID_CREDENTIALS: { status: 401, message: "Invalid email or password" },
  SESSION_EXPIRED: { status: 401, message: "Session expired" },

  // Permission errors (403)
  FORBIDDEN: { status: 403, message: "Forbidden" },
  ADMIN_ONLY: { status: 403, message: "Admin access required" },
  MERCHANT_INACTIVE: { status: 401, message: "Merchant account is not active" },

  // Rate limit (429)
  RATE_LIMIT: { status: 429, message: "Too many requests. Please try again later." },

  // Validation errors (400)
  VALIDATION: { status: 400, message: "Invalid input" },
  INVALID_JSON: { status: 400, message: "Invalid JSON body" },
  MISSING_FIELD: { status: 400, message: "Required field missing" },

  // Not found (404)
  NOT_FOUND: { status: 404, message: "Not found" },

  // Conflict (409)
  CONFLICT: { status: 409, message: "Resource already exists" },

  // Server error (500)
  INTERNAL: { status: 500, message: "Internal server error" },

  // Service unavailable (503)
  SERVICE_UNAVAILABLE: { status: 503, message: "Service not configured" },
};

export type ErrorCode = keyof typeof ERRORS;

/**
 * Return a standardized JSON error response.
 * @param code - Error code key
 * @param detail - Optional override message with more specific info
 * @param headers - Optional headers (e.g., Retry-After for 429)
 */
export function apiError(
  code: ErrorCode,
  detail?: string,
  headers?: Record<string, string>
): NextResponse {
  const def = ERRORS[code];
  return NextResponse.json(
    { error: detail || def.message, code },
    { status: def.status, headers }
  );
}
