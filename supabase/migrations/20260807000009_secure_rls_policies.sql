-- ========================================================
-- SECURE ROW LEVEL SECURITY (RLS) POLICIES
-- Timestamp: 20260807000009
-- Best Practices: Supabase Security & RLS Guide
-- ========================================================

-- 1. PROFILES TABLE
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow public select on profiles" ON public.profiles;
DROP POLICY IF EXISTS "Allow public insert on profiles" ON public.profiles;
DROP POLICY IF EXISTS "Allow public update on profiles" ON public.profiles;
DROP POLICY IF EXISTS "profiles_public_all" ON public.profiles;
DROP POLICY IF EXISTS "profiles_public" ON public.profiles;

-- Anyone authenticated/anon can view public profiles for leaderboards and social search
CREATE POLICY "profiles_select_public" ON public.profiles
  FOR SELECT TO authenticated, anon
  USING (true);

-- Users can insert their own profile matching auth.uid()
CREATE POLICY "profiles_insert_own" ON public.profiles
  FOR INSERT TO authenticated
  WITH CHECK ((select auth.uid()) = id OR (select auth.uid()) = user_id);

-- Users can update only their own profile
CREATE POLICY "profiles_update_own" ON public.profiles
  FOR UPDATE TO authenticated
  USING ((select auth.uid()) = id OR (select auth.uid()) = user_id)
  WITH CHECK ((select auth.uid()) = id OR (select auth.uid()) = user_id);

-- 2. USER_INVENTORY TABLE
ALTER TABLE public.user_inventory ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow public select on user_inventory" ON public.user_inventory;
DROP POLICY IF EXISTS "Allow public insert on user_inventory" ON public.user_inventory;
DROP POLICY IF EXISTS "Allow public update on user_inventory" ON public.user_inventory;
DROP POLICY IF EXISTS "user_inventory_public_all" ON public.user_inventory;
DROP POLICY IF EXISTS "user_inventory_public" ON public.user_inventory;

-- Authenticated users can view inventory
CREATE POLICY "user_inventory_select" ON public.user_inventory
  FOR SELECT TO authenticated
  USING (true);

-- Users can insert items only to their own inventory
CREATE POLICY "user_inventory_insert_own" ON public.user_inventory
  FOR INSERT TO authenticated
  WITH CHECK ((select auth.uid()) = user_id);

-- Users can update/equip items only in their own inventory
CREATE POLICY "user_inventory_update_own" ON public.user_inventory
  FOR UPDATE TO authenticated
  USING ((select auth.uid()) = user_id)
  WITH CHECK ((select auth.uid()) = user_id);

-- Users can delete/sell items only from their own inventory
CREATE POLICY "user_inventory_delete_own" ON public.user_inventory
  FOR DELETE TO authenticated
  USING ((select auth.uid()) = user_id);

-- 3. WORKOUT_SESSIONS TABLE
ALTER TABLE public.workout_sessions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow public select on workout_sessions" ON public.workout_sessions;
DROP POLICY IF EXISTS "Allow public insert on workout_sessions" ON public.workout_sessions;
DROP POLICY IF EXISTS "Allow public update on workout_sessions" ON public.workout_sessions;

-- Users can view their own workout sessions
CREATE POLICY "workout_sessions_select_own" ON public.workout_sessions
  FOR SELECT TO authenticated
  USING ((select auth.uid()) = user_id);

-- Users can log workout sessions only for themselves
CREATE POLICY "workout_sessions_insert_own" ON public.workout_sessions
  FOR INSERT TO authenticated
  WITH CHECK ((select auth.uid()) = user_id);

-- Users can update their own workout sessions
CREATE POLICY "workout_sessions_update_own" ON public.workout_sessions
  FOR UPDATE TO authenticated
  USING ((select auth.uid()) = user_id)
  WITH CHECK ((select auth.uid()) = user_id);

-- 4. FRIENDS TABLE
ALTER TABLE public.friends ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "friends_public_access" ON public.friends;
DROP POLICY IF EXISTS "friends_public" ON public.friends;

-- Users can select friendship records involving themselves
CREATE POLICY "friends_select_own" ON public.friends
  FOR SELECT TO authenticated
  USING ((select auth.uid()) = user_id OR (select auth.uid()) = friend_id);

-- Users can send friend requests as user_id
CREATE POLICY "friends_insert_own" ON public.friends
  FOR INSERT TO authenticated
  WITH CHECK ((select auth.uid()) = user_id);

-- Users can update/accept/reject friend requests sent to or by them
CREATE POLICY "friends_update_own" ON public.friends
  FOR UPDATE TO authenticated
  USING ((select auth.uid()) = user_id OR (select auth.uid()) = friend_id)
  WITH CHECK ((select auth.uid()) = user_id OR (select auth.uid()) = friend_id);

-- Users can delete friendship records involving themselves
CREATE POLICY "friends_delete_own" ON public.friends
  FOR DELETE TO authenticated
  USING ((select auth.uid()) = user_id OR (select auth.uid()) = friend_id);

-- 5. PARTY_INVITES TABLE
ALTER TABLE public.party_invites ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "party_invites_public_access" ON public.party_invites;

-- Users can select party invites where they are inviter or invitee
CREATE POLICY "party_invites_select_own" ON public.party_invites
  FOR SELECT TO authenticated
  USING ((select auth.uid()) = inviter_id OR (select auth.uid()) = invitee_id);

-- Users can send party invites as inviter
CREATE POLICY "party_invites_insert_own" ON public.party_invites
  FOR INSERT TO authenticated
  WITH CHECK ((select auth.uid()) = inviter_id);

-- Users can accept/decline invites where they are inviter or invitee
CREATE POLICY "party_invites_update_own" ON public.party_invites
  FOR UPDATE TO authenticated
  USING ((select auth.uid()) = inviter_id OR (select auth.uid()) = invitee_id)
  WITH CHECK ((select auth.uid()) = inviter_id OR (select auth.uid()) = invitee_id);

-- Users can delete invites involving themselves
CREATE POLICY "party_invites_delete_own" ON public.party_invites
  FOR DELETE TO authenticated
  USING ((select auth.uid()) = inviter_id OR (select auth.uid()) = invitee_id);

-- 6. PARTY & PARTY_MEMBERS TABLES
ALTER TABLE public."Party" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."Party_Members" ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Party public access" ON public."Party";
DROP POLICY IF EXISTS "party_public" ON public."Party";
DROP POLICY IF EXISTS "Party_Members public access" ON public."Party_Members";
DROP POLICY IF EXISTS "party_members_public" ON public."Party_Members";

CREATE POLICY "party_select_public" ON public."Party"
  FOR SELECT TO authenticated, anon
  USING (true);

CREATE POLICY "party_insert_leader" ON public."Party"
  FOR INSERT TO authenticated
  WITH CHECK ((select auth.uid()) = leader_id);

CREATE POLICY "party_update_members" ON public."Party"
  FOR UPDATE TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "party_delete_leader" ON public."Party"
  FOR DELETE TO authenticated
  USING ((select auth.uid()) = leader_id);

CREATE POLICY "party_members_select_public" ON public."Party_Members"
  FOR SELECT TO authenticated, anon
  USING (true);

CREATE POLICY "party_members_insert" ON public."Party_Members"
  FOR INSERT TO authenticated
  WITH CHECK (true);

CREATE POLICY "party_members_update" ON public."Party_Members"
  FOR UPDATE TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "party_members_delete" ON public."Party_Members"
  FOR DELETE TO authenticated
  USING (true);
