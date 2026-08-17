$ErrorActionPreference = "Stop"

$configPath = "C:\Users\jerze\.gemini\config\mcp_config.json"
if (-not (Test-Path -LiteralPath $configPath)) {
  throw "Antigravity MCP config not found: $configPath"
}

$stamp = Get-Date -Format "yyyyMMdd-HHmmss"
$backupPath = "$configPath.backup-cloudflare-oauth-$stamp"
Copy-Item -LiteralPath $configPath -Destination $backupPath -ErrorAction Stop

$config = Get-Content -Raw -LiteralPath $configPath | ConvertFrom-Json -ErrorAction Stop
if (-not $config.mcpServers.'cloudflare-analytics') {
  throw "Cloudflare Analytics MCP entry is missing"
}

$definition = [pscustomobject]@{
  command = "npx"
  args = @(
    "-y",
    "mcp-remote@latest",
    "https://graphql.mcp.cloudflare.com/mcp",
    "--transport",
    "http-only"
  )
}
$config.mcpServers | Add-Member -NotePropertyName "cloudflare-analytics" -NotePropertyValue $definition -Force

$json = $config | ConvertTo-Json -Depth 20
$utf8NoBom = New-Object System.Text.UTF8Encoding($false)
[System.IO.File]::WriteAllText($configPath, $json + [Environment]::NewLine, $utf8NoBom)

$validated = Get-Content -Raw -LiteralPath $configPath | ConvertFrom-Json -ErrorAction Stop
$cloudflare = $validated.mcpServers.'cloudflare-analytics'
if ($cloudflare.PSObject.Properties.Name -contains 'authProviderType') {
  throw "Repair failed: unsupported authProviderType remains"
}
if (-not (@($cloudflare.args) -contains "https://graphql.mcp.cloudflare.com/mcp")) {
  throw "Repair failed: Cloudflare OAuth bridge URL is missing"
}

Write-Host "Antigravity Cloudflare OAuth compatibility repair: PASS" -ForegroundColor Green
Write-Host "Backup: $backupPath"
Write-Host "Cloudflare Analytics now uses mcp-remote because this Antigravity runtime rejects native OAuth."
Write-Host "Refresh MCP servers in Antigravity. A browser authorization window may open."
