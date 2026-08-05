# IRONPIXELS - AI HANDOVER MEMORY & TECHNICAL ARCHITECTURE DUMP

This document serves as a complete memory dump and technical handoff guide for any AI assistant continuing the development of **IronPixels**.

---

## 1. PROJECT OVERVIEW & TECH STACK

- **Application Name**: IronPixels (Gamified Pixel-Art Fitness RPG Web App)
- **Framework**: Next.js 15 (App Router, TypeScript)
- **Styling**: Vanilla CSS, Tailwind CSS, Pixel-art aesthetics, Framer Motion
- **Icons**: Lucide React
- **Backend & Database**: Supabase Auth & Supabase PostgreSQL Database
- **Primary Repository**: `felixpalingan/IronPixels` (Branch: `main`)

---

## 2. DATABASE SCHEMA & SUPABASE TABLES

### Active Production Tables
1. **`public.profiles`**:
   - Columns: `id` (UUID PK), `user_id` (UUID UNIQUE), `username` (TEXT), `character_class` (TEXT), `gender` (TEXT: 'm' | 'f'), `level` (INT), `current_hp` (INT), `max_hp` (INT), `exp` (INT), `max_exp` (INT), `gold` (INT), `weight_kg` (NUMERIC), `available_ap` (INT), `str` (INT), `agi` (INT), `vit` (INT), `luk` (INT), `max_floor` (INT), `daily_rvs` (NUMERIC), `workout_streak` (INT).
2. **`public.user_inventory`**:
   - Columns: `inventory_id` (UUID PK), `user_id` (UUID), `item_id` (TEXT), `is_equipped` (BOOLEAN).
3. **`public.Workout_Sessions`**:
   - Columns: `session_id` (TEXT PK), `user_id` (UUID), `date` (TEXT), `duration_minutes` (INT), `total_rvs` (NUMERIC), `total_volume_kg` (NUMERIC), `exercises_log` (JSONB).
4. **`public.Party` & `public.Party_Members`**:
   - Multiplayer party guilds & party floor progress.
5. **`public.friends`**:
   - Friend relationships (`user_id`, `friend_id`, `status`: 'pending' | 'accepted').

### Executed Database Migrations
- `01_party_tables.sql`: Initial party tables schema.
- `02_clean_and_reset_db.sql`: Database cleanup.
- `03_drop_legacy_tables_and_pristine_db.sql`: Dropped legacy duplicate tables (`Users`, `user_stats`).
- `04_drop_all_lowercase_legacy_tables.sql`: Dropped duplicate lowercase legacy tables.
- `05_fix_missing_tables_and_columns.sql`: Added `available_ap`, `gender`, `user_inventory`.
- `06_fix_trigger_and_profiles_upsert.sql`: Enabled RLS `ALL` access policies for profiles and user_inventory.
- `07_drop_handle_new_user_trigger.sql`: Completely dropped the legacy PostgreSQL trigger `handle_new_user` and `on_auth_user_created` function so the `/api/user/onboarding` route controls 100% of initial profile creation.

---

## 3. CORE GAME MECHANICS & MATHEMATICAL FORMULAS

### RVS (Repetition Volume Score) & Stat Scaling
- File Location: `src/lib/rvsEngine.ts` & `src/lib/exercisesData.ts`
- **Formula**:
  - Heavy Weightlifting & Compound Lifts (Bench Press, Squats, Deadlifts, Overheads) scale with `STR`:
    `Stat Multiplier = heroStats.str / 50`
  - Calisthenics (Bodyweight) & Cardio Exercises (Push-ups, Pull-ups, Running) scale with `AGI`:
    `Stat Multiplier = heroStats.agi / 50`
  - Exercise RVS = `Base RVS * Stat Multiplier`
- Visual Badges rendered in `src/components/WorkoutTrackerForm.tsx`:
  - `🏋️ STR SCALING (STR/50)`
  - `🏃 AGI SCALING (AGI/50)`

### Character Classes & Archetypes
- **VANGUARD POWERLIFTER** (`WARRIOR`): High STR & VIT, specializes in heavy compound lifts.
- **BALANCED HERO** (`HERO`): High AGI & LUK, balanced all-around hero.
- **ARCANE ATHLETE** (`MAGE`): High AGI & STR, specializes in cardio and calisthenics.
- Gender Selector: `♂️ Male` or `♀️ Female` controlling animated sprite rendering in `<HeroSprite>`.

