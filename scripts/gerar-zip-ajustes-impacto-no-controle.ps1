param(
  [string]$ProjectRoot = "C:\Users\lacos\Documents\GitHub\impacto-no-controle",
  [string]$ZipName = "Impacto-no-Controle-ajustes-$(Get-Date -Format 'yyyyMMdd-HHmmss').zip"
)

$ErrorActionPreference = "Stop"

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

  "src/app/layout.tsx",
  "src/app/globals.css",
  "src/app/page.tsx",

  "src/app/acao/[slug]/page.tsx",
  "src/app/acao/[slug]/layout.tsx",

  "src/app/obrigado/[token]/page.tsx",
  "src/app/acompanhar/[token]/page.tsx",

  "src/app/api/participate/route.ts",
  "src/app/api/track/[token]/route.ts",

  "src/components/PublicHeader.tsx",
  "src/components/CampaignParticipation.tsx",

  "src/lib/pix.ts",
  "src/lib/format.ts",

  "public/images"
)

# Itens opcionais, se existirem
$optionalItems = @(
  "src/lib/email.ts",
  "src/lib/mailer.ts",
  "src/lib/resend.ts",
  "src/app/api/send-email",
  "src/app/head.tsx",
  "src/app/opengraph-image.tsx",
  "src/app/opengraph-image.png",
  "src/app/acao/[slug]/opengraph-image.tsx",
  "src/app/acao/[slug]/opengraph-image.png"
)

foreach ($relativePath in ($items + $optionalItems)) {
  $source = Join-Path $ProjectRoot $relativePath

  if (-not (Test-Path $source)) {
    Write-Host "Pulando (não encontrado): $relativePath"
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

Write-Host ""
Write-Host "ZIP gerado com sucesso em:"
Write-Host $ZipPath
Write-Host ""