-- 20261011000015_sync_schema_mismatches.sql
-- Fix column and table mismatches identified between Supabase and web application

-- 1. Add status column to workout_sessions (fixes workout submission failures)
ALTER TABLE public.workout_sessions 
ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'completed';

-- 2. Add updated_at column to Party (fixes party floor progression updates)
ALTER TABLE public."Party" 
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now());

-- 3. Add item_data column to user_inventory (prevents PostgREST schema cache errors)
ALTER TABLE public.user_inventory 
ADD COLUMN IF NOT EXISTS item_data JSONB DEFAULT NULL;
