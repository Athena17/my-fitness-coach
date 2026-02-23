-- ============================================
-- Irada Schema Migration #4: Carbs/Fat + Personal Ingredients
-- Run this in Supabase SQL Editor AFTER migration #3
-- ============================================

-- ENTRIES: add carbs and fat columns
ALTER TABLE entries ADD COLUMN IF NOT EXISTS carbs REAL DEFAULT 0;
ALTER TABLE entries ADD COLUMN IF NOT EXISTS fat REAL DEFAULT 0;

-- PROFILES: add carbs/fat targets and cycling carbs/fat
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS carbs_target REAL DEFAULT 0;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS fat_target REAL DEFAULT 0;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS cycling_training_carbs REAL DEFAULT 0;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS cycling_training_fat REAL DEFAULT 0;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS cycling_rest_carbs REAL DEFAULT 0;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS cycling_rest_fat REAL DEFAULT 0;

-- CUSTOM MEALS: add carbs and fat totals
ALTER TABLE custom_meals ADD COLUMN IF NOT EXISTS total_carbs REAL DEFAULT 0;
ALTER TABLE custom_meals ADD COLUMN IF NOT EXISTS total_fat REAL DEFAULT 0;

-- RECIPES: add carbs and fat totals + per-serving
ALTER TABLE recipes ADD COLUMN IF NOT EXISTS total_carbs REAL DEFAULT 0;
ALTER TABLE recipes ADD COLUMN IF NOT EXISTS total_fat REAL DEFAULT 0;
ALTER TABLE recipes ADD COLUMN IF NOT EXISTS per_serving_carbs REAL DEFAULT 0;
ALTER TABLE recipes ADD COLUMN IF NOT EXISTS per_serving_fat REAL DEFAULT 0;

-- LEFTOVERS: add per-serving carbs and fat
ALTER TABLE leftovers ADD COLUMN IF NOT EXISTS per_serving_carbs REAL DEFAULT 0;
ALTER TABLE leftovers ADD COLUMN IF NOT EXISTS per_serving_fat REAL DEFAULT 0;

-- PERSONAL INGREDIENTS: new table
CREATE TABLE IF NOT EXISTS personal_ingredients (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  ref_amount REAL DEFAULT 0,
  ref_unit TEXT DEFAULT 'g',
  ref_kcal REAL DEFAULT 0,
  ref_protein REAL DEFAULT 0,
  ref_carbs REAL DEFAULT 0,
  ref_fat REAL DEFAULT 0,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_personal_ingredients_user ON personal_ingredients(user_id);

ALTER TABLE personal_ingredients ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can CRUD own personal ingredients"
  ON personal_ingredients FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
