-- 005: Update get_nearby_stores RPC
-- 1. Return lat/lng for map marker placement on C-end
-- 2. Filter out stores belonging to non-active merchants

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
  lat          DOUBLE PRECISION,
  lng          DOUBLE PRECISION,
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
    JOIN merchants m ON m.id = ml.merchant_id
    WHERE ml.is_active = true
      AND m.status = 'active'
      AND ml.location IS NOT NULL
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
        ST_Y(ml.location::GEOMETRY) AS lat,
        ST_X(ml.location::GEOMETRY) AS lng,
        ST_Distance(ml.location, v_point) AS distance_m,
        CASE WHEN p_user_id IS NOT NULL THEN
          EXISTS(SELECT 1 FROM store_bookmarks sb WHERE sb.user_id = p_user_id AND sb.location_id = ml.id)
        ELSE false END AS is_bookmarked
      FROM merchant_locations ml
      JOIN merchants m ON m.id = ml.merchant_id
      WHERE ml.is_active = true
        AND m.status = 'active'
        AND ml.location IS NOT NULL
        AND ST_DWithin(ml.location, v_point, v_radius)
      ORDER BY distance_m
      LIMIT p_limit;
      RETURN;
    END IF;
  END LOOP;
END;
$$;
