-- Migration: 20261011000014_tidy_dungeon_stages.sql
-- Tidy and re-populate dungeon_bosses into a clean 20-stage progression with authentic sprite configs and stats.

DO $$ 
BEGIN 
  DELETE FROM public.dungeon_bosses WHERE boss_id NOT LIKE 'boss-stage-%'; 
END $$;

INSERT INTO public.dungeon_bosses (
  boss_id,
  boss_name,
  stage,
  current_hp,
  max_hp,
  status,
  category,
  mode,
  sprite_config
) VALUES
  ('boss-stage-1', 'Stage 1: Imp', 1, 1200, 1200, 'Active', 'mob', 'solo', '{"isBig": false, "spriteKey": "imp", "animPrefix": "idle_anim", "hasRunAnim": true, "displayName": "Imp"}'::jsonb),
  ('boss-stage-2', 'Stage 2: Swampy', 2, 1450, 1450, 'Active', 'mob', 'solo', '{"isBig": false, "spriteKey": "swampy", "animPrefix": "anim", "hasRunAnim": false, "displayName": "Swampy"}'::jsonb),
  ('boss-stage-3', 'Stage 3: Goblin', 3, 1750, 1750, 'Active', 'mob', 'solo', '{"isBig": false, "spriteKey": "goblin", "animPrefix": "idle_anim", "hasRunAnim": true, "displayName": "Goblin"}'::jsonb),
  ('boss-stage-4', 'Stage 4: Skeleton', 4, 2100, 2100, 'Active', 'mob', 'solo', '{"isBig": false, "spriteKey": "skelet", "animPrefix": "idle_anim", "hasRunAnim": true, "displayName": "Skeleton"}'::jsonb),
  ('boss-stage-5', 'Stage 5: [BOSS] Ogre King', 5, 6750, 6750, 'Active', 'boss', 'solo', '{"isBig": true, "spriteKey": "ogre", "animPrefix": "idle_anim", "hasRunAnim": true, "displayName": "Ogre King"}'::jsonb),
  ('boss-stage-6', 'Stage 6: Masked Orc', 6, 3000, 3000, 'Active', 'mob', 'solo', '{"isBig": false, "spriteKey": "masked_orc", "animPrefix": "idle_anim", "hasRunAnim": true, "displayName": "Masked Orc"}'::jsonb),
  ('boss-stage-7', 'Stage 7: Poison Slug', 7, 3600, 3600, 'Active', 'mob', 'solo', '{"isBig": false, "spriteKey": "slug", "animPrefix": "anim", "hasRunAnim": false, "displayName": "Poison Slug"}'::jsonb),
  ('boss-stage-8', 'Stage 8: Tiny Zombie', 8, 4300, 4300, 'Active', 'mob', 'solo', '{"isBig": false, "spriteKey": "tiny_zombie", "animPrefix": "idle_anim", "hasRunAnim": true, "displayName": "Tiny Zombie"}'::jsonb),
  ('boss-stage-9', 'Stage 9: Muddy', 9, 5200, 5200, 'Active', 'mob', 'solo', '{"isBig": false, "spriteKey": "muddy", "animPrefix": "anim", "hasRunAnim": false, "displayName": "Muddy"}'::jsonb),
  ('boss-stage-10', 'Stage 10: [BOSS] Undead Giant', 10, 9200, 9200, 'Active', 'boss', 'solo', '{"isBig": true, "spriteKey": "big_zombie", "animPrefix": "idle_anim", "hasRunAnim": true, "displayName": "Undead Giant"}'::jsonb),
  ('boss-stage-11', 'Stage 11: Dark Necromancer', 11, 7500, 7500, 'Active', 'mob', 'solo', '{"isBig": false, "spriteKey": "necromancer", "animPrefix": "anim", "hasRunAnim": false, "displayName": "Dark Necromancer"}'::jsonb),
  ('boss-stage-12', 'Stage 12: Pumpkin Dude', 12, 9000, 9000, 'Active', 'mob', 'solo', '{"isBig": false, "spriteKey": "pumpkin_dude", "animPrefix": "idle_anim", "hasRunAnim": true, "displayName": "Pumpkin Dude"}'::jsonb),
  ('boss-stage-13', 'Stage 13: Orc Warrior', 13, 10800, 10800, 'Active', 'mob', 'solo', '{"isBig": false, "spriteKey": "orc_warrior", "animPrefix": "idle_anim", "hasRunAnim": true, "displayName": "Orc Warrior"}'::jsonb),
  ('boss-stage-14', 'Stage 14: Wogol', 14, 13000, 13000, 'Active', 'mob', 'solo', '{"isBig": false, "spriteKey": "wogol", "animPrefix": "idle_anim", "hasRunAnim": true, "displayName": "Wogol"}'::jsonb),
  ('boss-stage-15', 'Stage 15: [BOSS] Demon Lord', 15, 12500, 12500, 'Active', 'boss', 'solo', '{"isBig": true, "spriteKey": "big_demon", "animPrefix": "idle_anim", "hasRunAnim": true, "displayName": "Demon Lord"}'::jsonb),
  ('boss-stage-16', 'Stage 16: Chort Fiend', 16, 18500, 18500, 'Active', 'mob', 'solo', '{"isBig": false, "spriteKey": "chort", "animPrefix": "idle_anim", "hasRunAnim": true, "displayName": "Chort Fiend"}'::jsonb),
  ('boss-stage-17', 'Stage 17: Ice Zombie', 17, 22200, 22200, 'Active', 'mob', 'solo', '{"isBig": false, "spriteKey": "ice_zombie", "animPrefix": "anim", "hasRunAnim": false, "displayName": "Ice Zombie"}'::jsonb),
  ('boss-stage-18', 'Stage 18: Orc Shaman', 18, 26600, 26600, 'Active', 'mob', 'solo', '{"isBig": false, "spriteKey": "orc_shaman", "animPrefix": "idle_anim", "hasRunAnim": true, "displayName": "Orc Shaman"}'::jsonb),
  ('boss-stage-19', 'Stage 19: Shadow Lich', 19, 32000, 32000, 'Active', 'mob', 'solo', '{"isBig": false, "spriteKey": "necromancer", "animPrefix": "anim", "hasRunAnim": false, "displayName": "Shadow Lich"}'::jsonb),
  ('boss-stage-20', 'Stage 20: [BOSS] Abyssal Overlord', 20, 35000, 35000, 'Active', 'boss', 'solo', '{"isBig": true, "spriteKey": "big_demon", "animPrefix": "idle_anim", "hasRunAnim": true, "displayName": "Abyssal Overlord"}'::jsonb)
ON CONFLICT (boss_id) DO UPDATE SET
  boss_name = EXCLUDED.boss_name,
  stage = EXCLUDED.stage,
  current_hp = EXCLUDED.current_hp,
  max_hp = EXCLUDED.max_hp,
  status = EXCLUDED.status,
  category = EXCLUDED.category,
  mode = EXCLUDED.mode,
  sprite_config = EXCLUDED.sprite_config,
  updated_at = now();
