---
section: "02_ARCHITECTURE_AND_STRUCTURE"
status: active
title: "Staff MFA Recovery & Break-Glass Runbook"
created: 2026-10-26
owner: "Security / Operations"
related: ["[[STRUCTURE]]", "[[MISSION_CONTROL_SOP]]", "[[00_MASTER_ACTION_PLAN]]"]
---

# Staff MFA Recovery & Break-Glass Runbook (A-263)

## 1. Overview & Policy Standard
Mission Control enforces Authenticator Assurance Level 2 (AAL2) via Time-based One-Time Password (TOTP) for all **Tier 2 (Ops Manager)** and **Tier 3 (Super Admin)** staff.

- **Agent (Tier 1):** Single-factor magic link acceptable for read-oriented workflows; TOTP optional.
- **Ops Manager (Tier 2) & Super Admin (Tier 3):** AAL2 strictly enforced on console load and all mutating Server Actions.

If a staff member loses their authenticator device, experiences TOTP token drift, or is locked out, follow this SOP strictly.

---

## 2. Identity Verification Gate (Mandatory)
Before resetting any TOTP factor or modifying `admin_users` or Supabase auth factors:
1. **Secondary Channel Verification:** The requesting staff member must join an out-of-band video or voice verification with a designated Super Admin or the Platform Owner.
2. **Employee Attestation:** Verify their corporate identity, staff ID, and reason for reset.
3. **Audit Pre-Log:** Log the incoming request in the incident tracking system with ticket reference, timestamp, and operator identity.

---

## 3. Recovery Procedures

### Scenario A: Staff Member Has Active Backup Factor
If the staff member previously saved recovery codes or has a secondary enrolled authenticator:
1. Direct the staff member to `/dashboard/mfa`.
2. Select "Enter Recovery Code" or alternate TOTP device.
3. Once authenticated at AAL2, navigate to IAM profile to unenroll the lost factor and enroll the new device.

---

### Scenario B: Administrator Reset via Supabase Admin API
A Tier 3 Super Admin or Platform Owner can delete the lost TOTP factor using the Supabase Service Role client:

```javascript
// Run via secure administrative script with service-role credentials
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

// 1. List user factors
const { data: factors, error: listErr } = await supabase.auth.admin.mfa.listFactors({
  userId: "<STAFF_USER_UUID>",
});

// 2. Delete the lost TOTP factor
for (const factor of factors.factors) {
  if (factor.factor_type === "totp") {
    await supabase.auth.admin.mfa.deleteFactor({
      userId: "<STAFF_USER_UUID>",
      id: factor.id,
    });
  }
}
```

---

### Scenario C: Direct SQL Break-Glass (Emergency Only)
If the Supabase Auth Admin API is unreachable and an emergency fix is required under owner authorization:

```sql
-- 1. Identify factor ID in auth.mfa_factors
SELECT id, user_id, friendly_name, factor_type, status, created_at
FROM auth.mfa_factors
WHERE user_id = '<STAFF_USER_UUID>' AND factor_type = 'totp';

-- 2. Delete factor (requires postgres/service-role access)
DELETE FROM auth.mfa_factors
WHERE user_id = '<STAFF_USER_UUID>' AND factor_type = 'totp';

-- 3. Invalidate active sessions to force fresh sign-in and re-enrollment
DELETE FROM auth.refresh_tokens WHERE user_id = '<STAFF_USER_UUID>';
```

---

## 4. Re-Enrollment Protocol
Once the lost factor has been removed:
1. The staff member logs in via their standard magic link.
2. Because their role is Tier 2+ and they lack an enrolled AAL2 factor, Mission Control's `getCurrentStaff()` and `DashboardLayout` automatically route them directly to `/dashboard/mfa`.
3. The staff member scans the newly generated QR code into their authenticator app (1Password, Google Authenticator, or Apple Passwords).
4. They enter the 6-digit TOTP code to verify enrollment.
5. The session immediately steps up to AAL2, unlocking full Mission Control capabilities.

---

## 5. Post-Recovery Audit Logging
Within 15 minutes of completion, the executing Super Admin must record the action in the `mission_control_actions` table:
- **Action:** `STAFF_MFA_FACTOR_RESET`
- **Target Table:** `auth.mfa_factors`
- **Target ID:** Staff User UUID
- **Reason:** Reason verified during step 2
- **Metadata:** `{ "verifier_id": "<SUPER_ADMIN_UUID>", "method": "API|SQL", "ticket": "<TICKET_ID>" }`
