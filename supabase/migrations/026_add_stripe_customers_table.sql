-- Migration: Add stripe_customers table for Stripe integration
-- Date: 2025-12-29
-- Description: Creates the stripe_customers table to store Stripe customer data

CREATE TABLE public.stripe_customers (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT next_auth.uid(),
  stripe_customer_id text NOT NULL,
  plan_active boolean NOT NULL DEFAULT false,
  plan_expires bigint NULL,
  subscription_id text NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT stripe_customers_pkey PRIMARY KEY (id),
  CONSTRAINT stripe_customers_stripe_customer_id_key UNIQUE (stripe_customer_id),
  CONSTRAINT stripe_customers_user_id_fkey FOREIGN KEY (user_id) REFERENCES next_auth.users(id) ON DELETE CASCADE
);

-- Enable RLS
ALTER TABLE public.stripe_customers ENABLE ROW LEVEL SECURITY;

-- RLS Policy: Users can read their own stripe customer data
CREATE POLICY "stripe_customers_select_own" ON public.stripe_customers
  FOR SELECT
  TO authenticated
  USING (next_auth.uid() = user_id);

-- RLS Policy: Service role can manage all records (for webhooks)
CREATE POLICY "stripe_customers_service_role" ON public.stripe_customers
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- Add index for faster lookups
CREATE INDEX idx_stripe_customers_user_id ON public.stripe_customers(user_id);
CREATE INDEX idx_stripe_customers_stripe_id ON public.stripe_customers(stripe_customer_id);

-- Add comment
COMMENT ON TABLE public.stripe_customers IS 'Stores Stripe customer information for subscription management';
