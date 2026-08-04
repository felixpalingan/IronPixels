-- ========================================================
-- IRONPIXELS DATABASE CLEANUP & RESET SCRIPT
-- Clears all user test data & tidies up PostgreSQL schema
-- ========================================================

-- 1. TRUNCATE ALL DYNAMIC USER DATA
TRUNCATE TABLE public."Session_Sets" CASCADE;
TRUNCATE TABLE public."Session_Exercises" CASCADE;
TRUNCATE TABLE public."Workout_Sessions" CASCADE;
TRUNCATE TABLE public."Equipped_Gear" CASCADE;
TRUNCATE TABLE public."User_Skills" CASCADE;

-- Truncate party and friends data if tables exist
DO $$
BEGIN
    IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'Party_Members') THEN
        EXECUTE 'TRUNCATE TABLE public."Party_Members" CASCADE;';
    END IF;
    IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'Party') THEN
        EXECUTE 'TRUNCATE TABLE public."Party" CASCADE;';
    END IF;
    IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'friends') THEN
        EXECUTE 'TRUNCATE TABLE public."friends" CASCADE;';
    END IF;
    IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'profiles') THEN
        EXECUTE 'TRUNCATE TABLE public."profiles" CASCADE;';
    END IF;
    IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'Users') THEN
        EXECUTE 'TRUNCATE TABLE public."Users" CASCADE;';
    END IF;
    IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'User_Stats') THEN
        EXECUTE 'TRUNCATE TABLE public."User_Stats" CASCADE;';
    END IF;
END $$;

-- 2. ENSURE PROFILES TABLE SCHEMA IS NEAT & COMPLETE
CREATE TABLE IF NOT EXISTS public."profiles" (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID UNIQUE,
    username TEXT NOT NULL UNIQUE,
    character_class TEXT DEFAULT 'WARRIOR',
    level INT DEFAULT 1,
    current_hp INT DEFAULT 1000,
    max_hp INT DEFAULT 1000,
    exp INT DEFAULT 0,
    max_exp INT DEFAULT 1000,
    gold INT DEFAULT 500,
    weight_kg NUMERIC(5,2) DEFAULT 70.00,
    str INT DEFAULT 85,
    agi INT DEFAULT 70,
    vit INT DEFAULT 60,
    luk INT DEFAULT 50,
    max_floor INT DEFAULT 1,
    daily_rvs NUMERIC(10,2) DEFAULT 0,
    workout_streak INT DEFAULT 1,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 3. ENSURE PARTY TABLES SCHEMA IS NEAT & COMPLETE
CREATE TABLE IF NOT EXISTS public."Party" (
    party_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    party_name TEXT NOT NULL,
    leader_id UUID NOT NULL,
    total_party_floor INT DEFAULT 1,
    total_party_cp INT DEFAULT 0,
    total_party_rvs INT DEFAULT 0,
    party_streak INT DEFAULT 1,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE TABLE IF NOT EXISTS public."Party_Members" (
    member_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    party_id UUID NOT NULL REFERENCES public."Party"(party_id) ON DELETE CASCADE,
    user_id UUID NOT NULL,
    role TEXT NOT NULL DEFAULT 'member',
    joined_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    UNIQUE(party_id, user_id)
);

CREATE TABLE IF NOT EXISTS public."friends" (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL,
    friend_id UUID NOT NULL,
    status TEXT NOT NULL DEFAULT 'pending',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    UNIQUE(user_id, friend_id)
);

-- 4. ENABLE RLS AND SET PUBLIC ACCESS POLICIES
ALTER TABLE public."profiles" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."Party" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."Party_Members" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."friends" ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "profiles_public" ON public."profiles";
CREATE POLICY "profiles_public" ON public."profiles" FOR ALL USING (true);

DROP POLICY IF EXISTS "party_public" ON public."Party";
CREATE POLICY "party_public" ON public."Party" FOR ALL USING (true);

DROP POLICY IF EXISTS "party_members_public" ON public."Party_Members";
CREATE POLICY "party_members_public" ON public."Party_Members" FOR ALL USING (true);

DROP POLICY IF EXISTS "friends_public" ON public."friends";
CREATE POLICY "friends_public" ON public."friends" FOR ALL USING (true);

-- 5. PERFORMANCE INDEXES
CREATE INDEX IF NOT EXISTS idx_profiles_max_floor ON public."profiles"(max_floor DESC);
CREATE INDEX IF NOT EXISTS idx_party_floor ON public."Party"(total_party_floor DESC);
CREATE INDEX IF NOT EXISTS idx_party_members_party_id ON public."Party_Members"(party_id);
