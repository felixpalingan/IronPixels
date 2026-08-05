-- ========================================================
-- FIX SOCIALS, FRIENDSHIPS, AND PARTY INVITES SCHEMA
-- Timestamp: 20260805000004
-- ========================================================

-- 1. Ensure friends table exists with proper unique constraint
CREATE TABLE IF NOT EXISTS public.friends (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  friend_id UUID NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending', -- 'pending', 'accepted'
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, friend_id)
);

-- 2. Ensure party_invites table exists
CREATE TABLE IF NOT EXISTS public.party_invites (
  invite_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  party_id UUID NOT NULL,
  inviter_id UUID NOT NULL,
  invitee_id UUID NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending', -- 'pending', 'accepted', 'declined'
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Enable RLS on friends & party_invites
ALTER TABLE public.friends ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.party_invites ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "friends_public_access" ON public.friends;
CREATE POLICY "friends_public_access" ON public.friends FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "party_invites_public_access" ON public.party_invites;
CREATE POLICY "party_invites_public_access" ON public.party_invites FOR ALL USING (true) WITH CHECK (true);
