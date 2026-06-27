# CIS Benchmarks Overview

This document provides a summary of Center for Internet Security (CIS) Benchmarks relevant to the ScoutIt web application platform and database infrastructure.

---

## 1. Operating System and Cloud Virtual Machine Security

*   **SSH Access Control:** Disable password-based authentication for SSH. Force the use of SSH Keys. Disable SSH root login (`PermitRootLogin no`).
*   **Minimal Services:** Install only the software packages required to run the web server. Disable or uninstall unused services (like FTP, telnet, or mail relays).
*   **Security Patches:** Automate OS security updates and apply package manager upgrades weekly.

---

## 2. Web Server Hardening (Node.js & Next.js)

### Safe Header Configurations (Helmet/Next Config)
Ensure the server sends security headers with every response to prevent browser-based attacks:
*   **Content Security Policy (CSP):** Enforce strict source restrictions on scripts, styles, and media.
*   **Strict-Transport-Security (HSTS):** Force clients to interact with the domain via HTTPS only.
*   **X-Content-Type-Options:** Prevent browsers from MIME-sniffing responses (set to `nosniff`).
*   **X-Frame-Options:** Prevent clickjacking by restricting framing (set to `DENY` or `SAMEORIGIN`).
*   **Referrer-Policy:** Restrict information sent in HTTP Referer headers (set to `strict-origin-when-cross-origin`).

### Process Security
*   **Non-Root Execution:** Never run Node.js processes as the `root` user. Use dedicated unprivileged service users (e.g., `node`).
*   **Error Handling:** Ensure the server does not output raw stack traces or internal environment variables to clients in error payloads. Log details internally, and return generic messages to the client.

---

## 3. Database Hardening (PostgreSQL)

*   **Access Control:** Use host-based authentication (`pg_hba.conf`) to restrict database connections to trusted IP ranges (e.g., allow connections only from the application server's private network).
*   **Encryption at Rest:** Ensure database storage disks are encrypted using AES-256.
*   **SSL Connections:** Enforce SSL connection requirements (`ssl = on` and `ssl_mode = require`) for all remote client connections.
*   **Password Complexity:** Enforce database user password length and complexity rules.
