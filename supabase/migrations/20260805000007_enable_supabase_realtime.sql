-- ========================================================
-- ENABLE SUPABASE REALTIME WEBSOCKETS FOR PARTY COMBAT & BOSSES
-- Timestamp: 20260805000007
-- ========================================================

-- Enable supabase_realtime publication for dungeon_bosses and Party tables
ALTER PUBLICATION supabase_realtime ADD TABLE public.dungeon_bosses;
ALTER PUBLICATION supabase_realtime ADD TABLE public."Party";
ALTER PUBLICATION supabase_realtime ADD TABLE public."Party_Members";
