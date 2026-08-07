-- ========================================================
-- WORKOUT ROUTINES & TEMPLATES SCHEMA
-- Timestamp: 20260807000010
-- Best Practices: Supabase Security & Postgres Rules
-- ========================================================

CREATE TABLE IF NOT EXISTS public.workout_routines (
  routine_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  routine_name TEXT NOT NULL,
  description TEXT,
  target_split TEXT DEFAULT 'Custom',
  exercises JSONB NOT NULL DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.workout_routines ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "workout_routines_select_public" ON public.workout_routines;
DROP POLICY IF EXISTS "workout_routines_all" ON public.workout_routines;

-- Authenticated & public access policy
CREATE POLICY "workout_routines_select_public" ON public.workout_routines
  FOR SELECT TO authenticated, anon
  USING (true);

CREATE POLICY "workout_routines_insert_own" ON public.workout_routines
  FOR INSERT TO authenticated
  WITH CHECK ((select auth.uid()) = user_id);

CREATE POLICY "workout_routines_update_own" ON public.workout_routines
  FOR UPDATE TO authenticated
  USING ((select auth.uid()) = user_id)
  WITH CHECK ((select auth.uid()) = user_id);

CREATE POLICY "workout_routines_delete_own" ON public.workout_routines
  FOR DELETE TO authenticated
  USING ((select auth.uid()) = user_id);
