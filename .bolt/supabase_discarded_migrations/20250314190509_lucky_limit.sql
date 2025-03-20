/*
  # Add description expiration tracking

  1. Changes
    - Add play_count to attraction_descriptions table
    - Add last_played_at to track when description was last used
    - Create function to check if description needs refresh
    - Update RLS policies

  2. Security
    - Maintain existing RLS policies
    - Add new policies for play count updates
*/

-- Add new columns to attraction_descriptions
ALTER TABLE attraction_descriptions
ADD COLUMN IF NOT EXISTS play_count integer DEFAULT 0,
ADD COLUMN IF NOT EXISTS last_played_at timestamptz;

-- Create function to check if description needs refresh
CREATE OR REPLACE FUNCTION should_refresh_description(
  play_count integer,
  created_at timestamptz,
  last_played_at timestamptz
) RETURNS boolean AS $$
BEGIN
  RETURN (
    play_count >= 50 OR -- More than 50 plays
    (CURRENT_TIMESTAMP - created_at) > INTERVAL '7 days' OR -- Older than 7 days
    (last_played_at IS NOT NULL AND (CURRENT_TIMESTAMP - last_played_at) > INTERVAL '7 days') -- Not played in 7 days
  );
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Create policy for updating play count
CREATE POLICY "Users can update play count"
  ON attraction_descriptions
  FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Create trigger to update last_played_at
CREATE OR REPLACE FUNCTION update_description_play_count()
RETURNS TRIGGER AS $$
BEGIN
  NEW.last_played_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER description_played
  BEFORE UPDATE OF play_count
  ON attraction_descriptions
  FOR EACH ROW
  EXECUTE FUNCTION update_description_play_count();