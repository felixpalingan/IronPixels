-- Migration: Allow authenticated users to delete their own workout sessions & set default session_id
ALTER TABLE public.workout_sessions ALTER COLUMN session_id SET DEFAULT gen_random_uuid()::text;

DROP POLICY IF EXISTS "workout_sessions_delete_own" ON public.workout_sessions;
CREATE POLICY "workout_sessions_delete_own" ON public.workout_sessions
  FOR DELETE
  TO authenticated
  USING ((SELECT auth.uid()) = user_id);
