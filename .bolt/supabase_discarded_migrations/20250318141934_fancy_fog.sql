/*
  # Setup Subscription Tiers for Brazil

  1. Changes
    - Create subscription tiers (Free and Premium)
    - Set prices in Brazilian Real (BRL)
    - Configure Stripe prices
    - Set up feature limits

  2. Security
    - Enable RLS policies
    - Restrict price modifications
*/

-- Clean up existing data
DELETE FROM subscription_tiers WHERE name IN ('Pro', 'Premium', 'Free');

-- Insert subscription tiers
INSERT INTO subscription_tiers (id, name, description, price, duration_days, is_active)
VALUES
  (
    gen_random_uuid(),
    'Free',
    'Explore tourist attractions with basic features',
    0,
    36500, -- ~100 years (effectively unlimited)
    true
  ),
  (
    gen_random_uuid(),
    'Premium',
    'Unlock unlimited audio guides and premium features',
    29.90, -- Price in BRL
    30,    -- Monthly subscription
    true
  );

-- Set up Stripe prices for Premium tier
INSERT INTO stripe_prices (
  stripe_price_id,
  tier_id,
  currency,
  unit_amount,
  recurring_interval,
  recurring_interval_count,
  is_active
)
SELECT
  'price_premium_monthly_brl', -- This will be replaced with actual Stripe price ID
  id as tier_id,
  'brl' as currency,
  2990 as unit_amount, -- Amount in cents (R$ 29,90)
  'month' as recurring_interval,
  1 as recurring_interval_count,
  true as is_active
FROM subscription_tiers
WHERE name = 'Premium';

-- Set up feature limits for Free tier
INSERT INTO feature_limits (tier_id, feature_name, monthly_limit, is_enabled)
SELECT 
  id as tier_id,
  feature_name,
  monthly_limit::integer,
  is_enabled
FROM subscription_tiers
CROSS JOIN (
  VALUES 
    ('audio_guides', 5::integer, false),        -- Limited audio guides
    ('offline_access', 0::integer, false),      -- No offline access
    ('custom_voices', 0::integer, false),       -- Only system language
    ('extended_range', 0::integer, false),      -- Basic range only
    ('priority_support', 0::integer, false)     -- No priority support
) as features(feature_name, monthly_limit, is_enabled)
WHERE name = 'Free'
ON CONFLICT (tier_id, feature_name) 
DO UPDATE SET
  monthly_limit = EXCLUDED.monthly_limit,
  is_enabled = EXCLUDED.is_enabled;

-- Set up feature limits for Premium tier
INSERT INTO feature_limits (tier_id, feature_name, monthly_limit, is_enabled)
SELECT 
  id as tier_id,
  feature_name,
  monthly_limit::integer,
  is_enabled
FROM subscription_tiers
CROSS JOIN (
  VALUES 
    ('audio_guides', NULL::integer, true),      -- Unlimited audio guides
    ('offline_access', NULL::integer, true),    -- Full offline access
    ('custom_voices', NULL::integer, true),     -- All languages available
    ('extended_range', NULL::integer, true),    -- Extended search radius
    ('priority_support', NULL::integer, true)   -- Priority support included
) as features(feature_name, monthly_limit, is_enabled)
WHERE name = 'Premium'
ON CONFLICT (tier_id, feature_name) 
DO UPDATE SET
  monthly_limit = EXCLUDED.monthly_limit,
  is_enabled = EXCLUDED.is_enabled;

-- Add RLS policies
ALTER TABLE stripe_prices ENABLE ROW LEVEL SECURITY;

-- Allow read access to authenticated users
CREATE POLICY "Allow authenticated users to read prices"
  ON stripe_prices
  FOR SELECT
  TO authenticated
  USING (true);

-- Only allow service role to modify prices
CREATE POLICY "Only service role can modify prices"
  ON stripe_prices
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);