/*
  # Premium POIs Integration

  1. New Function
    - Update fetch_attractions_within_radius to handle premium content
    - Add premium flag to response
    - Filter based on user's subscription status

  2. Changes
    - Modify existing function to include premium status
    - Add subscription check logic
*/

CREATE OR REPLACE FUNCTION fetch_attractions_within_radius(
  user_lat double precision,
  user_lon double precision,
  radius_km double precision
)
RETURNS TABLE (
  id uuid,
  name text,
  description text,
  latitude double precision,
  longitude double precision,
  distance_km double precision,
  city text,
  country text,
  is_premium boolean
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    a.id,
    a.name,
    a.description,
    a.latitude,
    a.longitude,
    (point(a.longitude, a.latitude) <@> point(user_lon, user_lat))::double precision AS distance_km,
    a.city,
    a.country,
    a.is_premium
  FROM attractions a
  WHERE 
    (point(a.longitude, a.latitude) <@> point(user_lon, user_lat)) <= radius_km
    AND a.approved = true
    AND (
      NOT a.is_premium 
      OR EXISTS (
        SELECT 1 
        FROM user_subscriptions us
        JOIN subscription_tiers st ON us.tier_id = st.id
        WHERE us.user_id = auth.uid()
          AND us.is_active = true
          AND st.price > 0
      )
    )
  ORDER BY distance_km ASC;
END;
$$ LANGUAGE plpgsql STABLE;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION fetch_attractions_within_radius TO authenticated;