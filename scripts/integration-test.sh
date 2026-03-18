#!/usr/bin/env bash
# P0b-20: Web data layer migration integration test
# Tests all migrated stores via API endpoints in legacy (no Supabase) mode.
set -uo pipefail

BASE="http://localhost:3000"
PASS=0
FAIL=0
ERRORS=""

pass() { ((PASS++)) || true; echo "  ✅ $1"; }
fail() { ((FAIL++)) || true; ERRORS+="  ❌ $1\n"; echo "  ❌ $1"; }

check_status() {
  local desc="$1" url="$2" expected="$3"
  shift 3
  local code
  code=$(curl -s -o /dev/null -w "%{http_code}" "$@" "$url") || true
  if [ "$code" = "$expected" ]; then pass "$desc (HTTP $code)"; else fail "$desc: expected $expected, got $code"; fi
}

check_json() {
  local desc="$1" url="$2" jq_expr="$3" expected="$4"
  shift 4
  local result
  result=$(curl -s "$@" "$url" | python3 -c "import sys,json; d=json.load(sys.stdin); print($jq_expr)" 2>/dev/null) || result="ERROR"
  if [ "$result" = "$expected" ]; then pass "$desc → $result"; else fail "$desc: expected '$expected', got '$result'"; fi
}

echo "═══════════════════════════════════════"
echo "Web 数据层迁移集成测试"
echo "═══════════════════════════════════════"

# ──────────────────────────────────────
echo ""
echo "1. 公开数据 (queries.ts)"
echo "──────────────────────────────────────"
check_status "GET /api/wines" "$BASE/api/wines" "200"
check_json "wines count = 32" "$BASE/api/wines" "len(d.get('wines',[]))" "32"
check_status "GET /api/wines/detail" "$BASE/api/wines/chianti-classico-castello-di-ama-2020" "200"
check_status "GET /api/wines/prices" "$BASE/api/wines/cloudy-bay-sauvignon-blanc-2023/prices" "200"
check_json "cloudy-bay prices = 6" "$BASE/api/wines/cloudy-bay-sauvignon-blanc-2023/prices" "len(d)" "6"
check_status "GET /api/merchants" "$BASE/api/merchants" "200"
check_json "merchants count = 6" "$BASE/api/merchants" "len(d)" "6"
check_status "GET /api/merchants/detail" "$BASE/api/merchants/watsons-wine" "200"
check_status "GET /api/merchants/wines" "$BASE/api/merchants/watsons-wine/wines" "200"
check_status "GET /api/scenes" "$BASE/api/scenes" "200"
check_json "scenes count = 4" "$BASE/api/scenes" "len(d)" "4"
check_status "GET /api/search" "$BASE/api/search?q=wine" "200"
check_status "GET /api/search regions" "$BASE/api/search?action=regions" "200"
check_status "404 on bad wine slug" "$BASE/api/wines/nonexistent-wine" "404"

# ──────────────────────────────────────
echo ""
echo "2. 酒商认证 (merchant-store + mock-auth)"
echo "──────────────────────────────────────"
MERCHANT_COOKIES=$(mktemp)
MERCHANT_CODE=$(curl -s -o /dev/null -w "%{http_code}" -c "$MERCHANT_COOKIES" \
  -X POST "$BASE/api/auth/login" \
  -H "Content-Type: application/json" \
  -d '{"email":"watsons@demo.com","password":"demo123"}') || true
if [ "$MERCHANT_CODE" = "200" ]; then pass "Merchant login (HTTP 200)"; else fail "Merchant login: expected 200, got $MERCHANT_CODE"; fi

check_json "Merchant /auth/me → role" "$BASE/api/auth/me" "d.get('role','?')" "merchant" -b "$MERCHANT_COOKIES"
check_json "Merchant /auth/me → name" "$BASE/api/auth/me" "'ok' if d.get('name') else 'no'" "ok" -b "$MERCHANT_COOKIES"

# Logout
check_status "Merchant logout" "$BASE/api/auth/logout" "200" -X POST -b "$MERCHANT_COOKIES"

# Re-login for subsequent tests
MERCHANT_CODE2=$(curl -s -o /dev/null -w "%{http_code}" -c "$MERCHANT_COOKIES" \
  -X POST "$BASE/api/auth/login" \
  -H "Content-Type: application/json" \
  -d '{"email":"watsons@demo.com","password":"demo123"}') || true

# ──────────────────────────────────────
echo ""
echo "3. 用户认证 (user-store)"
echo "──────────────────────────────────────"
# Test suspended user gets 403 (data file has all users suspended from previous testing)
USER_CODE=$(curl -s -o /dev/null -w "%{http_code}" \
  -X POST "$BASE/api/user/auth/login" \
  -H "Content-Type: application/json" \
  -d '{"email":"david@demo.com","password":"user123"}') || true
if [ "$USER_CODE" = "403" ]; then
  pass "Suspended user blocked (HTTP 403)"
