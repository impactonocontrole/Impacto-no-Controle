param(
  [string]$ProjectRoot = ".",
  [string]$ZipName = "Impacto-no-Controle-ajustes-$(Get-Date -Format 'yyyyMMdd-HHmmss').zip"
)

$ErrorActionPreference = 'Stop'

$ProjectRoot = (Resolve-Path $ProjectRoot).Path
$ZipPath = Join-Path $ProjectRoot $ZipName
$TempDir = Join-Path $env:TEMP ("impacto-no-controle-ajustes-" + [guid]::NewGuid().ToString())

if (Test-Path $ZipPath) {
  Remove-Item $ZipPath -Force
}

New-Item -ItemType Directory -Path $TempDir | Out-Null

$items = @(
  "package.json",
  "next.config.ts",
  "tsconfig.json",
  ".env.example",
  "README.md",

  "src/app/layout.tsx",
  "src/app/globals.css",
  "src/app/page.tsx",

  "src/app/acao",
  "src/app/acoes",
  "src/app/acompanhar",
  "src/app/cliente",
  "src/app/gestao",
  "src/app/redefinir-senha",
  "src/app/api/participate",
  "src/app/api/track",
  "src/app/api/admin",

  "src/components",
  "src/lib",

  "public/images",

  "supabase/01_schema_seed.sql",
  "supabase/02_ajustes_cliente_home_sao_francisco.sql"
)

foreach ($relativePath in $items) {
  $source = Join-Path $ProjectRoot $relativePath

  if (-not (Test-Path $source)) {
    Write-Warning "Item não encontrado, pulando: $relativePath"
    continue
  }

  $destination = Join-Path $TempDir $relativePath
  $destinationParent = Split-Path $destination -Parent

  if (-not (Test-Path $destinationParent)) {
    New-Item -ItemType Directory -Force -Path $destinationParent | Out-Null
  }

  if ((Get-Item $source).PSIsContainer) {
    Copy-Item $source -Destination $destination -Recurse -Force
  } else {
    Copy-Item $source -Destination $destination -Force
  }
}

Compress-Archive -Path (Join-Path $TempDir '*') -DestinationPath $ZipPath -Force
Remove-Item $TempDir -Recurse -Force

Write-Host "ZIP gerado com sucesso: $ZipPath"
