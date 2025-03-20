/*
  # Fix Premium Feature Access

  1. Changes
    - Add proper subscription tier structure
    - Set up feature limits correctly
    - Add RLS policies for premium content
    - Fix subscription handling

  2. Implementation Details
    - Clear subscription tiers table
    - Add proper tier definitions
    - Set up feature limits
    - Add proper RLS policies
*/

-- Reset existing data
TRUNCATE subscription_tiers CASCADE;

-- Insert subscription tiers
INSERT INTO subscription_tiers (id, name, description, price, duration_days, is_active)
VALUES
  (
    'free-tier',
    'Free',
    'Basic features for casual users',
    0,
    36500, -- ~100 years
    true
  ),
  (
    'premium-tier',
    'Premium',
    'Enhanced features for enthusiasts',
    9.99,
    30,
    true
  ),
  (
    'pro-tier',
    'Pro',
    'Ultimate experience for power users',
    19.99,
    30,
    true
  );

-- Insert feature limits for Free tier
INSERT INTO feature_limits (tier_id, feature_name, monthly_limit, is_enabled)
VALUES
  ('free-tier', 'audio_guides', 5, true),
  ('free-tier', 'offline_access', NULL, false),
  ('free-tier', 'custom_voices', NULL, false),
  ('free-tier', 'extended_range', NULL, false),
  ('free-tier', 'priority_support', NULL, false);

-- Insert feature limits for Premium tier
INSERT INTO feature_limits (tier_id, feature_name, monthly_limit, is_enabled)
VALUES
  ('premium-tier', 'audio_guides', 50, true),
  ('premium-tier', 'offline_access', NULL, true),
  ('premium-tier', 'custom_voices', NULL, true),
  ('premium-tier', 'extended_range', NULL, false),
  ('premium-tier', 'priority_support', NULL, false);

-- Insert feature limits for Pro tier
INSERT INTO feature_limits (tier_id, feature_name, monthly_limit, is_enabled)
VALUES
  ('pro-tier', 'audio_guides', NULL, true), -- Unlimited
  ('pro-tier', 'offline_access', NULL, true),
  ('pro-tier', 'custom_voices', NULL, true),
  ('pro-tier', 'extended_range', NULL, true),
  ('pro-tier', 'priority_support', NULL, true);

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