---

## 4. AUTHENTICATION & PROFILE FLOW

1. **Registration (`src/app/register/page.tsx`)**:
   - Calls `supabase.auth.signUp({ email, password, options: { data: { username } } })`.
   - If session is missing after sign-up, calls `supabase.auth.signInWithPassword()` to ensure auth cookies are set before proceeding.
2. **Onboarding (`src/app/onboarding/page.tsx`)**:
   - Collects `gender`, `character_class`, `weight_kg`, `username`, `user_id`.
   - Sends `POST /api/user/onboarding`.
3. **API Onboarding (`src/app/api/user/onboarding/route.ts`)**:
   - Upserts profile to `public.profiles`: `gold: 500`, `level: 1`, `current_hp: 1000`, `max_hp: 1000`, `exp: 0`, `max_exp: 1000`.
   - Inserts 3 valid starter equipment items into `public.user_inventory`:
     - Weapon: `e1010001-0000-0000-0000-000000000001` (Rusty Iron Broadsword)
     - Armor: `e1010002-0000-0000-0000-000000000002` (Novice Defender Shield)
     - Accessory: `e1010003-0000-0000-0000-000000000003` (Emerald Vitality Ring)
4. **Profile API (`src/app/api/user/profile/route.ts`)**:
   - Queries `profiles` using `.or("id.eq." + userId + ",user_id.eq." + userId)`. Returns real profile values.

---

## 5. INVENTORY & GACHA SHOP

- **Equipment Dictionary (`src/lib/equipment.ts`)**:
  - Contains full list of equipment items with UUIDs (`item_id`), stat bonuses (`bonus_str`, `bonus_agi`, `bonus_vit`, `bonus_hp`), and sprite image paths.
- **Equip API (`src/app/api/inventory/equip/route.ts`)**:
  - Updates `is_equipped` in `user_inventory` table. Un-equips existing items of the same type when a new item is equipped.
- **Gacha Shop (`src/app/api/shop/gacha/route.ts` & `src/components/BlacksmithShop.tsx`)**:
  - Chest Types: Bronze (500 gold), Silver (2500 gold), Void (10000 gold).
  - Deducts gold from `profiles` table and inserts newly drawn item into `user_inventory`.

---

## 6. MULTIPLAYER & HUB LEADERBOARD

- **Leaderboard API (`src/app/api/multiplayer/leaderboard/route.ts`)**:
  - Fetches top solo warriors and top guild parties directly from DB `profiles` and `Party` tables.
- **Friends API (`src/app/api/multiplayer/friends/route.ts`)**:
  - Handles searching users, sending friend requests, and listing accepted friends per authenticated user.

---

## 7. MAINTENANCE SCRIPTS

- **Database Table Reset**:
  - Run `node scripts/reset_db_tables.js` to wipe all rows clean across all production tables for clean testing.
- **Database Schema Push**:
  - Run `npx supabase db push --include-all` to push pending migrations in `supabase/migrations/` to the remote Supabase project.

---

## 8. KEY FILE SUMMARY & PATH DIRECTORY

- **`src/app/register/page.tsx`**: Registration page with auth session handshake.
- **`src/app/onboarding/page.tsx`**: Onboarding character creation with class radar chart & sprite preview.
- **`src/app/api/user/onboarding/route.ts`**: API route for completing onboarding & starter gear initialization.
- **`src/app/api/user/profile/route.ts`**: Profile GET API route.
- **`src/app/api/user/inventory/route.ts`**: User inventory GET API route.
- **`src/app/api/inventory/equip/route.ts`**: Equipment toggle POST API route.
- **`src/app/api/shop/gacha/route.ts`**: Gacha chest pull POST API route.
- **`src/components/DashboardLayout.tsx`**: Main game hub layout, status bar, and tab navigation.
- **`src/components/WorkoutTrackerForm.tsx`**: Real-time workout tracking form with STR/AGI RVS scaling badges.
- **`src/lib/equipment.ts`**: Equipment dictionary and item metadata.
- **`src/lib/rvsEngine.ts`**: Server-side RVS calculation engine.
- **`scripts/reset_db_tables.js`**: Database wipe script.

---
*Memory Dump Complete. Ready for next AI session.*
