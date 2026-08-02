CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

CREATE TABLE IF NOT EXISTS public."Users" (
    user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    username TEXT NOT NULL UNIQUE,
    character_class TEXT DEFAULT 'CYBER KNIGHT',
    level INT DEFAULT 1,
    current_hp INT DEFAULT 1000,
    max_hp INT DEFAULT 1000,
    exp INT DEFAULT 0,
    max_exp INT DEFAULT 1000,
    gold INT DEFAULT 500,
    weight_kg NUMERIC(5,2) DEFAULT 70.00,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE TABLE IF NOT EXISTS public."User_Stats" (
    user_id UUID PRIMARY KEY REFERENCES public."Users"(user_id) ON DELETE CASCADE,
    str INT DEFAULT 75,
    agi INT DEFAULT 75,
    vit INT DEFAULT 70,
    luk INT DEFAULT 70
);

CREATE TABLE IF NOT EXISTS public."Equipped_Gear" (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public."Users"(user_id) ON DELETE CASCADE,
    slot TEXT NOT NULL,
    name TEXT NOT NULL,
    icon TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE TABLE IF NOT EXISTS public."Exercise_Dictionary" (
    exercise_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    exercise_name TEXT NOT NULL UNIQUE,
    tier TEXT NOT NULL,
    movement_coefficient NUMERIC(4,2) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE TABLE IF NOT EXISTS public."Workout_Sessions" (
    session_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public."Users"(user_id) ON DELETE CASCADE,
    total_volume_kg NUMERIC(10,2) NOT NULL DEFAULT 0,
    total_rvs NUMERIC(10,2) NOT NULL DEFAULT 0,
    exercise_count INT NOT NULL DEFAULT 0,
    status TEXT NOT NULL DEFAULT 'completed',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE TABLE IF NOT EXISTS public."Session_Exercises" (
    log_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id UUID NOT NULL REFERENCES public."Workout_Sessions"(session_id) ON DELETE CASCADE,
    exercise_id UUID NOT NULL REFERENCES public."Exercise_Dictionary"(exercise_id) ON DELETE CASCADE,
    sets_count INT NOT NULL DEFAULT 0,
    reps_count INT NOT NULL DEFAULT 0,
    weight_lifted NUMERIC(10,2) NOT NULL DEFAULT 0,
    rvs_generated NUMERIC(10,2) NOT NULL DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE TABLE IF NOT EXISTS public."Session_Sets" (
    set_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    log_id UUID NOT NULL REFERENCES public."Session_Exercises"(log_id) ON DELETE CASCADE,
    set_number INT NOT NULL,
    weight_kg NUMERIC(6,2) NOT NULL,
    reps INT NOT NULL,
    rvs_generated NUMERIC(10,2) NOT NULL DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE TABLE IF NOT EXISTS public."User_Skills" (
    skill_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public."Users"(user_id) ON DELETE CASCADE,
    skill_name TEXT NOT NULL,
    damage_multiplier NUMERIC(4,2) NOT NULL DEFAULT 1.5,
    cooldown_minutes INT NOT NULL DEFAULT 5,
    last_used_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE TABLE IF NOT EXISTS public."Dungeon_Bosses" (
    boss_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    boss_name TEXT NOT NULL,
    current_hp BIGINT NOT NULL DEFAULT 250000,
    max_hp BIGINT NOT NULL DEFAULT 500000,
    status TEXT NOT NULL DEFAULT 'Active',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

INSERT INTO public."Exercise_Dictionary" (exercise_id, exercise_name, tier, movement_coefficient)
VALUES
('a1b2c3d4-e5f6-7a8b-9c0d-1e2f3a4b5c6d', 'Barbell Bench Press', 'Tier B', 1.20),
('b2c3d4e5-f6a7-8b9c-0d1e-2f3a4b5c6d7e', 'Barbell Squat', 'Tier B', 1.50),
('c3d4e5f6-a7b8-9c0d-1e2f-3a4b5c6d7e8f', 'Bicep Curl', 'Tier A', 2.50),
('d4e5f6a7-b8c9-0d1e-2f3a-4b5c6d7e8f9a', 'Lateral Raise', 'Tier A', 2.80),
('e5f6a7b8-c90d-1e2f-3a4b-5c6d7e8f9a0b', 'Leg Press', 'Tier C', 0.70),
('f6a7b8c9-0d1e-2f3a-4b5c-6d7e8f9a0b1c', 'Lat Pulldown', 'Tier C', 0.80)
ON CONFLICT (exercise_name) DO NOTHING;

INSERT INTO public."Dungeon_Bosses" (boss_id, boss_name, current_hp, max_hp, status)
VALUES ('b055d7ac-1234-4567-89ab-cdef01234567', 'Demon Lord Ignis', 250000, 500000, 'Active')
ON CONFLICT DO NOTHING;

ALTER TABLE public."Users" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."User_Stats" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."Workout_Sessions" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."User_Skills" ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users self management" ON public."Users";
CREATE POLICY "Users self management" ON public."Users"
    FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "User_Stats self management" ON public."User_Stats";
CREATE POLICY "User_Stats self management" ON public."User_Stats"
    FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Workout_Sessions self management" ON public."Workout_Sessions";
CREATE POLICY "Workout_Sessions self management" ON public."Workout_Sessions"
    FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "User_Skills self management" ON public."User_Skills";
CREATE POLICY "User_Skills self management" ON public."User_Skills"
    FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
