/*
  # Fix Attractions Table and Function Setup

  1. Changes
    - Create attractions table if not exists
    - Add proper indexes for geospatial queries
    - Update fetch_attractions_within_radius function
    - Add sample data for testing

  2. Security
    - Enable RLS
    - Add proper policies
*/

-- Create attractions table if not exists
CREATE TABLE IF NOT EXISTS attractions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text,
  city text,
  country text,
  latitude double precision NOT NULL,
  longitude double precision NOT NULL,
  rating numeric DEFAULT 0,
  audio_guides_count integer DEFAULT 0,
  is_premium boolean DEFAULT false,
  approved boolean DEFAULT false,
  approved_by uuid REFERENCES profiles(id),
  approved_at timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_attractions_location ON attractions USING gist (ll_to_earth(latitude, longitude));
CREATE INDEX IF NOT EXISTS idx_attractions_approved ON attractions(approved);
CREATE INDEX IF NOT EXISTS idx_attractions_premium ON attractions(is_premium);

-- Enable RLS
ALTER TABLE attractions ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
DROP POLICY IF EXISTS "Anyone can read approved attractions" ON attractions;
CREATE POLICY "Anyone can read approved attractions"
  ON attractions
  FOR SELECT
  TO public
  USING (approved = true);

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
  -- Install the earthdistance extension if not exists
  CREATE EXTENSION IF NOT EXISTS earthdistance CASCADE;
  
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

-- Add sample attractions near common locations
INSERT INTO attractions (
  name,
  description,
  city,
  country,
  latitude,
  longitude,
  approved,
  is_premium,
  rating
) VALUES 
-- New York attractions
(
  'Statue of Liberty',
  'Iconic symbol of freedom and democracy',
  'New York',
  'United States',
  40.6892,
  -74.0445,
  true,
  false,
  4.8
),
(
  'Central Park',
  'Urban oasis in the heart of Manhattan',
  'New York',
  'United States',
  40.7829,
  -73.9654,
  true,
  false,
  4.9
),
(
  'Empire State Building',
  'Historic Art Deco skyscraper with observation deck',
  'New York',
  'United States',
  40.7484,
  -73.9857,
  true,
  true,
  4.7
),
-- London attractions
(
  'Tower of London',
  'Historic castle and fortress on the River Thames',
  'London',
  'United Kingdom',
  51.5081,
  -0.0759,
  true,
  false,
  4.6
),
(
  'Big Ben',
  'Iconic clock tower at the north end of Westminster',
  'London',
  'United Kingdom',
  51.5007,
  -0.1246,
  true,
  true,
  4.8
),
-- Tokyo attractions
(
  'Tokyo Skytree',
  'Tallest structure in Japan with observation decks',
  'Tokyo',
  'Japan',
  35.7101,
  139.8107,
  true,
  false,
  4.5
),
(
  'Senso-ji Temple',
  'Ancient Buddhist temple in Asakusa',
  'Tokyo',
  'Japan',
  35.7147,
  139.7967,
  true,
  true,
  4.7
);