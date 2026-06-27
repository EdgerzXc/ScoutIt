-- ScoutIt Hardened RLS Policies
-- Execute this in the Supabase SQL Editor to replace the `USING (true)` insecure policies.

-- 1. properties table
ALTER TABLE properties ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public can read published properties" ON properties;
CREATE POLICY "Public can read published properties" ON properties
  FOR SELECT USING (pipeline_status = 'approved');

DROP POLICY IF EXISTS "Users can read their own properties" ON properties;
CREATE POLICY "Users can read their own properties" ON properties
  FOR SELECT USING (owner_id = (SELECT auth.uid())::text);

DROP POLICY IF EXISTS "Users can insert their own properties" ON properties;
CREATE POLICY "Users can insert their own properties" ON properties
  FOR INSERT WITH CHECK (owner_id = (SELECT auth.uid())::text);

DROP POLICY IF EXISTS "Users can update their own properties" ON properties;
CREATE POLICY "Users can update their own properties" ON properties
  FOR UPDATE USING (owner_id = (SELECT auth.uid())::text);

DROP POLICY IF EXISTS "Users can delete their own properties" ON properties;
CREATE POLICY "Users can delete their own properties" ON properties
  FOR DELETE USING (owner_id = (SELECT auth.uid())::text);

CREATE INDEX IF NOT EXISTS idx_properties_owner_id ON properties(owner_id);


-- 2. deals table
ALTER TABLE deals ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can read their own deals" ON deals;
CREATE POLICY "Users can read their own deals" ON deals
  FOR SELECT USING (
    broker_id = (SELECT auth.uid())::text OR
    property_id IN (SELECT id FROM properties WHERE owner_id = (SELECT auth.uid())::text)
  );

-- Deals are only created/updated via Service Role (API Routes). We don't want clients inserting deals directly.
DROP POLICY IF EXISTS "Users cannot insert deals directly" ON deals;
CREATE POLICY "Users cannot insert deals directly" ON deals
  FOR INSERT WITH CHECK (false);

CREATE INDEX IF NOT EXISTS idx_deals_broker_id ON deals(broker_id);
CREATE INDEX IF NOT EXISTS idx_deals_property_id ON deals(property_id);


-- 3. saved_intel table
ALTER TABLE saved_intel ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can read their own saved intel" ON saved_intel;
CREATE POLICY "Users can read their own saved intel" ON saved_intel
  FOR SELECT USING (user_id = (SELECT auth.uid())::text);

DROP POLICY IF EXISTS "Users can insert their own saved intel" ON saved_intel;
CREATE POLICY "Users can insert their own saved intel" ON saved_intel
  FOR INSERT WITH CHECK (user_id = (SELECT auth.uid())::text);

DROP POLICY IF EXISTS "Users can delete their own saved intel" ON saved_intel;
CREATE POLICY "Users can delete their own saved intel" ON saved_intel
  FOR DELETE USING (user_id = (SELECT auth.uid())::text);

CREATE INDEX IF NOT EXISTS idx_saved_intel_user_id ON saved_intel(user_id);


-- 4. user_profiles table
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can read their own profile" ON user_profiles;
CREATE POLICY "Users can read their own profile" ON user_profiles
  FOR SELECT USING (id = (SELECT auth.uid())::text);

DROP POLICY IF EXISTS "Users can update their own profile" ON user_profiles;
-- We intentionally drop the UPDATE policy to prevent clients from directly editing
-- their connects_balance or role via the browser console.
-- Profile updates MUST be handled server-side via secure API routes.

CREATE INDEX IF NOT EXISTS idx_user_profiles_id ON user_profiles(id);


-- 5. connect_balances table
ALTER TABLE connect_balances ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can read their own balances" ON connect_balances;
CREATE POLICY "Users can read their own balances" ON connect_balances
  FOR SELECT USING (user_id = (SELECT auth.uid())::text);

-- Balances are only mutated by Service Role.
DROP POLICY IF EXISTS "Users cannot modify balances" ON connect_balances;
CREATE POLICY "Users cannot modify balances" ON connect_balances
  FOR ALL USING (false);

CREATE INDEX IF NOT EXISTS idx_connect_balances_user_id ON connect_balances(user_id);


-- 6. connect_transactions table
ALTER TABLE connect_transactions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can read their own transactions" ON connect_transactions;
CREATE POLICY "Users can read their own transactions" ON connect_transactions
  FOR SELECT USING (user_id = (SELECT auth.uid())::text);

-- Transactions are only inserted by Service Role.
DROP POLICY IF EXISTS "Users cannot insert transactions" ON connect_transactions;
CREATE POLICY "Users cannot insert transactions" ON connect_transactions
  FOR ALL USING (false);

CREATE INDEX IF NOT EXISTS idx_connect_transactions_user_id ON connect_transactions(user_id);

-- 7. projects table
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public can read projects" ON projects;
CREATE POLICY "Public can read projects" ON projects
  FOR SELECT USING (status = 'active' OR status = 'showcase');

DROP POLICY IF EXISTS "Users can read their own projects" ON projects;
CREATE POLICY "Users can read their own projects" ON projects
  FOR SELECT USING (provider_id = (SELECT auth.uid())::text);

DROP POLICY IF EXISTS "Users can insert their own projects" ON projects;
CREATE POLICY "Users can insert their own projects" ON projects
  FOR INSERT WITH CHECK (provider_id = (SELECT auth.uid())::text);

DROP POLICY IF EXISTS "Users can update their own projects" ON projects;
CREATE POLICY "Users can update their own projects" ON projects
  FOR UPDATE USING (provider_id = (SELECT auth.uid())::text);

DROP POLICY IF EXISTS "Users can delete their own projects" ON projects;
CREATE POLICY "Users can delete their own projects" ON projects
  FOR DELETE USING (provider_id = (SELECT auth.uid())::text);

CREATE INDEX IF NOT EXISTS idx_projects_provider_id ON projects(provider_id);

-- 8. waitlist table
ALTER TABLE waitlist ENABLE ROW LEVEL SECURITY;

-- Waitlist is managed by the secure API route via Service Role. Clients cannot access it directly.
DROP POLICY IF EXISTS "Clients cannot access waitlist directly" ON waitlist;
CREATE POLICY "Clients cannot access waitlist directly" ON waitlist
  FOR ALL USING (false);
