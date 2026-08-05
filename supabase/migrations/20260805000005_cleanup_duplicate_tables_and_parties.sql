-- ========================================================
-- CLEANUP DUPLICATE TABLES AND ORPHANED PARTIES
-- Timestamp: 20260805000005
-- ========================================================

-- 1. Drop legacy duplicate lowercase tables to keep unified schema
DROP TABLE IF EXISTS public.parties CASCADE;
DROP TABLE IF EXISTS public.party_members CASCADE;
DROP TABLE IF EXISTS public.friendships CASCADE;

-- 2. Remove duplicate rows from Party_Members
DELETE FROM public."Party_Members" a
USING public."Party_Members" b
WHERE a.member_id < b.member_id
  AND a.party_id = b.party_id
  AND a.user_id = b.user_id;

-- 3. Remove duplicate parties for the same leader, keeping the newest one
DELETE FROM public."Party" a
USING public."Party" b
WHERE a.created_at < b.created_at
  AND a.leader_id = b.leader_id;

-- 4. Delete empty parties that have 0 members in Party_Members
DELETE FROM public."Party"
WHERE party_id NOT IN (
  SELECT DISTINCT party_id FROM public."Party_Members"
);

-- 5. Delete orphaned party invites for deleted parties
DELETE FROM public.party_invites
WHERE party_id NOT IN (
  SELECT party_id FROM public."Party"
);

-- 6. Add UNIQUE constraint to Party_Members if not present
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'party_members_party_user_unique'
    ) THEN
        ALTER TABLE public."Party_Members" ADD CONSTRAINT party_members_party_user_unique UNIQUE (party_id, user_id);
    END IF;
END $$;
