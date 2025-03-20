/*
  # Initialize subscription tiers and features

  1. New Data
    - Creates initial subscription tiers (Free, Premium, Pro)
    - Sets up feature limits for each tier
    - Configures pricing and durations

  2. Features
    - Audio guides
    - Offline access
    - Custom voices
    - Extended range
    - Priority support
*/

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