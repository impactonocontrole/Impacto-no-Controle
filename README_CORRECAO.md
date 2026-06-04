# Correção de lint/build

Arquivos incluídos:

- `src/app/api/reservations/route.ts`: corrige o erro TypeScript em `safeQuotaMap`.
- `eslint.config.mjs`: substitui a configuração antiga/compatível por flat config oficial do Next.js para ESLint 9.

Após copiar os arquivos para a raiz do projeto, rode:

```powershell
npm run lint
npm run build
```
