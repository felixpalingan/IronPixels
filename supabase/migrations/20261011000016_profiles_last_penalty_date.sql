-- 20261011000016_profiles_last_penalty_date.sql
-- Add last_penalty_date to profiles to authoritatively track daily boss attacks in the database

ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS last_penalty_date DATE DEFAULT NULL;
