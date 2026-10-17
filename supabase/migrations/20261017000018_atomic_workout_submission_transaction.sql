-- ========================================================
-- ATOMIC WORKOUT SUBMISSION & PROGRESSION INTEGRITY
-- Timestamp: 20261017000018
-- Architecture: ACID Atomic Multi-Table Transaction with Row-Level Lock
-- ========================================================

CREATE OR REPLACE FUNCTION public.submit_workout_transaction(
  p_user_id UUID,
  p_session_id TEXT,
  p_date TEXT,
  p_duration_minutes INT,
  p_total_rvs NUMERIC,
  p_total_volume_kg NUMERIC,
  p_exercises_log JSONB,
  p_earned_gold INT,
  p_new_exp INT,
  p_new_max_exp INT,
  p_new_level INT,
  p_new_ap INT,
  p_new_hp INT,
  p_safe_date TEXT,
  p_party_id UUID DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_updated_profile JSONB;
  v_current_gold INT;
BEGIN
  -- 1. Row-level lock on user profile to eliminate race conditions during level up / rewards
  SELECT gold INTO v_current_gold
  FROM public.profiles
  WHERE id = p_user_id OR user_id = p_user_id
  FOR UPDATE;

  IF v_current_gold IS NULL THEN
    RAISE EXCEPTION 'User profile not found for ID %', p_user_id;
  END IF;

  -- 2. Insert workout session record atomically
  INSERT INTO public.workout_sessions (
    session_id,
    user_id,
    date,
    duration_minutes,
    total_rvs,
    total_volume_kg,
    exercises_log,
    status
  ) VALUES (
    p_session_id,
    p_user_id,
    p_date::date,
    p_duration_minutes,
    ROUND(p_total_rvs)::INT,
    p_total_volume_kg,
    p_exercises_log,
    'completed'
  );

  -- 3. Update user profile progression atomically
  UPDATE public.profiles
  SET
    current_hp = p_new_hp,
    exp = p_new_exp,
    max_exp = p_new_max_exp,
    level = p_new_level,
    gold = COALESCE(gold, 0) + p_earned_gold,
    available_ap = p_new_ap,
    daily_rvs = COALESCE(daily_rvs, 0) + p_total_rvs,
    last_penalty_date = p_safe_date,
    updated_at = timezone('utc'::text, now())
  WHERE id = p_user_id OR user_id = p_user_id
  RETURNING to_jsonb(profiles.*) INTO v_updated_profile;

  -- 4. Contribute RVS to Party if user is an active party member
  IF p_party_id IS NOT NULL THEN
    UPDATE public."Party"
    SET
      total_party_rvs = COALESCE(total_party_rvs, 0) + p_total_rvs,
      updated_at = timezone('utc'::text, now())
    WHERE party_id = p_party_id;
  END IF;

  RETURN jsonb_build_object(
    'success', true,
    'profile', v_updated_profile
  );
END;
$$;
