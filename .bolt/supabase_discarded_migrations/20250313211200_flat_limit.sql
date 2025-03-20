/*
  # Add attraction descriptions table

  1. New Table
    - `attraction_descriptions`: Stores generated descriptions in different languages
      - `id` (uuid, primary key)
      - `attraction_id` (uuid, references attractions)
      - `language` (text)
      - `description` (text)
      - `created_at` (timestamp)

  2. Changes
    - Create table for storing descriptions
    - Add indexes for faster queries
    - Set up RLS policies
*/

-- Create attraction descriptions table
CREATE TABLE attraction_descriptions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  attraction_id uuid NOT NULL REFERENCES attractions(id) ON DELETE CASCADE,
  language text NOT NULL,
  description text NOT NULL,
  created_at timestamptz DEFAULT now(),
  UNIQUE(attraction_id, language)
);

-- Create indexes
CREATE INDEX idx_attraction_descriptions_attraction ON attraction_descriptions(attraction_id);
CREATE INDEX idx_attraction_descriptions_language ON attraction_descriptions(language);

-- Enable RLS
ALTER TABLE attraction_descriptions ENABLE ROW LEVEL SECURITY;

-- Add RLS policies
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