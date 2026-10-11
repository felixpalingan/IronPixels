-- Migration: Add weight_unit preference to profiles table
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS weight_unit TEXT DEFAULT 'kg';
