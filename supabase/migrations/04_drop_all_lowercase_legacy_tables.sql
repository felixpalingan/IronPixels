-- ========================================================
-- DROP ALL LOWERCASE LEGACY DUPLICATE TABLES
-- Cleans up parties, party_members, friendships, user_inventory, workout_sessions
-- ========================================================

DROP TABLE IF EXISTS public."parties" CASCADE;
DROP TABLE IF EXISTS public."party_members" CASCADE;
DROP TABLE IF EXISTS public."friendships" CASCADE;
DROP TABLE IF EXISTS public."user_inventory" CASCADE;
DROP TABLE IF EXISTS public."workout_sessions" CASCADE;
DROP TABLE IF EXISTS public."session_exercises" CASCADE;
DROP TABLE IF EXISTS public."session_sets" CASCADE;
DROP TABLE IF EXISTS public."equipped_gear" CASCADE;
DROP TABLE IF EXISTS public."user_skills" CASCADE;
DROP TABLE IF EXISTS public."exercise_dictionary" CASCADE;
