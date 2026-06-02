param(
  [string]$ProjectRoot = "C:\Users\lacos\Documents\GitHub\impacto-no-controle"
)

$ErrorActionPreference = "Stop"

$ProjectRoot = (Resolve-Path $ProjectRoot).Path
Set-Location $ProjectRoot

Write-Host ""
Write-Host "Projeto:" $ProjectRoot
Write-Host ""

if (Test-Path "package-lock.json") {
  $backupName = "package-lock.backup-$(Get-Date -Format 'yyyyMMdd-HHmmss').json"
  Copy-Item "package-lock.json" $backupName -Force
  Remove-Item "package-lock.json" -Force
  Write-Host "package-lock.json antigo removido. Backup criado:" $backupName
}

if (Test-Path "node_modules") {
  Remove-Item "node_modules" -Recurse -Force
  Write-Host "node_modules removido."
}

@"
registry=https://registry.npmjs.org/
package-lock=true
fund=false
audit=false
"@ | Set-Content ".npmrc" -Encoding UTF8

Write-Host ".npmrc configurado para usar o registry oficial do npm."

npm config set registry https://registry.npmjs.org/
npm cache verify

Write-Host ""
Write-Host "Gerando novo package-lock.json pelo registry oficial..."
npm install --registry=https://registry.npmjs.org/

Write-Host ""
Write-Host "Verificando se ainda existe referência a applied-caas/internal no package-lock..."
$internalRefs = Select-String -Path "package-lock.json" -Pattern "applied-caas|internal.api.openai|artifactory" -SimpleMatch -ErrorAction SilentlyContinue

if ($internalRefs) {
  Write-Host "ATENÇÃO: ainda foram encontradas referências internas no package-lock.json."
  Write-Host "Abra o arquivo e procure por: applied-caas, internal.api.openai ou artifactory."
  exit 1
} else {
  Write-Host "OK: package-lock.json não contém referências internas."
}

Write-Host ""
Write-Host "Rode agora:"
Write-Host "npm run build"
Write-Host ""
Write-Host "Se o build passar, faça:"
Write-Host "git add package.json package-lock.json .npmrc"
Write-Host "git commit -m `"Corrige package-lock para deploy na Vercel`""
Write-Host "git push origin main"
Write-Host ""
