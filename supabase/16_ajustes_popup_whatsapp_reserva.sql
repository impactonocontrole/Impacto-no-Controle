-- Impacto no Controle - Ajustes popup inicial, WhatsApp da reserva e campos públicos
-- Rode no Supabase SQL Editor. Este script não apaga dados.

begin;

-- 1) Campos de configuração do pop-up inicial por campanha.
alter table public.campaigns
  add column if not exists intro_modal_enabled boolean not null default false,
  add column if not exists intro_modal_title text,
  add column if not exists intro_modal_body text;

-- 2) Configuração sugerida para a campanha São Francisco em Ação.
update public.campaigns
set
  intro_modal_enabled = true,
  intro_modal_title = 'Bem-vindo à ação São Francisco em Ação',
  intro_modal_body = 'Aqui você escolhe seus números, reserva sua participação, faz o Pix pelo CNPJ da ONG Amigos de Pet e envia o comprovante em uma página própria. Para evitar perder o link ao abrir o aplicativo do banco, envie a página da reserva para o seu WhatsApp.',
  regulation_text = 'A participação só será confirmada após conferência do Pix pela organização. Caso algum número não seja aprovado, ele poderá voltar a ficar disponível.'
where slug = 'sao-francisco-em-racao';

-- 3) Recriar view pública mantendo a ordem atual e adicionando os novos campos no final.
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
  ca.created_at,
  ca.intro_modal_enabled,
  ca.intro_modal_title,
  ca.intro_modal_body
from public.campaigns ca
join public.clients cl on cl.id = ca.client_id;

grant select on public.campaigns_public to anon, authenticated;

commit;
