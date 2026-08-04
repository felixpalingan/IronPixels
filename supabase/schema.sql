CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

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

ALTER TABLE public."profiles" ADD COLUMN IF NOT EXISTS max_floor INT DEFAULT 1;
ALTER TABLE public."profiles" ADD COLUMN IF NOT EXISTS daily_rvs NUMERIC(10,2) DEFAULT 0;
ALTER TABLE public."profiles" ADD COLUMN IF NOT EXISTS workout_streak INT DEFAULT 1;
ALTER TABLE public."profiles" ADD COLUMN IF NOT EXISTS available_ap INT DEFAULT 5;
ALTER TABLE public."profiles" ADD COLUMN IF NOT EXISTS gender TEXT DEFAULT 'm';

CREATE TABLE IF NOT EXISTS public."user_inventory" (
    inventory_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL,
    item_id TEXT NOT NULL,
    is_equipped BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);


CREATE TABLE IF NOT EXISTS public."Equipped_Gear" (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL,
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
    user_id UUID NOT NULL,
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
    user_id UUID NOT NULL,
    skill_name TEXT NOT NULL,
    damage_multiplier NUMERIC(4,2) NOT NULL DEFAULT 1.5,
    cooldown_minutes INT NOT NULL DEFAULT 5,
    last_used_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

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

ALTER TABLE public."Party" ADD COLUMN IF NOT EXISTS total_party_floor INT DEFAULT 1;

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

INSERT INTO public."Exercise_Dictionary" (exercise_id, exercise_name, tier, movement_coefficient)
VALUES
('a1b2c3d4-e5f6-7a8b-9c0d-1e2f3a4b5c6d', 'Barbell Bench Press', 'Tier B', 1.20),
('b2c3d4e5-f6a7-8b9c-0d1e-2f3a4b5c6d7e', 'Barbell Squat', 'Tier B', 1.50),
('c3d4e5f6-a7b8-9c0d-1e2f-3a4b5c6d7e8f', 'Bicep Curl', 'Tier A', 2.50),
('d4e5f6a7-b8c9-0d1e-2f3a-4b5c6d7e8f9a', 'Lateral Raise', 'Tier A', 2.80),
('e5f6a7b8-c90d-1e2f-3a4b-5c6d7e8f9a0b', 'Leg Press', 'Tier C', 0.70),
('f6a7b8c9-0d1e-2f3a-4b5c-6d7e8f9a0b1c', 'Lat Pulldown', 'Tier C', 0.80)
ON CONFLICT (exercise_name) DO NOTHING;

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
