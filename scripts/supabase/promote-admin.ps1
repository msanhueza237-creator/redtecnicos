param(
  [Parameter(Mandatory = $true)][string]$Email,
  [Parameter(Mandatory = $true)][string]$Reason
)

$ErrorActionPreference = "Stop"
if (-not $env:SUPABASE_DB_URL) { throw "Falta SUPABASE_DB_URL." }
if (-not (Get-Command psql -ErrorAction SilentlyContinue)) { throw "psql no está instalado o no está en PATH." }

$script = Resolve-Path (Join-Path $PSScriptRoot "..\..\supabase\roles\bootstrap-admin.sql")
& psql $env:SUPABASE_DB_URL -v ON_ERROR_STOP=1 -v "admin_email=$Email" -v "reason=$Reason" -f $script
if ($LASTEXITCODE -ne 0) { throw "No fue posible asignar el rol superadmin." }

Write-Host "Rol superadmin asignado y auditado. La contraseña continúa administrada por Supabase Auth."
