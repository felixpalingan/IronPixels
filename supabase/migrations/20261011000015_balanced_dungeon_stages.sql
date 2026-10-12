-- Migration: 20261011000015_balanced_dungeon_stages.sql
-- Update dungeon_bosses to balanced HP curve and rewards based on 4-exercise x 3-set gym session archetype.

UPDATE public.dungeon_bosses SET current_hp = 1500, max_hp = 1500 WHERE stage = 1;
UPDATE public.dungeon_bosses SET current_hp = 2200, max_hp = 2200 WHERE stage = 2;
UPDATE public.dungeon_bosses SET current_hp = 3200, max_hp = 3200 WHERE stage = 3;
UPDATE public.dungeon_bosses SET current_hp = 4500, max_hp = 4500 WHERE stage = 4;
UPDATE public.dungeon_bosses SET current_hp = 12000, max_hp = 12000 WHERE stage = 5;
UPDATE public.dungeon_bosses SET current_hp = 6500, max_hp = 6500 WHERE stage = 6;
UPDATE public.dungeon_bosses SET current_hp = 8500, max_hp = 8500 WHERE stage = 7;
UPDATE public.dungeon_bosses SET current_hp = 11000, max_hp = 11000 WHERE stage = 8;
UPDATE public.dungeon_bosses SET current_hp = 14500, max_hp = 14500 WHERE stage = 9;
UPDATE public.dungeon_bosses SET current_hp = 30000, max_hp = 30000 WHERE stage = 10;
UPDATE public.dungeon_bosses SET current_hp = 18000, max_hp = 18000 WHERE stage = 11;
UPDATE public.dungeon_bosses SET current_hp = 22000, max_hp = 22000 WHERE stage = 12;
UPDATE public.dungeon_bosses SET current_hp = 27000, max_hp = 27000 WHERE stage = 13;
UPDATE public.dungeon_bosses SET current_hp = 33000, max_hp = 33000 WHERE stage = 14;
UPDATE public.dungeon_bosses SET current_hp = 65000, max_hp = 65000 WHERE stage = 15;
UPDATE public.dungeon_bosses SET current_hp = 40000, max_hp = 40000 WHERE stage = 16;
UPDATE public.dungeon_bosses SET current_hp = 48000, max_hp = 48000 WHERE stage = 17;
UPDATE public.dungeon_bosses SET current_hp = 58000, max_hp = 58000 WHERE stage = 18;
UPDATE public.dungeon_bosses SET current_hp = 70000, max_hp = 70000 WHERE stage = 19;
UPDATE public.dungeon_bosses SET current_hp = 125000, max_hp = 125000 WHERE stage = 20;
