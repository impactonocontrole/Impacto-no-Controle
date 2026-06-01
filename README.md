# Impacto no Controle

Ações solidárias com arrecadação, engajamento, gestão, transparência e prestação de contas.

## Stack

- Next.js + TypeScript
- Supabase Auth, Database e Storage
- Vercel
- GitHub

## Primeiro uso

Campanha piloto: **Sementinha Petz | São Francisco em Ação**

- 80 números a R$ 10,00
- Cotas “1 kg de amor”
- Pix: 58.392.598/0001-91
- Upload obrigatório de comprovante
- Aprovação manual pela Gestão/Cliente
- Andamento em R$ e kg de ração
- Página pública mobile friendly
- Ajuda com WhatsApp da Automação Extrema

## Principais URLs locais

- Home: http://localhost:3000
- Área do cliente: http://localhost:3000/cliente/login
- Gestão: http://localhost:3000/gestao/login
- Campanha piloto: http://localhost:3000/acao/sao-francisco-em-racao
- Página do cliente: http://localhost:3000/acoes/sementinha-petz

## Passos para projeto novo

1. Crie um projeto no Supabase.
2. Execute `supabase/01_schema_seed.sql` no SQL Editor.
3. Em Authentication > Users, crie os usuários:
   - `impactonocontrole@gmail.com` para Gestão/owner.
   - `sementinhapetz@gmail.com` para Cliente Sementinha Petz.
4. Rode novamente os blocos finais do SQL para vincular os usuários.
5. Copie `.env.example` para `.env.local` e configure as chaves do Supabase.
6. Rode:

```bash
npm install
npm run dev
```

## Passos para projeto já criado com o SQL anterior

Execute no Supabase SQL Editor o arquivo:

```txt
supabase/02_ajustes_cliente_home_sao_francisco.sql
```

Ele atualiza a campanha piloto, inclui imagens locais, recria a view pública com logo do cliente e vincula o usuário `sementinhapetz@gmail.com` como cliente.

## Atualização no GitHub

Depois de substituir os arquivos localmente:

```bash
git status
git add .
git commit -m "Ajusta home, area do cliente e campanha Sao Francisco"
git push origin main
```

Caso sua branch principal seja `master`, troque `main` por `master`.
