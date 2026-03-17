-- ============================================================
-- RLS Tests — Admin operations
-- ============================================================

BEGIN;

SELECT plan(22);

-- ── Seed data ──
DO $$
DECLARE
  v_admin_id    UUID := 'a4000000-0000-0000-0000-000000000099';
  v_user_id     UUID := 'a4000000-0000-0000-0000-000000000001';
  v_merchant_id UUID := 'b4000000-0000-0000-0000-000000000001';
  v_wine_id     UUID := 'c4000000-0000-0000-0000-000000000001';
  v_post_vis    UUID := 'a4100000-0000-0000-0000-000000000001';
  v_post_hid    UUID := 'a4100000-0000-0000-0000-000000000002';
BEGIN
  INSERT INTO auth.users (id, instance_id, aud, role, email, encrypted_password, email_confirmed_at, raw_app_meta_data, raw_user_meta_data, created_at, updated_at, confirmation_token)
  VALUES
    (v_admin_id, '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 't04_admin@test.com', crypt('pass', gen_salt('bf')), now(), '{"provider":"email","providers":["email"]}', '{}', now(), now(), ''),
    (v_user_id, '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 't04_user@test.com', crypt('pass', gen_salt('bf')), now(), '{"provider":"email","providers":["email"]}', '{}', now(), now(), '');

  INSERT INTO profiles (id, display_name, email, role) VALUES
    (v_admin_id, 'T04 Admin', 't04_admin@test.com', 'admin'),
    (v_user_id, 'T04 User', 't04_user@test.com', 'user');

  INSERT INTO merchants (id, slug, name, description_zh, description_en)
  VALUES (v_merchant_id, 't04-merchant', 'T04 Merchant', '酒商', 'Merchant');

  INSERT INTO wines (id, slug, name, type, region_zh, region_en, description_zh, description_en)
  VALUES (v_wine_id, 't04-wine', 'T04 Wine', 'red', '波爾多', 'Bordeaux', '測試', 'Test');

  INSERT INTO posts (id, author_id, content, status) VALUES
    (v_post_vis, v_user_id, 'Visible', 'visible'),
    (v_post_hid, v_user_id, 'Hidden', 'hidden');

  INSERT INTO reports (reporter_id, target_type, target_id, reason)
  VALUES (v_user_id, 'post', v_post_vis, 'spam');

  INSERT INTO media_uploads (user_id, bucket, path, mime_type)
  VALUES (v_user_id, 'posts', 'test.jpg', 'image/jpeg');

  INSERT INTO merchant_applications (company_name, contact_name, email, status)
  VALUES ('T04 Co', 'John', 't04_john@test.com', 'pending');

  INSERT INTO comments (post_id, author_id, content)
  VALUES (v_post_hid, v_user_id, 'A comment');
END;
$$;

-- ════════════════════════════════════════════════════════════
-- As Admin
-- ════════════════════════════════════════════════════════════
SET LOCAL role TO 'authenticated';
SET LOCAL "request.jwt.claim.sub" TO 'a4000000-0000-0000-0000-000000000099';
SET LOCAL "request.jwt.claims" TO '{"sub":"a4000000-0000-0000-0000-000000000099","role":"authenticated"}';

-- ── Posts: sees ALL including hidden ──
SELECT is(
  (SELECT count(*) FROM posts WHERE id IN ('a4100000-0000-0000-0000-000000000001', 'a4100000-0000-0000-0000-000000000002'))::INT,
  2, 'admin can see all posts including hidden'
);
SELECT lives_ok(
  $$UPDATE posts SET status = 'hidden', hidden_at = now(), hidden_reason = 'admin action' WHERE id = 'a4100000-0000-0000-0000-000000000001'$$,
  'admin can hide a post'
);

-- ── Reports ──
SELECT ok((SELECT count(*) FROM reports) > 0, 'admin can read reports');
SELECT lives_ok(
  $$UPDATE reports SET status = 'resolved', resolved_by = 'a4000000-0000-0000-0000-000000000099', resolved_at = now()$$,
  'admin can resolve report'
);

-- ── Merchants ──
SELECT lives_ok(
  $$INSERT INTO merchants (slug, name, description_zh, description_en) VALUES ('t04-new', 'New', '新', 'New')$$,
  'admin can create merchant'
);
SELECT lives_ok(
  $$UPDATE merchants SET status = 'inactive' WHERE slug = 't04-merchant'$$,
  'admin can update merchant status'
);

-- ── Wines ──
SELECT lives_ok(
  $$INSERT INTO wines (slug, name, type, region_zh, region_en, description_zh, description_en) VALUES ('t04-new-wine', 'New', 'white', 'X', 'X', 'X', 'X')$$,
  'admin can create wine'
);
SELECT lives_ok(
  $$UPDATE wines SET is_featured = true WHERE slug = 't04-wine'$$,
  'admin can update wine'
);

-- ── Tags ──
SELECT lives_ok(
  $$INSERT INTO tags (slug, name_zh, name_en) VALUES ('t04-bold', '濃郁', 'Bold')$$,
  'admin can create tag'
);

-- ── Scenes ──
SELECT lives_ok(
  $$INSERT INTO scenes (slug, title_zh, title_en, description_zh, description_en) VALUES ('t04-party', '派對', 'Party', '描述', 'Desc')$$,
  'admin can create scene'
);

-- ── Merchant Staff ──
SELECT lives_ok(
  $$INSERT INTO merchant_staff (profile_id, merchant_id, role) VALUES ('a4000000-0000-0000-0000-000000000001', 'b4000000-0000-0000-0000-000000000001', 'staff')$$,
  'admin can add merchant staff'
);
SELECT ok((SELECT count(*) FROM merchant_staff) > 0, 'admin can read all merchant_staff');
SELECT lives_ok(
  $$DELETE FROM merchant_staff WHERE profile_id = 'a4000000-0000-0000-0000-000000000001'$$,
  'admin can delete merchant staff'
);

-- ── Merchant Applications ──
SELECT ok((SELECT count(*) FROM merchant_applications) > 0, 'admin can read merchant_applications');
SELECT lives_ok(
  $$UPDATE merchant_applications SET status = 'approved'$$,
  'admin can update application status'
);

-- ── Media Uploads ──
SELECT ok((SELECT count(*) FROM media_uploads) > 0, 'admin can read media_uploads');

-- ── Ban user ──
SELECT lives_ok(
  $$UPDATE profiles SET status = 'banned', banned_at = now(), ban_reason = 'spam' WHERE id = 'a4000000-0000-0000-0000-000000000001'$$,
  'admin can ban a user'
);

-- Verify ban took effect
SET LOCAL role TO 'postgres';
SET LOCAL "request.jwt.claims" TO '';
SET LOCAL "request.jwt.claim.sub" TO '';

SELECT is(
  (SELECT status FROM profiles WHERE id = 'a4000000-0000-0000-0000-000000000001'),
  'banned', 'user status updated to banned'
);

-- ── Merchant Locations (admin can add + delete) ──
SET LOCAL role TO 'authenticated';
SET LOCAL "request.jwt.claim.sub" TO 'a4000000-0000-0000-0000-000000000099';
SET LOCAL "request.jwt.claims" TO '{"sub":"a4000000-0000-0000-0000-000000000099","role":"authenticated"}';

SELECT lives_ok(
  $$INSERT INTO merchant_locations (merchant_id, name, address_zh) VALUES ('b4000000-0000-0000-0000-000000000001', 'Admin Store', '管理員添加')$$,
  'admin can add merchant location'
);
SELECT lives_ok(
  $$DELETE FROM merchant_locations WHERE name = 'Admin Store'$$,
  'admin can delete merchant location'
);

-- ── Comments (admin can hide) ──
SELECT lives_ok(
  $$UPDATE comments SET status = 'hidden'$$,
  'admin can hide comments'
);

SET LOCAL role TO 'postgres';
SET LOCAL "request.jwt.claims" TO '';
SET LOCAL "request.jwt.claim.sub" TO '';

SELECT is(
  (SELECT count(*) FROM comments WHERE status = 'hidden' AND post_id = 'a4100000-0000-0000-0000-000000000002')::INT,
  1, 'comment status changed to hidden'
);

SELECT * FROM finish();
ROLLBACK;
