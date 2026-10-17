-- 20261017000017_boss_authoritative_hp_columns.sql
-- Ensure authoritative enemy HP tracking columns exist in profiles and Party tables

-- 1. Add dungeon_enemy_hp column to profiles for server-authoritative solo enemy HP tracking
ALTER TABLE public."profiles" 
ADD COLUMN IF NOT EXISTS dungeon_enemy_hp INT DEFAULT NULL;

-- 2. Add current_boss_hp column to Party for server-authoritative party boss HP tracking
ALTER TABLE public."Party" 
ADD COLUMN IF NOT EXISTS current_boss_hp INT DEFAULT NULL;
