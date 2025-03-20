/*
  # Add image support for attractions

  1. Changes
    - Add image_url column to attractions table
    - Update fetch_attractions_within_radius function to include image_url
    - Add sample image URLs for existing attractions

  2. Implementation Details
    - Use high-quality Unsplash images
    - Ensure proper URL handling
*/

-- Add image_url column if it doesn't exist
ALTER TABLE attractions
ADD COLUMN IF NOT EXISTS image_url text;

-- Drop existing function
DROP FUNCTION IF EXISTS fetch_attractions_within_radius(double precision, double precision, double precision);

-- Recreate function with image_url
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
    COALESCE(a.is_premium, false) as is_premium,
    a.image_url
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

-- Update sample attractions with high-quality images
UPDATE attractions
SET image_url = CASE name
  WHEN 'Statue of Liberty' THEN 'https://images.unsplash.com/photo-1605130284535-11dd9eedc58a'
  WHEN 'Central Park' THEN 'https://images.unsplash.com/photo-1534804630877-e3bf4418aca0'
  WHEN 'Empire State Building' THEN 'https://images.unsplash.com/photo-1555109307-f0b1f7d6b6ed'
  WHEN 'Tower of London' THEN 'https://images.unsplash.com/photo-1590512798524-b4ebb2f7fa0b'
  WHEN 'Big Ben' THEN 'https://images.unsplash.com/photo-1529655683826-aba9b3e77383'
  WHEN 'Tokyo Skytree' THEN 'https://images.unsplash.com/photo-1542051841857-5f90071e7989'
  WHEN 'Senso-ji Temple' THEN 'https://images.unsplash.com/photo-1570077188670-e3a8d69ac5ff'
END
WHERE name IN (
  'Statue of Liberty',
  'Central Park',
  'Empire State Building',
  'Tower of London',
  'Big Ben',
  'Tokyo Skytree',
  'Senso-ji Temple'
);