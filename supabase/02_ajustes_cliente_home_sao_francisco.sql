-- Impacto no Controle - Ajustes: área do cliente, imagens, campanha São Francisco em Ação e acesso Sementinha Petz
-- Rode no SQL Editor do Supabase após já ter executado o script inicial.

-- 1) Atualizar cliente piloto com logo e dados visuais
update public.clients
set
  logo_url = '/images/logo-sementinha-petz.jpeg',
  primary_color = '#2f5d3a',
  secondary_color = '#d6a84f',
  responsible_email = coalesce(responsible_email, 'impactonocontrole@gmail.com'),
  updated_at = now()
where slug = 'sementinha-petz';

-- 2) Atualizar campanha piloto para São Francisco em Ação
update public.campaigns
set
  title = 'São Francisco em Ação',
  subtitle = '40 kg de amor: transforme uma imagem de São Francisco em alimento real para cães e gatos.',
  story = 'A imagem de São Francisco foi doada pela Claudia, da corrente. A proposta é transformar essa doação em ração para cães e gatos, com transparência, carinho e prestação de contas para todos que participarem.',
  prize_title = 'Imagem de São Francisco',
  prize_description = 'Ao participar da ação com números, você concorre à imagem de São Francisco doada pela Claudia. Mais do que o prêmio, o objetivo é alimentar cães e gatos que precisam.',
  prize_image_url = '/images/sao-francisco.jpeg',
  main_image_url = '/images/sao-francisco.jpeg',
  status = 'active',
  number_count = 80,
  number_price_cents = 1000,
  target_amount_cents = 65000,
  extended_amount_cents = 80000,
  impact_unit = 'kg de ração',
  impact_value_cents = 1344,
  pix_key = '58.392.598/0001-91',
  pix_receiver_name = 'TUCXA',
  pix_city = 'Campinas',
  regulation_text = 'Ação solidária com 80 números a R$ 10,00 cada. A participação só será confirmada após conferência do Pix pela organização. Caso algum número não seja aprovado, ele poderá voltar a ficar disponível. Para ações públicas ou de maior alcance, recomenda-se validar as regras aplicáveis a sorteios, promoções e arrecadações.',
  data_consent_text = 'Estou ciente de que meus dados serão usados para confirmar minha participação nesta ação e para facilitar futuras ações solidárias, sem necessidade de preencher tudo novamente. Posso solicitar remoção depois.',
  updated_at = now()
where slug = 'sao-francisco-em-racao';

-- 3) Garantir 80 números na campanha
insert into public.campaign_numbers (campaign_id, number)
select ca.id, gs.number
from public.campaigns ca
cross join generate_series(1, 80) as gs(number)
where ca.slug = 'sao-francisco-em-racao'
on conflict (campaign_id, number) do nothing;

-- 4) Atualizar a view pública para retornar logo e cores do cliente
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

-- 5) Vincular usuário do cliente Sementinha Petz ao cliente correto
-- Importante: antes, crie o usuário em Authentication > Users com o e-mail sementinhapetz@gmail.com.
insert into public.app_users (auth_user_id, client_id, role, name, email)
select u.id, cl.id, 'client_admin', 'Sementinha Petz', 'sementinhapetz@gmail.com'
from auth.users u
cross join public.clients cl
where u.email = 'sementinhapetz@gmail.com'
  and cl.slug = 'sementinha-petz'
on conflict (auth_user_id) do update
set client_id = excluded.client_id,
    role = excluded.role,
    name = excluded.name,
    email = excluded.email;

-- 6) Manter usuário master da Automação Extrema como owner, se existir no Auth
insert into public.app_users (auth_user_id, client_id, role, name, email)
select u.id, null, 'owner', 'Impacto no Controle', 'impactonocontrole@gmail.com'
from auth.users u
where u.email = 'impactonocontrole@gmail.com'
on conflict (auth_user_id) do update
set client_id = excluded.client_id,
    role = excluded.role,
    name = excluded.name,
    email = excluded.email;
