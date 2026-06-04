-- Impacto no Controle - Ajustes fluxo reserva -> Pix -> comprovante
-- Rode no Supabase SQL Editor. Este script não apaga dados.

begin;

-- 1) Permitir reserva/checkout antes do envio do comprovante.
alter table public.contributions
  add column if not exists reservation_expires_at timestamptz,
  add column if not exists proof_file_hash text;

alter table public.contributions drop constraint if exists contributions_status_check;
alter table public.contributions
  add constraint contributions_status_check
  check (status in ('awaiting_payment','pending_approval','approved','rejected','canceled'));

create unique index if not exists contributions_proof_file_hash_unique
  on public.contributions (proof_file_hash)
  where proof_file_hash is not null;

-- 2) Recomendação para a campanha São Francisco: reserva temporária curta.
update public.campaigns
set reservation_minutes = 30
where slug = 'sao-francisco-em-racao';

-- 3) Função para liberar reservas expiradas.
create or replace function public.release_expired_reservations()
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  update public.campaign_numbers
  set
    status = 'available',
    participant_id = null,
    contribution_id = null,
    buyer_display_name = null,
    reserved_until = null,
    updated_at = now()
  where status = 'reserved'
    and reserved_until is not null
    and reserved_until < now();

  update public.contributions
  set
    status = 'canceled',
    note = coalesce(note, '') || case when coalesce(note, '') = '' then '' else E'\n' end || 'Reserva expirada automaticamente antes do envio do comprovante.',
    updated_at = now()
  where status = 'awaiting_payment'
    and reservation_expires_at is not null
    and reservation_expires_at < now();
end;
$$;

-- 4) Recriar views para refletir reservas e status de pagamento.
drop view if exists public.admin_campaigns_overview cascade;
drop view if exists public.admin_contributions cascade;
drop view if exists public.contribution_tracking cascade;
drop view if exists public.campaign_stats_public cascade;
drop view if exists public.campaign_numbers_public cascade;

create view public.campaign_numbers_public with (security_invoker = true) as
select
  n.campaign_id,
  n.number,
  n.status,
  case when c.show_buyer_names and n.status in ('reserved','pending_approval','confirmed') then n.buyer_display_name else null end as buyer_display_name
from public.campaign_numbers n
join public.campaigns c on c.id = n.campaign_id;

create view public.campaign_stats_public as
select
  c.id as campaign_id,
  coalesce(sum(con.amount_cents) filter (where con.status = 'approved'), 0)::integer as confirmed_amount_cents,
  coalesce(sum(con.amount_cents) filter (where con.status in ('awaiting_payment','pending_approval')), 0)::integer as pending_amount_cents,
  coalesce(count(con.id) filter (where con.status = 'approved'), 0)::integer as confirmed_count,
  coalesce(count(con.id) filter (where con.status in ('awaiting_payment','pending_approval')), 0)::integer as pending_count
from public.campaigns c
left join public.contributions con on con.campaign_id = c.id
  and con.status <> 'canceled'
group by c.id;

create view public.admin_campaigns_overview as
select
  ca.id,
  ca.client_id,
  cl.name as client_name,
  ca.slug,
  ca.title,
  ca.status,
  ca.target_amount_cents,
  ca.extended_amount_cents,
  ca.impact_value_cents,
  ca.number_count,
  ca.number_price_cents,
  ca.created_at,
  s.confirmed_amount_cents,
  s.pending_amount_cents,
  s.confirmed_count,
  s.pending_count
from public.campaigns ca
join public.clients cl on cl.id = ca.client_id
left join public.campaign_stats_public s on s.campaign_id = ca.id;

create view public.admin_contributions as
select
  con.id,
  con.campaign_id,
  con.participant_id,
  p.name as participant_name,
  p.phone,
  p.email,
  con.type,
  con.status,
  con.amount_cents,
  con.selected_numbers,
  con.selected_quotas,
  con.proof_file_path,
  con.acompanhamento_token,
  con.rejected_reason,
  con.approved_at,
  con.created_at,
  con.reservation_expires_at,
  con.proof_file_hash
from public.contributions con
join public.participants p on p.id = con.participant_id;

create view public.contribution_tracking as
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
  cl.secondary_color as client_secondary_color,
  con.reservation_expires_at
from public.contributions con
join public.participants p on p.id = con.participant_id
join public.campaigns ca on ca.id = con.campaign_id
join public.clients cl on cl.id = ca.client_id;

grant select on public.campaign_numbers_public, public.campaign_stats_public to anon, authenticated;
grant select on public.admin_campaigns_overview, public.admin_contributions, public.contribution_tracking to authenticated;

commit;
