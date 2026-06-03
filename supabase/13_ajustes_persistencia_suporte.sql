-- Ajuste 13 - Persistência local no app e padronização do WhatsApp para Suporte
-- Este SQL atualiza somente textos de mensagens já gravadas no banco.
-- Não altera aquisições, números, participantes ou configurações da campanha.

begin;

update public.message_templates
set body = replace(
             replace(
               replace(body,
                 'Para facilitar a participação, vamos utilizar o sistema Impacto no Controle, solução prática, rápida e segura da empresa Automação Extrema (https://automacao-extrema.vercel.app/) do Márcio Alexandre.',
                 'Para facilitar a participação, vamos utilizar o sistema Impacto no Controle, solução prática, rápida e segura da empresa Automação Extrema (https://automacao-extrema.vercel.app/).'
               ),
               'Para facilitar a participação, vamos utilizar o sistema Impacto no Controle, solução prática, rápida e segura da empresa Automação Extrema (https://automacao-extrema.vercel.app/) do Suporte.',
               'Para facilitar a participação, vamos utilizar o sistema Impacto no Controle, solução prática, rápida e segura da empresa Automação Extrema (https://automacao-extrema.vercel.app/).'
             ),
             'Márcio Alexandre',
             'Suporte'
           )
where campaign_id in (
  select id from public.campaigns where slug = 'sao-francisco-em-racao'
);

commit;
