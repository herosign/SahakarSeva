-- ============================================================
-- Sahakar Seva: Safe, Idempotent PostgreSQL Schema
-- MLH 2026 Cooperative Labour Platform
-- Safe to run in Supabase SQL Editor even if tables already exist!
-- ============================================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. Federations
CREATE TABLE IF NOT EXISTS federations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  region TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 2. Societies
CREATE TABLE IF NOT EXISTS societies (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  federation_id UUID REFERENCES federations(id) ON DELETE SET NULL,
  name TEXT NOT NULL,
  registration_no TEXT UNIQUE,
  address TEXT,
  lat NUMERIC,
  lng NUMERIC,
  geofence_radius_km NUMERIC DEFAULT 20,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 3. Profiles
CREATE TABLE IF NOT EXISTS profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  role TEXT CHECK (role IN ('customer', 'worker', 'admin')),
  name TEXT,
  phone TEXT,
  email TEXT,
  lang TEXT DEFAULT 'en',
  avatar_url TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 4. Worker Profiles
CREATE TABLE IF NOT EXISTS worker_profiles (
  id UUID PRIMARY KEY REFERENCES profiles(id) ON DELETE CASCADE,
  society_id UUID REFERENCES societies(id) ON DELETE SET NULL,
  trade TEXT,
  iti_cert_url TEXT,
  approved BOOLEAN DEFAULT TRUE,
  lat NUMERIC DEFAULT 28.5855,
  lng NUMERIC DEFAULT 77.3100,
  joined_at TIMESTAMPTZ DEFAULT now(),
  total_jobs INT DEFAULT 0,
  completed_jobs INT DEFAULT 0
);

-- 5. Wage Floors (Anti-Exploitation)
CREATE TABLE IF NOT EXISTS wage_floors (
  trade TEXT PRIMARY KEY,
  min_amount NUMERIC NOT NULL
);

-- 6. Jobs
CREATE TABLE IF NOT EXISTS jobs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  customer_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  trade TEXT NOT NULL,
  offer NUMERIC NOT NULL,
  description TEXT,
  address TEXT,
  lat NUMERIC,
  lng NUMERIC,
  status TEXT DEFAULT 'open' CHECK (status IN ('open', 'assigned', 'in_progress', 'completed', 'paid')),
  assigned_worker_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  accepted_bid_id UUID,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 7. Bids
CREATE TABLE IF NOT EXISTS bids (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  job_id UUID REFERENCES jobs(id) ON DELETE CASCADE,
  worker_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  amount NUMERIC NOT NULL,
  is_counter BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 8. Invoices (0% Commission, 2% Welfare Fund)
CREATE TABLE IF NOT EXISTS invoices (
  job_id UUID PRIMARY KEY REFERENCES jobs(id) ON DELETE CASCADE,
  base_fare NUMERIC NOT NULL,
  discount NUMERIC DEFAULT 0,
  welfare_contribution NUMERIC DEFAULT 0,
  platform_fee NUMERIC DEFAULT 0,
  tip NUMERIC DEFAULT 0,
  total NUMERIC NOT NULL,
  worker_receives NUMERIC NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 9. Ratings
CREATE TABLE IF NOT EXISTS ratings (
  job_id UUID PRIMARY KEY REFERENCES jobs(id) ON DELETE CASCADE,
  worker_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  customer_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  stars INT CHECK (stars BETWEEN 1 AND 5),
  review TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 10. Welfare Accounts
CREATE TABLE IF NOT EXISTS welfare_accounts (
  worker_id UUID PRIMARY KEY REFERENCES profiles(id) ON DELETE CASCADE,
  pf_balance NUMERIC DEFAULT 2340,
  pool_balance NUMERIC DEFAULT 580
);

-- 11. Insurance Policies
CREATE TABLE IF NOT EXISTS insurance_policies (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  worker_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  scheme TEXT,
  policy_no TEXT,
  valid_till DATE
);

-- 12. App Settings
CREATE TABLE IF NOT EXISTS app_settings (
  key TEXT PRIMARY KEY,
  value TEXT
);

-- Seed Data (Safe with ON CONFLICT)
INSERT INTO wage_floors (trade, min_amount) VALUES
  ('Electrician', 350),
  ('Plumber', 300),
  ('Carpenter', 300),
  ('Mason', 320),
  ('AC Repair', 350),
  ('Cleaning', 250)
ON CONFLICT (trade) DO NOTHING;

INSERT INTO app_settings (key, value) VALUES
  ('platform_fee', '0'),
  ('welfare_pct', '2')
ON CONFLICT (key) DO NOTHING;
