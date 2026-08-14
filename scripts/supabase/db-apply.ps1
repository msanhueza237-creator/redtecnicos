param(
  [ValidateSet("development", "staging", "production")]
  [string]$Environment = "development",
  [switch]$Apply,
  [string]$Confirmation = ""
)

$ErrorActionPreference = "Stop"
$root = Resolve-Path (Join-Path $PSScriptRoot "..\..")
$migrations = Get-ChildItem -LiteralPath (Join-Path $root "supabase\migrations") -Filter "*.sql" | Sort-Object Name

if (-not $migrations) { throw "No se encontraron migraciones." }

Write-Host "Entorno: $Environment"
Write-Host "Migraciones:"
$migrations | ForEach-Object { Write-Host " - $($_.Name)" }

if (-not $Apply) {
  Write-Host "DRY-RUN: no se modificó la base. Agrega -Apply para ejecutar."
  exit 0
}

if (-not $env:SUPABASE_DB_URL) { throw "Falta SUPABASE_DB_URL." }
if (-not (Get-Command psql -ErrorAction SilentlyContinue)) { throw "psql no está instalado o no está en PATH." }

if ($Environment -eq "production") {
  $required = "APLICAR RED TECNICOS PRODUCCION"
  if ($Confirmation -cne $required) { throw "Confirmación incorrecta. Se requiere: $required" }
  if ($env:SUPABASE_BACKUP_VERIFIED -cne "true") { throw "Producción requiere SUPABASE_BACKUP_VERIFIED=true." }
}

foreach ($migration in $migrations) {
  Write-Host "Aplicando $($migration.Name)..."
  & psql $env:SUPABASE_DB_URL -v ON_ERROR_STOP=1 -f $migration.FullName
  if ($LASTEXITCODE -ne 0) { throw "Falló $($migration.Name)." }
}

Write-Host "Migraciones aplicadas correctamente."
