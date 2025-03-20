/*
  # Fix Attractions Table Structure

  1. Changes
    - Create attractions table with proper columns
    - Add necessary indexes
    - Add sample data
    - Enable RLS

  2. Security
    - Enable RLS
    - Add proper policies
    - Maintain data integrity
*/

-- Create attractions table with proper structure
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

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_attractions_location ON attractions(latitude, longitude);
CREATE INDEX IF NOT EXISTS idx_attractions_approved ON attractions(approved);
CREATE INDEX IF NOT EXISTS idx_attractions_premium ON attractions(is_premium);

-- Enable RLS
ALTER TABLE attractions ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Anyone can read approved attractions"
  ON attractions
  FOR SELECT
  TO public
  USING (approved = true);

-- Add sample attractions for testing
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