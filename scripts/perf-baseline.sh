#!/bin/bash
# Performance Baseline Measurement Script
# Usage: bash scripts/perf-baseline.sh [base_url]
# Default: http://localhost:3000

BASE_URL="${1:-http://localhost:3000}"
RESULTS_FILE="perf-baseline-$(date +%Y%m%d-%H%M%S).txt"

echo "=== Performance Baseline Measurement ==="
echo "Target: $BASE_URL"
echo "Date: $(date)"
echo ""

# ── 1. Web Build Size ──
echo "── 1. Web Build Size ──"
if [ -d "apps/web/.next" ]; then
  TOTAL=$(du -sh apps/web/.next 2>/dev/null | cut -f1)
  STATIC=$(du -sh apps/web/.next/static 2>/dev/null | cut -f1)
  SERVER=$(du -sh apps/web/.next/server 2>/dev/null | cut -f1)
  echo "  Total .next: $TOTAL"
  echo "  Static assets: $STATIC"
  echo "  Server bundle: $SERVER"

  echo ""
  echo "  Top 10 largest JS chunks:"
  find apps/web/.next/static -name "*.js" -type f -exec du -h {} \; 2>/dev/null | sort -rh | head -10 | while read size file; do
    echo "    $size  $(basename "$file")"
  done
else
  echo "  [SKIP] No .next build found. Run 'pnpm --filter web build' first."
fi

# ── 2. Mobile Bundle Size ──
echo ""
echo "── 2. Mobile Bundle Size ──"
if command -v npx &> /dev/null && [ -d "apps/mobile" ]; then
  echo "  Measuring Expo web export size..."
  EXPO_OUT=$(cd apps/mobile && npx expo export --platform web --output-dir /tmp/expo-perf-check 2>&1)
  if [ -d "/tmp/expo-perf-check" ]; then
    EXPO_TOTAL=$(du -sh /tmp/expo-perf-check 2>/dev/null | cut -f1)
    EXPO_JS=$(find /tmp/expo-perf-check -name "*.js" -type f -exec du -ch {} + 2>/dev/null | tail -1 | cut -f1)
    echo "  Total export: $EXPO_TOTAL"
    echo "  JS bundles: $EXPO_JS"
    rm -rf /tmp/expo-perf-check
  else
    echo "  [SKIP] Expo export failed"
  fi
else
  echo "  [SKIP] Expo not available"
fi

# ── 3. API Response Times ──
echo ""
echo "── 3. API Response Times (5 requests each, avg) ──"

measure_endpoint() {
  local name="$1"
  local url="$2"
  local total=0
  local count=5
  local status=""

  for i in $(seq 1 $count); do
    result=$(curl -s -o /dev/null -w "%{http_code} %{time_total}" "$url" 2>/dev/null)
    status=$(echo "$result" | cut -d' ' -f1)
    time_ms=$(echo "$result" | awk '{printf "%.0f", $2 * 1000}')
    total=$((total + time_ms))
  done

  avg=$((total / count))
  echo "  $name: ${avg}ms (status: $status)"
}

measure_endpoint "GET /zh-HK (homepage)" "$BASE_URL/zh-HK"
measure_endpoint "GET /api/wines" "$BASE_URL/api/wines"
measure_endpoint "GET /api/merchants" "$BASE_URL/api/merchants"
measure_endpoint "GET /api/wines?type=red&page=1" "$BASE_URL/api/wines?type=red&page=1"
measure_endpoint "GET /api/search?q=wine" "$BASE_URL/api/search?q=wine"
measure_endpoint "GET /api/scenes" "$BASE_URL/api/scenes"
measure_endpoint "GET /login" "$BASE_URL/login"

# ── 4. Page Size (transfer) ──
echo ""
echo "── 4. Page Transfer Size ──"

measure_page_size() {
  local name="$1"
  local url="$2"
  size=$(curl -s -o /dev/null -w "%{size_download}" "$url" 2>/dev/null)
  if [ "$size" -gt 0 ] 2>/dev/null; then
    if [ "$size" -gt 1048576 ]; then
      echo "  $name: $(echo "scale=1; $size/1048576" | bc)MB"
    elif [ "$size" -gt 1024 ]; then
      echo "  $name: $(echo "scale=1; $size/1024" | bc)KB"
    else
      echo "  $name: ${size}B"
    fi
  else
    echo "  $name: [FAILED]"
  fi
}

measure_page_size "Homepage HTML" "$BASE_URL/zh-HK"
measure_page_size "Search page HTML" "$BASE_URL/zh-HK/search"
measure_page_size "Wines API JSON" "$BASE_URL/api/wines"
measure_page_size "Merchants API JSON" "$BASE_URL/api/merchants"

# ── 5. Database / Store Performance ──
echo ""
echo "── 5. Data Store Check ──"
if [ -f "apps/web/data/analytics.db" ]; then
  DB_SIZE=$(du -h apps/web/data/analytics.db | cut -f1)
  echo "  analytics.db size: $DB_SIZE"
fi
for f in apps/web/data/*.json; do
  if [ -f "$f" ]; then
    SIZE=$(du -h "$f" | cut -f1)
    echo "  $(basename "$f"): $SIZE"
  fi
done

# ── 6. Mobile Performance Notes ──
echo ""
echo "── 6. Mobile Performance Baseline (Manual Testing Protocol) ──"
echo "  Cold start target: < 3s (measure from tap to first frame)"
echo "  Hot start target: < 1s (measure from background resume)"
echo "  Feed scroll: 60fps target (check with Perf Monitor overlay)"
echo "  Post submission: < 5s including image upload"
echo "  Store list load: < 2s from location grant to list render"
echo "  Method: Use Expo dev tools Performance Monitor or React DevTools Profiler"

echo ""
echo "=== Baseline Complete ==="
