-- ============================================
-- NutriTrack Database Schema
-- Run this in Supabase SQL Editor (one time)
-- ============================================

-- 1. PROFILES (user targets & settings)
CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  calorie_target INTEGER NOT NULL DEFAULT 2000,
  protein_target INTEGER NOT NULL DEFAULT 120,
  maintenance_kcal INTEGER NOT NULL DEFAULT 2000,
  user_name TEXT NOT NULL DEFAULT '',
  weight_loss_target REAL NOT NULL DEFAULT 5,
  onboarding_complete BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 2. ENTRIES (food logs)
CREATE TABLE entries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  kcal REAL NOT NULL DEFAULT 0,
  protein REAL NOT NULL DEFAULT 0,
  meal TEXT NOT NULL DEFAULT 'Snack',
  serving_size REAL,
  serving_unit TEXT DEFAULT 'g',
  date_key TEXT NOT NULL,
  timestamp TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 3. ENTRY INGREDIENTS (ingredients per food entry)
CREATE TABLE entry_ingredients (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  entry_id UUID NOT NULL REFERENCES entries(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  grams REAL NOT NULL DEFAULT 0,
  kcal REAL NOT NULL DEFAULT 0,
  protein REAL NOT NULL DEFAULT 0
);

-- 4. EXERCISE LOGS
CREATE TABLE exercise_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  calories_burned REAL NOT NULL DEFAULT 0,
  duration REAL,
  date_key TEXT NOT NULL,
  timestamp TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 5. WATER LOGS
CREATE TABLE water_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  amount_ml REAL NOT NULL DEFAULT 250,
  date_key TEXT NOT NULL,
  timestamp TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 6. CUSTOM MEALS (saved meal templates)
CREATE TABLE custom_meals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  ingredients JSONB NOT NULL DEFAULT '[]',
  total_kcal REAL NOT NULL DEFAULT 0,
  total_protein REAL NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 7. RECIPES
CREATE TABLE recipes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  ingredients JSONB NOT NULL DEFAULT '[]',
  total_kcal REAL NOT NULL DEFAULT 0,
  total_protein REAL NOT NULL DEFAULT 0,
  servings INTEGER NOT NULL DEFAULT 1,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 8. LEFTOVERS
CREATE TABLE leftovers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  kcal REAL NOT NULL DEFAULT 0,
  protein REAL NOT NULL DEFAULT 0,
  servings_left REAL NOT NULL DEFAULT 1,
  date_key TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ============================================
-- INDEXES (for fast queries by user + date)
-- ============================================

CREATE INDEX idx_entries_user_date ON entries(user_id, date_key);
CREATE INDEX idx_exercise_user_date ON exercise_logs(user_id, date_key);
CREATE INDEX idx_water_user_date ON water_logs(user_id, date_key);
CREATE INDEX idx_custom_meals_user ON custom_meals(user_id);
CREATE INDEX idx_recipes_user ON recipes(user_id);
CREATE INDEX idx_leftovers_user ON leftovers(user_id);

-- ============================================
-- ROW LEVEL SECURITY (users can only access their own data)
-- ============================================

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE entry_ingredients ENABLE ROW LEVEL SECURITY;
ALTER TABLE exercise_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE water_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE custom_meals ENABLE ROW LEVEL SECURITY;
ALTER TABLE recipes ENABLE ROW LEVEL SECURITY;
ALTER TABLE leftovers ENABLE ROW LEVEL SECURITY;

-- Profiles: users can read/update their own profile
CREATE POLICY "Users can view own profile"
  ON profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Users can insert own profile"
  ON profiles FOR INSERT WITH CHECK (auth.uid() = id);

-- Entries: full CRUD on own data
CREATE POLICY "Users can CRUD own entries"
  ON entries FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- Entry ingredients: accessible if the parent entry belongs to the user
CREATE POLICY "Users can CRUD own entry ingredients"
  ON entry_ingredients FOR ALL
  USING (EXISTS (SELECT 1 FROM entries WHERE entries.id = entry_ingredients.entry_id AND entries.user_id = auth.uid()))
  WITH CHECK (EXISTS (SELECT 1 FROM entries WHERE entries.id = entry_ingredients.entry_id AND entries.user_id = auth.uid()));

-- Exercise logs
CREATE POLICY "Users can CRUD own exercise logs"
  ON exercise_logs FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- Water logs
CREATE POLICY "Users can CRUD own water logs"
  ON water_logs FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- Custom meals
CREATE POLICY "Users can CRUD own custom meals"
  ON custom_meals FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- Recipes
CREATE POLICY "Users can CRUD own recipes"
  ON recipes FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- Leftovers
CREATE POLICY "Users can CRUD own leftovers"
  ON leftovers FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- ============================================
-- AUTO-CREATE PROFILE ON SIGNUP
-- ============================================

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id)
  VALUES (NEW.id);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
