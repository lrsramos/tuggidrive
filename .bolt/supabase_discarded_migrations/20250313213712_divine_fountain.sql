/*
  # Fix Subscription Tiers Implementation

  1. Changes
    - Use proper UUID generation for tier IDs
    - Fix feature limits implementation
    - Add proper RLS policies
    - Add feature access function

  2. Implementation Details
    - Use gen_random_uuid() for tier IDs
    - Set up feature limits correctly
    - Implement proper access control
*/

-- Reset existing data
TRUNCATE subscription_tiers CASCADE;

-- Insert subscription tiers with proper UUIDs
WITH inserted_tiers AS (
  INSERT INTO subscription_tiers (id, name, description, price, duration_days, is_active)
  VALUES
    (
      gen_random_uuid(),
      'Free',
      'Basic features for casual users',
      0,
      36500, -- ~100 years
      true
    ),
    (
      gen_random_uuid(),
      'Premium',
      'Enhanced features for enthusiasts',
      9.99,
      30,
      true
    ),
    (
      gen_random_uuid(),
      'Pro',
      'Ultimate experience for power users',
      19.99,
      30,
      true
    )
  RETURNING id, name
)
-- Insert feature limits for each tier
INSERT INTO feature_limits (tier_id, feature_name, monthly_limit, is_enabled)
SELECT 
  id,
  feature_name,
  monthly_limit,
  is_enabled
FROM inserted_tiers
CROSS JOIN (
  VALUES
    ('audio_guides', 5::integer, true),
    ('offline_access', NULL::integer, false),
    ('custom_voices', NULL::integer, false),
    ('extended_range', NULL::integer, false),
    ('priority_support', NULL::integer, false)
) AS features(feature_name, monthly_limit, is_enabled)
WHERE inserted_tiers.name = 'Free'
UNION ALL
SELECT 
  id,
  feature_name,
  monthly_limit,
  is_enabled
FROM inserted_tiers
CROSS JOIN (
  VALUES
    ('audio_guides', 50::integer, true),
    ('offline_access', NULL::integer, true),
    ('custom_voices', NULL::integer, true),
    ('extended_range', NULL::integer, false),
    ('priority_support', NULL::integer, false)
) AS features(feature_name, monthly_limit, is_enabled)
WHERE inserted_tiers.name = 'Premium'
UNION ALL
SELECT 
  id,
  feature_name,
  monthly_limit,
  is_enabled
FROM inserted_tiers
CROSS JOIN (
  VALUES
    ('audio_guides', NULL::integer, true),
    ('offline_access', NULL::integer, true),
    ('custom_voices', NULL::integer, true),
    ('extended_range', NULL::integer, true),
    ('priority_support', NULL::integer, true)
) AS features(feature_name, monthly_limit, is_enabled)
WHERE inserted_tiers.name = 'Pro';

-- Update RLS policies
ALTER TABLE subscription_tiers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read subscription tiers"
  ON subscription_tiers
  FOR SELECT
  TO public
  USING (true);

-- Update feature access function
CREATE OR REPLACE FUNCTION check_feature_access(feature_name text)
RETURNS boolean AS $$
DECLARE
  user_tier_id uuid;
  is_enabled boolean;
BEGIN
  -- Get user's current tier
  SELECT tier_id INTO user_tier_id
  FROM user_subscriptions us
  WHERE us.user_id = auth.uid()
    AND us.is_active = true
    AND us.expires_at > CURRENT_TIMESTAMP
  ORDER BY created_at DESC
  LIMIT 1;

  -- Check if feature is enabled for user's tier
  SELECT fl.is_enabled INTO is_enabled
  FROM feature_limits fl
  WHERE fl.tier_id = user_tier_id
    AND fl.feature_name = check_feature_access.feature_name;

  RETURN COALESCE(is_enabled, false);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;