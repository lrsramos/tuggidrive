/*
  # Add language-specific descriptions table

  1. Changes
    - Create attraction_descriptions table for multilingual support
    - Add necessary indexes and constraints
    - Enable RLS policies
    - Update fetch_attractions function

  2. Security
    - Enable RLS
    - Add proper policies
    - Maintain data integrity
*/

-- Create attraction_descriptions table if it doesn't exist
CREATE TABLE IF NOT EXISTS attraction_descriptions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  attraction_id uuid NOT NULL REFERENCES attractions(id) ON DELETE CASCADE,
  language text NOT NULL,
  description text NOT NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(attraction_id, language)
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_attraction_descriptions_attraction ON attraction_descriptions(attraction_id);
CREATE INDEX IF NOT EXISTS idx_attraction_descriptions_language ON attraction_descriptions(language);

-- Enable RLS
ALTER TABLE attraction_descriptions ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Anyone can read descriptions"
  ON attraction_descriptions
  FOR SELECT
  TO public
  USING (true);

CREATE POLICY "Authenticated users can insert descriptions"
  ON attraction_descriptions
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Drop existing function
DROP FUNCTION IF EXISTS fetch_attractions_within_radius(double precision, double precision, double precision);

-- Recreate the function without premium checks
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
  is_premium boolean,
  image_url text
) AS $$
BEGIN
  RETURN QUERY
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
    COALESCE(a.is_premium, false) as is_premium,
    a.image_url
  FROM attractions a
  INNER JOIN attraction_coordinates ac ON ac.attraction_id = a.id
  WHERE earth_distance(
    ll_to_earth(ac.latitude, ac.longitude),
    ll_to_earth(user_lat, user_lon)
  ) / 1000 <= radius_km
    AND a.approved = true
    AND ac.show_in_map = true
  ORDER BY a.id, distance_km ASC;
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION fetch_attractions_within_radius TO authenticated;