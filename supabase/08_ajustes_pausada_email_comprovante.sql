-- Impacto no Controle - Ajustes de página pausada e políticas públicas
-- Rode no Supabase > SQL Editor.
-- Objetivo: permitir que campanhas pausadas/encerradas/prestação publicada sejam encontradas
-- pela página pública, sem abrir participação. Campanhas em rascunho continuam protegidas.

begin;

-- Recriar políticas públicas incluindo campanhas pausadas.
drop policy if exists "public read active campaigns" on public.campaigns;
create policy "public read active campaigns" on public.campaigns
for select
using (status in ('active','paused','closed','accountability_published'));

drop policy if exists "public read campaign numbers" on public.campaign_numbers;
create policy "public read campaign numbers" on public.campaign_numbers
for select
using (
  exists (
    select 1
    from public.campaigns c
    where c.id = campaign_id
      and c.status in ('active','paused','closed','accountability_published')
  )
);

drop policy if exists "public read active quotas" on public.campaign_quotas;
create policy "public read active quotas" on public.campaign_quotas
for select
using (
  is_active
  and exists (
    select 1
    from public.campaigns c
    where c.id = campaign_id
      and c.status in ('active','paused','closed','accountability_published')
  )
);

-- Garantir que a view pública não filtre somente campanhas ativas.
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

commit;
