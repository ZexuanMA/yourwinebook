-- 006: Update get_feed RPC to include title, tags, rating fields

CREATE OR REPLACE FUNCTION get_feed(
  p_user_id    UUID DEFAULT NULL,
  p_cursor_ts  TIMESTAMPTZ DEFAULT NULL,
  p_cursor_id  UUID DEFAULT NULL,
  p_limit      INT DEFAULT 20
)
RETURNS TABLE (
  id            UUID,
  content       TEXT,
  title         TEXT,
  tags          TEXT[],
  rating        SMALLINT,
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
    p.title,
    p.tags,
    p.rating,
    p.is_official,
    p.like_count,
    p.comment_count,
    p.created_at,
    pr.id            AS author_id,
    pr.display_name  AS author_name,
    pr.avatar_url    AS author_avatar,
    m.name           AS merchant_name,
    COALESCE(
      (SELECT jsonb_agg(jsonb_build_object(
        'id', pm.id, 'url', pm.url, 'mime_type', pm.mime_type,
        'width', pm.width, 'height', pm.height
      ) ORDER BY pm.sort_order)
      FROM post_media pm WHERE pm.post_id = p.id),
      '[]'::JSONB
    ) AS media,
    COALESCE(
      (SELECT jsonb_agg(jsonb_build_object(
        'slug', w.slug, 'name', w.name, 'emoji', w.emoji
      ))
      FROM post_products pp JOIN wines w ON w.id = pp.wine_id
      WHERE pp.post_id = p.id),
      '[]'::JSONB
    ) AS products,
    CASE WHEN p_user_id IS NOT NULL THEN
      EXISTS(SELECT 1 FROM post_likes pl WHERE pl.post_id = p.id AND pl.user_id = p_user_id)
    ELSE false END AS is_liked,
    CASE WHEN p_user_id IS NOT NULL THEN
      EXISTS(SELECT 1 FROM post_bookmarks pb WHERE pb.post_id = p.id AND pb.user_id = p_user_id)
    ELSE false END AS is_bookmarked
  FROM posts p
  JOIN profiles pr ON pr.id = p.author_id
  LEFT JOIN merchants m ON m.id = p.merchant_id
  WHERE p.status = 'visible'
    AND (p_user_id IS NULL OR NOT EXISTS(
      SELECT 1 FROM blocks b
      WHERE b.blocker_id = p_user_id AND b.blocked_id = p.author_id
    ))
    AND (p_cursor_ts IS NULL OR
         (p.created_at, p.id) < (p_cursor_ts, p_cursor_id))
  ORDER BY p.created_at DESC, p.id DESC
  LIMIT p_limit;
END;
$$;
