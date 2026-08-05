-- ========================================================
-- FIX 06: Fix PostgreSQL Auth Trigger and Profiles RLS Policies
-- ========================================================

-- 1. Remove outdated trigger function that inserts invalid starter items
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (
    id,
    user_id,
    username,
    character_class,
    gender,
    weight_kg,
    level,
    current_hp,
    max_hp,
    exp,
    max_exp,
    gold
  )
  VALUES (
    NEW.id,
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'username', SPLIT_PART(NEW.email, '@', 1)),
    COALESCE(NEW.raw_user_meta_data->>'character_class', 'WARRIOR'),
    COALESCE(NEW.raw_user_meta_data->>'gender', 'm'),
    COALESCE((NEW.raw_user_meta_data->>'weight_kg')::numeric, 75.0),
    1,
    1000,
    1000,
    0,
    1000,
    500
  )
  ON CONFLICT (id) DO UPDATE SET
    user_id = EXCLUDED.user_id,
    username = EXCLUDED.username,
    character_class = COALESCE(EXCLUDED.character_class, public.profiles.character_class),
    gender = COALESCE(EXCLUDED.gender, public.profiles.gender),
    weight_kg = COALESCE(EXCLUDED.weight_kg, public.profiles.weight_kg);

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 2. Ensure RLS policies on profiles & user_inventory allow ALL operations
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_inventory ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "profiles_public" ON public.profiles;
DROP POLICY IF EXISTS "Allow public select on profiles" ON public.profiles;
DROP POLICY IF EXISTS "Allow public insert on profiles" ON public.profiles;
DROP POLICY IF EXISTS "Allow public update on profiles" ON public.profiles;

CREATE POLICY "profiles_public_all" ON public.profiles FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "user_inventory_public" ON public.user_inventory;
DROP POLICY IF EXISTS "Allow public select on user_inventory" ON public.user_inventory;
DROP POLICY IF EXISTS "Allow public insert on user_inventory" ON public.user_inventory;
DROP POLICY IF EXISTS "Allow public update on user_inventory" ON public.user_inventory;

CREATE POLICY "user_inventory_public_all" ON public.user_inventory FOR ALL USING (true) WITH CHECK (true);
