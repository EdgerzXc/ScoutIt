$ErrorActionPreference = "Stop"

$configPath = "C:\Users\jerze\.gemini\config\mcp_config.json"
$schemaPath = "C:\Users\jerze\AppData\Local\Programs\Antigravity IDE\resources\app\extensions\antigravity\schemas\mcp_config.schema.json"
$cachePath = "C:\Users\jerze\.gemini\antigravity-ide\mcp\google-developer-knowledge"

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

$stitch = $config.mcpServers.StitchMCP
if ($stitch) {
  $stitch.PSObject.Properties.Remove('$typeName')
}

$supabase = $config.mcpServers.supabase
if (-not $supabase) {
  throw "Supabase MCP entry is missing"
}
$supabase.args = @(
  "-y",
  "@supabase/mcp-server-supabase@latest",
  "--project-ref",
  "yyixsuaimdzyiocswcgc",
  "--read-only",
  "--features",
  "database,debugging,docs"
)
$supabase | Add-Member -NotePropertyName disabledTools -NotePropertyValue @(
  "apply_migration"
) -Force

$airtable = $config.mcpServers.airtable
if (-not $airtable) {
  throw "Airtable MCP entry is missing"
}
$airtable | Add-Member -NotePropertyName disabledTools -NotePropertyValue @(
  "create_comment",
  "create_field",
  "create_record",
  "create_table",
  "delete_records",
  "update_field",
  "update_records",
  "update_table",
  "upload_attachment"
) -Force

New-Item -ItemType Directory -Path $cachePath -Force | Out-Null

$json = $config | ConvertTo-Json -Depth 20
$utf8NoBom = New-Object System.Text.UTF8Encoding($false)
[System.IO.File]::WriteAllText($configPath, $json + [Environment]::NewLine, $utf8NoBom)

$validated = Get-Content -Raw -LiteralPath $configPath | ConvertFrom-Json -ErrorAction Stop
$schema = Get-Content -Raw -LiteralPath $schemaPath | ConvertFrom-Json -ErrorAction Stop

if ($validated.mcpServers.StitchMCP.PSObject.Properties.Name -contains '$typeName') {
  throw "Repair failed: unsupported StitchMCP type field remains"
}

if (-not (@($validated.mcpServers.supabase.args) -contains "--read-only")) {
  throw "Repair failed: Supabase read-only flag is missing"
}

if (-not (@($validated.mcpServers.supabase.args) -contains "--project-ref")) {
  throw "Repair failed: Supabase project scope is missing"
}

if (-not (@($validated.mcpServers.airtable.disabledTools) -contains "update_records")) {
  throw "Repair failed: Airtable mutation tools are not disabled"
}

Write-Host "Antigravity MCP structural repair: PASS" -ForegroundColor Green
Write-Host "Backup: $backupPath"
Write-Host "Servers preserved: $((@($validated.mcpServers.PSObject.Properties.Name)) -join ', ')"
Write-Host "Supabase: ScoutIt project-scoped, read-only; existing token value preserved"
Write-Host "Airtable: record/schema read tools retained; mutation tools disabled"
Write-Host "Credentials were not printed or changed. Restart Antigravity IDE before testing."
