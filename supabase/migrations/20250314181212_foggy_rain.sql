/*
  # Update fetch_attractions_within_radius function

  1. Changes
    - Remove premium tier check from function
    - Simplify query to only check for approved attractions
    - Keep distance calculation and sorting

  2. Security
    - Maintain existing RLS policies
    - Keep security definer setting
*/

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