else
  fail "Suspended user: expected 403, got $USER_CODE"
fi

# Register a new test user
REG_COOKIES=$(mktemp)
REG_CODE=$(curl -s -o /dev/null -w "%{http_code}" -c "$REG_COOKIES" \
  -X POST "$BASE/api/user/auth/register" \
  -H "Content-Type: application/json" \
  -d '{"name":"Integration Tester","email":"inttest@test.com","password":"test1234"}') || true
if [ "$REG_CODE" = "200" ] || [ "$REG_CODE" = "201" ]; then
  pass "Register user (HTTP $REG_CODE)"
  # Verify me endpoint
  check_json "New user /auth/me name" "$BASE/api/user/auth/me" "d.get('name','?')" "Integration Tester" -b "$REG_COOKIES"

  # Test bookmarks with new user
  BM_CODE=$(curl -s -o /dev/null -w "%{http_code}" -b "$REG_COOKIES" \
    -X POST "$BASE/api/user/bookmarks/wines" \
    -H "Content-Type: application/json" \
    -d '{"wineSlug":"cloudy-bay-sauvignon-blanc-2023"}') || true
  if [ "$BM_CODE" = "200" ]; then pass "Toggle wine bookmark (HTTP 200)"; else fail "Toggle wine bookmark: expected 200, got $BM_CODE"; fi

  MBM_CODE=$(curl -s -o /dev/null -w "%{http_code}" -b "$REG_COOKIES" \
    -X POST "$BASE/api/user/bookmarks/merchants" \
    -H "Content-Type: application/json" \
    -d '{"merchantSlug":"watsons-wine"}') || true
  if [ "$MBM_CODE" = "200" ]; then pass "Toggle merchant bookmark (HTTP 200)"; else fail "Toggle merchant bookmark: expected 200, got $MBM_CODE"; fi

  # Logout
  check_status "User logout" "$BASE/api/user/auth/logout" "200" -X POST -b "$REG_COOKIES"
else
  # User may already exist from previous test run
  USER_COOKIES=$(mktemp)
  LOGIN_CODE=$(curl -s -o /dev/null -w "%{http_code}" -c "$USER_COOKIES" \
    -X POST "$BASE/api/user/auth/login" \
    -H "Content-Type: application/json" \
    -d '{"email":"inttest@test.com","password":"test1234"}') || true
  if [ "$LOGIN_CODE" = "200" ]; then
    pass "Login existing test user (HTTP 200)"
    check_json "Test user /auth/me name" "$BASE/api/user/auth/me" "d.get('name','?')" "Integration Tester" -b "$USER_COOKIES"

    BM_CODE=$(curl -s -o /dev/null -w "%{http_code}" -b "$USER_COOKIES" \
      -X POST "$BASE/api/user/bookmarks/wines" \
      -H "Content-Type: application/json" \
      -d '{"wineSlug":"cloudy-bay-sauvignon-blanc-2023"}') || true
    if [ "$BM_CODE" = "200" ]; then pass "Toggle wine bookmark (HTTP 200)"; else fail "Toggle wine bookmark: expected 200, got $BM_CODE"; fi
    rm -f "$USER_COOKIES"
  else
    fail "Could not register or login test user (reg=$REG_CODE, login=$LOGIN_CODE)"
  fi
fi

# ──────────────────────────────────────
echo ""
echo "4. 入驻申请 (application-store)"
echo "──────────────────────────────────────"
# Submit application (public, no auth needed)
APP_RESULT=$(curl -s -X POST "$BASE/api/merchant-applications" \
  -H "Content-Type: application/json" \
  -d '{"company_name":"Test Wines","contact_name":"Tester","email":"test@test.com","phone":"12345","wine_count":10}') || true
APP_ID=$(echo "$APP_RESULT" | python3 -c "import sys,json; print(json.load(sys.stdin).get('id',''))" 2>/dev/null) || APP_ID=""
if [ -n "$APP_ID" ]; then pass "Create application → id=$APP_ID"; else fail "Create application: no id returned"; fi

# ──────────────────────────────────────
echo ""
echo "5. 酒款价格 (price-store)"
echo "──────────────────────────────────────"
check_status "Merchant GET wines" "$BASE/api/merchant/wines" "200" -b "$MERCHANT_COOKIES"

# Update price
PRICE_CODE=$(curl -s -o /dev/null -w "%{http_code}" -b "$MERCHANT_COOKIES" \
  -X PATCH "$BASE/api/merchant/wines/cloudy-bay-sauvignon-blanc-2023/price" \
  -H "Content-Type: application/json" \
  -d '{"price":142}') || true
if [ "$PRICE_CODE" = "200" ]; then pass "Update wine price (HTTP 200)"; else fail "Update wine price: expected 200, got $PRICE_CODE"; fi

# Verify price reflects
check_json "Price updated for watsons" "$BASE/api/wines/cloudy-bay-sauvignon-blanc-2023/prices" \
  "next((p['price'] for p in d if p.get('merchantSlug')=='watsons-wine'), 'missing')" "142"

