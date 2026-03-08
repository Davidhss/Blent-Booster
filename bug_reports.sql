-- Create the bug_reports table
CREATE TABLE IF NOT EXISTS public.bug_reports (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    user_email TEXT NOT NULL,
    tool TEXT NOT NULL DEFAULT 'Geral',
    description TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'pending', -- 'pending', 'resolved'
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Note: We are not enforcing RLS heavily on this table for inserts from the backend, 
-- but we can add an admin-only view policy if desired.
-- For now, the backend uses the service_role key to manage it.

-- Enable RLS just in case, but no public policies needed since backend uses service_role
ALTER TABLE public.bug_reports ENABLE ROW LEVEL SECURITY;
