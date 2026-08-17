$ErrorActionPreference = "Stop"

$workspace = "C:\Users\jerze\ScoutIt\_SCOUTIT_BRAIN\15_IMPLEMENTATION_RECORDS\active\agent-workspace"

# Run the original idempotent pack installer, then immediately apply the runtime
# compatibility correction before Antigravity is restarted. The installed IDE's
# language server accepts only google_credentials as a native authProviderType,
# so Cloudflare OAuth must use the stdio mcp-remote bridge.
& (Join-Path $workspace "install-antigravity-mcp-pack.ps1")
& (Join-Path $workspace "fix-antigravity-cloudflare-oauth.ps1")

Write-Host "Safe Antigravity MCP pack installation: PASS" -ForegroundColor Green
