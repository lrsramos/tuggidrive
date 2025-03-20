/*
  # Update Coordinates Structure

  1. Changes
    - Move coordinates to dedicated table
    - Update fetch_attractions_within_radius function
    - Add proper indexes and constraints
    - Migrate existing coordinates

  2. Security
    - Enable RLS
    - Add proper policies
    - Maintain data integrity
*/

-- First, ensure the attraction_coordinates table exists with proper structure
CREATE TABLE IF NOT EXISTS attraction_coordinates (
  id SERIAL PRIMARY KEY,
  attraction_id uuid NOT NULL REFERENCES attractions(id) ON DELETE CASCADE,
  latitude double precision NOT NULL,
  longitude double precision NOT NULL,
  show_in_map boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  UNIQUE(attraction_id, latitude, longitude)
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_attraction_coordinates_location 
  ON attraction_coordinates(latitude, longitude);
CREATE INDEX IF NOT EXISTS idx_attraction_coordinates_attraction 
  ON attraction_coordinates(attraction_id);

-- Enable RLS
ALTER TABLE attraction_coordinates ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Anyone can read coordinates"
  ON attraction_coordinates
  FOR SELECT
  TO public
  USING (true);

-- Migrate existing coordinates from attractions table
INSERT INTO attraction_coordinates (attraction_id, latitude, longitude)
SELECT 
  id as attraction_id,
  latitude,
  longitude
FROM attractions
ON CONFLICT (attraction_id, latitude, longitude) DO NOTHING;

-- Drop existing function
DROP FUNCTION IF EXISTS fetch_attractions_within_radius(double precision, double precision, double precision);

-- Recreate the function to use attraction_coordinates
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
  JOIN attraction_coordinates ac ON ac.attraction_id = a.id
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
  ORDER BY distance_km ASC;
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION fetch_attractions_within_radius TO authenticated;

-- Remove latitude and longitude columns from attractions table
-- since they're now in attraction_coordinates
ALTER TABLE attractions 
  DROP COLUMN IF EXISTS latitude,
  DROP COLUMN IF EXISTS longitude;