-- ============================================
-- NutriTrack Schema Migration #3: Calorie Cycling
-- Run this in Supabase SQL Editor AFTER migration #2
-- ============================================

-- PROFILES: add calorie cycling config fields
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS cycling_enabled BOOLEAN NOT NULL DEFAULT FALSE;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS cycling_training_kcal INTEGER NOT NULL DEFAULT 0;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS cycling_training_protein INTEGER NOT NULL DEFAULT 0;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS cycling_rest_kcal INTEGER NOT NULL DEFAULT 0;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS cycling_rest_protein INTEGER NOT NULL DEFAULT 0;

-- DAY_TYPES: per-user per-day training/rest selection
CREATE TABLE IF NOT EXISTS day_types (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  date_key TEXT NOT NULL,
  day_type TEXT NOT NULL DEFAULT 'rest',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, date_key)
);

CREATE INDEX IF NOT EXISTS idx_day_types_user_date ON day_types(user_id, date_key);

ALTER TABLE day_types ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can CRUD own day types"
  ON day_types FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
