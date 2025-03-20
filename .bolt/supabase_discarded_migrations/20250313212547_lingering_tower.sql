/*
  # Fix Premium Features Implementation

  1. Changes
    - Consolidate premium-related migrations
    - Fix duplicate migrations
    - Ensure proper order of operations
    - Add missing columns and indexes
    - Update function definitions

  2. Security
    - Maintain existing RLS policies
    - Ensure proper access control
*/

-- Drop existing function if exists to avoid conflicts
DROP FUNCTION IF EXISTS fetch_attractions_within_radius(double precision, double precision, double precision);

-- Ensure is_premium column exists
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 
    FROM information_schema.columns 
    WHERE table_name = 'attractions' 
    AND column_name = 'is_premium'
  ) THEN
    ALTER TABLE attractions
    ADD COLUMN is_premium boolean DEFAULT false;
  END IF;
END $$;

-- Recreate index if needed
DROP INDEX IF EXISTS idx_attractions_premium;
CREATE INDEX idx_attractions_premium ON attractions(is_premium);

-- Drop existing policies to avoid conflicts
DROP POLICY IF EXISTS "Free users can access non-premium attractions" ON attractions;

-- Recreate RLS policy
CREATE POLICY "Free users can access non-premium attractions"
  ON attractions
  FOR SELECT
  TO authenticated
  USING (
    (NOT COALESCE(is_premium, false)) OR 
    EXISTS (
      SELECT 1 FROM user_subscriptions us
      JOIN subscription_tiers st ON us.tier_id = st.id
      WHERE us.user_id = auth.uid()
        AND us.is_active = true
        AND st.price > 0
    )
  );

-- Recreate the function with proper premium handling
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
    COALESCE(a.is_premium, false) as is_premium
  FROM attractions a
  WHERE 
    (point(a.longitude, a.latitude) <@> point(user_lon, user_lat)) <= radius_km
    AND a.approved = true
    AND (
      NOT COALESCE(a.is_premium, false)
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

-- Mark some attractions as premium for testing
UPDATE attractions
SET is_premium = true
WHERE id IN (
  SELECT id 
  FROM attractions 
  WHERE rating >= 4.5 
  LIMIT 5
);