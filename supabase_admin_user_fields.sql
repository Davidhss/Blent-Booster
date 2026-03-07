-- ==========================================
-- SQL MIGRATION FOR NEW ADMIN FEATURES
-- ==========================================

-- 1. Add new columns to the `profiles` table to support advanced user management.
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS temporary_access_until TIMESTAMP WITH TIME ZONE DEFAULT NULL,
ADD COLUMN IF NOT EXISTS total_time_logged_in INTEGER DEFAULT 0, -- Time in seconds
ADD COLUMN IF NOT EXISTS tags TEXT[] DEFAULT '{}';

-- 2. Update the admin_update_user RPC function if needed (we can handle updates directly to profiles table via supabase-js in the admin dashboard)
-- Note: The admin dashboard already updates `profiles` directly using supabase.from('profiles').update(...)
-- so these new fields will work out-of-the-box as long as the admin RLS policy allows it.
