/*
  # Fix Attractions Function

  1. Changes
    - Create earthdistance extension properly
    - Update fetch_attractions_within_radius function
    - Remove extension creation from function

  2. Security
    - Maintain existing RLS policies
    - Keep function security definer
*/

-- Create required extensions (outside of function)
CREATE EXTENSION IF NOT EXISTS cube;
CREATE EXTENSION IF NOT EXISTS earthdistance;

-- Drop existing function if exists
DROP FUNCTION IF EXISTS fetch_attractions_within_radius(double precision, double precision, double precision);

-- Create the function with proper handling
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
  WITH user_subscription AS (
    SELECT st.price > 0 as is_premium_user
    FROM user_subscriptions us
    JOIN subscription_tiers st ON us.tier_id = st.id
    WHERE us.user_id = auth.uid()
      AND us.is_active = true
      AND us.starts_at <= CURRENT_TIMESTAMP
      AND us.expires_at > CURRENT_TIMESTAMP
    ORDER BY us.created_at DESC
    LIMIT 1
  )
  SELECT 
    a.id,
    a.name,
    a.description,
    a.latitude,
    a.longitude,
    earth_distance(
      ll_to_earth(a.latitude, a.longitude),
      ll_to_earth(user_lat, user_lon)
    ) / 1000 AS distance_km,
    a.city,
    a.country,
    COALESCE(a.is_premium, false) as is_premium
  FROM attractions a
  LEFT JOIN user_subscription us ON true
  WHERE earth_distance(
    ll_to_earth(a.latitude, a.longitude),
    ll_to_earth(user_lat, user_lon)
  ) / 1000 <= radius_km
    AND a.approved = true
    AND (
      NOT COALESCE(a.is_premium, false) 
      OR COALESCE(us.is_premium_user, false) = true
    )
  ORDER BY distance_km ASC;
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION fetch_attractions_within_radius TO authenticated;