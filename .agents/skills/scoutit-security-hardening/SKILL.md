---
name: scoutit-security-hardening
description: Apply server-side JWT session validation, secure Supabase RLS (Row Level Security) policies, prevent identity spoofing, and implement defensive secure coding controls for ScoutIt.
---

# ScoutIt Security Hardening Skill

Use this skill when auditing, modifying, or implementing features on the ScoutIt website to ensure the backend and database layer are fully secured and resistant to access control and injection attacks.

---

## 🎯 When to Activate
Activate this skill whenever the user requests:
*   "Harden API routes" or "secure backend endpoints"
*   "Configure RLS policies" or "fix database permissions"
*   "Implement authentication/session guards"
*   "Prevent identity spoofing" or "BOLA vulnerabilities"

---

## 🔒 Core Defensive Standards

### 1. Server-Side Session Validation (BOLA Prevention)
Never trust `userId` or `role` parameters supplied in the request body. Always extract the user session JWT from the request headers and verify it server-side.

#### Secure API Route Template (Next.js App Router):
```javascript
import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export async function POST(request) {
  try {
    // 1. Get token from authorization header
    const authHeader = request.headers.get("Authorization");
    const token = authHeader?.replace("Bearer ", "");
    
    if (!token) {
      return NextResponse.json({ error: "Unauthorized: Missing token" }, { status: 401 });
    }

    // 2. Initialize temporary client to verify the user JWT
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    const client = createClient(supabaseUrl, supabaseAnonKey);
    
    const { data: { user }, error: authError } = await client.auth.getUser(token);
    
    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized: Invalid session" }, { status: 401 });
    }

    // 3. Trustworthy user identity
    const verifiedUserId = user.id;
    
    // Proceed with business logic using verifiedUserId...
  } catch (err) {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
```

---

### 2. Secure Server-Side Database Access (`supabaseAdmin.js`)
Privileged database operations (like updating user roles, adjusting wallets/connects, or bypassing standard user limits) must run server-side using a client configured with the private `SUPABASE_SERVICE_ROLE_KEY`.

#### Create `src/lib/supabaseAdmin.js`:
```javascript
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

// Export server-only admin client
export const supabaseAdmin = 
  supabaseUrl && supabaseServiceKey
    ? createClient(supabaseUrl, supabaseServiceKey, {
        auth: {
          persistSession: false,
          autoRefreshToken: false
        }
      })
    : null;
```

---

### 3. Database Row Level Security (RLS) Hardening
Every table in the Supabase public schema must have RLS enabled and specific access control policies defined.

#### Standard Schema Hardening Commands:
```sql
-- 1. Enable RLS
ALTER TABLE properties ENABLE ROW LEVEL SECURITY;
ALTER TABLE deals ENABLE ROW LEVEL SECURITY;
ALTER TABLE saved_intel ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;

-- 2. Define Optimized Policy (Wrap auth.uid() in sub-select)
CREATE POLICY "Users can only read/write their own properties"
ON properties
FOR ALL
USING ((SELECT auth.uid())::text = owner_id);

-- 3. Create Indexes on Policy Columns (Critical for query performance)
CREATE INDEX IF NOT EXISTS idx_properties_owner_id ON properties(owner_id);
```

---

## 📋 Security Verification Checklist

When reviewing code changes, verify:
*   [ ] No API route extracts user identity from the request JSON body (`userId`).
*   [ ] Database connections for client-facing code use the public `anon` key, while secure admin API routes use `supabaseAdmin` with the private `service_role` key.
*   [ ] All environment variables that are sensitive (like `SUPABASE_SERVICE_ROLE_KEY` or `AIRTABLE_API_KEY`) do **NOT** have the `NEXT_PUBLIC_` prefix to prevent them from leaking to the frontend bundle.
*   [ ] All query parameters are parameterized (no string concatenation of user input inside SQL statements).
