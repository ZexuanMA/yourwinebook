-- ============================================================
-- Migration 003: Supabase Storage Buckets & Policies
-- ============================================================
-- Three buckets:
--   posts     — user-uploaded post images (public read, auth upload)
--   avatars   — user profile photos (public read, auth upload)
--   merchants — merchant logos/banners (public read, staff/admin upload)
-- ============================================================

-- ────────────────────────────────────────────────────────────
-- 1. CREATE BUCKETS
-- ────────────────────────────────────────────────────────────

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES
  ('posts', 'posts', true, 10485760, -- 10 MB
   ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/heic', 'image/heif']),
  ('avatars', 'avatars', true, 2097152, -- 2 MB
   ARRAY['image/jpeg', 'image/png', 'image/webp']),
  ('merchants', 'merchants', true, 5242880, -- 5 MB
   ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/svg+xml']);

-- ────────────────────────────────────────────────────────────
-- 2. POSTS BUCKET POLICIES
-- ────────────────────────────────────────────────────────────
-- Directory structure: posts/{user_id}/{upload_id}.{ext}
-- Public read (bucket is public), authenticated upload to own folder only.

-- Anyone can read (bucket is public, but explicit policy for completeness)
CREATE POLICY "posts_public_select"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'posts');

-- Authenticated users can upload to their own folder
CREATE POLICY "posts_insert_own"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'posts'
    AND auth.role() = 'authenticated'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

-- Users can update (replace) their own uploads
CREATE POLICY "posts_update_own"
  ON storage.objects FOR UPDATE
  USING (
    bucket_id = 'posts'
    AND auth.role() = 'authenticated'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

-- Users can delete their own uploads; admins can delete any
CREATE POLICY "posts_delete_own_or_admin"
  ON storage.objects FOR DELETE
  USING (
    bucket_id = 'posts'
    AND (
      (auth.role() = 'authenticated' AND (storage.foldername(name))[1] = auth.uid()::text)
      OR is_admin()
    )
  );

-- ────────────────────────────────────────────────────────────
-- 3. AVATARS BUCKET POLICIES
-- ────────────────────────────────────────────────────────────
-- Directory structure: avatars/{user_id}.{ext}

CREATE POLICY "avatars_public_select"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'avatars');

CREATE POLICY "avatars_insert_own"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'avatars'
    AND auth.role() = 'authenticated'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

CREATE POLICY "avatars_update_own"
  ON storage.objects FOR UPDATE
  USING (
    bucket_id = 'avatars'
    AND auth.role() = 'authenticated'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

CREATE POLICY "avatars_delete_own"
  ON storage.objects FOR DELETE
  USING (
    bucket_id = 'avatars'
    AND auth.role() = 'authenticated'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

-- ────────────────────────────────────────────────────────────
-- 4. MERCHANTS BUCKET POLICIES
-- ────────────────────────────────────────────────────────────
-- Directory structure: merchants/{merchant_id}/{filename}.{ext}
-- Merchant staff can upload to own merchant folder; admin can upload anywhere.

CREATE POLICY "merchants_public_select"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'merchants');

CREATE POLICY "merchants_insert_staff_or_admin"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'merchants'
    AND (
      is_merchant_staff((storage.foldername(name))[1]::uuid)
      OR is_admin()
    )
  );

CREATE POLICY "merchants_update_staff_or_admin"
  ON storage.objects FOR UPDATE
  USING (
    bucket_id = 'merchants'
    AND (
      is_merchant_staff((storage.foldername(name))[1]::uuid)
      OR is_admin()
    )
  );

CREATE POLICY "merchants_delete_admin"
  ON storage.objects FOR DELETE
  USING (
    bucket_id = 'merchants'
    AND is_admin()
  );
