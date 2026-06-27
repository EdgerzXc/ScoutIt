-- ==============================================================================
-- SCOUTIT SECURITY HARDENING
-- Database Audit Logging Implementation
-- ==============================================================================

-- 1. Create the Audit Logs Table
CREATE TABLE IF NOT EXISTS audit_logs (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    table_name text NOT NULL,
    record_id text NOT NULL,
    action text NOT NULL CHECK (action IN ('INSERT', 'UPDATE', 'DELETE')),
    old_data jsonb,
    new_data jsonb,
    changed_by_user_id uuid,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);

-- 2. Lock Down the Audit Logs with RLS
-- This ensures that no one (not even an authenticated user) can mutate or delete the logs.
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "No one can read audit logs except Service Role" ON audit_logs;
CREATE POLICY "No one can read audit logs except Service Role" ON audit_logs
    FOR SELECT USING (false);

DROP POLICY IF EXISTS "No one can mutate audit logs" ON audit_logs;
CREATE POLICY "No one can mutate audit logs" ON audit_logs
    FOR ALL USING (false);


-- 3. Create the Generic Audit Trigger Function
-- This function captures the BEFORE and AFTER states of any row it is attached to.
CREATE OR REPLACE FUNCTION audit_record_changes()
RETURNS trigger AS $$
DECLARE
    changed_by uuid;
BEGIN
    -- Extract the user ID from the Supabase auth context (if available)
    changed_by := auth.uid();

    IF (TG_OP = 'DELETE') THEN
        INSERT INTO audit_logs (table_name, record_id, action, old_data, changed_by_user_id)
        VALUES (TG_TABLE_NAME::text, OLD.id::text, TG_OP, row_to_json(OLD)::jsonb, changed_by);
        RETURN OLD;
    ELSIF (TG_OP = 'UPDATE') THEN
        INSERT INTO audit_logs (table_name, record_id, action, old_data, new_data, changed_by_user_id)
        VALUES (TG_TABLE_NAME::text, NEW.id::text, TG_OP, row_to_json(OLD)::jsonb, row_to_json(NEW)::jsonb, changed_by);
        RETURN NEW;
    ELSIF (TG_OP = 'INSERT') THEN
        INSERT INTO audit_logs (table_name, record_id, action, new_data, changed_by_user_id)
        VALUES (TG_TABLE_NAME::text, NEW.id::text, TG_OP, row_to_json(NEW)::jsonb, changed_by);
        RETURN NEW;
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


-- 4. Attach Triggers to Critical Tables

-- A) properties table
DROP TRIGGER IF EXISTS audit_properties_changes ON properties;
CREATE TRIGGER audit_properties_changes
    AFTER INSERT OR UPDATE OR DELETE ON properties
    FOR EACH ROW EXECUTE FUNCTION audit_record_changes();

-- B) deals table
DROP TRIGGER IF EXISTS audit_deals_changes ON deals;
CREATE TRIGGER audit_deals_changes
    AFTER INSERT OR UPDATE OR DELETE ON deals
    FOR EACH ROW EXECUTE FUNCTION audit_record_changes();

-- C) user_profiles table
DROP TRIGGER IF EXISTS audit_profiles_changes ON user_profiles;
CREATE TRIGGER audit_profiles_changes
    AFTER INSERT OR UPDATE OR DELETE ON user_profiles
    FOR EACH ROW EXECUTE FUNCTION audit_record_changes();

-- D) connect_balances table
DROP TRIGGER IF EXISTS audit_balances_changes ON connect_balances;
CREATE TRIGGER audit_balances_changes
    AFTER INSERT OR UPDATE OR DELETE ON connect_balances
    FOR EACH ROW EXECUTE FUNCTION audit_record_changes();
