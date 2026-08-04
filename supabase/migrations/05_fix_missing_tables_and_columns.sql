-- ========================================================
-- FIX 05: Add missing tables and columns for frontend sync
-- ========================================================

-- 1. Create user_inventory table (used by onboarding + inventory API)
CREATE TABLE IF NOT EXISTS public."user_inventory" (
    inventory_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL,
    item_id TEXT NOT NULL,
    is_equipped BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE public."user_inventory" ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "user_inventory_public" ON public."user_inventory";
CREATE POLICY "user_inventory_public" ON public."user_inventory" FOR ALL USING (true);

-- 2. Add missing columns to Workout_Sessions
ALTER TABLE public."Workout_Sessions" ADD COLUMN IF NOT EXISTS date TEXT;
ALTER TABLE public."Workout_Sessions" ADD COLUMN IF NOT EXISTS duration_minutes INT DEFAULT 0;
ALTER TABLE public."Workout_Sessions" ADD COLUMN IF NOT EXISTS exercises_log JSONB DEFAULT '[]'::jsonb;

-- 3. Add missing columns to profiles
ALTER TABLE public."profiles" ADD COLUMN IF NOT EXISTS available_ap INT DEFAULT 5;
ALTER TABLE public."profiles" ADD COLUMN IF NOT EXISTS gender TEXT DEFAULT 'm';
