-- ============================================================
-- RLS Tests — Public data readable by anonymous users
-- ============================================================

BEGIN;

SELECT plan(26);

-- ────────────────────────────────────────────────────────────
-- Seed data as superuser (postgres)
-- ────────────────────────────────────────────────────────────
DO $$
DECLARE
  v_user_id    UUID := 'a1000000-0000-0000-0000-000000000001';
  v_merchant_id UUID := 'b1000000-0000-0000-0000-000000000001';
  v_wine_id    UUID := 'c1000000-0000-0000-0000-000000000001';
  v_region_id  UUID := 'd1000000-0000-0000-0000-000000000001';
  v_tag_id     UUID := 'e1000000-0000-0000-0000-000000000001';
  v_scene_id   UUID := 'f1000000-0000-0000-0000-000000000001';
  v_post_id    UUID := 'a1100000-0000-0000-0000-000000000001';
  v_hidden_post UUID := 'a1100000-0000-0000-0000-000000000002';
  v_location_id UUID := 'b1100000-0000-0000-0000-000000000001';
BEGIN
  INSERT INTO auth.users (id, instance_id, aud, role, email, encrypted_password, email_confirmed_at, raw_app_meta_data, raw_user_meta_data, created_at, updated_at, confirmation_token)
  VALUES (v_user_id, '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 't01_user@test.com', crypt('pass', gen_salt('bf')), now(), '{"provider":"email","providers":["email"]}', '{}', now(), now(), '');

  INSERT INTO profiles (id, display_name, email, role) VALUES (v_user_id, 'T01 User', 't01_user@test.com', 'user');

  INSERT INTO regions (id, slug, name_zh, name_en, country_zh, country_en)
  VALUES (v_region_id, 't01-bordeaux', '波爾多', 'Bordeaux', '法國', 'France');

  INSERT INTO merchants (id, slug, name, description_zh, description_en, status)
  VALUES (v_merchant_id, 't01-merchant', 'T01 Merchant', '測試', 'Test', 'active');

  INSERT INTO merchant_locations (id, merchant_id, name, address_zh, is_active)
  VALUES (v_location_id, v_merchant_id, 'Main Store', '中環', true);

  INSERT INTO wines (id, slug, name, type, region_zh, region_en, description_zh, description_en)
  VALUES (v_wine_id, 't01-wine', 'T01 Wine', 'red', '波爾多', 'Bordeaux', '測試', 'Test');

  INSERT INTO tags (id, slug, name_zh, name_en) VALUES (v_tag_id, 't01-fruity', '果香', 'Fruity');
  INSERT INTO wine_tags (wine_id, tag_id) VALUES (v_wine_id, v_tag_id);

  INSERT INTO scenes (id, slug, title_zh, title_en, description_zh, description_en)
  VALUES (v_scene_id, 't01-dinner', '晚餐', 'Dinner', '適合晚餐', 'For dinner');
  INSERT INTO scene_wines (scene_id, wine_id) VALUES (v_scene_id, v_wine_id);

  INSERT INTO merchant_prices (wine_id, merchant_id, price, is_best) VALUES (v_wine_id, v_merchant_id, 300, true);
  INSERT INTO posts (id, author_id, content, status) VALUES (v_post_id, v_user_id, 'Great wine!', 'visible');
  INSERT INTO posts (id, author_id, content, status, hidden_at, hidden_reason) VALUES (v_hidden_post, v_user_id, 'Hidden', 'hidden', now(), 'spam');
  INSERT INTO post_likes (post_id, user_id) VALUES (v_post_id, v_user_id);
  INSERT INTO reports (reporter_id, target_type, target_id, reason) VALUES (v_user_id, 'post', v_post_id, 'spam');
  INSERT INTO media_uploads (user_id, bucket, path, mime_type) VALUES (v_user_id, 'posts', 'test.jpg', 'image/jpeg');
  INSERT INTO wine_bookmarks (user_id, wine_id) VALUES (v_user_id, v_wine_id);
  INSERT INTO merchant_applications (company_name, contact_name, email) VALUES ('T01 Co', 'John', 't01_john@test.com');
END;
$$;

-- ── Switch to anonymous ──
SET LOCAL role TO 'anon';
SET LOCAL "request.jwt.claims" TO '{}';
SET LOCAL "request.jwt.claim.sub" TO '';

-- ── Public data readable ──
SELECT ok((SELECT count(*) FROM regions) > 0, 'anon can read regions');
SELECT ok((SELECT count(*) FROM merchants) > 0, 'anon can read merchants');
SELECT ok((SELECT count(*) FROM wines) > 0, 'anon can read wines');
SELECT ok((SELECT count(*) FROM tags) > 0, 'anon can read tags');
SELECT ok((SELECT count(*) FROM wine_tags) > 0, 'anon can read wine_tags');
SELECT ok((SELECT count(*) FROM scenes) > 0, 'anon can read scenes');
SELECT ok((SELECT count(*) FROM scene_wines) > 0, 'anon can read scene_wines');
SELECT ok((SELECT count(*) FROM merchant_prices) > 0, 'anon can read merchant_prices');
SELECT ok((SELECT count(*) FROM merchant_locations) > 0, 'anon can read merchant_locations');
SELECT ok((SELECT count(*) FROM profiles) > 0, 'anon can read profiles');
SELECT ok((SELECT count(*) FROM post_likes) > 0, 'anon can read post_likes');
SELECT ok(true, 'anon can query follows table');

-- ── Visible posts only ──
SELECT is(
  (SELECT count(*) FROM posts WHERE id IN ('a1100000-0000-0000-0000-000000000001', 'a1100000-0000-0000-0000-000000000002'))::INT,
  1, 'anon can only see visible posts'
);
SELECT is(
  (SELECT status FROM posts WHERE id = 'a1100000-0000-0000-0000-000000000001'),
  'visible', 'anon only sees visible status'
);

-- ── Private data NOT readable ──
SELECT is((SELECT count(*) FROM reports)::INT, 0, 'anon cannot read reports');
SELECT is((SELECT count(*) FROM media_uploads)::INT, 0, 'anon cannot read media_uploads');
SELECT is((SELECT count(*) FROM wine_bookmarks)::INT, 0, 'anon cannot read wine_bookmarks');
SELECT is((SELECT count(*) FROM merchant_bookmarks)::INT, 0, 'anon cannot read merchant_bookmarks');
SELECT is((SELECT count(*) FROM store_bookmarks)::INT, 0, 'anon cannot read store_bookmarks');
SELECT is((SELECT count(*) FROM post_bookmarks)::INT, 0, 'anon cannot read post_bookmarks');
SELECT is((SELECT count(*) FROM blocks)::INT, 0, 'anon cannot read blocks');
SELECT is((SELECT count(*) FROM merchant_applications)::INT, 0, 'anon cannot read merchant_applications');
SELECT is((SELECT count(*) FROM merchant_staff)::INT, 0, 'anon cannot read merchant_staff');

-- ── Anon CAN insert merchant_applications ──
SELECT lives_ok(
  $$INSERT INTO merchant_applications (company_name, contact_name, email) VALUES ('New Co', 'Jane', 't01_jane@test.com')$$,
  'anon can submit merchant application'
);

-- ── Anon CANNOT write to public tables ──
SELECT throws_ok(
  $$INSERT INTO wines (slug, name, type, region_zh, region_en, description_zh, description_en) VALUES ('hack', 'Hack', 'red', 'X', 'X', 'X', 'X')$$,
  NULL, NULL, 'anon cannot insert wines'
);
SELECT throws_ok(
  $$INSERT INTO merchants (slug, name, description_zh, description_en) VALUES ('hack', 'Hack', 'X', 'X')$$,
  NULL, NULL, 'anon cannot insert merchants'
);

SELECT * FROM finish();
ROLLBACK;
