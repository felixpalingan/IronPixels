-- ========================================================
-- REALTIME PERSISTENT DUNGEON BOSSES SCHEMA
-- Timestamp: 20260805000006
-- ========================================================

-- 1. Ensure dungeon_bosses table has all columns for solo & party combat sync
ALTER TABLE public.dungeon_bosses ADD COLUMN IF NOT EXISTS category TEXT DEFAULT 'mob';
ALTER TABLE public.dungeon_bosses ADD COLUMN IF NOT EXISTS mode TEXT DEFAULT 'solo';
ALTER TABLE public.dungeon_bosses ADD COLUMN IF NOT EXISTS sprite_config JSONB DEFAULT '{"spriteKey": "goblin", "displayName": "Goblin", "animPrefix": "idle_anim", "hasRunAnim": true, "isBig": false}'::jsonb;

-- 2. Enable RLS on dungeon_bosses
ALTER TABLE public.dungeon_bosses ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "dungeon_bosses_public_access" ON public.dungeon_bosses;
CREATE POLICY "dungeon_bosses_public_access" ON public.dungeon_bosses FOR ALL USING (true) WITH CHECK (true);
