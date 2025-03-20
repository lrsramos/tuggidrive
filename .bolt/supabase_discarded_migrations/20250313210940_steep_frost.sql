/*
  # Add premium features to attractions

  1. New Column
    - `is_premium`: Boolean flag to mark premium attractions
    
  2. Changes
    - Add column to attractions table
    - Update existing attractions
    - Add RLS policies for premium content
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