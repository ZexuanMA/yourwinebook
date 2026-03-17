-- ============================================================
-- Your Wine Book — RLS Policies
-- ============================================================
-- Principle: public data is readable by anyone, private data
-- is accessible only by the owner, writes are restricted to
-- the appropriate role. Complex writes go through Edge Functions.
-- ============================================================

-- ────────────────────────────────────────────────────────────
-- Helper: check if current user is admin
-- ────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION is_admin()
RETURNS BOOLEAN
LANGUAGE sql STABLE SECURITY DEFINER
AS $$
  SELECT EXISTS(
    SELECT 1 FROM profiles
    WHERE id = auth.uid() AND role = 'admin'
  );
$$;

-- Helper: check if current user is merchant staff for a given merchant
CREATE OR REPLACE FUNCTION is_merchant_staff(p_merchant_id UUID)
RETURNS BOOLEAN
LANGUAGE sql STABLE SECURITY DEFINER
AS $$
  SELECT EXISTS(
    SELECT 1 FROM merchant_staff
    WHERE profile_id = auth.uid() AND merchant_id = p_merchant_id
  );
$$;

-- ────────────────────────────────────────────────────────────
-- 1. PROFILES
-- ────────────────────────────────────────────────────────────
-- Anyone can read profiles (for author names in posts, etc.)
CREATE POLICY "profiles_select"
  ON profiles FOR SELECT
  USING (true);

-- Users can update their own profile
CREATE POLICY "profiles_update_own"
  ON profiles FOR UPDATE
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- Admins can update any profile (for banning, role changes)
CREATE POLICY "profiles_update_admin"
  ON profiles FOR UPDATE
  USING (is_admin());

-- Profile creation handled by auth trigger, not client
CREATE POLICY "profiles_insert_own"
  ON profiles FOR INSERT
  WITH CHECK (auth.uid() = id);

-- ────────────────────────────────────────────────────────────
-- 2. REGIONS (public read-only)
-- ────────────────────────────────────────────────────────────
CREATE POLICY "regions_select" ON regions FOR SELECT USING (true);

-- ────────────────────────────────────────────────────────────
-- 3. MERCHANTS (public read, admin write)
-- ────────────────────────────────────────────────────────────
CREATE POLICY "merchants_select" ON merchants FOR SELECT USING (true);
CREATE POLICY "merchants_insert_admin" ON merchants FOR INSERT WITH CHECK (is_admin());
CREATE POLICY "merchants_update_admin" ON merchants FOR UPDATE USING (is_admin());

-- ────────────────────────────────────────────────────────────
-- 4. MERCHANT STAFF (staff can read own, admin full access)
-- ────────────────────────────────────────────────────────────
CREATE POLICY "merchant_staff_select_own"
  ON merchant_staff FOR SELECT
  USING (profile_id = auth.uid());

CREATE POLICY "merchant_staff_select_admin"
  ON merchant_staff FOR SELECT
  USING (is_admin());

CREATE POLICY "merchant_staff_insert_admin"
  ON merchant_staff FOR INSERT
  WITH CHECK (is_admin());

CREATE POLICY "merchant_staff_delete_admin"
  ON merchant_staff FOR DELETE
  USING (is_admin());

-- ────────────────────────────────────────────────────────────
-- 5. MERCHANT LOCATIONS (public read, staff/admin write)
-- ────────────────────────────────────────────────────────────
CREATE POLICY "merchant_locations_select"
  ON merchant_locations FOR SELECT
  USING (true);

CREATE POLICY "merchant_locations_insert_staff"
  ON merchant_locations FOR INSERT
  WITH CHECK (is_merchant_staff(merchant_id) OR is_admin());

CREATE POLICY "merchant_locations_update_staff"
  ON merchant_locations FOR UPDATE
  USING (is_merchant_staff(merchant_id) OR is_admin());

CREATE POLICY "merchant_locations_delete_admin"
  ON merchant_locations FOR DELETE
  USING (is_admin());

-- ────────────────────────────────────────────────────────────
-- 6. WINES (public read-only, admin write)
-- ────────────────────────────────────────────────────────────
CREATE POLICY "wines_select" ON wines FOR SELECT USING (true);
CREATE POLICY "wines_insert_admin" ON wines FOR INSERT WITH CHECK (is_admin());
CREATE POLICY "wines_update_admin" ON wines FOR UPDATE USING (is_admin());

