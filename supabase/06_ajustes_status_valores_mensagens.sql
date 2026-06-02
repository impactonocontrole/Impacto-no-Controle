-- Impacto no Controle - Ajustes de status público, valores e mensagens prontas
-- Rode no Supabase > SQL Editor.

begin;

-- 1) Garantir que a página pública encontre campanhas ativas, pausadas, encerradas
--    e com prestação publicada. Campanhas em rascunho continuam protegidas no front.
create or replace view public.campaigns_public with (security_invoker = true) as
select
  ca.id,
  ca.client_id,
  cl.name as client_name,
  cl.slug as client_slug,
  cl.logo_url as client_logo_url,
  cl.primary_color as client_primary_color,
  cl.secondary_color as client_secondary_color,
  ca.slug,
  ca.type,
  ca.title,
  ca.subtitle,
  ca.story,
  ca.prize_title,
  ca.prize_description,
  ca.prize_image_url,
  ca.main_image_url,
  ca.starts_at,
  ca.ends_at,
  ca.status,
  ca.target_amount_cents,
  ca.extended_amount_cents,
  ca.impact_unit,
  ca.impact_value_cents,
  ca.number_count,
  ca.number_price_cents,
  coalesce(ca.pix_key, cl.pix_key) as pix_key,
  coalesce(ca.pix_receiver_name, cl.pix_receiver_name, cl.name) as pix_receiver_name,
  coalesce(ca.pix_city, cl.pix_city, 'Campinas') as pix_city,
  ca.regulation_text,
  ca.data_consent_text,
  ca.show_buyer_names,
  ca.created_at
from public.campaigns ca
join public.clients cl on cl.id = ca.client_id;

grant select on public.campaigns_public to anon, authenticated;

-- 2) Corrigir valores da campanha piloto caso tenham sido salvos com casas extras.
update public.campaigns
set
  target_amount_cents = 65000,
  extended_amount_cents = 80000,
  impact_value_cents = 1344,
  number_price_cents = 1000
where slug = 'sao-francisco-em-racao';

-- 3) Atualizar mensagens prontas com links e quebras reais de linha.
delete from public.message_templates
where campaign_id in (select id from public.campaigns where slug = 'sao-francisco-em-racao')
  and channel = 'whatsapp';

insert into public.message_templates (campaign_id, channel, purpose, title, body, sort_order)
select ca.id, 'whatsapp', 'launch', 'Mensagem de lançamento', $$Pessoal, estamos iniciando a ação São Francisco em Ação 🐾

A imagem de São Francisco foi doada pela Claudia e queremos transformar essa doação em ração para cães e gatos.

Cada número para participar do sorteio custa R$ 10,00. Quem quiser ampliar a ajuda também pode escolher cotas extras “1 kg de amor”.

A meta ideal é chegar em R$ 650,00, o que representa aproximadamente 40 kg ou mais de ração, dependendo da compra.

Participe pela página da ação:
https://impacto-no-controle.vercel.app/acao/sao-francisco-em-racao

Mais do que concorrer ao prêmio, a ideia é transformar carinho em alimento real.$$,
1
from public.campaigns ca where ca.slug = 'sao-francisco-em-racao'
union all
select ca.id, 'whatsapp', 'progress', 'Mensagem de andamento', $$Atualização da ação São Francisco em Ação 🐾

Já arrecadamos [VALOR], o que representa aproximadamente [KG] kg de ração para cães e gatos.

Faltam [FALTA] para bater a meta ideal. Quem ainda quiser participar pode escolher um número ou doar uma cota “1 kg de amor”.

Acompanhe ou participe aqui:
https://impacto-no-controle.vercel.app/acao/sao-francisco-em-racao

Obrigado a todos que já ajudaram. A prestação de contas será compartilhada ao final.$$,
2
from public.campaigns ca where ca.slug = 'sao-francisco-em-racao'
union all
select ca.id, 'whatsapp', 'last_call', 'Última chamada', $$Última chamada para a ação São Francisco em Ação 🐾

Estamos perto de fechar a campanha. Ainda dá tempo de escolher um número ou contribuir com uma cota “1 kg de amor”.

Cada participação ajuda a transformar a imagem de São Francisco em ração para cães e gatos.

Participe ou compartilhe este link com alguém que também ame essa causa:
https://impacto-no-controle.vercel.app/acao/sao-francisco-em-racao$$,
3
from public.campaigns ca where ca.slug = 'sao-francisco-em-racao'
union all
select ca.id, 'whatsapp', 'accountability', 'Prestação de contas', $$Prestação de contas da ação São Francisco em Ação 🐾

Arrecadamos [VALOR_FINAL] e isso foi transformado em [KG_FINAL] kg de ração para cães e gatos.

Nossa gratidão a todos que participaram, divulgaram e ajudaram. A imagem de São Francisco cumpriu seu propósito: virar alimento, cuidado e amor em ação.

Acompanhe a página da ação:
https://impacto-no-controle.vercel.app/acao/sao-francisco-em-racao#prestacao-de-contas$$,
4
from public.campaigns ca where ca.slug = 'sao-francisco-em-racao';

commit;
