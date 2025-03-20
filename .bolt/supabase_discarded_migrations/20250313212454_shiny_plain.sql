/*
  # Add Premium Features to Attractions

  1. Changes
    - Add is_premium column to attractions table
    - Create index for premium filtering
    - Add RLS policy for premium content access

  2. Security
    - RLS policy to control access to premium attractions
    - Only premium subscribers can access premium content
*/

-- Add premium flag to attractions
ALTER TABLE attractions
ADD COLUMN is_premium boolean DEFAULT false;

-- Create index for faster premium filtering
CREATE INDEX idx_attractions_premium ON attractions(is_premium);

-- Update RLS policies to handle premium content
CREATE POLICY "Free users can access non-premium attractions"
  ON attractions
  FOR SELECT
  TO authenticated
  USING (
    (NOT is_premium) OR 
    EXISTS (
      SELECT 1 FROM user_subscriptions us
      JOIN subscription_tiers st ON us.tier_id = st.id
      WHERE us.user_id = auth.uid()
        AND us.is_active = true
        AND st.price > 0
    )
  );

-- Mark some existing attractions as premium (for testing)
UPDATE attractions
SET is_premium = true
WHERE id IN (
  SELECT id 
  FROM attractions 
  WHERE rating >= 4.5 
  LIMIT 5
);