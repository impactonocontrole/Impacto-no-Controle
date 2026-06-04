# Correção do npm run lint

Substitua o arquivo `eslint.config.mjs` na raiz do projeto por este arquivo.

Depois rode:

```powershell
cd "C:\Users\lacos\Documents\GitHub\impacto-no-controle"
npm run lint
npm run build
```

Se passar:

```powershell
git status
git add eslint.config.mjs
git commit -m "Ajusta regras de lint para MVP"
git push origin main
```

Não há SQL para esta correção.
