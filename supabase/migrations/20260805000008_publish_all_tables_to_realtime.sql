-- ========================================================
-- PUBLISH ALL APP TABLES TO SUPABASE REALTIME WEBSOCKETS
-- Timestamp: 20260805000008
-- ========================================================

-- Enable supabase_realtime publication for friends, party_invites, profiles, workout_sessions, and user_inventory
ALTER PUBLICATION supabase_realtime ADD TABLE public.friends;
ALTER PUBLICATION supabase_realtime ADD TABLE public.party_invites;
ALTER PUBLICATION supabase_realtime ADD TABLE public.profiles;
ALTER PUBLICATION supabase_realtime ADD TABLE public.workout_sessions;
ALTER PUBLICATION supabase_realtime ADD TABLE public.user_inventory;
