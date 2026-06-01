# Impacto no Controle

Ações solidárias com arrecadação, engajamento, gestão e prestação de contas.

## Stack

- Next.js + TypeScript
- Supabase Auth, Database e Storage
- Vercel
- GitHub

## Primeiro uso

Campanha piloto: **Sementinha Petz | São Francisco em Ração**

- 80 números a R$ 10,00
- Cotas “1 kg de amor”
- Pix: 58.392.598/0001-91
- Upload de comprovante
- Aprovação manual pela Gestão
- Andamento em R$ e kg de ração

## Passos

1. Crie um projeto no Supabase.
2. Execute `supabase/01_schema_seed.sql` no SQL Editor.
3. Em Authentication > Users, crie o usuário `impactonocontrole@gmail.com`.
4. Rode novamente o bloco final do SQL para vincular o usuário como owner, se necessário.
5. Copie `.env.example` para `.env.local` e configure as chaves do Supabase.
6. Rode:

```bash
npm install
npm run dev
```

7. Acesse:

- Home: http://localhost:3000
- Campanha: http://localhost:3000/acao/sao-francisco-em-racao
- Gestão: http://localhost:3000/gestao/login
