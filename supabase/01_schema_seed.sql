-- Impacto no Controle - MVP completo
-- Execute este script no Supabase SQL Editor em um projeto novo.
-- Depois crie o usuário de autenticação impactonocontrole@gmail.com e rode novamente apenas o bloco "VINCULAR USUÁRIO ADMIN", caso o usuário ainda não exista.

create extension if not exists pgcrypto;

-- LIMPEZA PARA PROJETO NOVO ---------------------------------------------------
drop view if exists public.admin_campaigns_overview cascade;
drop view if exists public.admin_contributions cascade;
drop view if exists public.contribution_tracking cascade;
drop view if exists public.campaign_stats_public cascade;
drop view if exists public.campaign_quotas_public cascade;
drop view if exists public.campaign_numbers_public cascade;
drop view if exists public.campaigns_public cascade;
drop view if exists public.clients_public cascade;

drop table if exists public.audit_logs cascade;
drop table if exists public.message_templates cascade;
drop table if exists public.campaign_accountability cascade;
drop table if exists public.campaign_updates cascade;
drop table if exists public.repasse_rules cascade;
drop table if exists public.contributions cascade;
drop table if exists public.campaign_quotas cascade;
drop table if exists public.campaign_numbers cascade;
drop table if exists public.participants cascade;
drop table if exists public.campaigns cascade;
drop table if exists public.app_users cascade;
drop table if exists public.clients cascade;

