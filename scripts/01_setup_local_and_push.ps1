# Impacto no Controle - configurar localmente e enviar ao GitHub
# Execute no PowerShell dentro da pasta Impacto-no-Controle.

$ErrorActionPreference = "Stop"

Write-Host "==> Verificando Node.js, npm e Git..." -ForegroundColor Cyan
node -v
npm -v
git --version

Write-Host "==> Instalando dependências..." -ForegroundColor Cyan
npm install

if (!(Test-Path ".env.local")) {
  Copy-Item ".env.example" ".env.local"
  Write-Host "\nIMPORTANTE: edite o arquivo .env.local com as chaves do Supabase antes de rodar npm run dev." -ForegroundColor Yellow
}

if (!(Test-Path ".git")) {
  Write-Host "==> Inicializando Git..." -ForegroundColor Cyan
  git init
  git branch -M main
}

$remote = git remote 2>$null
if ($remote -notmatch "origin") {
  git remote add origin https://github.com/impactonocontrole/Impacto-no-Controle.git
}

Write-Host "==> Salvando arquivos no Git..." -ForegroundColor Cyan
git add .
try {
  git commit -m "MVP inicial do Impacto no Controle"
} catch {
  Write-Host "Nada novo para commitar ou commit já criado." -ForegroundColor Yellow
}

Write-Host "==> Enviando para o GitHub..." -ForegroundColor Cyan
git push -u origin main

Write-Host "\nPronto. Projeto enviado para o GitHub." -ForegroundColor Green
Write-Host "Próximo passo: configurar .env.local e rodar npm run dev" -ForegroundColor Green
