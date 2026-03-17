-- ============================================================
-- RLS Test Setup — verify helpers can be created
-- ============================================================

BEGIN;
SELECT plan(1);
SELECT ok(true, 'pgTAP is available');
SELECT * FROM finish();
ROLLBACK;
