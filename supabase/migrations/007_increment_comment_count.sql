-- 007: Atomic comment count increment function for create-comment Edge Function

CREATE OR REPLACE FUNCTION increment_comment_count(p_post_id UUID)
RETURNS void
LANGUAGE sql
AS $$
  UPDATE posts SET comment_count = comment_count + 1 WHERE id = p_post_id;
$$;
