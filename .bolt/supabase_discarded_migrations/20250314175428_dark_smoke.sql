/*
  # Fix POI Coordinates Function

  1. Changes
    - Update fetch_attractions_within_radius function to properly use attraction_coordinates
    - Remove any remaining references to direct latitude/longitude from attractions table
    - Ensure proper table joins and column references

  2. Security
    - Maintain existing RLS policies
    - Keep security definer setting
*/

-- Drop existing function
DROP FUNCTION IF EXISTS fetch_attractions_within_radius(double precision, double precision, double precision);

-- Recreate the function with proper table references
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
  SELECT DISTINCT ON (a.id)
    a.id,
    a.name,
    a.description,
    ac.latitude,
    ac.longitude,
    earth_distance(
      ll_to_earth(ac.latitude, ac.longitude),
      ll_to_earth(user_lat, user_lon)
    ) / 1000 AS distance_km,
    a.city,
    a.country,
    COALESCE(a.is_premium, false) as is_premium
  FROM attractions a
  INNER JOIN attraction_coordinates ac ON ac.attraction_id = a.id
  LEFT JOIN user_subscription us ON true
  WHERE earth_distance(
    ll_to_earth(ac.latitude, ac.longitude),
    ll_to_earth(user_lat, user_lon)
  ) / 1000 <= radius_km
    AND a.approved = true
    AND ac.show_in_map = true
    AND (
      NOT COALESCE(a.is_premium, false) 
      OR COALESCE(us.is_premium_user, false) = true
    )
  ORDER BY a.id, distance_km ASC;
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION fetch_attractions_within_radius TO authenticated;

-- Ensure we have the required extensions
CREATE EXTENSION IF NOT EXISTS cube;
CREATE EXTENSION IF NOT EXISTS earthdistance;

-- Add sample coordinates for existing attractions if they don't exist
INSERT INTO attraction_coordinates (attraction_id, latitude, longitude)
SELECT 
  id as attraction_id,
  40.6892 as latitude,
  -74.0445 as longitude
FROM attractions 
WHERE name = 'Statue of Liberty'
ON CONFLICT (attraction_id, latitude, longitude) DO NOTHING;

INSERT INTO attraction_coordinates (attraction_id, latitude, longitude)
SELECT 
  id as attraction_id,
  40.7829 as latitude,
  -73.9654 as longitude
FROM attractions 
WHERE name = 'Central Park'
ON CONFLICT (attraction_id, latitude, longitude) DO NOTHING;

INSERT INTO attraction_coordinates (attraction_id, latitude, longitude)
SELECT 
  id as attraction_id,
  40.7484 as latitude,
  -73.9857 as longitude
FROM attractions 
WHERE name = 'Empire State Building'
ON CONFLICT (attraction_id, latitude, longitude) DO NOTHING;

INSERT INTO attraction_coordinates (attraction_id, latitude, longitude)
SELECT 
  id as attraction_id,
  51.5081 as latitude,
  -0.0759 as longitude
FROM attractions 
WHERE name = 'Tower of London'
ON CONFLICT (attraction_id, latitude, longitude) DO NOTHING;

INSERT INTO attraction_coordinates (attraction_id, latitude, longitude)
SELECT 
  id as attraction_id,
  51.5007 as latitude,
  -0.1246 as longitude
FROM attractions 
WHERE name = 'Big Ben'
ON CONFLICT (attraction_id, latitude, longitude) DO NOTHING;

INSERT INTO attraction_coordinates (attraction_id, latitude, longitude)
SELECT 
  id as attraction_id,
  35.7101 as latitude,
  139.8107 as longitude
FROM attractions 
WHERE name = 'Tokyo Skytree'
ON CONFLICT (attraction_id, latitude, longitude) DO NOTHING;

INSERT INTO attraction_coordinates (attraction_id, latitude, longitude)
SELECT 
  id as attraction_id,
  35.7147 as latitude,
  139.7967 as longitude
FROM attractions 
WHERE name = 'Senso-ji Temple'
ON CONFLICT (attraction_id, latitude, longitude) DO NOTHING;