-- TABELAS ---------------------------------------------------------------------
create table public.clients (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null unique,
  logo_url text,
  primary_color text default '#2f5d3a',
  secondary_color text default '#d6a84f',
  pix_key text,
  pix_receiver_name text,
  pix_city text default 'Campinas',
  responsible_name text,
  responsible_whatsapp text,
  responsible_email text,
  privacy_text text default 'Usaremos seus dados apenas para identificar sua participação nesta ação e facilitar futuras ações solidárias. Você pode solicitar remoção a qualquer momento.',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.app_users (
  id uuid primary key default gen_random_uuid(),
  auth_user_id uuid unique references auth.users(id) on delete cascade,
  client_id uuid references public.clients(id) on delete set null,
  role text not null default 'client_admin' check (role in ('owner','client_admin','operator','viewer')),
  name text,
  email text not null,
  created_at timestamptz not null default now()
);

create table public.campaigns (
  id uuid primary key default gen_random_uuid(),
  client_id uuid not null references public.clients(id) on delete cascade,
  slug text not null unique,
  type text not null default 'numbers_quotas' check (type in ('numbers','quotas','numbers_quotas','crowdfunding','auction','direct_items','repasse')),
  title text not null,
  subtitle text,
  story text,
  prize_title text,
  prize_description text,
  prize_image_url text,
  main_image_url text,
  starts_at timestamptz,
  ends_at timestamptz,
  status text not null default 'draft' check (status in ('draft','active','paused','closed','accountability_published')),
  target_amount_cents integer not null default 0,
  extended_amount_cents integer not null default 0,
  impact_unit text not null default 'kg de ração',
  impact_value_cents integer not null default 0,
  number_count integer not null default 0,
  number_price_cents integer not null default 0,
  pix_key text,
  pix_receiver_name text,
  pix_city text,
  regulation_text text,
  data_consent_text text default 'Estou ciente de que meus dados serão usados para confirmar minha participação nesta ação e para facilitar futuras ações solidárias, sem necessidade de preencher tudo novamente.',
  show_buyer_names boolean not null default true,
  reservation_minutes integer not null default 1440,
  created_by uuid references public.app_users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.campaign_numbers (
  id uuid primary key default gen_random_uuid(),
  campaign_id uuid not null references public.campaigns(id) on delete cascade,
  number integer not null,
  status text not null default 'available' check (status in ('available','reserved','pending_approval','confirmed','canceled')),
  participant_id uuid,
  contribution_id uuid,
  buyer_display_name text,
  reserved_until timestamptz,
  confirmed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (campaign_id, number)
);

create table public.campaign_quotas (
  id uuid primary key default gen_random_uuid(),
  campaign_id uuid not null references public.campaigns(id) on delete cascade,
  title text not null,
  description text,
  amount_cents integer not null,
  impact_qty numeric(10,2),
  is_active boolean not null default true,
  sort_order integer not null default 0,
  created_at timestamptz not null default now()
);

create table public.participants (
  id uuid primary key default gen_random_uuid(),
  client_id uuid not null references public.clients(id) on delete cascade,
  name text not null,
  phone text not null,
  email text,
  consent_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (client_id, phone)
);

alter table public.campaign_numbers
  add constraint campaign_numbers_participant_fk foreign key (participant_id) references public.participants(id) on delete set null;

create table public.contributions (
  id uuid primary key default gen_random_uuid(),
  campaign_id uuid not null references public.campaigns(id) on delete cascade,
  participant_id uuid not null references public.participants(id) on delete cascade,
  type text not null default 'numbers' check (type in ('numbers','quota','mixed','donation','auction','direct_item','repasse')),
  status text not null default 'pending_approval' check (status in ('pending_approval','approved','rejected','canceled')),
  amount_cents integer not null,
  selected_numbers integer[] not null default '{}',
  selected_quotas jsonb not null default '[]'::jsonb,
  proof_file_path text,
  acompanhamento_token text not null unique default encode(gen_random_bytes(24), 'hex'),
  note text,
  approved_by uuid references public.app_users(id) on delete set null,
  approved_at timestamptz,
  rejected_reason text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.campaign_numbers
  add constraint campaign_numbers_contribution_fk foreign key (contribution_id) references public.contributions(id) on delete set null;

create table public.repasse_rules (
  id uuid primary key default gen_random_uuid(),
  campaign_id uuid not null references public.campaigns(id) on delete cascade,
  rule_type text not null check (rule_type in ('percent_gross','percent_profit','fixed_total','fixed_per_unit','matched_donation')),
  label text not null,
  percent numeric(5,2),
  fixed_amount_cents integer,
  max_amount_cents integer,
  notes text,
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

create table public.campaign_updates (
  id uuid primary key default gen_random_uuid(),
  campaign_id uuid not null references public.campaigns(id) on delete cascade,
  title text not null,
  body text not null,
  image_url text,
  is_public boolean not null default true,
  created_at timestamptz not null default now()
);

create table public.campaign_accountability (
  id uuid primary key default gen_random_uuid(),
  campaign_id uuid not null references public.campaigns(id) on delete cascade,
  final_amount_cents integer,
  final_impact_qty numeric(10,2),
  receipt_url text,
  photos jsonb not null default '[]'::jsonb,
  thank_you_text text,
  draw_result_text text,
  published_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.message_templates (
  id uuid primary key default gen_random_uuid(),
  campaign_id uuid not null references public.campaigns(id) on delete cascade,
  channel text not null default 'whatsapp' check (channel in ('whatsapp','email')),
  purpose text not null,
  title text not null,
  body text not null,
  sort_order integer not null default 0,
  created_at timestamptz not null default now()
);

create table public.audit_logs (
  id uuid primary key default gen_random_uuid(),
  actor_user_id uuid references public.app_users(id) on delete set null,
  client_id uuid references public.clients(id) on delete set null,
  campaign_id uuid references public.campaigns(id) on delete set null,
  action text not null,
  payload jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

-- TRIGGERS --------------------------------------------------------------------
create or replace function public.touch_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger trg_clients_updated before update on public.clients for each row execute function public.touch_updated_at();
create trigger trg_campaigns_updated before update on public.campaigns for each row execute function public.touch_updated_at();
create trigger trg_campaign_numbers_updated before update on public.campaign_numbers for each row execute function public.touch_updated_at();
create trigger trg_participants_updated before update on public.participants for each row execute function public.touch_updated_at();
create trigger trg_contributions_updated before update on public.contributions for each row execute function public.touch_updated_at();
create trigger trg_accountability_updated before update on public.campaign_accountability for each row execute function public.touch_updated_at();

create or replace function public.create_campaign_numbers()
returns trigger language plpgsql as $$
begin
  if new.number_count > 0 then
    insert into public.campaign_numbers (campaign_id, number)
    select new.id, gs from generate_series(1, new.number_count) gs
    on conflict (campaign_id, number) do nothing;
  end if;
  return new;
end;
$$;

create trigger trg_campaign_create_numbers after insert on public.campaigns for each row execute function public.create_campaign_numbers();

-- RLS -------------------------------------------------------------------------
alter table public.clients enable row level security;
alter table public.app_users enable row level security;
alter table public.campaigns enable row level security;
alter table public.campaign_numbers enable row level security;
alter table public.campaign_quotas enable row level security;
alter table public.participants enable row level security;
alter table public.contributions enable row level security;
alter table public.repasse_rules enable row level security;
alter table public.campaign_updates enable row level security;
alter table public.campaign_accountability enable row level security;
alter table public.message_templates enable row level security;
alter table public.audit_logs enable row level security;

create or replace function public.is_owner()
returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.app_users where auth_user_id = auth.uid() and role = 'owner');
$$;

create or replace function public.is_client_member(target_client uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from public.app_users
    where auth_user_id = auth.uid()
      and (role = 'owner' or client_id = target_client)
  );
$$;

create policy "public read clients" on public.clients for select using (true);
create policy "public read active campaigns" on public.campaigns for select using (status in ('active','closed','accountability_published'));
create policy "public read campaign numbers" on public.campaign_numbers for select using (
  exists (select 1 from public.campaigns c where c.id = campaign_id and c.status in ('active','closed','accountability_published'))
);
create policy "public read active quotas" on public.campaign_quotas for select using (
  is_active and exists (select 1 from public.campaigns c where c.id = campaign_id and c.status in ('active','closed','accountability_published'))
);
create policy "public read public updates" on public.campaign_updates for select using (is_public);

create policy "app users can read themselves" on public.app_users for select using (auth_user_id = auth.uid() or public.is_owner());

create policy "members read campaigns" on public.campaigns for all using (public.is_client_member(client_id)) with check (public.is_client_member(client_id));
create policy "members read numbers" on public.campaign_numbers for all using (
  exists (select 1 from public.campaigns c where c.id = campaign_id and public.is_client_member(c.client_id))
) with check (
  exists (select 1 from public.campaigns c where c.id = campaign_id and public.is_client_member(c.client_id))
);
create policy "members read quotas" on public.campaign_quotas for all using (
  exists (select 1 from public.campaigns c where c.id = campaign_id and public.is_client_member(c.client_id))
) with check (
  exists (select 1 from public.campaigns c where c.id = campaign_id and public.is_client_member(c.client_id))
);
create policy "members read participants" on public.participants for select using (public.is_client_member(client_id));
create policy "members read contributions" on public.contributions for all using (
  exists (select 1 from public.campaigns c where c.id = campaign_id and public.is_client_member(c.client_id))
) with check (
  exists (select 1 from public.campaigns c where c.id = campaign_id and public.is_client_member(c.client_id))
);

-- VIEWS -----------------------------------------------------------------------
create view public.clients_public with (security_invoker = true) as
select id, name, slug, logo_url, primary_color, secondary_color from public.clients;

create view public.campaigns_public with (security_invoker = true) as
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

create view public.campaign_numbers_public with (security_invoker = true) as
select
  n.campaign_id,
  n.number,
  n.status,
  case when c.show_buyer_names and n.status in ('pending_approval','confirmed') then n.buyer_display_name else null end as buyer_display_name
from public.campaign_numbers n
join public.campaigns c on c.id = n.campaign_id;

create view public.campaign_quotas_public with (security_invoker = true) as
select id, campaign_id, title, description, amount_cents, impact_qty, is_active, sort_order
from public.campaign_quotas
where is_active = true;

create view public.campaign_stats_public as
select
  c.id as campaign_id,
  coalesce(sum(con.amount_cents) filter (where con.status = 'approved'), 0)::integer as confirmed_amount_cents,
  coalesce(sum(con.amount_cents) filter (where con.status = 'pending_approval'), 0)::integer as pending_amount_cents,
  coalesce(count(con.id) filter (where con.status = 'approved'), 0)::integer as confirmed_count,
  coalesce(count(con.id) filter (where con.status = 'pending_approval'), 0)::integer as pending_count
from public.campaigns c
left join public.contributions con on con.campaign_id = c.id
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
  con.created_at
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
  cl.name as client_name
from public.contributions con
join public.participants p on p.id = con.participant_id
join public.campaigns ca on ca.id = con.campaign_id
join public.clients cl on cl.id = ca.client_id;

-- GRANTS ----------------------------------------------------------------------
grant usage on schema public to anon, authenticated;
grant select on public.clients, public.campaigns, public.campaign_numbers, public.campaign_quotas, public.campaign_updates to anon, authenticated;
grant select on public.clients_public, public.campaigns_public, public.campaign_numbers_public, public.campaign_quotas_public, public.campaign_stats_public to anon, authenticated;
grant select on public.app_users, public.participants, public.contributions, public.repasse_rules, public.campaign_accountability, public.message_templates, public.audit_logs to authenticated;
grant insert, update, delete on public.clients, public.app_users, public.campaigns, public.campaign_numbers, public.campaign_quotas, public.participants, public.contributions, public.repasse_rules, public.campaign_updates, public.campaign_accountability, public.message_templates, public.audit_logs to authenticated;

-- STORAGE ---------------------------------------------------------------------
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'proofs',
  'proofs',
  false,
  10485760,
  array['image/jpeg','image/png','image/webp','application/pdf']
)
on conflict (id) do update set public = excluded.public, file_size_limit = excluded.file_size_limit, allowed_mime_types = excluded.allowed_mime_types;

-- SEED: CLIENTE E CAMPANHA PILOTO --------------------------------------------
insert into public.clients (
  name,
  slug,
  logo_url,
  primary_color,
  secondary_color,
  pix_key,
  pix_receiver_name,
  pix_city,
  responsible_name,
  responsible_email,
  privacy_text
) values (
  'Sementinha Petz / Tucxa',
  'sementinha-petz',
  '/images/logo-sementinha-petz.jpeg',
  '#2f5d3a',
  '#d6a84f',
  '58.392.598/0001-91',
  'TUCXA',
  'Campinas',
  'Laércio',
  'impactonocontrole@gmail.com',
  'Usaremos seus dados apenas para confirmar sua participação nesta ação e facilitar futuras ações solidárias. Você pode solicitar remoção a qualquer momento.'
);

insert into public.campaigns (
  client_id,
  slug,
  type,
  title,
  subtitle,
  story,
  prize_title,
  prize_description,
  prize_image_url,
  main_image_url,
  status,
  target_amount_cents,
  extended_amount_cents,
  impact_unit,
  impact_value_cents,
  number_count,
  number_price_cents,
  pix_key,
  pix_receiver_name,
  pix_city,
  regulation_text,
  data_consent_text
)
select
  cl.id,
  'sao-francisco-em-racao',
  'numbers_quotas',
  'São Francisco em Ação',
  '40 kg de amor: transforme uma imagem de São Francisco em alimento real para cães e gatos.',
  'A imagem de São Francisco foi doada pela Claudia, da corrente. A proposta é transformar essa doação em ração para cães e gatos, com transparência, carinho e prestação de contas para todos que participarem.',
  'Imagem de São Francisco',
  'Ao participar da ação com números, você concorre à imagem de São Francisco doada pela Claudia. Mais do que o prêmio, o objetivo é alimentar cães e gatos que precisam.',
  '/images/sao-francisco.jpeg',
  '/images/sao-francisco.jpeg',
  'active',
  65000,
  80000,
  'kg de ração',
  1344,
  80,
  1000,
  '58.392.598/0001-91',
  'TUCXA',
  'Campinas',
  'Ação solidária com 80 números a R$ 10,00 cada. A participação só será confirmada após conferência do Pix pela organização. Caso algum número não seja aprovado, ele poderá voltar a ficar disponível. Para ações públicas ou de maior alcance, recomenda-se validar as regras aplicáveis a sorteios, promoções e arrecadações.',
  'Estou ciente de que meus dados serão usados para confirmar minha participação nesta ação e para facilitar futuras ações solidárias, sem necessidade de preencher tudo novamente. Posso solicitar remoção depois.'
from public.clients cl
where cl.slug = 'sementinha-petz';

insert into public.campaign_quotas (campaign_id, title, description, amount_cents, impact_qty, sort_order)
select ca.id, '1 kg de amor', 'Ajuda simbólica equivalente a aproximadamente 1 kg de ração.', 1500, 1, 1 from public.campaigns ca where ca.slug = 'sao-francisco-em-racao'
union all
select ca.id, '2 kg de amor', 'Para quem quer dobrar o impacto da participação.', 3000, 2, 2 from public.campaigns ca where ca.slug = 'sao-francisco-em-racao'
union all
select ca.id, '5 kg de amor', 'Uma ajuda forte para acelerar a meta da ação.', 7500, 5, 3 from public.campaigns ca where ca.slug = 'sao-francisco-em-racao'
union all
select ca.id, '10 kg de amor', 'Cota especial para padrinhos da ração.', 15000, 10, 4 from public.campaigns ca where ca.slug = 'sao-francisco-em-racao';

insert into public.message_templates (campaign_id, channel, purpose, title, body, sort_order)
select ca.id, 'whatsapp', 'launch', 'Mensagem de lançamento',
'Pessoal, estamos iniciando a ação São Francisco em Ação 🐾\n\nA imagem de São Francisco foi doada pela Claudia e queremos transformar essa doação em ração para cães e gatos.\n\nCada número custa R$ 10, e também é possível ajudar com cotas “1 kg de amor”. A meta ideal é chegar em R$ 650, o que representa aproximadamente 40 kg ou mais de ração, dependendo da compra.\n\nQuem puder participar, escolha seus números ou uma cota pela página da ação. O Pix é conferido pela organização antes da confirmação.\n\nMais do que concorrer ao prêmio, a ideia é transformar carinho em alimento real.', 1
from public.campaigns ca where ca.slug = 'sao-francisco-em-racao'
union all
select ca.id, 'whatsapp', 'progress', 'Mensagem de andamento',
'Atualização da ação São Francisco em Ação 🐾\n\nJá arrecadamos R$ [VALOR], o que representa aproximadamente [KG] kg de ração para cães e gatos.\n\nFaltam R$ [FALTA] para bater a meta ideal. Quem ainda quiser participar pode escolher um número ou doar uma cota “1 kg de amor”.\n\nObrigado a todos que já ajudaram. A prestação de contas será compartilhada ao final.', 2
from public.campaigns ca where ca.slug = 'sao-francisco-em-racao'
union all
select ca.id, 'whatsapp', 'last_call', 'Última chamada',
'Última chamada para a ação São Francisco em Ação 🐾\n\nEstamos perto de fechar a campanha. Ainda dá tempo de escolher um número ou contribuir com uma cota “1 kg de amor”.\n\nCada participação ajuda a transformar a imagem de São Francisco em ração para cães e gatos. Quem puder, participe e compartilhe com alguém que também ame essa causa.', 3
from public.campaigns ca where ca.slug = 'sao-francisco-em-racao'
union all
select ca.id, 'whatsapp', 'accountability', 'Prestação de contas',
'Prestação de contas da ação São Francisco em Ação 🐾\n\nArrecadamos R$ [VALOR_FINAL] e isso foi transformado em [KG_FINAL] kg de ração para cães e gatos.\n\nNossa gratidão a todos que participaram, divulgaram e ajudaram. A imagem de São Francisco cumpriu seu propósito: virar alimento, cuidado e amor em ação.', 4
from public.campaigns ca where ca.slug = 'sao-francisco-em-racao';

-- VINCULAR USUÁRIO ADMIN ------------------------------------------------------
-- 1) No Supabase, vá em Authentication > Users > Add user.
-- 2) Crie o usuário impactonocontrole@gmail.com com uma senha temporária.
-- 3) Rode este bloco novamente se o usuário ainda não existia quando você executou o script completo.
insert into public.app_users (auth_user_id, client_id, role, name, email)
select u.id, null, 'owner', 'Impacto no Controle', 'impactonocontrole@gmail.com'
from auth.users u
where u.email = 'impactonocontrole@gmail.com'
on conflict (auth_user_id) do update set role = excluded.role, name = excluded.name, email = excluded.email;

-- VINCULAR USUÁRIO CLIENTE SEMENTINHA PETZ -----------------------------------
-- 1) No Supabase, crie o usuário sementinhapetz@gmail.com em Authentication > Users.
-- 2) Rode este bloco para vincular o login ao cliente Sementinha Petz / Tucxa.
insert into public.app_users (auth_user_id, client_id, role, name, email)
select u.id, cl.id, 'client_admin', 'Sementinha Petz', 'sementinhapetz@gmail.com'
from auth.users u
cross join public.clients cl
where u.email = 'sementinhapetz@gmail.com'
  and cl.slug = 'sementinha-petz'
on conflict (auth_user_id) do update set client_id = excluded.client_id, role = excluded.role, name = excluded.name, email = excluded.email;
