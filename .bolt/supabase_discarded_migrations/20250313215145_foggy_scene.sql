/*
  # Fix POIs Retrieval

  1. Changes
    - Update fetch_attractions_within_radius function
    - Add proper RLS policies for attractions table
    - Fix premium content access

  2. Security
    - Ensure proper access control
    - Maintain data integrity
*/

-- Drop existing function if exists
DROP FUNCTION IF EXISTS fetch_attractions_within_radius(double precision, double precision, double precision);

-- Enable RLS on attractions table
ALTER TABLE attractions ENABLE ROW LEVEL SECURITY;

-- Create base RLS policy for attractions
CREATE POLICY "Anyone can read approved attractions"
  ON attractions
  FOR SELECT
  TO public
  USING (approved = true);

-- Recreate the function with proper handling
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
    (point(a.longitude, a.latitude) <@> point(user_lon, user_lat))::double precision AS distance_km,
    a.city,
    a.country,
    COALESCE(a.is_premium, false) as is_premium
  FROM attractions a
  LEFT JOIN user_subscription us ON true
  WHERE 
    (point(a.longitude, a.latitude) <@> point(user_lon, user_lat)) <= radius_km
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

-- Add some sample attractions for testing
INSERT INTO attractions (
  name, 
  description, 
  city, 
  country, 
  latitude, 
  longitude, 
  approved,
  is_premium
) VALUES 
(
  'Eiffel Tower',
  'Iconic iron lattice tower on the Champ de Mars in Paris',
  'Paris',
  'France',
  48.8584,
  2.2945,
  true,
  false
),
(
  'Louvre Museum',
  'World''s largest art museum and historic monument',
  'Paris',
  'France',
  48.8606,
  2.3376,
  true,
  true
),
(
  'Notre-Dame Cathedral',
  'Medieval Catholic cathedral on the Île de la Cité',
  'Paris',
  'France',
  48.8530,
  2.3499,
  true,
  false
);