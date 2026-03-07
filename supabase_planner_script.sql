-- 1. Add feature flags to profiles
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS features text[] DEFAULT '{}';

-- 2. Create the planner_posts table if it doesn't exist
CREATE TABLE IF NOT EXISTS planner_posts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  title text NOT NULL,
  start_date date NOT NULL,
  platform text NOT NULL,
  is_posted boolean DEFAULT false,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 3. Add the new columns (in case the table already existed before)
ALTER TABLE planner_posts 
  ADD COLUMN IF NOT EXISTS format text,
  ADD COLUMN IF NOT EXISTS description text,
  ADD COLUMN IF NOT EXISTS image_url text,
  ADD COLUMN IF NOT EXISTS caption text,
  ADD COLUMN IF NOT EXISTS is_idea boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS scheduled_time timestamp with time zone,
  ADD COLUMN IF NOT EXISTS status text DEFAULT 'IDEA',
  ADD COLUMN IF NOT EXISTS ig_container_id text,
  ADD COLUMN IF NOT EXISTS ig_media_id text;

-- 4. Enable RLS on planner_posts
ALTER TABLE planner_posts ENABLE ROW LEVEL SECURITY;

-- 5. Create policies safely (Drop them first to avoid "already exists" error)
DROP POLICY IF EXISTS "Users can view their own planner posts" ON planner_posts;
CREATE POLICY "Users can view their own planner posts"
  ON planner_posts FOR SELECT
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert their own planner posts" ON planner_posts;
CREATE POLICY "Users can insert their own planner posts"
  ON planner_posts FOR INSERT
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update their own planner posts" ON planner_posts;
CREATE POLICY "Users can update their own planner posts"
  ON planner_posts FOR UPDATE
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete their own planner posts" ON planner_posts;
CREATE POLICY "Users can delete their own planner posts"
  ON planner_posts FOR DELETE
  USING (auth.uid() = user_id);

-- 6. Create user_social_accounts table to store Meta access tokens
CREATE TABLE IF NOT EXISTS user_social_accounts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  platform text NOT NULL, 
  access_token text NOT NULL,
  platform_user_id text, -- ID da conta profissional do Instagram
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
  UNIQUE(user_id, platform)
);

-- Enable RLS
ALTER TABLE user_social_accounts ENABLE ROW LEVEL SECURITY;

-- Policies for social accounts
DROP POLICY IF EXISTS "Users can view their own social accounts" ON user_social_accounts;
CREATE POLICY "Users can view their own social accounts"
  ON user_social_accounts FOR SELECT
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can manage their own social accounts" ON user_social_accounts;
CREATE POLICY "Users can manage their own social accounts"
  ON user_social_accounts FOR ALL
  USING (auth.uid() = user_id);
