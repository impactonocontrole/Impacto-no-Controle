#!/usr/bin/env bash
set -euo pipefail

echo "==> Verificando Node.js, npm e Git..."
node -v
npm -v
git --version

echo "==> Instalando dependências..."
npm install

if [ ! -f .env.local ]; then
  cp .env.example .env.local
  echo "IMPORTANTE: edite o arquivo .env.local com as chaves do Supabase antes de rodar npm run dev."
fi

if [ ! -d .git ]; then
  echo "==> Inicializando Git..."
  git init
  git branch -M main
fi

if ! git remote | grep -q '^origin$'; then
  git remote add origin https://github.com/impactonocontrole/Impacto-no-Controle.git
fi

echo "==> Salvando arquivos no Git..."
git add .
git commit -m "MVP inicial do Impacto no Controle" || echo "Nada novo para commitar ou commit já criado."

echo "==> Enviando para o GitHub..."
git push -u origin main

echo "Pronto. Projeto enviado para o GitHub. Próximo passo: configurar .env.local e rodar npm run dev"