-- ────────────────────────────────────────────────────────────
-- 7. TAGS & WINE_TAGS (public read-only)
-- ────────────────────────────────────────────────────────────
CREATE POLICY "tags_select" ON tags FOR SELECT USING (true);
CREATE POLICY "tags_insert_admin" ON tags FOR INSERT WITH CHECK (is_admin());

CREATE POLICY "wine_tags_select" ON wine_tags FOR SELECT USING (true);
CREATE POLICY "wine_tags_insert_admin" ON wine_tags FOR INSERT WITH CHECK (is_admin());

-- ────────────────────────────────────────────────────────────
-- 8. SCENES & SCENE_WINES (public read-only)
-- ────────────────────────────────────────────────────────────
CREATE POLICY "scenes_select" ON scenes FOR SELECT USING (true);
CREATE POLICY "scenes_insert_admin" ON scenes FOR INSERT WITH CHECK (is_admin());

CREATE POLICY "scene_wines_select" ON scene_wines FOR SELECT USING (true);
CREATE POLICY "scene_wines_insert_admin" ON scene_wines FOR INSERT WITH CHECK (is_admin());

-- ────────────────────────────────────────────────────────────
-- 9. MERCHANT PRICES (public read, staff/admin write)
-- ────────────────────────────────────────────────────────────
CREATE POLICY "merchant_prices_select"
  ON merchant_prices FOR SELECT
  USING (true);

CREATE POLICY "merchant_prices_insert"
  ON merchant_prices FOR INSERT
  WITH CHECK (is_merchant_staff(merchant_id) OR is_admin());

CREATE POLICY "merchant_prices_update"
  ON merchant_prices FOR UPDATE
  USING (is_merchant_staff(merchant_id) OR is_admin());

CREATE POLICY "merchant_prices_delete"
  ON merchant_prices FOR DELETE
  USING (is_admin());

-- ────────────────────────────────────────────────────────────
-- 10. MERCHANT APPLICATIONS (anon insert, admin read/update)
-- ────────────────────────────────────────────────────────────
CREATE POLICY "applications_insert_anon"
  ON merchant_applications FOR INSERT
  WITH CHECK (true);

CREATE POLICY "applications_select_admin"
  ON merchant_applications FOR SELECT
  USING (is_admin());

CREATE POLICY "applications_update_admin"
  ON merchant_applications FOR UPDATE
  USING (is_admin());

-- ────────────────────────────────────────────────────────────
-- 11. POSTS (public read visible, owner write)
-- ────────────────────────────────────────────────────────────
-- Anyone can read visible posts
CREATE POLICY "posts_select_visible"
  ON posts FOR SELECT
  USING (status = 'visible');

-- Admins can see all posts (including hidden)
CREATE POLICY "posts_select_admin"
  ON posts FOR SELECT
  USING (is_admin());

-- Authenticated users can create posts (finalize-post Edge Function preferred)
CREATE POLICY "posts_insert_auth"
  ON posts FOR INSERT
  WITH CHECK (auth.uid() = author_id);

-- Authors can update their own posts
CREATE POLICY "posts_update_own"
  ON posts FOR UPDATE
  USING (auth.uid() = author_id);

-- Admins can update any post (hide/delete)
CREATE POLICY "posts_update_admin"
  ON posts FOR UPDATE
  USING (is_admin());

-- ────────────────────────────────────────────────────────────
-- 12. POST MEDIA (follows post visibility)
-- ────────────────────────────────────────────────────────────
CREATE POLICY "post_media_select"
  ON post_media FOR SELECT
  USING (EXISTS(
    SELECT 1 FROM posts WHERE posts.id = post_media.post_id
      AND (posts.status = 'visible' OR is_admin())
  ));

CREATE POLICY "post_media_insert_auth"
  ON post_media FOR INSERT
  WITH CHECK (EXISTS(
    SELECT 1 FROM posts WHERE posts.id = post_media.post_id
      AND posts.author_id = auth.uid()
  ));

-- ────────────────────────────────────────────────────────────
-- 13. POST PRODUCTS (follows post visibility)
-- ────────────────────────────────────────────────────────────
CREATE POLICY "post_products_select"
  ON post_products FOR SELECT
  USING (EXISTS(
    SELECT 1 FROM posts WHERE posts.id = post_products.post_id
      AND (posts.status = 'visible' OR is_admin())
  ));

CREATE POLICY "post_products_insert_auth"
  ON post_products FOR INSERT
  WITH CHECK (EXISTS(
    SELECT 1 FROM posts WHERE posts.id = post_products.post_id
      AND posts.author_id = auth.uid()
  ));

