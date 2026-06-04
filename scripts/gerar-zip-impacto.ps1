$ErrorActionPreference = "Stop"

$projectName = "impacto-no-controle-ajustes-whatsapp-pix"
$date = Get-Date -Format "yyyyMMdd-HHmm"
$zipName = "$projectName-$date.zip"

$root = Get-Location
$tempDir = Join-Path $env:TEMP "$projectName-$date"

Write-Host "Criando pasta temporária: $tempDir"

if (Test-Path $tempDir) {
    Remove-Item $tempDir -Recurse -Force
}

New-Item -ItemType Directory -Path $tempDir | Out-Null

$excludeDirs = @(
    "node_modules",
    ".next",
    ".vercel",
    ".git",
    "coverage",
    "dist",
    "build",
    ".turbo"
)

$excludeFiles = @(
    ".env",
    ".env.local",
    ".env.production",
    ".env.development"
)

Write-Host "Copiando arquivos do projeto..."

Get-ChildItem -Path $root -Force | ForEach-Object {
    $item = $_

    if ($excludeDirs -contains $item.Name) {
        Write-Host "Ignorando pasta: $($item.Name)"
        return
    }

    if ($excludeFiles -contains $item.Name) {
        Write-Host "Ignorando arquivo sensível: $($item.Name)"
        return
    }

    $destination = Join-Path $tempDir $item.Name

    if ($item.PSIsContainer) {
        Copy-Item $item.FullName $destination -Recurse -Force
    } else {
        Copy-Item $item.FullName $destination -Force
    }
}

$zipPath = Join-Path $root $zipName

if (Test-Path $zipPath) {
    Remove-Item $zipPath -Force
}

Write-Host "Gerando ZIP: $zipPath"

Compress-Archive -Path (Join-Path $tempDir "*") -DestinationPath $zipPath -Force

Remove-Item $tempDir -Recurse -Force

Write-Host ""
Write-Host "ZIP gerado com sucesso:"
Write-Host $zipPath