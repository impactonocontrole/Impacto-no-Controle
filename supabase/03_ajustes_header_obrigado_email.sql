-- Impacto no Controle - Ajustes de acompanhamento/obrigado/e-mail
-- Rode no SQL Editor do Supabase após aplicar os scripts anteriores.
-- Este script não apaga dados. Ele apenas atualiza a view usada pelas páginas de Obrigado/Acompanhamento.

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
  cl.name as client_name
from public.contributions con
join public.participants p on p.id = con.participant_id
join public.campaigns ca on ca.id = con.campaign_id
join public.clients cl on cl.id = ca.client_id;
