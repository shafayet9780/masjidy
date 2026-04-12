-- FR-006: Followed mosques with next live jamat (same next-prayer logic as nearby_mosques_with_next_prayer)
-- Sorted by next jamat (today before tomorrow; nulls last). PostGIS distance from caller lat/lng.

CREATE OR REPLACE FUNCTION public.followed_mosques_with_next_prayer(
  p_mosque_ids UUID[],
  p_lat DOUBLE PRECISION,
  p_lng DOUBLE PRECISION,
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
  picked AS (
    SELECT DISTINCT m.id AS mosque_id, m.name AS mosque_name, m.facilities, m.location
    FROM public.mosques m
    WHERE m.id = ANY(p_mosque_ids)
  ),
  with_dist AS (
    SELECT
      p.mosque_id,
      p.mosque_name,
      p.facilities,
      (ST_Distance(p.location, (SELECT g FROM origin), true) / 1000.0)::double precision AS dist_km
    FROM picked p
    CROSS JOIN origin o
  )
  SELECT
    w.mosque_id AS id,
    w.mosque_name AS name,
    w.dist_km AS distance_km,
    COALESCE(nt.prayer, nw.prayer) AS next_prayer,
    COALESCE(nt.time, nw.time) AS next_jamat_time,
    COALESCE(nt.trust_score, nw.trust_score) AS next_trust_score,
    COALESCE(w.facilities, '{}'::jsonb) AS facilities,
    (nt.prayer IS NULL AND nw.prayer IS NOT NULL) AS is_tomorrow
  FROM with_dist w
  LEFT JOIN LATERAL (
    SELECT jt.prayer, jt.time, jt.trust_score
    FROM public.jamat_times jt
    WHERE jt.mosque_id = w.mosque_id
      AND jt.status = 'live'
      AND (jt.time::time) > p_current_local_time
    ORDER BY (jt.time::time) ASC
    LIMIT 1
  ) nt ON true
  LEFT JOIN LATERAL (
    SELECT jt.prayer, jt.time, jt.trust_score
    FROM public.jamat_times jt
    WHERE jt.mosque_id = w.mosque_id
      AND jt.status = 'live'
    ORDER BY (jt.time::time) ASC
    LIMIT 1
  ) nw ON nt.prayer IS NULL
  ORDER BY
    CASE WHEN COALESCE(nt.prayer, nw.prayer) IS NULL THEN 1 ELSE 0 END,
    CASE WHEN nt.prayer IS NULL AND nw.prayer IS NOT NULL THEN 1 ELSE 0 END,
    (COALESCE(nt.time, nw.time))::time ASC NULLS LAST;
$$;

REVOKE ALL ON FUNCTION public.followed_mosques_with_next_prayer(
  UUID[],
  DOUBLE PRECISION,
  DOUBLE PRECISION,
  TIME
) FROM PUBLIC;

GRANT EXECUTE ON FUNCTION public.followed_mosques_with_next_prayer(
  UUID[],
  DOUBLE PRECISION,
  DOUBLE PRECISION,
  TIME
) TO anon, authenticated;

-- ---------------------------------------------------------------------------
-- Max 50 follows per user (server authority; client also checks)
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.enforce_follow_limit()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  IF (
    SELECT COUNT(*)::int FROM public.follows f WHERE f.user_id = NEW.user_id
  ) >= 50 THEN
    RAISE EXCEPTION 'FOLLOW_LIMIT_REACHED'
      USING ERRCODE = 'check_violation',
      HINT = 'Maximum 50 follows per user';
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS follows_enforce_limit_insert ON public.follows;
CREATE TRIGGER follows_enforce_limit_insert
  BEFORE INSERT ON public.follows
  FOR EACH ROW
  EXECUTE FUNCTION public.enforce_follow_limit();
