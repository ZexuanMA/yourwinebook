-- ============================================================
-- Your Wine Book — Schema V1
-- ============================================================
-- Covers: existing web tables + auth profiles + merchant accounts
--         + community (posts/comments/likes) + stores (PostGIS)
--         + bookmarks + uploads + moderation + follows/blocks
--         + two core RPCs (get_nearby_stores, get_feed)
-- ============================================================

-- Extensions
CREATE EXTENSION IF NOT EXISTS "postgis";    -- spatial queries for stores
CREATE EXTENSION IF NOT EXISTS "pg_trgm";    -- trigram for fuzzy search

-- ============================================================
-- 1. PROFILES (linked to Supabase Auth)
-- ============================================================
CREATE TABLE profiles (
  id          UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  display_name TEXT NOT NULL,
  email       TEXT NOT NULL,
  avatar_url  TEXT,
  role        TEXT NOT NULL DEFAULT 'user'
              CHECK (role IN ('user', 'admin', 'merchant_staff')),
  locale      TEXT NOT NULL DEFAULT 'zh-HK'
              CHECK (locale IN ('zh-HK', 'en')),
  status      TEXT NOT NULL DEFAULT 'active'
              CHECK (status IN ('active', 'suspended', 'banned')),
  banned_at   TIMESTAMPTZ,
  ban_reason  TEXT,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_profiles_email ON profiles(email);
CREATE INDEX idx_profiles_role ON profiles(role);
CREATE INDEX idx_profiles_status ON profiles(status);

-- ============================================================
-- 2. REGIONS
-- ============================================================
CREATE TABLE regions (
  id            UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  slug          TEXT UNIQUE NOT NULL,
  name_zh       TEXT NOT NULL,
  name_en       TEXT NOT NULL,
  country_zh    TEXT NOT NULL,
  country_en    TEXT NOT NULL,
  description_zh TEXT,
  description_en TEXT,
  created_at    TIMESTAMPTZ DEFAULT now()
);

-- ============================================================
-- 3. MERCHANTS (business entities — not auth accounts)
-- ============================================================
CREATE TABLE merchants (
  id             UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  slug           TEXT UNIQUE NOT NULL,
  name           TEXT NOT NULL,
  description_zh TEXT NOT NULL,
  description_en TEXT NOT NULL,
  details_zh     TEXT[] DEFAULT '{}',
  details_en     TEXT[] DEFAULT '{}',
  wines_listed   INT DEFAULT 0,
  best_prices    INT DEFAULT 0,
  rating         NUMERIC(2,1) DEFAULT 0,
  website        TEXT,
  logo_url       TEXT,
  status         TEXT NOT NULL DEFAULT 'active'
                 CHECK (status IN ('active', 'inactive', 'pending')),
  created_at     TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_merchants_slug ON merchants(slug);
CREATE INDEX idx_merchants_status ON merchants(status);

-- Link merchant staff to a merchant entity
CREATE TABLE merchant_staff (
  profile_id   UUID PRIMARY KEY REFERENCES profiles(id) ON DELETE CASCADE,
  merchant_id  UUID NOT NULL REFERENCES merchants(id) ON DELETE CASCADE,
  role         TEXT NOT NULL DEFAULT 'staff'
               CHECK (role IN ('owner', 'staff')),
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_merchant_staff_merchant ON merchant_staff(merchant_id);

-- ============================================================
-- 4. MERCHANT LOCATIONS (stores with PostGIS)
-- ============================================================
CREATE TABLE merchant_locations (
  id           UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  merchant_id  UUID NOT NULL REFERENCES merchants(id) ON DELETE CASCADE,
  name         TEXT NOT NULL,
  address_zh   TEXT NOT NULL,
  address_en   TEXT,
  district_zh  TEXT,
  district_en  TEXT,
  phone        TEXT,
  location     GEOGRAPHY(POINT, 4326),
  hours        JSONB DEFAULT '{}',        -- structured opening hours
  is_active    BOOLEAN NOT NULL DEFAULT true,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_merchant_locations_merchant ON merchant_locations(merchant_id);
CREATE INDEX idx_merchant_locations_geo ON merchant_locations USING GIST(location);
CREATE INDEX idx_merchant_locations_active ON merchant_locations(is_active) WHERE is_active = true;

-- ============================================================
-- 5. WINES
-- ============================================================
CREATE TABLE wines (
  id              UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  slug            TEXT UNIQUE NOT NULL,
  name            TEXT NOT NULL,
  type            TEXT NOT NULL CHECK (type IN ('red','white','sparkling','rosé','dessert')),
  region_zh       TEXT NOT NULL,
  region_en       TEXT NOT NULL,
  grape_variety   TEXT,
  vintage         INT,
  description_zh  TEXT NOT NULL,
  description_en  TEXT NOT NULL,
  tasting_notes   JSONB DEFAULT '{}',
  region_story_zh TEXT,
  region_story_en TEXT,
  min_price       INT,
  merchant_count  INT DEFAULT 0,
  emoji           TEXT DEFAULT '🍷',
  badge           TEXT,
  is_featured     BOOLEAN DEFAULT false,
  created_at      TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_wines_slug ON wines(slug);
CREATE INDEX idx_wines_type ON wines(type);
CREATE INDEX idx_wines_is_featured ON wines(is_featured);
CREATE INDEX idx_wines_name_trgm ON wines USING GIN(name gin_trgm_ops);

-- ============================================================
-- 6. TAGS & WINE-TAG JUNCTION
-- ============================================================
CREATE TABLE tags (
  id       UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  slug     TEXT UNIQUE NOT NULL,
  name_zh  TEXT NOT NULL,
  name_en  TEXT NOT NULL
);

CREATE TABLE wine_tags (
  wine_id UUID REFERENCES wines(id) ON DELETE CASCADE,
  tag_id  UUID REFERENCES tags(id) ON DELETE CASCADE,
  PRIMARY KEY (wine_id, tag_id)
);

-- ============================================================
-- 7. SCENES & SCENE-WINE JUNCTION
-- ============================================================
CREATE TABLE scenes (
  id              UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  slug            TEXT UNIQUE NOT NULL,
  title_zh        TEXT NOT NULL,
  title_en        TEXT NOT NULL,
  description_zh  TEXT NOT NULL,
  description_en  TEXT NOT NULL,
  emoji           TEXT DEFAULT '🍷',
  created_at      TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE scene_wines (
  scene_id   UUID REFERENCES scenes(id) ON DELETE CASCADE,
  wine_id    UUID REFERENCES wines(id) ON DELETE CASCADE,
  sort_order INT DEFAULT 0,
  PRIMARY KEY (scene_id, wine_id)
);

CREATE INDEX idx_scenes_slug ON scenes(slug);

-- ============================================================
-- 8. MERCHANT PRICES (price comparison)
-- ============================================================
CREATE TABLE merchant_prices (
  id          UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  wine_id     UUID REFERENCES wines(id) ON DELETE CASCADE,
  merchant_id UUID REFERENCES merchants(id) ON DELETE CASCADE,
  price       INT NOT NULL,
  url         TEXT,
  is_best     BOOLEAN DEFAULT false,
  updated_at  TIMESTAMPTZ DEFAULT now(),
  UNIQUE (wine_id, merchant_id)
);

CREATE INDEX idx_merchant_prices_wine ON merchant_prices(wine_id);
CREATE INDEX idx_merchant_prices_merchant ON merchant_prices(merchant_id);

-- ============================================================
-- 9. MERCHANT APPLICATIONS
-- ============================================================
CREATE TABLE merchant_applications (
  id           UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  company_name TEXT NOT NULL,
  contact_name TEXT NOT NULL,
  email        TEXT NOT NULL,
  phone        TEXT,
  website      TEXT,
  wine_count   INT,
  message      TEXT,
  status       TEXT DEFAULT 'pending'
               CHECK (status IN ('pending', 'contacted', 'approved', 'rejected')),
  created_at   TIMESTAMPTZ DEFAULT now()
);

-- ============================================================
-- 10. COMMUNITY — POSTS
-- ============================================================
CREATE TABLE posts (
  id            UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  author_id     UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  content       TEXT NOT NULL,
  is_official   BOOLEAN NOT NULL DEFAULT false,
  merchant_id   UUID REFERENCES merchants(id) ON DELETE SET NULL,
  like_count    INT NOT NULL DEFAULT 0,
  comment_count INT NOT NULL DEFAULT 0,
  status        TEXT NOT NULL DEFAULT 'visible'
                CHECK (status IN ('visible', 'hidden', 'deleted')),
  hidden_at     TIMESTAMPTZ,
  hidden_reason TEXT,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_posts_author ON posts(author_id);
CREATE INDEX idx_posts_created ON posts(created_at DESC);
CREATE INDEX idx_posts_status ON posts(status) WHERE status = 'visible';
CREATE INDEX idx_posts_merchant ON posts(merchant_id) WHERE merchant_id IS NOT NULL;

-- ============================================================
-- 11. COMMUNITY — POST MEDIA
-- ============================================================
CREATE TABLE post_media (
  id         UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  post_id    UUID NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
  url        TEXT NOT NULL,
  mime_type  TEXT NOT NULL,
  width      INT,
  height     INT,
  sort_order INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_post_media_post ON post_media(post_id);

-- ============================================================
-- 12. COMMUNITY — POST PRODUCT REFERENCES
-- ============================================================
CREATE TABLE post_products (
  post_id  UUID REFERENCES posts(id) ON DELETE CASCADE,
  wine_id  UUID REFERENCES wines(id) ON DELETE CASCADE,
  PRIMARY KEY (post_id, wine_id)
);

-- ============================================================
-- 13. COMMUNITY — POST LIKES
-- ============================================================
CREATE TABLE post_likes (
  post_id    UUID NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
  user_id    UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (post_id, user_id)
);

CREATE INDEX idx_post_likes_user ON post_likes(user_id);

-- ============================================================
-- 14. COMMUNITY — COMMENTS
-- ============================================================
CREATE TABLE comments (
  id              UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  post_id         UUID NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
  author_id       UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  content         TEXT NOT NULL,
  status          TEXT NOT NULL DEFAULT 'visible'
                  CHECK (status IN ('visible', 'hidden', 'deleted')),
  idempotency_key TEXT,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_comments_post ON comments(post_id);
CREATE INDEX idx_comments_author ON comments(author_id);
CREATE UNIQUE INDEX idx_comments_idempotency ON comments(author_id, idempotency_key)
  WHERE idempotency_key IS NOT NULL;

-- ============================================================
-- 15. BOOKMARKS
-- ============================================================
CREATE TABLE wine_bookmarks (
  user_id    UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  wine_id    UUID NOT NULL REFERENCES wines(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id, wine_id)
);

CREATE TABLE merchant_bookmarks (
  user_id      UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  merchant_id  UUID NOT NULL REFERENCES merchants(id) ON DELETE CASCADE,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id, merchant_id)
);

CREATE TABLE store_bookmarks (
  user_id     UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  location_id UUID NOT NULL REFERENCES merchant_locations(id) ON DELETE CASCADE,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id, location_id)
);

CREATE TABLE post_bookmarks (
  user_id    UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  post_id    UUID NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id, post_id)
);

-- ============================================================
-- 16. FOLLOWS
-- ============================================================
CREATE TABLE follows (
  follower_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  followed_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (follower_id, followed_id),
  CHECK (follower_id <> followed_id)
);

CREATE INDEX idx_follows_followed ON follows(followed_id);

-- ============================================================
-- 17. BLOCKS
-- ============================================================
CREATE TABLE blocks (
  blocker_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  blocked_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (blocker_id, blocked_id),
  CHECK (blocker_id <> blocked_id)
);

CREATE INDEX idx_blocks_blocked ON blocks(blocked_id);

-- ============================================================
-- 18. REPORTS
-- ============================================================
CREATE TABLE reports (
  id           UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  reporter_id  UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  target_type  TEXT NOT NULL CHECK (target_type IN ('post', 'comment', 'user')),
  target_id    UUID NOT NULL,
  reason       TEXT NOT NULL,
  details      TEXT,
  status       TEXT NOT NULL DEFAULT 'pending'
               CHECK (status IN ('pending', 'reviewed', 'resolved', 'dismissed')),
  resolved_by  UUID REFERENCES profiles(id),
  resolved_at  TIMESTAMPTZ,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_reports_status ON reports(status) WHERE status = 'pending';
CREATE INDEX idx_reports_target ON reports(target_type, target_id);

-- ============================================================
-- 19. MEDIA UPLOADS (upload intent tracking)
-- ============================================================
CREATE TABLE media_uploads (
  id          UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id     UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  bucket      TEXT NOT NULL,
  path        TEXT NOT NULL,
  mime_type   TEXT NOT NULL,
  size_bytes  INT,
  status      TEXT NOT NULL DEFAULT 'pending'
              CHECK (status IN ('pending', 'uploaded', 'attached', 'expired')),
  expires_at  TIMESTAMPTZ NOT NULL DEFAULT (now() + interval '1 hour'),
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_media_uploads_user ON media_uploads(user_id);
CREATE INDEX idx_media_uploads_status ON media_uploads(status) WHERE status = 'pending';
CREATE INDEX idx_media_uploads_expires ON media_uploads(expires_at) WHERE status = 'pending';

-- ============================================================
-- 20. TRIGGERS — updated_at auto-update
-- ============================================================
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_profiles_updated
  BEFORE UPDATE ON profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER trg_posts_updated
  BEFORE UPDATE ON posts
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER trg_merchant_locations_updated
  BEFORE UPDATE ON merchant_locations
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ============================================================
-- 21. TRIGGERS — denormalized counters
-- ============================================================

-- Post like_count
CREATE OR REPLACE FUNCTION update_post_like_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE posts SET like_count = like_count + 1 WHERE id = NEW.post_id;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE posts SET like_count = GREATEST(like_count - 1, 0) WHERE id = OLD.post_id;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_post_likes_count
  AFTER INSERT OR DELETE ON post_likes
  FOR EACH ROW EXECUTE FUNCTION update_post_like_count();

-- Post comment_count
CREATE OR REPLACE FUNCTION update_post_comment_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE posts SET comment_count = comment_count + 1 WHERE id = NEW.post_id;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE posts SET comment_count = GREATEST(comment_count - 1, 0) WHERE id = OLD.post_id;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_comments_count
  AFTER INSERT OR DELETE ON comments
  FOR EACH ROW EXECUTE FUNCTION update_post_comment_count();

-- ============================================================
-- 22. RPC — get_nearby_stores
-- ============================================================
CREATE OR REPLACE FUNCTION get_nearby_stores(
  p_lat       DOUBLE PRECISION,
  p_lng       DOUBLE PRECISION,
  p_radius_km INT DEFAULT 5,
  p_limit     INT DEFAULT 50,
  p_user_id   UUID DEFAULT NULL
)
RETURNS TABLE (
  id           UUID,
  merchant_id  UUID,
  merchant_name TEXT,
  merchant_slug TEXT,
  name         TEXT,
  address_zh   TEXT,
  address_en   TEXT,
  district_zh  TEXT,
  district_en  TEXT,
  phone        TEXT,
  hours        JSONB,
  distance_m   DOUBLE PRECISION,
  is_bookmarked BOOLEAN
)
LANGUAGE plpgsql STABLE
AS $$
DECLARE
  v_point   GEOGRAPHY;
  v_radius  INT;
  v_found   INT;
BEGIN
  v_point := ST_SetSRID(ST_MakePoint(p_lng, p_lat), 4326)::GEOGRAPHY;

  -- Auto-expand radius: 5km -> 10km -> 20km -> 50km
  FOREACH v_radius IN ARRAY ARRAY[p_radius_km * 1000, 10000, 20000, 50000]
  LOOP
    SELECT COUNT(*) INTO v_found
    FROM merchant_locations ml
    WHERE ml.is_active = true
      AND ST_DWithin(ml.location, v_point, v_radius);

    IF v_found > 0 THEN
      RETURN QUERY
      SELECT
        ml.id,
        ml.merchant_id,
        m.name AS merchant_name,
        m.slug AS merchant_slug,
        ml.name,
        ml.address_zh,
        ml.address_en,
        ml.district_zh,
        ml.district_en,
        ml.phone,
        ml.hours,
        ST_Distance(ml.location, v_point) AS distance_m,
        CASE WHEN p_user_id IS NOT NULL THEN
          EXISTS(SELECT 1 FROM store_bookmarks sb WHERE sb.user_id = p_user_id AND sb.location_id = ml.id)
        ELSE false END AS is_bookmarked
      FROM merchant_locations ml
      JOIN merchants m ON m.id = ml.merchant_id
      WHERE ml.is_active = true
        AND ST_DWithin(ml.location, v_point, v_radius)
      ORDER BY distance_m
      LIMIT p_limit;
      RETURN;
    END IF;
  END LOOP;
END;
$$;

-- ============================================================
-- 23. RPC — get_feed
-- ============================================================
CREATE OR REPLACE FUNCTION get_feed(
  p_user_id    UUID DEFAULT NULL,
  p_cursor_ts  TIMESTAMPTZ DEFAULT NULL,
  p_cursor_id  UUID DEFAULT NULL,
  p_limit      INT DEFAULT 20
)
RETURNS TABLE (
  id            UUID,
  content       TEXT,
  is_official   BOOLEAN,
  like_count    INT,
  comment_count INT,
  created_at    TIMESTAMPTZ,
  author_id     UUID,
  author_name   TEXT,
  author_avatar TEXT,
  merchant_name TEXT,
  media         JSONB,
  products      JSONB,
  is_liked      BOOLEAN,
  is_bookmarked BOOLEAN
)
LANGUAGE plpgsql STABLE
AS $$
BEGIN
  RETURN QUERY
  SELECT
    p.id,
    p.content,
    p.is_official,
    p.like_count,
    p.comment_count,
    p.created_at,
    pr.id            AS author_id,
    pr.display_name  AS author_name,
    pr.avatar_url    AS author_avatar,
    m.name           AS merchant_name,
    -- Aggregate media as JSON array
    COALESCE(
      (SELECT jsonb_agg(jsonb_build_object(
        'id', pm.id, 'url', pm.url, 'mime_type', pm.mime_type,
        'width', pm.width, 'height', pm.height
      ) ORDER BY pm.sort_order)
      FROM post_media pm WHERE pm.post_id = p.id),
      '[]'::JSONB
    ) AS media,
    -- Aggregate products as JSON array
    COALESCE(
      (SELECT jsonb_agg(jsonb_build_object(
        'slug', w.slug, 'name', w.name, 'emoji', w.emoji
      ))
      FROM post_products pp JOIN wines w ON w.id = pp.wine_id
      WHERE pp.post_id = p.id),
      '[]'::JSONB
    ) AS products,
    -- Current user liked?
    CASE WHEN p_user_id IS NOT NULL THEN
      EXISTS(SELECT 1 FROM post_likes pl WHERE pl.post_id = p.id AND pl.user_id = p_user_id)
    ELSE false END AS is_liked,
    -- Current user bookmarked?
    CASE WHEN p_user_id IS NOT NULL THEN
      EXISTS(SELECT 1 FROM post_bookmarks pb WHERE pb.post_id = p.id AND pb.user_id = p_user_id)
    ELSE false END AS is_bookmarked
  FROM posts p
  JOIN profiles pr ON pr.id = p.author_id
  LEFT JOIN merchants m ON m.id = p.merchant_id
  WHERE p.status = 'visible'
    -- Filter out blocked users
    AND (p_user_id IS NULL OR NOT EXISTS(
      SELECT 1 FROM blocks b
      WHERE b.blocker_id = p_user_id AND b.blocked_id = p.author_id
    ))
    -- Cursor pagination: (created_at, id) keyset
    AND (p_cursor_ts IS NULL OR
         (p.created_at, p.id) < (p_cursor_ts, p_cursor_id))
  ORDER BY p.created_at DESC, p.id DESC
  LIMIT p_limit;
END;
$$;

-- ============================================================
-- 24. ENABLE RLS ON ALL TABLES
-- ============================================================
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE regions ENABLE ROW LEVEL SECURITY;
ALTER TABLE merchants ENABLE ROW LEVEL SECURITY;
ALTER TABLE merchant_staff ENABLE ROW LEVEL SECURITY;
ALTER TABLE merchant_locations ENABLE ROW LEVEL SECURITY;
ALTER TABLE wines ENABLE ROW LEVEL SECURITY;
ALTER TABLE tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE wine_tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE scenes ENABLE ROW LEVEL SECURITY;
ALTER TABLE scene_wines ENABLE ROW LEVEL SECURITY;
ALTER TABLE merchant_prices ENABLE ROW LEVEL SECURITY;
ALTER TABLE merchant_applications ENABLE ROW LEVEL SECURITY;
ALTER TABLE posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE post_media ENABLE ROW LEVEL SECURITY;
ALTER TABLE post_products ENABLE ROW LEVEL SECURITY;
ALTER TABLE post_likes ENABLE ROW LEVEL SECURITY;
ALTER TABLE comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE wine_bookmarks ENABLE ROW LEVEL SECURITY;
ALTER TABLE merchant_bookmarks ENABLE ROW LEVEL SECURITY;
ALTER TABLE store_bookmarks ENABLE ROW LEVEL SECURITY;
ALTER TABLE post_bookmarks ENABLE ROW LEVEL SECURITY;
ALTER TABLE follows ENABLE ROW LEVEL SECURITY;
ALTER TABLE blocks ENABLE ROW LEVEL SECURITY;
ALTER TABLE reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE media_uploads ENABLE ROW LEVEL SECURITY;
