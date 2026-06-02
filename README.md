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

## Ajustes incluídos nesta versão

- Cabeçalho único com Impacto no Controle + indicação visual de que é uma solução da Automação Extrema.
- Páginas públicas de campanha sem botões Cliente/Gestão.
- Página de obrigado em `/obrigado/[token]` após envio do comprovante.
- Link individual de acompanhamento em `/acompanhar/[token]`.
- Mensagem pronta para WhatsApp na gestão da campanha, em cada participação.
- Envio opcional de e-mail ao participante, com cópia para `impactonocontrole@gmail.com`, quando `RESEND_API_KEY` estiver configurada.

## Envio de e-mail opcional

Para ativar o envio automático de e-mail, configure no `.env.local` e depois também na Vercel:

```env
RESEND_API_KEY=
EMAIL_FROM="Impacto no Controle <onboarding@resend.dev>"
IMPACTO_ADMIN_EMAIL=impactonocontrole@gmail.com
```

Se `RESEND_API_KEY` não for configurada, a participação continua funcionando normalmente. Apenas o e-mail automático não será enviado.

## Ajuste SQL incremental desta versão

Para uma base já criada, rode também:

```txt
supabase/03_ajustes_header_obrigado_email.sql
```