# Unauthorized price update should fail
check_status "No auth → 401 on price update" "$BASE/api/merchant/wines/cloudy-bay-sauvignon-blanc-2023/price" "401" \
  -X PATCH -H "Content-Type: application/json" -d '{"price":999}'

# ──────────────────────────────────────
echo ""
echo "6. 社区 (community-store)"
echo "──────────────────────────────────────"
check_status "GET community posts" "$BASE/api/community/posts" "200"
check_json "Posts exist" "$BASE/api/community/posts" "'ok' if len(d.get('posts',[])) > 0 else 'empty'" "ok"

# Get first post id
FIRST_POST=$(curl -s "$BASE/api/community/posts" | python3 -c "import sys,json; d=json.load(sys.stdin); posts=d.get('posts',[]); print(posts[0]['id'] if posts else '')" 2>/dev/null) || FIRST_POST=""
if [ -n "$FIRST_POST" ]; then
  check_status "GET post detail" "$BASE/api/community/posts/$FIRST_POST" "200"
  check_status "GET post comments" "$BASE/api/community/posts/$FIRST_POST/comments" "200"
fi

# ──────────────────────────────────────
echo ""
echo "7. 管理后台 — 使用酒商账号测试权限边界"
echo "──────────────────────────────────────"
# Merchant should not have admin access
check_status "Merchant → 401 on admin accounts" "$BASE/api/admin/accounts" "401" -b "$MERCHANT_COOKIES"

# No auth should fail
check_status "No auth → 401 on admin accounts" "$BASE/api/admin/accounts" "401"

# ──────────────────────────────────────
echo ""
echo "8. 流量分析 (analytics-store, SQLite)"
echo "──────────────────────────────────────"
TRACK_CODE=$(curl -s -o /dev/null -w "%{http_code}" \
  -X POST "$BASE/api/track" \
  -H "Content-Type: application/json" \
  -d '{"type":"pageview","path":"/zh-HK","sessionId":"test-session-123"}') || true
if [ "$TRACK_CODE" = "200" ]; then pass "Track event (HTTP 200)"; else fail "Track event: expected 200, got $TRACK_CODE"; fi

# ──────────────────────────────────────
echo ""
echo "10. 管理员专属 API"
echo "──────────────────────────────────────"
ADMIN_COOKIES=$(mktemp)
ADMIN_BODY=$(python3 -c "import json; print(json.dumps({'email':'Zexuan@admin.com','password':'ad7581jnP123!'}))")
ADMIN_CODE=$(curl -s -o /dev/null -w "%{http_code}" -c "$ADMIN_COOKIES" \
  -X POST "$BASE/api/auth/login" \
  -H "Content-Type: application/json" \
  -d "$ADMIN_BODY") || true
if [ "$ADMIN_CODE" = "200" ]; then pass "Admin login (HTTP 200)"; else fail "Admin login: expected 200, got $ADMIN_CODE"; fi

check_status "GET /api/admin/accounts" "$BASE/api/admin/accounts" "200" -b "$ADMIN_COOKIES"
check_json "Admin accounts has merchants" "$BASE/api/admin/accounts" "'ok' if len(d) > 0 else 'empty'" "ok" -b "$ADMIN_COOKIES"
check_status "GET /api/admin/applications" "$BASE/api/admin/applications" "200" -b "$ADMIN_COOKIES"
check_status "GET /api/admin/users" "$BASE/api/admin/users" "200" -b "$ADMIN_COOKIES"
check_json "Admin users list" "$BASE/api/admin/users" "'ok' if len(d) > 0 else 'empty'" "ok" -b "$ADMIN_COOKIES"
check_status "GET /api/admin/analytics" "$BASE/api/admin/analytics" "200" -b "$ADMIN_COOKIES"
check_status "Admin logout" "$BASE/api/auth/logout" "200" -X POST -b "$ADMIN_COOKIES"

# ──────────────────────────────────────
echo ""
echo "11. 页面渲染"
echo "──────────────────────────────────────"
check_status "Homepage" "$BASE/zh-HK" "200"
check_status "Search page" "$BASE/zh-HK/search" "200"
check_status "Merchants page" "$BASE/zh-HK/merchants" "200"
check_status "Dashboard → login redirect" "$BASE/dashboard" "307"
check_status "Login page" "$BASE/login" "200"

# Clean up
rm -f "$MERCHANT_COOKIES" "$REG_COOKIES" "$ADMIN_COOKIES" 2>/dev/null || true

# ──────────────────────────────────────
echo ""
echo "═══════════════════════════════════════"
echo "结果: $PASS 通过, $FAIL 失败"
echo "═══════════════════════════════════════"

if [ "$FAIL" -gt 0 ]; then
  echo ""
  echo "失败项:"
  echo -e "$ERRORS"
  exit 1
fi
