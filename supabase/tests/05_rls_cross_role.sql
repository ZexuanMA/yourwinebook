-- ============================================================
-- RLS Tests — Cross-role violations & edge cases
-- ============================================================

BEGIN;

SELECT plan(16);

-- ── Seed data ──
DO $$
DECLARE
  v_user_a     UUID := 'a5000000-0000-0000-0000-000000000001';
  v_user_b     UUID := 'a5000000-0000-0000-0000-000000000002';
  v_admin_id   UUID := 'a5000000-0000-0000-0000-000000000099';
  v_staff_a    UUID := 'a5000000-0000-0000-0000-000000000010';
  v_merchant_a UUID := 'b5000000-0000-0000-0000-000000000001';
  v_wine_id    UUID := 'c5000000-0000-0000-0000-000000000001';
  v_post_vis   UUID := 'a5100000-0000-0000-0000-000000000001';
  v_post_hid   UUID := 'a5100000-0000-0000-0000-000000000002';
BEGIN
  INSERT INTO auth.users (id, instance_id, aud, role, email, encrypted_password, email_confirmed_at, raw_app_meta_data, raw_user_meta_data, created_at, updated_at, confirmation_token)
  VALUES
    (v_user_a, '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 't05_a@test.com', crypt('pass', gen_salt('bf')), now(), '{"provider":"email","providers":["email"]}', '{}', now(), now(), ''),
    (v_user_b, '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 't05_b@test.com', crypt('pass', gen_salt('bf')), now(), '{"provider":"email","providers":["email"]}', '{}', now(), now(), ''),
    (v_admin_id, '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 't05_admin@test.com', crypt('pass', gen_salt('bf')), now(), '{"provider":"email","providers":["email"]}', '{}', now(), now(), ''),
    (v_staff_a, '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 't05_staff@test.com', crypt('pass', gen_salt('bf')), now(), '{"provider":"email","providers":["email"]}', '{}', now(), now(), '');

  INSERT INTO profiles (id, display_name, email, role) VALUES
    (v_user_a, 'T05 User A', 't05_a@test.com', 'user'),
    (v_user_b, 'T05 User B', 't05_b@test.com', 'user'),
    (v_admin_id, 'T05 Admin', 't05_admin@test.com', 'admin'),
    (v_staff_a, 'T05 Staff', 't05_staff@test.com', 'merchant_staff');

  INSERT INTO merchants (id, slug, name, description_zh, description_en)
  VALUES (v_merchant_a, 't05-merchant', 'T05 Merchant', '酒商', 'Merchant');

  INSERT INTO merchant_staff (profile_id, merchant_id) VALUES (v_staff_a, v_merchant_a);

  INSERT INTO wines (id, slug, name, type, region_zh, region_en, description_zh, description_en)
  VALUES (v_wine_id, 't05-wine', 'T05 Wine', 'red', '波爾多', 'Bordeaux', '測試', 'Test');

  INSERT INTO posts (id, author_id, content, status) VALUES
    (v_post_vis, v_user_a, 'Visible', 'visible'),
    (v_post_hid, v_user_a, 'Hidden', 'hidden');

  INSERT INTO post_media (post_id, url, mime_type, sort_order) VALUES
    (v_post_vis, 'https://example.com/vis.jpg', 'image/jpeg', 0),
    (v_post_hid, 'https://example.com/hid.jpg', 'image/jpeg', 0);

  INSERT INTO post_products (post_id, wine_id) VALUES
    (v_post_vis, v_wine_id),
    (v_post_hid, v_wine_id);

  INSERT INTO media_uploads (user_id, bucket, path, mime_type) VALUES
    (v_user_a, 'posts', 'a.jpg', 'image/jpeg'),
    (v_user_b, 'posts', 'b.jpg', 'image/jpeg');

  INSERT INTO blocks (blocker_id, blocked_id) VALUES (v_user_a, v_user_b);
END;
$$;

-- ════════════════════════════════════════════════════════════
-- 1. Role escalation prevention
-- ════════════════════════════════════════════════════════════
SET LOCAL role TO 'authenticated';
SET LOCAL "request.jwt.claim.sub" TO 'a5000000-0000-0000-0000-000000000001';
SET LOCAL "request.jwt.claims" TO '{"sub":"a5000000-0000-0000-0000-000000000001","role":"authenticated"}';

SELECT throws_ok(
  $$INSERT INTO merchant_staff (profile_id, merchant_id) VALUES ('a5000000-0000-0000-0000-000000000001', 'b5000000-0000-0000-0000-000000000001')$$,
  NULL, NULL, 'user cannot self-assign as merchant staff'
);

-- ════════════════════════════════════════════════════════════
-- 2. Post media visibility follows post status
-- ════════════════════════════════════════════════════════════
SET LOCAL "request.jwt.claim.sub" TO 'a5000000-0000-0000-0000-000000000002';
SET LOCAL "request.jwt.claims" TO '{"sub":"a5000000-0000-0000-0000-000000000002","role":"authenticated"}';

SELECT is((SELECT count(*) FROM post_media WHERE post_id IN ('a5100000-0000-0000-0000-000000000001', 'a5100000-0000-0000-0000-000000000002'))::INT, 1, 'user_b can only see media from visible posts');
SELECT is((SELECT count(*) FROM post_products WHERE post_id IN ('a5100000-0000-0000-0000-000000000001', 'a5100000-0000-0000-0000-000000000002'))::INT, 1, 'user_b can only see products from visible posts');

-- Admin sees all
SET LOCAL "request.jwt.claim.sub" TO 'a5000000-0000-0000-0000-000000000099';
SET LOCAL "request.jwt.claims" TO '{"sub":"a5000000-0000-0000-0000-000000000099","role":"authenticated"}';

SELECT is((SELECT count(*) FROM post_media WHERE post_id IN ('a5100000-0000-0000-0000-000000000001', 'a5100000-0000-0000-0000-000000000002'))::INT, 2, 'admin can see all post media including hidden');
SELECT is((SELECT count(*) FROM post_products WHERE post_id IN ('a5100000-0000-0000-0000-000000000001', 'a5100000-0000-0000-0000-000000000002'))::INT, 2, 'admin can see all post products including hidden');

-- ════════════════════════════════════════════════════════════
-- 3. Media uploads isolation
-- ════════════════════════════════════════════════════════════
SET LOCAL "request.jwt.claim.sub" TO 'a5000000-0000-0000-0000-000000000001';
SET LOCAL "request.jwt.claims" TO '{"sub":"a5000000-0000-0000-0000-000000000001","role":"authenticated"}';

SELECT is((SELECT count(*) FROM media_uploads)::INT, 1, 'user_a can only see own media uploads');

SET LOCAL "request.jwt.claim.sub" TO 'a5000000-0000-0000-0000-000000000002';
SET LOCAL "request.jwt.claims" TO '{"sub":"a5000000-0000-0000-0000-000000000002","role":"authenticated"}';

SELECT is((SELECT count(*) FROM media_uploads)::INT, 1, 'user_b can only see own media uploads');

-- User A tries to modify user B's upload
SET LOCAL "request.jwt.claim.sub" TO 'a5000000-0000-0000-0000-000000000001';
SET LOCAL "request.jwt.claims" TO '{"sub":"a5000000-0000-0000-0000-000000000001","role":"authenticated"}';

UPDATE media_uploads SET status = 'expired' WHERE user_id = 'a5000000-0000-0000-0000-000000000002';

SET LOCAL role TO 'postgres';
SET LOCAL "request.jwt.claims" TO '';
SET LOCAL "request.jwt.claim.sub" TO '';

SELECT is(
  (SELECT status FROM media_uploads WHERE user_id = 'a5000000-0000-0000-0000-000000000002'),
  'pending', 'user_a cannot modify user_b uploads (unchanged)'
);

-- ════════════════════════════════════════════════════════════
-- 4. Post media: user can only add to own posts
-- ════════════════════════════════════════════════════════════
SET LOCAL role TO 'authenticated';
SET LOCAL "request.jwt.claim.sub" TO 'a5000000-0000-0000-0000-000000000002';
SET LOCAL "request.jwt.claims" TO '{"sub":"a5000000-0000-0000-0000-000000000002","role":"authenticated"}';

SELECT throws_ok(
  $$INSERT INTO post_media (post_id, url, mime_type) VALUES ('a5100000-0000-0000-0000-000000000001', 'https://evil.com/x.jpg', 'image/jpeg')$$,
  NULL, NULL, 'user_b cannot add media to user_a post'
);
SELECT throws_ok(
  $$INSERT INTO post_products (post_id, wine_id) VALUES ('a5100000-0000-0000-0000-000000000001', 'c5000000-0000-0000-0000-000000000001')$$,
  NULL, NULL, 'user_b cannot add products to user_a post'
);

-- ════════════════════════════════════════════════════════════
-- 5. Blocks isolation
-- ════════════════════════════════════════════════════════════
SET LOCAL "request.jwt.claim.sub" TO 'a5000000-0000-0000-0000-000000000001';
SET LOCAL "request.jwt.claims" TO '{"sub":"a5000000-0000-0000-0000-000000000001","role":"authenticated"}';

SELECT is((SELECT count(*) FROM blocks)::INT, 1, 'user_a can see own blocks');

SET LOCAL "request.jwt.claim.sub" TO 'a5000000-0000-0000-0000-000000000002';
SET LOCAL "request.jwt.claims" TO '{"sub":"a5000000-0000-0000-0000-000000000002","role":"authenticated"}';

SELECT is((SELECT count(*) FROM blocks)::INT, 0, 'user_b cannot see blocks where they are blocked_id');

-- ════════════════════════════════════════════════════════════
-- 6. Anon cannot do authenticated-only operations
-- ════════════════════════════════════════════════════════════
SET LOCAL role TO 'anon';
SET LOCAL "request.jwt.claims" TO '{}';
SET LOCAL "request.jwt.claim.sub" TO '';

SELECT throws_ok(
  $$INSERT INTO posts (author_id, content) VALUES ('a5000000-0000-0000-0000-000000000001', 'Anon post')$$,
  NULL, NULL, 'anon cannot create posts'
);
SELECT throws_ok(
  $$INSERT INTO comments (post_id, author_id, content) VALUES ('a5100000-0000-0000-0000-000000000001', 'a5000000-0000-0000-0000-000000000001', 'Comment')$$,
  NULL, NULL, 'anon cannot create comments'
);
SELECT throws_ok(
  $$INSERT INTO post_likes (post_id, user_id) VALUES ('a5100000-0000-0000-0000-000000000001', 'a5000000-0000-0000-0000-000000000001')$$,
  NULL, NULL, 'anon cannot like posts'
);
SELECT throws_ok(
  $$INSERT INTO reports (reporter_id, target_type, target_id, reason) VALUES ('a5000000-0000-0000-0000-000000000001', 'post', 'a5100000-0000-0000-0000-000000000001', 'spam')$$,
  NULL, NULL, 'anon cannot create reports'
);

SELECT * FROM finish();
ROLLBACK;
