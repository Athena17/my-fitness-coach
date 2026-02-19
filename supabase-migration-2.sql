-- ============================================
-- NutriTrack Schema Migration #2
-- Run this in Supabase SQL Editor AFTER migration #1
-- ============================================

-- PROFILES: add user physical/preference data
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS age INTEGER;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS sex TEXT DEFAULT 'male';
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS height REAL;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS weight REAL;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS activity_level TEXT DEFAULT 'moderate';
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS goal TEXT DEFAULT 'lose';
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS intensity TEXT DEFAULT 'moderate';
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS water_target_liters REAL DEFAULT 2.5;

-- ENTRIES: store ingredients inline as JSONB + link to leftovers/recipes
ALTER TABLE entries ADD COLUMN IF NOT EXISTS ingredients JSONB;
ALTER TABLE entries ADD COLUMN IF NOT EXISTS from_leftover_id UUID;
ALTER TABLE entries ADD COLUMN IF NOT EXISTS recipe_id UUID;

-- EXERCISE_LOGS: add detailed fields
ALTER TABLE exercise_logs ADD COLUMN IF NOT EXISTS type TEXT;
ALTER TABLE exercise_logs ADD COLUMN IF NOT EXISTS label TEXT;
ALTER TABLE exercise_logs ADD COLUMN IF NOT EXISTS intensity TEXT;
ALTER TABLE exercise_logs ADD COLUMN IF NOT EXISTS weight_used REAL;
ALTER TABLE exercise_logs ADD COLUMN IF NOT EXISTS duration_minutes REAL;

-- LEFTOVERS: add per-serving and batch fields
ALTER TABLE leftovers ADD COLUMN IF NOT EXISTS per_serving_kcal REAL DEFAULT 0;
ALTER TABLE leftovers ADD COLUMN IF NOT EXISTS per_serving_protein REAL DEFAULT 0;
ALTER TABLE leftovers ADD COLUMN IF NOT EXISTS remaining_servings REAL DEFAULT 1;
ALTER TABLE leftovers ADD COLUMN IF NOT EXISTS total_servings REAL DEFAULT 1;
ALTER TABLE leftovers ADD COLUMN IF NOT EXISTS date_cooked TEXT;
ALTER TABLE leftovers ADD COLUMN IF NOT EXISTS recipe_id UUID;

-- RECIPES: add per-serving and yield fields
ALTER TABLE recipes ADD COLUMN IF NOT EXISTS servings_yield INTEGER DEFAULT 1;
ALTER TABLE recipes ADD COLUMN IF NOT EXISTS notes TEXT;
ALTER TABLE recipes ADD COLUMN IF NOT EXISTS per_serving_kcal REAL DEFAULT 0;
ALTER TABLE recipes ADD COLUMN IF NOT EXISTS per_serving_protein REAL DEFAULT 0;
