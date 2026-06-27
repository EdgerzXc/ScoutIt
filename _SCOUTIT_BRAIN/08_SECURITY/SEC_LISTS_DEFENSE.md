# SecLists Defensive Implementation Guide

This guide explains how to use the concepts from the [SecLists](https://github.com/danielmiessler/SecLists) repository to harden the ScoutIt web application against common list-based attacks, such as brute-forcing, credential stuffing, and directory scanning.

---

## 1. Defending Against Password Guessing (Weak Password Blacklists)

SecLists contains databases of the most common passwords (such as `rockyou.txt` and various "top 10,000 passwords" lists). If a user chooses a password from these lists, their account is highly vulnerable to brute-force attacks.

### Hardening Recommendations
*   **Password Strength Verification:** Rather than checking length alone, integrate a validator like `zxcvbn` to estimate password entropy and block passwords with low scores (e.g., containing dictionary words, common sequences, or user-specific info).
*   **Common Password Blacklist:** Maintain a lightweight blacklist of the top 1,000 most common passwords on the server and check new user passwords against it during signup or password reset.
*   **Account Lockout / Rate Limiting:** Enforce a lockout policy or temporary login delay (e.g., using a progressive delay: 1s, 2s, 4s, etc.) after 5 consecutive failed login attempts on a single account.

---

## 2. Defending Against Directory & Path Discovery

SecLists includes extensive lists of common URL paths, directories, and file names (like `admin`, `api/v1/config`, `.env`, `backup.tar.gz`, `dev.sql`). Automated scanners request these paths to find misconfigured servers or exposed files.

### Hardening Recommendations
*   **Disable Directory Listing:** Ensure your web server configuration (or host provider, such as Vercel) does not permit directory indexing or listing.
*   **Explicit Route Mapping:** Ensure the application returns a generic `404 Not Found` for any request that does not match an active route. Do not return customized 404 pages that leak server details (e.g., Node.js versions or framework names).
*   **Environment File Safeguards:**
    *   **Rule:** Never check `.env.local` or sensitive backup files into source control (ensure they are in `.gitignore`).
    *   **Server Config:** Configure server routes to block access to files starting with `.` (such as `.env`, `.git/`, `.htaccess`).

---

## 3. Defending Against Input Fuzzing (SQLi & XSS Payloads)

SecLists contains lists of special characters and malicious scripts designed to break SQL statements or trigger script execution in browsers.

### Hardening Recommendations
*   **Type-Safe APIs:** Use strict parameter validation. For example, if an API expects a UUID, validate it with a regular expression or schema parser (e.g., Zod) before doing database lookups.
*   **Encode Output Data:** When rendering user-supplied text in the frontend, always use React's default text rendering (which automatically escapes values to prevent XSS) and avoid using `dangerouslySetInnerHTML` unless absolute sanitization is applied.
