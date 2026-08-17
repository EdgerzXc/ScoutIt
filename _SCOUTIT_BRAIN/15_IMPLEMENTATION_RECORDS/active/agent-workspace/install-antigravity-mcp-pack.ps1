$ErrorActionPreference = "Stop"

$configPath = "C:\Users\jerze\.gemini\config\mcp_config.json"
$schemaPath = "C:\Users\jerze\AppData\Local\Programs\Antigravity IDE\resources\app\extensions\antigravity\schemas\mcp_config.schema.json"

if (-not (Test-Path -LiteralPath $configPath)) {
  throw "Antigravity MCP config not found: $configPath"
}

if (-not (Test-Path -LiteralPath $schemaPath)) {
  throw "Installed Antigravity MCP schema not found: $schemaPath"
}

$stamp = Get-Date -Format "yyyyMMdd-HHmmss"
$backupPath = "$configPath.backup-$stamp"
Copy-Item -LiteralPath $configPath -Destination $backupPath -ErrorAction Stop

$config = Get-Content -Raw -LiteralPath $configPath | ConvertFrom-Json -ErrorAction Stop
if (-not $config.mcpServers) {
  throw "Invalid MCP config: mcpServers is missing"
}

function Set-McpServer {
  param(
    [Parameter(Mandatory = $true)]
    [string]$Name,

    [Parameter(Mandatory = $true)]
    [psobject]$Definition
  )

  $config.mcpServers | Add-Member -NotePropertyName $Name -NotePropertyValue $Definition -Force
}

# Official Chrome DevTools MCP. A temporary profile prevents the agent from
# silently inheriting the owner's normal cookies and signed-in browser sessions.
Set-McpServer -Name "chrome-devtools" -Definition ([pscustomobject]@{
  command = "npx"
  args = @(
    "-y",
    "chrome-devtools-mcp@latest",
    "--isolated",
    "--redact-network-headers=true",
    "--usage-statistics=false",
    "--performance-crux=false"
  )
})

# Public Cloudflare documentation plus the narrow GraphQL analytics surface.
# The full Cloudflare API server is excluded because it can mutate DNS, Workers,
# R2, Zero Trust, and other production services.
Set-McpServer -Name "cloudflare-docs" -Definition ([pscustomobject]@{
  serverUrl = "https://docs.mcp.cloudflare.com/mcp"
})

Set-McpServer -Name "cloudflare-analytics" -Definition ([pscustomobject]@{
  serverUrl = "https://graphql.mcp.cloudflare.com/mcp"
  authProviderType = "oauth"
})

# Google's first-party Analytics MCP requires pipx and read-only Application
# Default Credentials. Prepare it but keep it disabled until both are configured.
Set-McpServer -Name "google-analytics" -Definition ([pscustomobject]@{
  command = "python"
  args = @("-m", "pipx", "run", "analytics-mcp")
  disabled = $true
})

$json = $config | ConvertTo-Json -Depth 20
$utf8NoBom = New-Object System.Text.UTF8Encoding($false)
[System.IO.File]::WriteAllText($configPath, $json + [Environment]::NewLine, $utf8NoBom)

$validated = Get-Content -Raw -LiteralPath $configPath | ConvertFrom-Json -ErrorAction Stop
$null = Get-Content -Raw -LiteralPath $schemaPath | ConvertFrom-Json -ErrorAction Stop

if (-not (@($validated.mcpServers.'chrome-devtools'.args) -contains "--isolated")) {
  throw "Install failed: Chrome DevTools isolated profile flag is missing"
}

if ($validated.mcpServers.'cloudflare-docs'.serverUrl -ne "https://docs.mcp.cloudflare.com/mcp") {
  throw "Install failed: Cloudflare documentation server is missing"
}

if ($validated.mcpServers.'cloudflare-analytics'.authProviderType -ne "oauth") {
  throw "Install failed: Cloudflare analytics OAuth is missing"
}

if (-not $validated.mcpServers.'google-analytics'.disabled) {
  throw "Install failed: Google Analytics must remain disabled until credentials are configured"
}

Write-Host "Antigravity official MCP pack: PASS" -ForegroundColor Green
Write-Host "Backup: $backupPath"
Write-Host "Chrome DevTools: enabled with an isolated temporary browser profile"
Write-Host "Cloudflare Docs: enabled (public documentation)"
Write-Host "Cloudflare Analytics: enabled; approve its OAuth prompt in Antigravity"
Write-Host "Google Analytics: prepared but disabled pending pipx + read-only Google credentials"
Write-Host "Google Search Console: not installed; Google has no first-party MCP server"
Write-Host "Credentials were not printed or changed. Restart Antigravity IDE before testing."
