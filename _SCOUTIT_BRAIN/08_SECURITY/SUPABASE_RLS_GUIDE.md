# Supabase Row Level Security (RLS) Guide

This guide details best practices for configuring Row Level Security (RLS) policies in Supabase and PostgreSQL for the ScoutIt platform.

---

## 1. Fundamentals of RLS

PostgreSQL Row Level Security (RLS) acts as a firewall directly on the database tables. When enabled, all queries are intercepted and filtered according to specific rules, even if executed via the client-side API client.

### Enable RLS on Every Table
By default, newly created tables in Supabase permit anyone with the `anon` API key to read and write rows. RLS must be explicitly enabled for every single table.

```sql
-- Enable RLS
ALTER TABLE properties ENABLE ROW LEVEL SECURITY;
ALTER TABLE deals ENABLE ROW LEVEL SECURITY;
ALTER TABLE saved_intel ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
```

### The Default-Deny Policy
Once RLS is enabled on a table, PostgreSQL blocks all client access (`SELECT`, `INSERT`, `UPDATE`, `DELETE`) until specific access policies are defined.

---

## 2. Best Practices for Policy Construction

### A. Trustworthy User Identity via `auth.uid()`
When writing policies based on user identity, do not trust parameters supplied in the query client body. Use Supabase's native session function `auth.uid()`, which extracts and verifies the user ID directly from the authenticated JWT (JSON Web Token) payload.

```sql
-- Allow users to read and update only their own profile
CREATE POLICY "Users can edit their own profiles"
ON user_profiles
FOR ALL
USING (auth.uid()::text = id);
```

### B. Performance Optimization: Wrap `auth.uid()` in Sub-selects
In PostgreSQL, calling functions inside policies can cause performance degradation because the function is evaluated for each row. Wrapping the call in a sub-query (`(SELECT auth.uid())`) allows PostgreSQL to run the function once and cache the result for index evaluation.

```sql
-- OPTIMIZED POLICY:
CREATE POLICY "Users can manage their own saved properties"
ON saved_intel
FOR ALL
USING ((SELECT auth.uid())::text = user_id);
```

### C. Index Columns Used in Policies
Any column referenced in a policy's `USING` or `WITH CHECK` clauses (such as `user_id`, `owner_id`, or `tenant_id`) **must have a database index**. Without indexes, database queries will fallback to full table scans, causing API requests to hang or timeout.

```sql
-- Create indexes for RLS columns
CREATE INDEX IF NOT EXISTS idx_properties_owner_id ON properties(owner_id);
CREATE INDEX IF NOT EXISTS idx_saved_intel_user_id ON saved_intel(user_id);
CREATE INDEX IF NOT EXISTS idx_deals_broker_id ON deals(broker_id);
```

### D. Keep Policies Simple
Avoid doing complex `JOIN` operations inside RLS policies. RLS is executed for every row affected by a query, so a complex JOIN inside a policy can turn a simple read operation into a slow, resource-heavy transaction.

---

## 3. Client vs. Server Key Usage

*   **`anon` Key (Client-Side):** The public key used in browsers and mobile clients. Always Subject to RLS restrictions.
*   **`service_role` Key (Server-Side):** The administrative key. It **bypasses all RLS policies**.
    *   **Rule:** Keep `service_role` key strictly in server-side environment variables. Never expose it to the browser.
    *   **Usage:** Use the `service_role` key in API routes and Edge Functions for system actions (like transaction processing, ledger balancing, or admin updates).
