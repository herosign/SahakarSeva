-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. federations
CREATE TABLE federations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  region TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 2. societies
CREATE TABLE societies (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  federation_id UUID REFERENCES federations(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  registration_no TEXT UNIQUE NOT NULL,
  address TEXT NOT NULL,
  lat NUMERIC NOT NULL,
  lng NUMERIC NOT NULL,
  geofence_radius_km NUMERIC DEFAULT 20,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 3. profiles
CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  role TEXT CHECK (role IN ('customer', 'worker', 'admin')) NOT NULL,
  name TEXT NOT NULL,
  phone TEXT UNIQUE NOT NULL,
  email TEXT UNIQUE,
  lang TEXT DEFAULT 'en',
  avatar_url TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 4. worker_profiles
CREATE TABLE worker_profiles (
  id UUID PRIMARY KEY REFERENCES profiles(id) ON DELETE CASCADE,
  society_id UUID REFERENCES societies(id) ON DELETE SET NULL,
  trade TEXT NOT NULL,
  iti_cert_url TEXT,
  approved BOOLEAN DEFAULT false,
  lat NUMERIC,
  lng NUMERIC,
  joined_at TIMESTAMPTZ DEFAULT now(),
  total_jobs INT DEFAULT 0,
  completed_jobs INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 5. wage_floors
CREATE TABLE wage_floors (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  trade TEXT UNIQUE NOT NULL,
  min_amount NUMERIC NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 6. jobs
CREATE TABLE jobs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  customer_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  trade TEXT NOT NULL,
  offer NUMERIC NOT NULL,
  description TEXT,
  address TEXT NOT NULL,
  lat NUMERIC NOT NULL,
  lng NUMERIC NOT NULL,
  status TEXT DEFAULT 'open' CHECK (status IN ('open', 'assigned', 'in_progress', 'completed', 'paid')),
  assigned_worker_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  accepted_bid_id UUID,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 7. bids
CREATE TABLE bids (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  job_id UUID REFERENCES jobs(id) ON DELETE CASCADE,
  worker_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  amount NUMERIC NOT NULL,
  is_counter BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE jobs
  ADD CONSTRAINT fk_jobs_bids FOREIGN KEY (accepted_bid_id) REFERENCES bids(id) ON DELETE SET NULL;

-- 8. invoices
CREATE TABLE invoices (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  job_id UUID UNIQUE REFERENCES jobs(id) ON DELETE CASCADE,
  base_fare NUMERIC NOT NULL,
  discount NUMERIC DEFAULT 0,
  welfare_contribution NUMERIC NOT NULL,
  platform_fee NUMERIC DEFAULT 0,
  tip NUMERIC DEFAULT 0,
  total NUMERIC NOT NULL,
  worker_receives NUMERIC NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 9. ratings
CREATE TABLE ratings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  job_id UUID UNIQUE REFERENCES jobs(id) ON DELETE CASCADE,
  worker_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  customer_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  stars INT CHECK (stars BETWEEN 1 AND 5) NOT NULL,
  review TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 10. welfare_accounts
CREATE TABLE welfare_accounts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  worker_id UUID UNIQUE REFERENCES profiles(id) ON DELETE CASCADE,
  pf_balance NUMERIC DEFAULT 0,
  pool_balance NUMERIC DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 11. insurance_policies
CREATE TABLE insurance_policies (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  worker_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  scheme TEXT NOT NULL,
  policy_no TEXT NOT NULL,
  valid_till DATE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 12. grievances
CREATE TABLE grievances (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  subject TEXT NOT NULL,
  body TEXT NOT NULL,
  status TEXT DEFAULT 'open',
  resolved_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 13. sos_alerts
CREATE TABLE sos_alerts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  lat NUMERIC NOT NULL,
  lng NUMERIC NOT NULL,
  resolved BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 14. app_settings
CREATE TABLE app_settings (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL
);

-- 15. demand_history
CREATE TABLE demand_history (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  trade TEXT NOT NULL,
  date DATE NOT NULL,
  demand INT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Trust score view
CREATE VIEW trust_scores AS
SELECT 
  wp.id as worker_id,
  p.name,
  COALESCE(AVG(r.stars), 3.0) as avg_rating,
  CASE WHEN wp.total_jobs > 0 THEN (wp.completed_jobs::numeric / wp.total_jobs * 100) ELSE 100 END as completion_rate,
  LEAST(EXTRACT(EPOCH FROM (now() - wp.joined_at)) / (86400 * 365), 1.0) * 100 as tenure_score,
  ROUND(
    (COALESCE(AVG(r.stars), 3.0) / 5.0 * 100 * 0.6) +
    (CASE WHEN wp.total_jobs > 0 THEN wp.completed_jobs::numeric / wp.total_jobs * 100 ELSE 100 END * 0.3) +
    (LEAST(EXTRACT(EPOCH FROM (now() - wp.joined_at)) / (86400 * 365), 1.0) * 100 * 0.1)
  , 1) as trust_score
FROM worker_profiles wp
JOIN profiles p ON p.id = wp.id
LEFT JOIN ratings r ON r.worker_id = wp.id
GROUP BY wp.id, p.name, wp.total_jobs, wp.completed_jobs, wp.joined_at;

-- Wage floor enforcement function
CREATE OR REPLACE FUNCTION check_wage_floor()
RETURNS TRIGGER AS $$
DECLARE
  floor_amount numeric;
BEGIN
  SELECT min_amount INTO floor_amount FROM wage_floors WHERE trade = (
    SELECT trade FROM jobs WHERE id = COALESCE(NEW.job_id, NEW.id)
  );
  IF floor_amount IS NOT NULL THEN
    -- For jobs table
    IF TG_TABLE_NAME = 'jobs' AND NEW.offer < floor_amount THEN
      RAISE EXCEPTION 'FAIR_WAGE_FLOOR_VIOLATION: Offer Rs% is below minimum Rs% for this trade', NEW.offer, floor_amount;
    END IF;
    -- For bids table  
    IF TG_TABLE_NAME = 'bids' AND NEW.amount < floor_amount THEN
      RAISE EXCEPTION 'FAIR_WAGE_FLOOR_VIOLATION: Bid Rs% is below minimum Rs% for this trade', NEW.amount, floor_amount;
    END IF;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER enforce_job_wage_floor BEFORE INSERT OR UPDATE ON jobs FOR EACH ROW EXECUTE FUNCTION check_wage_floor();
CREATE TRIGGER enforce_bid_wage_floor BEFORE INSERT OR UPDATE ON bids FOR EACH ROW EXECUTE FUNCTION check_wage_floor();

-- RLS policies
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE worker_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE bids ENABLE ROW LEVEL SECURITY;
ALTER TABLE app_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE wage_floors ENABLE ROW LEVEL SECURITY;

-- Profiles: Users can read and update their own profile. Anyone can view basic profiles.
CREATE POLICY "Public profiles are viewable by everyone" ON profiles FOR SELECT USING (true);
CREATE POLICY "Users can update own profile" ON profiles FOR UPDATE USING (auth.uid() = id);

-- Worker Profiles: Viewable by everyone. Workers can update their location etc.
CREATE POLICY "Worker profiles are viewable by everyone" ON worker_profiles FOR SELECT USING (true);
CREATE POLICY "Workers can update own worker profile" ON worker_profiles FOR UPDATE USING (auth.uid() = id);

-- Jobs: 
-- Customers can see their own jobs.
-- Workers can see all open jobs and jobs assigned to them.
CREATE POLICY "Customers can view own jobs" ON jobs FOR SELECT USING (auth.uid() = customer_id);
CREATE POLICY "Workers can view open and assigned jobs" ON jobs FOR SELECT USING (
  status = 'open' OR assigned_worker_id = auth.uid() OR auth.uid() IN (SELECT id FROM profiles WHERE role='admin')
);
CREATE POLICY "Customers can create jobs" ON jobs FOR INSERT WITH CHECK (auth.uid() = customer_id);
CREATE POLICY "Customers can update their own open jobs" ON jobs FOR UPDATE USING (auth.uid() = customer_id);

-- Bids:
-- Workers can see and place bids.
-- Customers can see bids on their jobs.
CREATE POLICY "Workers can view and insert own bids" ON bids FOR ALL USING (auth.uid() = worker_id);
CREATE POLICY "Customers can view bids on their jobs" ON bids FOR SELECT USING (
  EXISTS (SELECT 1 FROM jobs WHERE jobs.id = bids.job_id AND jobs.customer_id = auth.uid())
);

-- Admin policies for settings and floors
CREATE POLICY "Admins can manage settings" ON app_settings FOR ALL USING (
  EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND role = 'admin')
);
CREATE POLICY "Anyone can view settings" ON app_settings FOR SELECT USING (true);

CREATE POLICY "Admins can manage wage floors" ON wage_floors FOR ALL USING (
  EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND role = 'admin')
);
CREATE POLICY "Anyone can view wage floors" ON wage_floors FOR SELECT USING (true);

-- Seed data
INSERT INTO federations (name, region) VALUES ('National Cooperative Labour Federation', 'All India');
INSERT INTO societies (federation_id, name, registration_no, address, lat, lng) VALUES
  ((SELECT id FROM federations LIMIT 1), 'Jan Seva Society #12', 'SOC-2024-0012', 'Sector 15, Noida', 28.5855, 77.3100),
  ((SELECT id FROM federations LIMIT 1), 'Shramik Sahayog Society #7', 'SOC-2024-0007', 'Lajpat Nagar, Delhi', 28.5700, 77.2400),
  ((SELECT id FROM federations LIMIT 1), 'Kisan Mazdoor Society #3', 'SOC-2024-0003', 'Dwarka, Delhi', 28.5921, 77.0460);

INSERT INTO wage_floors (trade, min_amount) VALUES
  ('Electrician', 350), ('Plumber', 300), ('Carpenter', 300),
  ('Mason', 320), ('AC Repair', 350), ('Cleaning', 250);

INSERT INTO app_settings (key, value) VALUES ('platform_fee', '0'), ('welfare_pct', '2');
