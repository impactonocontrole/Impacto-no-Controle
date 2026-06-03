-- Impacto no Controle - Ajuste visual da página de Obrigado para Amigos de Pet
-- Rode no Supabase > SQL Editor após aplicar o script 10.
-- Este script não apaga dados. Ele atualiza a view de acompanhamento para expor logo e cores do cliente.

create or replace view public.contribution_tracking as
select
  con.acompanhamento_token,
  con.campaign_id,
  con.status,
  con.amount_cents,
  con.selected_numbers,
  con.selected_quotas,
  con.created_at,
  p.name as participant_name,
  p.phone as participant_phone,
  p.email as participant_email,
  ca.title as campaign_title,
  ca.slug as campaign_slug,
  cl.name as client_name,
  cl.logo_url as client_logo_url,
  cl.primary_color as client_primary_color,
  cl.secondary_color as client_secondary_color
from public.contributions con
join public.participants p on p.id = con.participant_id
join public.campaigns ca on ca.id = con.campaign_id
join public.clients cl on cl.id = ca.client_id;

-- Reforço da identidade visual da ONG Amigos de Pet.
update public.clients
set
  logo_url = '/images/amigos-de-pet-icon.jpg',
  primary_color = '#A91583',
  secondary_color = '#F45AC0',
  updated_at = now()
where slug = 'amigos-de-pet';
