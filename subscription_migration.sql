-- Migração para adicionar datas de fim de assinatura e ID do Stripe
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS subscription_end_date TIMESTAMP WITH TIME ZONE;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS stripe_subscription_id TEXT;
