# OWASP Cheat Sheet Series Summaries

This document compiles the key recommendations and implementations from the OWASP Cheat Sheets for **Authentication**, **Session Management**, and **SQL Injection Prevention** for application development in ScoutIt.

---

## 1. Authentication Security Cheat Sheet

### Password Handling
*   **Length & Strength:** Enforce a minimum length of 8 characters. Do not set a maximum limit (or allow at least 64+ characters) to permit passphrases.
*   **Hashing on Server:** Always hash passwords before storing them. Use **bcrypt** (cost >= 10), **Argon2id**, or **PBKDF2** with a strong salt. Never use MD5, SHA-1, or plain SHA-256 for password storage.
*   **Credential Stuffing Protection:** Rate limit authentication attempts based on both the client IP address and the username.

### Login Flow Rules
*   **Generic Error Messages:** Always return generic error messages for authentication failures (e.g., "Invalid username or password") to prevent username enumeration.
*   **MFA (Multi-Factor Authentication):** Implement MFA for privileged roles (such as Admins and System Operators).

---

## 2. Session Management Security Cheat Sheet

### Session ID Generation & Lifecycle
*   **Cryptographic Randomness:** Session IDs must be generated using a cryptographically secure random number generator (CSPRNG) with at least 128 bits of entropy.
*   **Session Termination:** 
    *   Destroy session tokens on the server immediately upon user logout.
    *   Set absolute session timeouts (e.g., 24 hours) and idle timeouts (e.g., 30 minutes).

### Secure Cookie Attributes
When storing session identifiers in cookies, enforce the following attributes:
*   **`HttpOnly`:** Prevents client-side scripts (JavaScript) from reading the cookie, mitigating XSS-based session hijacking.
*   **`Secure`:** Ensures the cookie is only transmitted over encrypted (HTTPS) connections.
*   **`SameSite=Lax` or `SameSite=Strict`:** Mitigates Cross-Site Request Forgery (CSRF) attacks by restricting cookie transmission in third-party contexts.

---

## 3. SQL Injection (SQLi) Prevention Cheat Sheet

### Primary Defense: Query Parameterization
*   **Rule:** Always use parameterized queries (Prepared Statements) for all SQL executions. This separates user-supplied inputs from the SQL command syntax.
*   **Example (Node.js/Pg):**
    ```javascript
    // SECURE: Parameterized Query
    const query = 'SELECT * FROM users WHERE id = $1';
    const values = [userId];
    const res = await client.query(query, values);
    ```
*   **Example (Object-Relational Mapping):** When using ORMs like Prisma, Sequelize, or Supabase JS client libraries, query inputs are parameterized automatically behind the scenes.

### Secondary Defenses
*   **Input Validation (White-listing):** Ensure that input parameters conform to expected formats (e.g., UUID format, integer format, alphanumeric) before processing them in any query.
*   **Principle of Least Privilege:** Configure database users with the minimum permissions required (e.g., web clients should not have schema modification permissions or superuser status).
