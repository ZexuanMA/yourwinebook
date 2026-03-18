-- 004_community_web_columns.sql
-- Add Web community fields to posts table.
-- These columns support the existing Web community feature (title, tags, rating)
-- which predates the mobile-first Supabase schema.

ALTER TABLE posts
  ADD COLUMN IF NOT EXISTS title  TEXT,
  ADD COLUMN IF NOT EXISTS tags   TEXT[] NOT NULL DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS rating SMALLINT CHECK (rating IS NULL OR (rating >= 1 AND rating <= 5));

-- Index for tag filtering
CREATE INDEX IF NOT EXISTS idx_posts_tags ON posts USING GIN (tags);

-- Update existing seed posts with legacy Web community data
-- (matches data/community.json content)
UPDATE posts SET title = '第一次試 Cloudy Bay', tags = ARRAY['白酒', '日常自飲'], rating = 4
  WHERE id = '20000000-0000-0000-0000-000000000001';

UPDATE posts SET title = '週末 Moët 開箱', tags = ARRAY['氣泡酒', '聚餐'], rating = 5
  WHERE id = '20000000-0000-0000-0000-000000000002';

UPDATE posts SET title = 'Penfolds Bin 389 永遠的經典', tags = ARRAY['紅酒', '知識分享'], rating = 5
  WHERE id = '20000000-0000-0000-0000-000000000003';

UPDATE posts SET title = 'Marlborough Sauvignon Blanc 季節推薦', tags = ARRAY['白酒', '推薦']
  WHERE id = '20000000-0000-0000-0000-000000000004';

UPDATE posts SET title = '新手入門推薦', tags = ARRAY['紅酒', '新手友善', '求推薦'], rating = 4
  WHERE id = '20000000-0000-0000-0000-000000000005';

UPDATE posts SET title = '春季品鑑會預告', tags = ARRAY['活動', '品鑑會']
  WHERE id = '20000000-0000-0000-0000-000000000006';

UPDATE posts SET title = '週末小酌 Whispering Angel', tags = ARRAY['粉紅酒', '日常自飲'], rating = 4
  WHERE id = '20000000-0000-0000-0000-000000000007';

UPDATE posts SET title = '尋找送禮好酒', tags = ARRAY['送禮', '求推薦']
  WHERE id = '20000000-0000-0000-0000-000000000008';
