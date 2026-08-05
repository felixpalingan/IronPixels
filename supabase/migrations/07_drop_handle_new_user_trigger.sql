-- ========================================================
-- FIX 07: Drop handle_new_user trigger and function completely
-- Allows onboarding API to insert 100% fresh, accurate profiles
-- ========================================================

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS public.handle_new_user CASCADE;

-- Ensure profiles table policies allow full insert/update by authenticated and anon users
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "profiles_public_all" ON public.profiles;
CREATE POLICY "profiles_public_all" ON public.profiles FOR ALL USING (true) WITH CHECK (true);
