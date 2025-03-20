/*
  # Create function to fetch attractions within radius

  1. New Function
    - `fetch_attractions_within_radius`: Returns attractions within a specified radius
      - Parameters:
        - user_lat: User's latitude
        - user_lon: User's longitude
        - radius_km: Search radius in kilometers
      - Returns: Table of nearby attractions with distance

  2. Implementation Details
    - Uses PostGIS earth_distance functions for efficient distance calculation
    - Returns attractions ordered by distance
    - Includes distance in kilometers in the result
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
  distance_km double precision
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    a.id,
    a.name,
    a.description,
    a.latitude,
    a.longitude,
    (point(a.longitude, a.latitude) <@> point(user_lon, user_lat))::double precision AS distance_km
  FROM attractions a
  WHERE 
    (point(a.longitude, a.latitude) <@> point(user_lon, user_lat)) <= radius_km
    AND a.approved = true
  ORDER BY distance_km ASC;
END;
$$ LANGUAGE plpgsql STABLE;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION fetch_attractions_within_radius TO authenticated;