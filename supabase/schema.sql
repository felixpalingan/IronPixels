CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

CREATE TABLE IF NOT EXISTS public."Users" (
    user_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    username TEXT NOT NULL UNIQUE,
    character_class TEXT DEFAULT 'CYBER KNIGHT',
    level INT DEFAULT 15,
    current_hp INT DEFAULT 850,
    max_hp INT DEFAULT 1000,
    exp INT DEFAULT 10000,
    max_exp INT DEFAULT 15000,
    gold INT DEFAULT 12500,
    weight_kg NUMERIC(5,2) DEFAULT 75.00,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE TABLE IF NOT EXISTS public."User_Stats" (
    user_id UUID PRIMARY KEY REFERENCES public."Users"(user_id) ON DELETE CASCADE,
    str INT DEFAULT 85,
    agi INT DEFAULT 72,
    vit INT DEFAULT 54,
    luk INT DEFAULT 60
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
    exercise_id UUID NOT NULL REFERENCES public."Exercise_Dictionary"(exercise_id) ON DELETE CASCADE,
    sets INT NOT NULL,
    reps INT NOT NULL,
    weight_lifted NUMERIC(6,2) NOT NULL,
    rvs_generated NUMERIC(10,2) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

INSERT INTO public."Users" (user_id, username, character_class, level, current_hp, max_hp, exp, max_exp, gold, weight_kg)
VALUES ('e7b1a2c3-4d5e-6f7a-8b9c-0d1e2f3a4b5c', 'Felix', 'CYBER KNIGHT', 15, 850, 1000, 10000, 15000, 12500, 75.00)
ON CONFLICT (user_id) DO NOTHING;

INSERT INTO public."User_Stats" (user_id, str, agi, vit, luk)
VALUES ('e7b1a2c3-4d5e-6f7a-8b9c-0d1e2f3a4b5c', 85, 72, 54, 60)
ON CONFLICT (user_id) DO NOTHING;

INSERT INTO public."Equipped_Gear" (user_id, slot, name, icon)
VALUES 
('e7b1a2c3-4d5e-6f7a-8b9c-0d1e2f3a4b5c', 'weapon', 'Iron Blade...', 'sword'),
('e7b1a2c3-4d5e-6f7a-8b9c-0d1e2f3a4b5c', 'armor', 'Chainmail', 'shield'),
('e7b1a2c3-4d5e-6f7a-8b9c-0d1e2f3a4b5c', 'accessory', 'Vitality A...', 'heart')
ON CONFLICT DO NOTHING;

INSERT INTO public."Exercise_Dictionary" (exercise_id, exercise_name, tier, movement_coefficient)
VALUES
('a1b2c3d4-e5f6-7a8b-9c0d-1e2f3a4b5c6d', 'Barbell Bench Press', 'Tier B', 1.20),
('b2c3d4e5-f6a7-8b9c-0d1e-2f3a4b5c6d7e', 'Barbell Squat', 'Tier B', 1.50),
('c3d4e5f6-a7b8-9c0d-1e2f-3a4b5c6d7e8f', 'Bicep Curl', 'Tier A', 2.50),
('d4e5f6a7-b8c9-0d1e-2f3a-4b5c6d7e8f9a', 'Lateral Raise', 'Tier A', 2.80),
('e5f6a7b8-c90d-1e2f-3a4b-5c6d7e8f9a0b', 'Leg Press', 'Tier C', 0.70),
('f6a7b8c9-0d1e-2f3a-4b5c-6d7e8f9a0b1c', 'Lat Pulldown', 'Tier C', 0.80)
ON CONFLICT (exercise_name) DO NOTHING;
