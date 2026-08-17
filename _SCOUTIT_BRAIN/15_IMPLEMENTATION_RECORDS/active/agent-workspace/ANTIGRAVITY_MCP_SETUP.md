# Antigravity MCP setup

This packet keeps Antigravity's MCP setup inside the shared ScoutIt agent workspace.

## Install the official MCP pack

Close Antigravity IDE, then run this command in PowerShell:

```powershell
powershell.exe -NoProfile -ExecutionPolicy Bypass -File "C:\Users\jerze\ScoutIt\_SCOUTIT_BRAIN\15_IMPLEMENTATION_RECORDS\active\agent-workspace\install-antigravity-mcp-pack.ps1"
```

Restart Antigravity after the script reports `PASS`.

## Expected MCP servers

| Server | State after install | Access policy |
|---|---|---|
| Chrome DevTools | Enabled | Official Google server; isolated temporary Chrome profile; headers redacted |
| Cloudflare Docs | Enabled | Public documentation only |
| Cloudflare Analytics | Enabled | Official GraphQL analytics server; Cloudflare OAuth required |
| Google Analytics | Disabled/prepared | Enable only after read-only Google credentials are configured |
| Google Search Console | Not installed | Google has no first-party MCP server; use Chrome temporarily or build an audited read-only connector |

The installer preserves the existing Airtable, Supabase, Stitch, and Google Developer Knowledge
entries. It also makes a timestamped backup before changing the live Antigravity config.

The full Cloudflare API MCP is intentionally excluded because it can reach DNS, Workers, R2,
Zero Trust, and other mutation-capable account APIs. Add it only for a specific approved task
with exact OAuth permissions.

## First checks in Antigravity

1. Open **Settings -> Customizations -> MCP Tools**.
2. Confirm `chrome-devtools`, `cloudflare-docs`, and `cloudflare-analytics` appear.
3. Complete the Cloudflare OAuth prompt using read/analytics permissions only.
4. Ask: `Use Chrome DevTools to open the ScoutIt local site and report console and network errors. Do not submit forms or change external data.`
5. Ask: `Use Cloudflare Analytics to summarize ScoutIt's traffic and errors. Read only; make no configuration changes.`

## Google Analytics prerequisites

Google's official Analytics MCP is experimental and requires:

- Python plus `pipx`;
- Google Analytics Admin API and Data API enabled in a Google Cloud project;
- Application Default Credentials with `analytics.readonly` scope;
- a Google user or service account that can view the ScoutIt GA4 property.

Do not paste credential JSON, refresh tokens, API tokens, or private keys into an agent chat.
Keep the credential file on this computer and provide only its local file path during setup.

## Scope note

More MCPs are not automatically better. Antigravity already reports a customization token-budget
warning caused mainly by the large global skill set. Keep MCP access focused and disable unused
skills rather than granting every available integration.
