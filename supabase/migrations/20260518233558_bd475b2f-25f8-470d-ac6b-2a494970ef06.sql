UPDATE hevy_workouts_cache w
SET volume_kg = COALESCE(sub.total, 0)
FROM (
  SELECT id, ROUND(SUM(
    COALESCE((s->>'weight_kg')::numeric, CASE WHEN s->>'weight_lbs' IS NOT NULL THEN (s->>'weight_lbs')::numeric * 0.453592 ELSE 0 END)
    * COALESCE((s->>'reps')::numeric, 0)
  )::numeric, 2) AS total
  FROM hevy_workouts_cache,
       jsonb_array_elements(COALESCE(raw_data->'exercises','[]'::jsonb)) ex,
       jsonb_array_elements(COALESCE(ex->'sets','[]'::jsonb)) s
  GROUP BY id
) sub
WHERE w.id = sub.id;