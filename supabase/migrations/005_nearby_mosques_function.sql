-- FR-002: Nearby mosques with next live jamat (PostGIS + timezone-safe wall-clock compare)
-- SECURITY INVOKER (default): relies on RLS (mosques public read, jamat_times live only).

CREATE OR REPLACE FUNCTION public.nearby_mosques_with_next_prayer(
  p_lat DOUBLE PRECISION,
  p_lng DOUBLE PRECISION,
  p_radius_km INT DEFAULT 10,
  p_limit INT DEFAULT 20,
  p_current_local_time TIME DEFAULT LOCALTIME
)
RETURNS TABLE (
  id UUID,
  name TEXT,
  distance_km DOUBLE PRECISION,
  next_prayer public.prayer_type,
  next_jamat_time TIMETZ,
  next_trust_score INT,
  facilities JSONB,
  is_tomorrow BOOLEAN
)
LANGUAGE sql
STABLE
SET search_path = public
AS $$
  WITH origin AS (
    SELECT ST_Point(p_lng, p_lat)::geography AS g
  ),
  nearby AS (
    SELECT
      m.id AS mosque_id,
      m.name AS mosque_name,
      m.facilities,
      (ST_Distance(m.location, (SELECT g FROM origin), true) / 1000.0)::double precision AS dist_km
    FROM public.mosques m
    CROSS JOIN origin o
    WHERE ST_DWithin(m.location, o.g, p_radius_km * 1000.0)
    ORDER BY dist_km ASC
    LIMIT p_limit
  )
  SELECT
    n.mosque_id AS id,
    n.mosque_name AS name,
    n.dist_km AS distance_km,
    COALESCE(nt.prayer, nw.prayer) AS next_prayer,
    COALESCE(nt.time, nw.time) AS next_jamat_time,
    COALESCE(nt.trust_score, nw.trust_score) AS next_trust_score,
    COALESCE(n.facilities, '{}'::jsonb) AS facilities,
    (nt.prayer IS NULL AND nw.prayer IS NOT NULL) AS is_tomorrow
  FROM nearby n
  LEFT JOIN LATERAL (
    SELECT jt.prayer, jt.time, jt.trust_score
    FROM public.jamat_times jt
    WHERE jt.mosque_id = n.mosque_id
      AND jt.status = 'live'
      AND (jt.time::time) > p_current_local_time
    ORDER BY (jt.time::time) ASC
    LIMIT 1
  ) nt ON true
  LEFT JOIN LATERAL (
    SELECT jt.prayer, jt.time, jt.trust_score
    FROM public.jamat_times jt
    WHERE jt.mosque_id = n.mosque_id
      AND jt.status = 'live'
    ORDER BY (jt.time::time) ASC
    LIMIT 1
  ) nw ON nt.prayer IS NULL
  ORDER BY n.dist_km ASC;
$$;

REVOKE ALL ON FUNCTION public.nearby_mosques_with_next_prayer(
  DOUBLE PRECISION,
  DOUBLE PRECISION,
  INT,
  INT,
  TIME
) FROM PUBLIC;

GRANT EXECUTE ON FUNCTION public.nearby_mosques_with_next_prayer(
  DOUBLE PRECISION,
  DOUBLE PRECISION,
  INT,
  INT,
  TIME
) TO anon, authenticated;
