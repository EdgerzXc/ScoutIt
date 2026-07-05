-- Mission Control Schema
-- This creates the administrative tables necessary for the ScoutIt Mission Control app
-- as defined in MISSION_CONTROL_SPEC.md.

-- 1. admin_users Table
CREATE TABLE IF NOT EXISTS public.admin_users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  display_name TEXT,
  tier SMALLINT NOT NULL CHECK (tier IN (1, 2, 3)),  -- 1 Agent, 2 Ops Manager, 3 Super Admin
  is_finance BOOLEAN NOT NULL DEFAULT false,
  active BOOLEAN NOT NULL DEFAULT true,
  invited_by UUID REFERENCES public.admin_users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS on admin_users
ALTER TABLE public.admin_users ENABLE ROW LEVEL SECURITY;

-- No client-side policies at all: every read/write to admin_users happens
-- server-side with the service-role key.
CREATE POLICY "no client access" ON public.admin_users FOR ALL USING (false);


-- 2. mission_control_actions Table
CREATE TABLE IF NOT EXISTS public.mission_control_actions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  actor_id UUID NOT NULL REFERENCES public.admin_users(id),
  actor_tier SMALLINT NOT NULL,
  action TEXT NOT NULL,
  target_table TEXT NOT NULL,
  target_id TEXT NOT NULL,
  reason TEXT,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS on mission_control_actions
ALTER TABLE public.mission_control_actions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "no client access" ON public.mission_control_actions FOR ALL USING (false);


-- 3. Add Moderation columns to existing tables

-- Add moderation fields to user_profiles
ALTER TABLE public.user_profiles ADD COLUMN IF NOT EXISTS is_shadowbanned BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE public.user_profiles ADD COLUMN IF NOT EXISTS archived_at TIMESTAMPTZ;
ALTER TABLE public.user_profiles ADD COLUMN IF NOT EXISTS moderation_note TEXT;

-- Add moderation fields to properties
ALTER TABLE public.properties ADD COLUMN IF NOT EXISTS moderation_status TEXT NOT NULL DEFAULT 'pending' CHECK (moderation_status IN ('pending','approved','rejected','archived'));
ALTER TABLE public.properties ADD COLUMN IF NOT EXISTS rejection_reason TEXT;
ALTER TABLE public.properties ADD COLUMN IF NOT EXISTS archived_at TIMESTAMPTZ;


-- 4. feature_flags Table (additive feature)
CREATE TABLE IF NOT EXISTS public.feature_flags (
    id TEXT PRIMARY KEY,
    is_enabled BOOLEAN NOT NULL DEFAULT false,
    description TEXT,
    updated_by UUID REFERENCES public.admin_users(id),
    created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

ALTER TABLE public.feature_flags ENABLE ROW LEVEL SECURITY;

-- Anyone can read feature flags
CREATE POLICY "Anyone can read feature flags" ON public.feature_flags
    FOR SELECT
    TO public
    USING (true);

-- No client write access
CREATE POLICY "no client access for write" ON public.feature_flags FOR INSERT WITH CHECK (false);
CREATE POLICY "no client access for update" ON public.feature_flags FOR UPDATE USING (false);
CREATE POLICY "no client access for delete" ON public.feature_flags FOR DELETE USING (false);


-- 5. blocked_access Table
CREATE TYPE block_type AS ENUM ('ip', 'user_id', 'fingerprint');

CREATE TABLE IF NOT EXISTS public.blocked_access (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    type block_type NOT NULL,
    value TEXT NOT NULL,
    reason TEXT,
    blocked_by UUID REFERENCES public.admin_users(id),
    created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

ALTER TABLE public.blocked_access ENABLE ROW LEVEL SECURITY;
CREATE POLICY "no client access" ON public.blocked_access FOR ALL USING (false);


-- 6. private_notifications Table
CREATE TABLE IF NOT EXISTS public.private_notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    target_url TEXT,
    is_read BOOLEAN NOT NULL DEFAULT false,
    created_by UUID REFERENCES public.admin_users(id),
    created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

ALTER TABLE public.private_notifications ENABLE ROW LEVEL SECURITY;

-- Users can read their own notifications
CREATE POLICY "Users can read their own notifications" ON public.private_notifications
    FOR SELECT
    TO authenticated
    USING (auth.uid() = user_id);

-- Users can update (mark as read) their own notifications
CREATE POLICY "Users can update their own notifications" ON public.private_notifications
    FOR UPDATE
    TO authenticated
    USING (auth.uid() = user_id);

CREATE POLICY "no client access for insert" ON public.private_notifications FOR INSERT WITH CHECK (false);
CREATE POLICY "no client access for delete" ON public.private_notifications FOR DELETE USING (false);
