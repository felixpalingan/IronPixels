-- ========================================================
-- ATOMIC GACHA & INVENTORY INTEGRITY
-- Timestamp: 20260807000011
-- Best Practices: Idempotency & Concurrency-Safe Purchases
-- ========================================================

-- Ensure non-negative gold constraint on profiles
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'profiles_gold_non_negative'
  ) THEN
    ALTER TABLE public.profiles ADD CONSTRAINT profiles_gold_non_negative CHECK (gold >= 0);
  END IF;
END $$;

-- Optional Stored Procedure for all-in-one atomic deduction & inventory insertion
CREATE OR REPLACE FUNCTION public.buy_gacha_chest(
  p_user_id UUID,
  p_price INT,
  p_item_id TEXT
)
RETURNS TABLE (
  success BOOLEAN,
  new_gold INT,
  inventory_id UUID,
  error_message TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_current_gold INT;
  v_new_gold INT;
  v_inv_id UUID;
BEGIN
  -- Row-level lock on user profile to completely eliminate race condition
  SELECT gold INTO v_current_gold
  FROM public.profiles
  WHERE id = p_user_id OR user_id = p_user_id
  FOR UPDATE;

  IF v_current_gold IS NULL THEN
    RETURN QUERY SELECT false, 0, NULL::UUID, 'Profile not found'::TEXT;
    RETURN;
  END IF;

  IF v_current_gold < p_price THEN
    RETURN QUERY SELECT false, v_current_gold, NULL::UUID, 'Insufficient gold'::TEXT;
    RETURN;
  END IF;

  v_new_gold := v_current_gold - p_price;

  UPDATE public.profiles
  SET gold = v_new_gold, updated_at = NOW()
  WHERE id = p_user_id OR user_id = p_user_id;

  INSERT INTO public.user_inventory (user_id, item_id, is_equipped)
  VALUES (p_user_id, p_item_id, false)
  RETURNING user_inventory.inventory_id INTO v_inv_id;

  RETURN QUERY SELECT true, v_new_gold, v_inv_id, NULL::TEXT;
END;
$$;
