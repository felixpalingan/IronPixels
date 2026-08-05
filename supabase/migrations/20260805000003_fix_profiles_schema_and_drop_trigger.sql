-- ========================================================
-- FIX PROFILES SCHEMA AND PERMANENTLY DROP TRIGGER
-- Timestamp: 20260805000003
-- ========================================================

-- 1. Permanently drop handle_new_user trigger and function from auth.users
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS public.handle_new_user CASCADE;

-- 2. Add all missing columns to public.profiles if not present
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS user_id UUID;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS gender TEXT DEFAULT 'm';
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS weight_kg NUMERIC DEFAULT 75;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS character_class TEXT DEFAULT 'WARRIOR';
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS str INT DEFAULT 85;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS agi INT DEFAULT 70;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS vit INT DEFAULT 60;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS luk INT DEFAULT 50;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS available_ap INT DEFAULT 5;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS max_floor INT DEFAULT 1;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS daily_rvs NUMERIC(10,2) DEFAULT 0;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS workout_streak INT DEFAULT 1;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS stats JSONB DEFAULT '{"str": 85, "agi": 70, "vit": 60, "luk": 50}'::jsonb;

-- 3. Update user_id to match id for any existing records
UPDATE public.profiles SET user_id = id WHERE user_id IS NULL;

-- 4. Re-enable RLS with full permissive access
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "profiles_public_all" ON public.profiles;
DROP POLICY IF EXISTS "Allow public select on profiles" ON public.profiles;
DROP POLICY IF EXISTS "Allow public insert on profiles" ON public.profiles;
DROP POLICY IF EXISTS "Allow public update on profiles" ON public.profiles;

CREATE POLICY "profiles_public_all" ON public.profiles FOR ALL USING (true) WITH CHECK (true);