-- ────────────────────────────────────────────────────────────
-- 14. POST LIKES (auth users can toggle)
-- ────────────────────────────────────────────────────────────
CREATE POLICY "post_likes_select"
  ON post_likes FOR SELECT
  USING (true);

CREATE POLICY "post_likes_insert_auth"
  ON post_likes FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "post_likes_delete_own"
  ON post_likes FOR DELETE
  USING (auth.uid() = user_id);

-- ────────────────────────────────────────────────────────────
-- 15. COMMENTS (visible read, auth write)
-- ────────────────────────────────────────────────────────────
CREATE POLICY "comments_select_visible"
  ON comments FOR SELECT
  USING (status = 'visible');

CREATE POLICY "comments_select_admin"
  ON comments FOR SELECT
  USING (is_admin());

-- Prefer create-comment Edge Function, but allow direct insert for flexibility
CREATE POLICY "comments_insert_auth"
  ON comments FOR INSERT
  WITH CHECK (auth.uid() = author_id);

CREATE POLICY "comments_update_admin"
  ON comments FOR UPDATE
  USING (is_admin());

-- ────────────────────────────────────────────────────────────
-- 16. BOOKMARKS (owner only)
-- ────────────────────────────────────────────────────────────

-- Wine bookmarks
CREATE POLICY "wine_bookmarks_select_own"
  ON wine_bookmarks FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "wine_bookmarks_insert_own"
  ON wine_bookmarks FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "wine_bookmarks_delete_own"
  ON wine_bookmarks FOR DELETE USING (auth.uid() = user_id);

-- Merchant bookmarks
CREATE POLICY "merchant_bookmarks_select_own"
  ON merchant_bookmarks FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "merchant_bookmarks_insert_own"
  ON merchant_bookmarks FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "merchant_bookmarks_delete_own"
  ON merchant_bookmarks FOR DELETE USING (auth.uid() = user_id);

-- Store bookmarks
CREATE POLICY "store_bookmarks_select_own"
  ON store_bookmarks FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "store_bookmarks_insert_own"
  ON store_bookmarks FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "store_bookmarks_delete_own"
  ON store_bookmarks FOR DELETE USING (auth.uid() = user_id);

-- Post bookmarks
CREATE POLICY "post_bookmarks_select_own"
  ON post_bookmarks FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "post_bookmarks_insert_own"
  ON post_bookmarks FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "post_bookmarks_delete_own"
  ON post_bookmarks FOR DELETE USING (auth.uid() = user_id);

-- ────────────────────────────────────────────────────────────
-- 17. FOLLOWS (owner only)
-- ────────────────────────────────────────────────────────────
CREATE POLICY "follows_select"
  ON follows FOR SELECT USING (true);

CREATE POLICY "follows_insert_own"
  ON follows FOR INSERT
  WITH CHECK (auth.uid() = follower_id);

CREATE POLICY "follows_delete_own"
  ON follows FOR DELETE
  USING (auth.uid() = follower_id);

-- ────────────────────────────────────────────────────────────
-- 18. BLOCKS (owner only)
-- ────────────────────────────────────────────────────────────
CREATE POLICY "blocks_select_own"
  ON blocks FOR SELECT
  USING (auth.uid() = blocker_id);

CREATE POLICY "blocks_insert_own"
  ON blocks FOR INSERT
  WITH CHECK (auth.uid() = blocker_id);

CREATE POLICY "blocks_delete_own"
  ON blocks FOR DELETE
  USING (auth.uid() = blocker_id);

-- ────────────────────────────────────────────────────────────
-- 19. REPORTS (auth users can create, admin can manage)
-- ────────────────────────────────────────────────────────────
CREATE POLICY "reports_insert_auth"
  ON reports FOR INSERT
  WITH CHECK (auth.uid() = reporter_id);

CREATE POLICY "reports_select_admin"
  ON reports FOR SELECT
  USING (is_admin());

CREATE POLICY "reports_update_admin"
  ON reports FOR UPDATE
  USING (is_admin());

-- ────────────────────────────────────────────────────────────
-- 20. MEDIA UPLOADS (owner only, admin read)
-- ────────────────────────────────────────────────────────────
CREATE POLICY "media_uploads_select_own"
  ON media_uploads FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "media_uploads_select_admin"
  ON media_uploads FOR SELECT
  USING (is_admin());

CREATE POLICY "media_uploads_insert_own"
  ON media_uploads FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "media_uploads_update_own"
  ON media_uploads FOR UPDATE
  USING (auth.uid() = user_id);
