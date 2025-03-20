/*
  # Update Premium Features

  1. Changes
    - Set default feature limits for subscription tiers
    - Enable specific features for premium tiers
    - Set monthly limits for features

  2. Security
    - Maintain existing RLS policies
    - Keep data integrity
*/

-- Insert or update feature limits for Free tier
INSERT INTO feature_limits (tier_id, feature_name, monthly_limit, is_enabled)
SELECT 
  id as tier_id,
  feature_name,
  monthly_limit,
  is_enabled
FROM subscription_tiers
CROSS JOIN (
  VALUES 
    ('audio_guides', 5, false),
    ('offline_access', 0, false),
    ('custom_voices', 0, false),
    ('extended_range', 0, false),
    ('priority_support', 0, false)
) as features(feature_name, monthly_limit, is_enabled)
WHERE name = 'Free'
ON CONFLICT (tier_id, feature_name) 
DO UPDATE SET
  monthly_limit = EXCLUDED.monthly_limit,
  is_enabled = EXCLUDED.is_enabled;

-- Insert or update feature limits for Premium tier
INSERT INTO feature_limits (tier_id, feature_name, monthly_limit, is_enabled)
SELECT 
  id as tier_id,
  feature_name,
  monthly_limit,
  is_enabled
FROM subscription_tiers
CROSS JOIN (
  VALUES 
    ('audio_guides', null, true),      -- Unlimited audio guides
    ('offline_access', null, true),     -- Unlimited offline access
    ('custom_voices', null, true),      -- All voice options available
    ('extended_range', null, true),     -- Extended search radius
    ('priority_support', null, true)    -- Priority support enabled
) as features(feature_name, monthly_limit, is_enabled)
WHERE name = 'Premium'
ON CONFLICT (tier_id, feature_name) 
DO UPDATE SET
  monthly_limit = EXCLUDED.monthly_limit,
  is_enabled = EXCLUDED.is_enabled;

-- Insert or update feature limits for Pro tier
INSERT INTO feature_limits (tier_id, feature_name, monthly_limit, is_enabled)
SELECT 
  id as tier_id,
  feature_name,
  monthly_limit,
  is_enabled
FROM subscription_tiers
CROSS JOIN (
  VALUES 
    ('audio_guides', null, true),      -- Unlimited audio guides
    ('offline_access', null, true),     -- Unlimited offline access
    ('custom_voices', null, true),      -- All voice options available
    ('extended_range', null, true),     -- Extended search radius
    ('priority_support', null, true)    -- Priority support enabled
) as features(feature_name, monthly_limit, is_enabled)
WHERE name = 'Pro'
ON CONFLICT (tier_id, feature_name) 
DO UPDATE SET
  monthly_limit = EXCLUDED.monthly_limit,
  is_enabled = EXCLUDED.is_enabled;