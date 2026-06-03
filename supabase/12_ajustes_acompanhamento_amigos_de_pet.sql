-- Ajuste da view de acompanhamento/obrigado para expor identidade visual do cliente.
-- Mantém a ordem das colunas já existentes para evitar erro 42P16 no CREATE OR REPLACE VIEW.

create or replace view public.contribution_tracking as
select
  con.acompanhamento_token,
  con.status,
  con.amount_cents,
  con.selected_numbers,
  con.selected_quotas,
  con.created_at,
  p.name as participant_name,
  ca.title as campaign_title,
  ca.slug as campaign_slug,
  cl.name as client_name,
  con.campaign_id,
  p.phone as participant_phone,
  p.email as participant_email,
  cl.logo_url as client_logo_url,
  cl.primary_color as client_primary_color,
  cl.secondary_color as client_secondary_color
from public.contributions con
join public.participants p on p.id = con.participant_id
join public.campaigns ca on ca.id = con.campaign_id
join public.clients cl on cl.id = ca.client_id;

update public.clients
set
  logo_url = coalesce(nullif(logo_url, ''), '/images/amigos-de-pet-icon.jpg'),
  primary_color = '#A91583',
  secondary_color = '#F45AC0'
where lower(name) like '%amigos de pet%';
