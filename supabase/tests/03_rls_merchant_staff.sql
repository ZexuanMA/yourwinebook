-- ============================================================
-- RLS Tests — Merchant staff operations
-- ============================================================

BEGIN;

SELECT plan(12);

-- ── Seed data ──
DO $$
DECLARE
  v_staff_a    UUID := 'a3000000-0000-0000-0000-000000000010';
  v_staff_b    UUID := 'a3000000-0000-0000-0000-000000000020';
  v_regular    UUID := 'a3000000-0000-0000-0000-000000000030';
  v_merchant_a UUID := 'b3000000-0000-0000-0000-000000000001';
  v_merchant_b UUID := 'b3000000-0000-0000-0000-000000000002';
  v_wine_id    UUID := 'c3000000-0000-0000-0000-000000000001';
  v_location_a UUID := 'b3100000-0000-0000-0000-000000000001';
BEGIN
  INSERT INTO auth.users (id, instance_id, aud, role, email, encrypted_password, email_confirmed_at, raw_app_meta_data, raw_user_meta_data, created_at, updated_at, confirmation_token)
  VALUES
    (v_staff_a, '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 't03_sa@test.com', crypt('pass', gen_salt('bf')), now(), '{"provider":"email","providers":["email"]}', '{}', now(), now(), ''),
    (v_staff_b, '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 't03_sb@test.com', crypt('pass', gen_salt('bf')), now(), '{"provider":"email","providers":["email"]}', '{}', now(), now(), ''),
    (v_regular, '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 't03_reg@test.com', crypt('pass', gen_salt('bf')), now(), '{"provider":"email","providers":["email"]}', '{}', now(), now(), '');

  INSERT INTO profiles (id, display_name, email, role) VALUES
    (v_staff_a, 'T03 Staff A', 't03_sa@test.com', 'merchant_staff'),
    (v_staff_b, 'T03 Staff B', 't03_sb@test.com', 'merchant_staff'),
    (v_regular, 'T03 Regular', 't03_reg@test.com', 'user');

  INSERT INTO merchants (id, slug, name, description_zh, description_en) VALUES
    (v_merchant_a, 't03-merchant-a', 'Merchant A', '酒商A', 'Merchant A'),
    (v_merchant_b, 't03-merchant-b', 'Merchant B', '酒商B', 'Merchant B');

  INSERT INTO merchant_staff (profile_id, merchant_id, role) VALUES
    (v_staff_a, v_merchant_a, 'owner'),
    (v_staff_b, v_merchant_b, 'staff');

  INSERT INTO wines (id, slug, name, type, region_zh, region_en, description_zh, description_en)
  VALUES (v_wine_id, 't03-wine', 'T03 Wine', 'red', '波爾多', 'Bordeaux', '測試', 'Test');

  INSERT INTO merchant_locations (id, merchant_id, name, address_zh)
  VALUES (v_location_a, v_merchant_a, 'Store A', '地址A');
END;
$$;

-- ════════════════════════════════════════════════════════════
-- As Staff A (owns merchant_a)
-- ════════════════════════════════════════════════════════════
SET LOCAL role TO 'authenticated';
SET LOCAL "request.jwt.claim.sub" TO 'a3000000-0000-0000-0000-000000000010';
SET LOCAL "request.jwt.claims" TO '{"sub":"a3000000-0000-0000-0000-000000000010","role":"authenticated"}';

SELECT is((SELECT count(*) FROM merchant_staff)::INT, 1, 'staff_a can see own merchant_staff record');

SELECT lives_ok(
  $$INSERT INTO merchant_locations (merchant_id, name, address_zh) VALUES ('b3000000-0000-0000-0000-000000000001', 'New Store', '新地址')$$,
  'staff_a can add location for own merchant'
);
SELECT lives_ok(
  $$UPDATE merchant_locations SET name = 'Updated' WHERE id = 'b3100000-0000-0000-0000-000000000001'$$,
  'staff_a can update own merchant location'
);
SELECT lives_ok(
  $$INSERT INTO merchant_prices (wine_id, merchant_id, price) VALUES ('c3000000-0000-0000-0000-000000000001', 'b3000000-0000-0000-0000-000000000001', 250)$$,
  'staff_a can add price for own merchant'
);
SELECT lives_ok(
  $$UPDATE merchant_prices SET price = 260 WHERE merchant_id = 'b3000000-0000-0000-0000-000000000001'$$,
  'staff_a can update price for own merchant'
);

-- ── Cannot manage other merchant ──
SELECT throws_ok(
  $$INSERT INTO merchant_locations (merchant_id, name, address_zh) VALUES ('b3000000-0000-0000-0000-000000000002', 'Hack', '偷偷')$$,
  NULL, NULL, 'staff_a cannot add location for merchant_b'
);
SELECT throws_ok(
  $$INSERT INTO merchant_prices (wine_id, merchant_id, price) VALUES ('c3000000-0000-0000-0000-000000000001', 'b3000000-0000-0000-0000-000000000002', 100)$$,
  NULL, NULL, 'staff_a cannot add price for merchant_b'
);
SELECT throws_ok(
  $$INSERT INTO merchants (slug, name, description_zh, description_en) VALUES ('hack', 'Hack', 'X', 'X')$$,
  NULL, NULL, 'staff cannot insert merchants'
);

-- ── Staff DELETE is silently denied (RLS filters to 0 rows) ──
DELETE FROM merchant_locations WHERE id = 'b3100000-0000-0000-0000-000000000001';

-- Switch to postgres to verify row still exists
SET LOCAL role TO 'postgres';
SET LOCAL "request.jwt.claims" TO '';
SET LOCAL "request.jwt.claim.sub" TO '';

SELECT ok(
  EXISTS(SELECT 1 FROM merchant_locations WHERE id = 'b3100000-0000-0000-0000-000000000001'),
  'staff delete on locations had no effect (row still exists)'
);

-- Back to staff, try delete prices
SET LOCAL role TO 'authenticated';
SET LOCAL "request.jwt.claim.sub" TO 'a3000000-0000-0000-0000-000000000010';
SET LOCAL "request.jwt.claims" TO '{"sub":"a3000000-0000-0000-0000-000000000010","role":"authenticated"}';

DELETE FROM merchant_prices WHERE merchant_id = 'b3000000-0000-0000-0000-000000000001';

SET LOCAL role TO 'postgres';
SET LOCAL "request.jwt.claims" TO '';
SET LOCAL "request.jwt.claim.sub" TO '';

SELECT ok(
  EXISTS(SELECT 1 FROM merchant_prices WHERE merchant_id = 'b3000000-0000-0000-0000-000000000001'),
  'staff delete on prices had no effect (row still exists)'
);

-- ════════════════════════════════════════════════════════════
-- As Regular User
-- ════════════════════════════════════════════════════════════
SET LOCAL role TO 'authenticated';
SET LOCAL "request.jwt.claim.sub" TO 'a3000000-0000-0000-0000-000000000030';
SET LOCAL "request.jwt.claims" TO '{"sub":"a3000000-0000-0000-0000-000000000030","role":"authenticated"}';

SELECT throws_ok(
  $$INSERT INTO merchant_locations (merchant_id, name, address_zh) VALUES ('b3000000-0000-0000-0000-000000000001', 'Hack', 'X')$$,
  NULL, NULL, 'regular user cannot add merchant locations'
);
SELECT is((SELECT count(*) FROM merchant_staff)::INT, 0, 'regular user cannot see merchant_staff');

SELECT * FROM finish();
ROLLBACK;
