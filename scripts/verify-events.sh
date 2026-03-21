#!/bin/bash
# Verify that all defined PostHog events are actually used in the codebase
# Usage: bash scripts/verify-events.sh

echo "=== PostHog Event Verification ==="
echo ""

# Defined events in @ywb/domain/analytics.ts
echo "── Store Funnel Events ──"
for event in location_permission_requested location_permission_granted location_permission_denied \
             store_list_viewed store_card_clicked store_detail_viewed \
             store_bookmarked store_unbookmarked store_navigate_clicked; do
  count=$(grep -r "STORE_EVENTS\.\|\"$event\"" apps/mobile/ --include="*.tsx" --include="*.ts" -l 2>/dev/null | wc -l)
  if [ "$count" -gt 0 ]; then
    echo "  [OK] $event ($count files)"
  else
    echo "  [MISSING] $event"
  fi
done

echo ""
echo "── Community Funnel Events ──"
for event in feed_viewed post_card_clicked post_detail_viewed \
             post_create_started post_create_submitted post_create_success post_create_failed \
             post_liked post_unliked post_bookmarked post_unbookmarked \
             comment_submitted comment_success comment_failed \
             report_submitted user_blocked user_unblocked; do
  KEY=$(echo "$event" | tr '[:lower:]' '[:upper:]')
  count=$(grep -r "COMMUNITY_EVENTS\.$KEY\|\"$event\"" apps/mobile/ --include="*.tsx" --include="*.ts" -l 2>/dev/null | wc -l)
  if [ "$count" -gt 0 ]; then
    echo "  [OK] $event ($count files)"
  else
    echo "  [MISSING] $event"
  fi
done

echo ""
echo "── Auth Events ──"
for event in user_logged_in user_registered user_logged_out; do
  count=$(grep -r "AUTH_EVENTS\.\|\"$event\"" apps/mobile/ --include="*.tsx" --include="*.ts" -l 2>/dev/null | wc -l)
  if [ "$count" -gt 0 ]; then
    echo "  [OK] $event ($count files)"
  else
    echo "  [MISSING] $event"
  fi
done

echo ""
echo "=== Verification Complete ==="
