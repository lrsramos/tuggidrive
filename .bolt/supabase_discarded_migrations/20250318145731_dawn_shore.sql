/*
  # Setup Native In-App Purchase Structure

  1. Changes
    - Add store-specific product IDs
    - Remove Stripe-specific tables
    - Add purchase verification table
    - Update subscription tracking

  2. Security
    - Enable RLS policies
    - Add verification checks
*/

-- Remove Stripe-specific table
DROP TABLE IF EXISTS stripe_prices;

-- Create store products table
CREATE TABLE store_products (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tier_id uuid REFERENCES subscription_tiers(id) NOT NULL,
  store_type text NOT NULL CHECK (store_type IN ('apple', 'google')),
  product_id text NOT NULL,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE (store_type, product_id)
);

-- Create purchase receipts table
CREATE TABLE purchase_receipts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) NOT NULL,
  store_type text NOT NULL CHECK (store_type IN ('apple', 'google')),
  product_id text NOT NULL,
  receipt_data text NOT NULL,
  original_transaction_id text,
  purchase_date timestamptz NOT NULL,
  expires_date timestamptz,
  is_trial boolean DEFAULT false,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Add store products for Premium tier
INSERT INTO store_products (tier_id, store_type, product_id)
SELECT 
  id as tier_id,
  store_type,
  product_id
FROM subscription_tiers
CROSS JOIN (
  VALUES 
    ('apple', 'com.tuggi.premium.monthly'),    -- Apple product ID
    ('google', 'premium_monthly')              -- Google product ID
) as products(store_type, product_id)
WHERE name = 'Premium';

-- Enable RLS
ALTER TABLE store_products ENABLE ROW LEVEL SECURITY;
ALTER TABLE purchase_receipts ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Allow public read access to store products"
  ON store_products
  FOR SELECT
  TO public
  USING (is_active = true);

CREATE POLICY "Allow authenticated users to read their receipts"
  ON purchase_receipts
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- Function to verify subscription status
CREATE OR REPLACE FUNCTION is_subscription_active(user_uuid uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 
    FROM purchase_receipts
    WHERE user_id = user_uuid
      AND is_active = true
      AND expires_date > now()
  );
END;
$$;

-- Trigger to update user_subscriptions table
CREATE OR REPLACE FUNCTION update_user_subscription()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Update or insert into user_subscriptions
  INSERT INTO user_subscriptions (
    user_id,
    tier_id,
    starts_at,
    expires_at,
    is_active
  )
  SELECT
    NEW.user_id,
    sp.tier_id,
    NEW.purchase_date,
    NEW.expires_date,
    NEW.is_active
  FROM store_products sp
  WHERE sp.product_id = NEW.product_id
  ON CONFLICT (user_id, tier_id) 
  DO UPDATE SET
    starts_at = EXCLUDED.starts_at,
    expires_at = EXCLUDED.expires_at,
    is_active = EXCLUDED.is_active;
    
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_purchase_receipt_change
  AFTER INSERT OR UPDATE
  ON purchase_receipts
  FOR EACH ROW
  EXECUTE FUNCTION update_user_subscription();