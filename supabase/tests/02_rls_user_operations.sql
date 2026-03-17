-- ============================================================
-- RLS Tests — Authenticated user operations
-- ============================================================

BEGIN;

SELECT plan(28);

-- ── Seed data as superuser ──
DO $$
DECLARE
  v_user_a     UUID := 'a2000000-0000-0000-0000-000000000001';
  v_user_b     UUID := 'a2000000-0000-0000-0000-000000000002';
  v_merchant_id UUID := 'b2000000-0000-0000-0000-000000000001';
  v_wine_id    UUID := 'c2000000-0000-0000-0000-000000000001';
  v_location_id UUID := 'b2100000-0000-0000-0000-000000000001';
  v_post_a     UUID := 'a2100000-0000-0000-0000-000000000001';
  v_post_b     UUID := 'a2100000-0000-0000-0000-000000000002';
BEGIN
  INSERT INTO auth.users (id, instance_id, aud, role, email, encrypted_password, email_confirmed_at, raw_app_meta_data, raw_user_meta_data, created_at, updated_at, confirmation_token)
  VALUES
    (v_user_a, '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 't02_a@test.com', crypt('pass', gen_salt('bf')), now(), '{"provider":"email","providers":["email"]}', '{}', now(), now(), ''),
    (v_user_b, '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 't02_b@test.com', crypt('pass', gen_salt('bf')), now(), '{"provider":"email","providers":["email"]}', '{}', now(), now(), '');

  INSERT INTO profiles (id, display_name, email, role) VALUES
    (v_user_a, 'T02 User A', 't02_a@test.com', 'user'),
    (v_user_b, 'T02 User B', 't02_b@test.com', 'user');

  INSERT INTO merchants (id, slug, name, description_zh, description_en)
  VALUES (v_merchant_id, 't02-merchant', 'T02 Merchant', '測試', 'Test');

  INSERT INTO merchant_locations (id, merchant_id, name, address_zh)
  VALUES (v_location_id, v_merchant_id, 'T02 Store', '地址');

  INSERT INTO wines (id, slug, name, type, region_zh, region_en, description_zh, description_en)
  VALUES (v_wine_id, 't02-wine', 'T02 Wine', 'red', '波爾多', 'Bordeaux', '測試', 'Test');

  INSERT INTO posts (id, author_id, content, status) VALUES
    (v_post_a, v_user_a, 'Post by A', 'visible'),
    (v_post_b, v_user_b, 'Post by B', 'visible');

  INSERT INTO wine_bookmarks (user_id, wine_id) VALUES (v_user_b, v_wine_id);
END;
$$;

-- ════════════════════════════════════════════════════════════
-- As User A
-- ════════════════════════════════════════════════════════════
SET LOCAL role TO 'authenticated';
SET LOCAL "request.jwt.claim.sub" TO 'a2000000-0000-0000-0000-000000000001';
SET LOCAL "request.jwt.claims" TO '{"sub":"a2000000-0000-0000-0000-000000000001","role":"authenticated"}';

-- ── Bookmarks ──
SELECT lives_ok(
  $$INSERT INTO wine_bookmarks (user_id, wine_id) VALUES ('a2000000-0000-0000-0000-000000000001', 'c2000000-0000-0000-0000-000000000001')$$,
  'user_a can add wine bookmark'
);
SELECT is((SELECT count(*) FROM wine_bookmarks)::INT, 1, 'user_a sees only own wine bookmarks');
SELECT lives_ok(
  $$DELETE FROM wine_bookmarks WHERE user_id = 'a2000000-0000-0000-0000-000000000001'$$,
  'user_a can delete own wine bookmark'
);
SELECT lives_ok(
  $$INSERT INTO merchant_bookmarks (user_id, merchant_id) VALUES ('a2000000-0000-0000-0000-000000000001', 'b2000000-0000-0000-0000-000000000001')$$,
  'user_a can add merchant bookmark'
);
SELECT is((SELECT count(*) FROM merchant_bookmarks)::INT, 1, 'user_a sees only own merchant bookmarks');
SELECT lives_ok(
  $$INSERT INTO store_bookmarks (user_id, location_id) VALUES ('a2000000-0000-0000-0000-000000000001', 'b2100000-0000-0000-0000-000000000001')$$,
  'user_a can add store bookmark'
);
SELECT lives_ok(
  $$INSERT INTO post_bookmarks (user_id, post_id) VALUES ('a2000000-0000-0000-0000-000000000001', 'a2100000-0000-0000-0000-000000000001')$$,
  'user_a can add post bookmark'
);
SELECT throws_ok(
  $$INSERT INTO wine_bookmarks (user_id, wine_id) VALUES ('a2000000-0000-0000-0000-000000000002', 'c2000000-0000-0000-0000-000000000001')$$,
  NULL, NULL, 'user_a cannot add bookmark for user_b'
);

-- ── Posts ──
SELECT lives_ok(
  $$INSERT INTO posts (author_id, content) VALUES ('a2000000-0000-0000-0000-000000000001', 'My new post')$$,
  'user_a can create post'
);
SELECT throws_ok(
  $$INSERT INTO posts (author_id, content) VALUES ('a2000000-0000-0000-0000-000000000002', 'Fake')$$,
  NULL, NULL, 'user_a cannot create post as user_b'
);
SELECT lives_ok(
  $$UPDATE posts SET content = 'Updated' WHERE id = 'a2100000-0000-0000-0000-000000000001'$$,
  'user_a can update own post'
);

-- ── Likes ──
SELECT lives_ok(
  $$INSERT INTO post_likes (post_id, user_id) VALUES ('a2100000-0000-0000-0000-000000000002', 'a2000000-0000-0000-0000-000000000001')$$,
  'user_a can like a post'
);
SELECT lives_ok(
  $$DELETE FROM post_likes WHERE post_id = 'a2100000-0000-0000-0000-000000000002' AND user_id = 'a2000000-0000-0000-0000-000000000001'$$,
  'user_a can unlike a post'
);
SELECT throws_ok(
  $$INSERT INTO post_likes (post_id, user_id) VALUES ('a2100000-0000-0000-0000-000000000001', 'a2000000-0000-0000-0000-000000000002')$$,
  NULL, NULL, 'user_a cannot like as user_b'
);

-- ── Comments ──
SELECT lives_ok(
  $$INSERT INTO comments (post_id, author_id, content) VALUES ('a2100000-0000-0000-0000-000000000002', 'a2000000-0000-0000-0000-000000000001', 'Nice!')$$,
  'user_a can create comment'
);
SELECT throws_ok(
  $$INSERT INTO comments (post_id, author_id, content) VALUES ('a2100000-0000-0000-0000-000000000001', 'a2000000-0000-0000-0000-000000000002', 'Fake')$$,
  NULL, NULL, 'user_a cannot comment as user_b'
);

-- ── Follows ──
SELECT lives_ok(
  $$INSERT INTO follows (follower_id, followed_id) VALUES ('a2000000-0000-0000-0000-000000000001', 'a2000000-0000-0000-0000-000000000002')$$,
  'user_a can follow user_b'
);
SELECT lives_ok(
  $$DELETE FROM follows WHERE follower_id = 'a2000000-0000-0000-0000-000000000001'$$,
  'user_a can unfollow user_b'
);
SELECT throws_ok(
  $$INSERT INTO follows (follower_id, followed_id) VALUES ('a2000000-0000-0000-0000-000000000002', 'a2000000-0000-0000-0000-000000000001')$$,
  NULL, NULL, 'user_a cannot create follow as user_b'
);

-- ── Blocks ──
SELECT lives_ok(
  $$INSERT INTO blocks (blocker_id, blocked_id) VALUES ('a2000000-0000-0000-0000-000000000001', 'a2000000-0000-0000-0000-000000000002')$$,
  'user_a can block user_b'
);
SELECT is((SELECT count(*) FROM blocks)::INT, 1, 'user_a can see own blocks');
SELECT lives_ok(
  $$DELETE FROM blocks WHERE blocker_id = 'a2000000-0000-0000-0000-000000000001'$$,
  'user_a can unblock'
);

-- ── Reports ──
SELECT lives_ok(
  $$INSERT INTO reports (reporter_id, target_type, target_id, reason) VALUES ('a2000000-0000-0000-0000-000000000001', 'post', 'a2100000-0000-0000-0000-000000000002', 'spam')$$,
  'user_a can create report'
);
SELECT is((SELECT count(*) FROM reports)::INT, 0, 'user_a cannot read reports');

-- ── Profile ──
SELECT lives_ok(
  $$UPDATE profiles SET display_name = 'User A Updated' WHERE id = 'a2000000-0000-0000-0000-000000000001'$$,
  'user_a can update own profile'
);

-- Verify user_b unchanged: switch to postgres
SET LOCAL role TO 'postgres';
SET LOCAL "request.jwt.claims" TO '';
SET LOCAL "request.jwt.claim.sub" TO '';

SELECT is(
  (SELECT display_name FROM profiles WHERE id = 'a2000000-0000-0000-0000-000000000002'),
  'T02 User B', 'user_b profile unchanged'
);

-- ── Admin-only tables (back to user_a) ──
SET LOCAL role TO 'authenticated';
SET LOCAL "request.jwt.claim.sub" TO 'a2000000-0000-0000-0000-000000000001';
SET LOCAL "request.jwt.claims" TO '{"sub":"a2000000-0000-0000-0000-000000000001","role":"authenticated"}';

SELECT throws_ok(
  $$INSERT INTO merchants (slug, name, description_zh, description_en) VALUES ('hack', 'Hack', 'X', 'X')$$,
  NULL, NULL, 'regular user cannot insert merchants'
);
SELECT throws_ok(
  $$INSERT INTO wines (slug, name, type, region_zh, region_en, description_zh, description_en) VALUES ('hack', 'Hack', 'red', 'X', 'X', 'X', 'X')$$,
  NULL, NULL, 'regular user cannot insert wines'
);

SELECT * FROM finish();
ROLLBACK;
