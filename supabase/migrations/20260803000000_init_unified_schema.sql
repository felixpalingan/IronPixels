DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS public.handle_new_user CASCADE;

DROP TABLE IF EXISTS public.inventory CASCADE;
DROP TABLE IF EXISTS public.user_inventory CASCADE;
DROP TABLE IF EXISTS public.workout_sessions CASCADE;
DROP TABLE IF EXISTS public.dungeon_bosses CASCADE;
DROP TABLE IF EXISTS public.user_stats CASCADE;
DROP TABLE IF EXISTS public.profiles CASCADE;
DROP TABLE IF EXISTS public.users CASCADE;

CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  username TEXT NOT NULL,
  character_class TEXT NOT NULL DEFAULT 'WARRIOR',
  level INT NOT NULL DEFAULT 1,
  current_hp INT NOT NULL DEFAULT 1000,
  max_hp INT NOT NULL DEFAULT 1000,
  exp INT NOT NULL DEFAULT 0,
  max_exp INT NOT NULL DEFAULT 1000,
  gold INT NOT NULL DEFAULT 500,
  weight_kg NUMERIC NOT NULL DEFAULT 75,
  available_ap INT NOT NULL DEFAULT 5,
  stats JSONB NOT NULL DEFAULT '{"str": 85, "agi": 72, "vit": 54, "luk": 60}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE public.user_inventory (
  inventory_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  item_id TEXT NOT NULL,
  is_equipped BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE public.dungeon_bosses (
  boss_id TEXT PRIMARY KEY,
  boss_name TEXT NOT NULL,
  stage INT NOT NULL,
  current_hp INT NOT NULL,
  max_hp INT NOT NULL,
  status TEXT NOT NULL DEFAULT 'Active',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE public.workout_sessions (
  session_id TEXT PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  duration_minutes INT NOT NULL DEFAULT 45,
  total_rvs INT NOT NULL DEFAULT 0,
  total_volume_kg NUMERIC NOT NULL DEFAULT 0,
  exercises_log JSONB NOT NULL DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_inventory ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.workout_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.dungeon_bosses ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public select on profiles" ON public.profiles FOR SELECT USING (true);
CREATE POLICY "Allow public insert on profiles" ON public.profiles FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update on profiles" ON public.profiles FOR UPDATE USING (true);

CREATE POLICY "Allow public select on user_inventory" ON public.user_inventory FOR SELECT USING (true);
CREATE POLICY "Allow public insert on user_inventory" ON public.user_inventory FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update on user_inventory" ON public.user_inventory FOR UPDATE USING (true);

CREATE POLICY "Allow public select on dungeon_bosses" ON public.dungeon_bosses FOR SELECT USING (true);
CREATE POLICY "Allow public insert on dungeon_bosses" ON public.dungeon_bosses FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update on dungeon_bosses" ON public.dungeon_bosses FOR UPDATE USING (true);

CREATE POLICY "Allow public select on workout_sessions" ON public.workout_sessions FOR SELECT USING (true);
CREATE POLICY "Allow public insert on workout_sessions" ON public.workout_sessions FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update on workout_sessions" ON public.workout_sessions FOR UPDATE USING (true);

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, username, character_class)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'username', SPLIT_PART(NEW.email, '@', 1)),
    COALESCE(NEW.raw_user_meta_data->>'character_class', 'WARRIOR')
  )
  ON CONFLICT (id) DO NOTHING;

  INSERT INTO public.user_inventory (user_id, item_id, is_equipped)
  VALUES
    (NEW.id, 'wep-novice-sword', true),
    (NEW.id, 'arm-iron-plate', true),
    (NEW.id, 'acc-#00ff41-ring', true);

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

INSERT INTO public.dungeon_bosses (boss_id, boss_name, stage, current_hp, max_hp, status)
VALUES 
('boss-stage-1-grok', 'Orc Warlord Grok', 1, 30000, 30000, 'Active'),
('boss-stage-2-crimson', 'Blood Beast Crimson', 2, 75000, 75000, 'Active'),
('boss-stage-3-ignis', 'Demon Lord Ignis', 3, 150000, 150000, 'Active'),
('boss-stage-4-dragon', 'Abyssal Void Dragon', 4, 300000, 300000, 'Active'),
('boss-stage-5-omega', 'Cyber Mecha Omega', 5, 600000, 600000, 'Active'),
('boss-stage-6-lich', 'Shadow Lich Emperor', 6, 1200000, 1200000, 'Active')
ON CONFLICT (boss_id) DO UPDATE 
SET boss_name = EXCLUDED.boss_name, stage = EXCLUDED.stage, current_hp = EXCLUDED.current_hp, max_hp = EXCLUDED.max_hp, status = EXCLUDED.status;
