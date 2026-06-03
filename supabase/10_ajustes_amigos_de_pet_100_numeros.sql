-- Impacto no Controle - Ajustes Amigos de Pet / São Francisco em Ação
-- Rode no Supabase > SQL Editor.
-- Objetivo: migrar a campanha de Sementinha Petz/Tucxa para ONG Amigos de Pet,
-- atualizar identidade visual, Pix, 100 números e mensagens prontas de WhatsApp.

begin;

-- 1) Garantir o cliente ONG Amigos de Pet e migrar qualquer vínculo antigo do Sementinha.
do $$
declare
  v_old_client uuid;
  v_new_client uuid;
begin
  select id into v_old_client from public.clients where slug = 'sementinha-petz';
  select id into v_new_client from public.clients where slug = 'amigos-de-pet';

  if v_new_client is null and v_old_client is not null then
    update public.clients
    set
      name = 'ONG Amigos de Pet',
      slug = 'amigos-de-pet',
      logo_url = '/images/amigos-de-pet-icon.jpg',
      primary_color = '#A91583',
      secondary_color = '#F45AC0',
      pix_key = '38.626.039/0001-91',
      pix_receiver_name = 'AMIGOS DE PET',
      pix_city = 'Campinas',
      responsible_name = 'Laércio',
      responsible_email = 'impactonocontrole@gmail.com',
      updated_at = now()
    where id = v_old_client
    returning id into v_new_client;
  elsif v_new_client is null then
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
      'ONG Amigos de Pet',
      'amigos-de-pet',
      '/images/amigos-de-pet-icon.jpg',
      '#A91583',
      '#F45AC0',
      '38.626.039/0001-91',
      'AMIGOS DE PET',
      'Campinas',
      'Laércio',
      'impactonocontrole@gmail.com',
      'Usaremos seus dados apenas para confirmar sua participação nesta ação e facilitar futuras ações solidárias. Você pode solicitar remoção a qualquer momento.'
    ) returning id into v_new_client;
  else
    update public.clients
    set
      name = 'ONG Amigos de Pet',
      logo_url = '/images/amigos-de-pet-icon.jpg',
      primary_color = '#A91583',
      secondary_color = '#F45AC0',
      pix_key = '38.626.039/0001-91',
      pix_receiver_name = 'AMIGOS DE PET',
      pix_city = 'Campinas',
      responsible_name = 'Laércio',
      responsible_email = 'impactonocontrole@gmail.com',
      updated_at = now()
    where id = v_new_client;
  end if;

  if v_old_client is not null and v_new_client is not null and v_old_client <> v_new_client then
    update public.campaigns set client_id = v_new_client where client_id = v_old_client;
    update public.app_users set client_id = v_new_client where client_id = v_old_client;
    delete from public.clients where id = v_old_client;
  end if;
end $$;

-- 2) Atualizar campanha São Francisco em Ação para Amigos de Pet, 100 números e novo Pix.
update public.campaigns ca
set
  client_id = cl.id,
  type = 'numbers',
  title = 'São Francisco em Ação',
  subtitle = '40 kg de amor: transforme uma imagem de São Francisco em alimento real para cães e gatos.',
  story = 'A imagem de São Francisco foi doada e será sorteada entre os participantes. A proposta é transformar essa doação em ração para cães e gatos, com transparência, carinho e prestação de contas para todos que participarem.',
  prize_title = 'Imagem de São Francisco',
  prize_description = 'Ao participar da ação com números, você concorre à imagem de São Francisco doada. Mais do que o prêmio, o objetivo é alimentar cães e gatos que precisam.',
  status = case when ca.status = 'draft' then 'active' else ca.status end,
  target_amount_cents = 65000,
  extended_amount_cents = 100000,
  impact_unit = 'kg de ração',
  impact_value_cents = 1344,
  number_count = 100,
  number_price_cents = 1000,
  pix_key = '38.626.039/0001-91',
  pix_receiver_name = 'AMIGOS DE PET',
  pix_city = 'Campinas',
  ends_at = '2026-06-24 23:59:59-03'::timestamptz,
  regulation_text = 'Ação solidária com 100 números a R$ 10,00 cada. A participação só será confirmada após conferência do Pix pela organização. Caso algum número não seja aprovado, ele poderá voltar a ficar disponível.

A campanha encerra-se em 24/06/2026. O sorteio será feito em 25/06/2026 e será divulgado vídeo com o número e o nome do ganhador.',
  data_consent_text = 'Estou ciente de que meus dados serão usados para confirmar minha participação nesta ação e para facilitar futuras ações solidárias, sem necessidade de preencher tudo novamente. Posso solicitar remoção depois.'
from public.clients cl
where ca.slug = 'sao-francisco-em-racao'
  and cl.slug = 'amigos-de-pet';

-- 3) Garantir os 100 números e remover números acima de 100, se existirem.
insert into public.campaign_numbers (campaign_id, number)
select ca.id, gs
from public.campaigns ca
cross join generate_series(1, 100) gs
where ca.slug = 'sao-francisco-em-racao'
on conflict (campaign_id, number) do nothing;

delete from public.campaign_numbers n
using public.campaigns ca
where n.campaign_id = ca.id
  and ca.slug = 'sao-francisco-em-racao'
  and n.number > 100;

-- 4) Atualizar mensagens prontas de WhatsApp.
delete from public.message_templates
where campaign_id in (select id from public.campaigns where slug = 'sao-francisco-em-racao')
  and channel = 'whatsapp';

insert into public.message_templates (campaign_id, channel, purpose, title, body, sort_order)
select ca.id, 'whatsapp', 'launch', 'Mensagem de lançamento', $$Bom dia, pessoal!

Estamos iniciando a ação São Francisco em Ação 🐾, uma campanha especial para transformar carinho em alimento real para cães e gatos.

A imagem de São Francisco foi doada e será sorteada entre os participantes. Cada número da rifa custa R$ 10,00.

A nossa meta ideal é arrecadar R$ 650,00, valor que representa aproximadamente 40 kg ou mais de ração, dependendo da compra.

Para facilitar a participação, vamos utilizar o sistema Impacto no Controle, solução prática, rápida e segura da empresa Automação Extrema (https://automacao-extrema.vercel.app/) do Márcio Alexandre.

Para participar, basta acessar o link abaixo, escolher o número, e a própria página irá gerar um QR Code para pagamento diretamente no CNPJ do Amigos de Pet.

[LINK_ACAO]

Depois de pagar pelo seu banco, você mesmo envia o comprovante pela página da ação. Assim, a contabilidade já fica organizada na hora e todos já podem acompanhar.

Caso alguém tenha qualquer dúvida, pode falar com o Márcio Alexandre, que ajudará no processo.

A campanha ficará aberta até o dia 24/06/2026. No dia 25/06/2026, colocaremos todos os nomes em uma caixa, gravaremos o sorteio e publicaremos o vídeo aqui para todos acompanharem.

Mais do que concorrer ao prêmio, essa ação é uma forma de transformar amor, fé e solidariedade em ração para quem precisa.

Boa sorte a todos e muito obrigado pela participação! 🙏🐾$$,
1
from public.campaigns ca where ca.slug = 'sao-francisco-em-racao'
union all
select ca.id, 'whatsapp', 'progress', 'Mensagem de andamento', $$Atualização da ação São Francisco em Ação 🐾

Já arrecadamos [VALOR], o que representa aproximadamente [KG] kg de ração para cães e gatos.

A meta ideal é R$ 650,00. Faltam [FALTA] para bater essa meta.

Quem ainda quiser participar pode escolher um número disponível por R$ 10,00 na página da ação:

[LINK_ANDAMENTO]

A campanha encerra em 24/06/2026 e o sorteio será em 25/06/2026, com vídeo do número e nome do ganhador.

Gratidão a todos que já ajudaram a transformar amor em alimento real. 🙏🐾$$,
2
from public.campaigns ca where ca.slug = 'sao-francisco-em-racao'
union all
select ca.id, 'whatsapp', 'last_call', 'Última chamada', $$Última chamada para a ação São Francisco em Ação 🐾

A campanha encerra em 24/06/2026. Ainda dá tempo de escolher um número por R$ 10,00 e participar do sorteio da imagem de São Francisco.

O sorteio será feito em 25/06/2026, com divulgação em vídeo do número e nome do ganhador.

Participe ou compartilhe com alguém que também ama essa causa:

[LINK_ULTIMA_CHAMADA]

Mais do que concorrer ao prêmio, essa ação transforma fé, amor e solidariedade em ração para cães e gatos. 🙏🐾$$,
3
from public.campaigns ca where ca.slug = 'sao-francisco-em-racao'
union all
select ca.id, 'whatsapp', 'accountability', 'Prestação de contas', $$Prestação de contas da ação São Francisco em Ação 🐾

Arrecadamos [VALOR_FINAL] e isso foi transformado em [KG_FINAL] kg de ração para cães e gatos.

O sorteio foi realizado e divulgado em vídeo, com o número e o nome do ganhador.

Nossa gratidão a todos que participaram, divulgaram e ajudaram a transformar amor, fé e solidariedade em alimento real.

Acompanhe a página da ação:

[LINK_PRESTACAO]$$,
4
from public.campaigns ca where ca.slug = 'sao-francisco-em-racao';

-- 5) Se existir usuário Amigos de Pet já criado no Auth, vincular automaticamente.
insert into public.app_users (auth_user_id, client_id, role, name, email)
select u.id, cl.id, 'client_admin', 'ONG Amigos de Pet', 'amigosdepet@gmail.com'
from auth.users u
cross join public.clients cl
where u.email = 'amigosdepet@gmail.com'
  and cl.slug = 'amigos-de-pet'
on conflict (auth_user_id) do update set client_id = excluded.client_id, role = excluded.role, name = excluded.name, email = excluded.email;

commit;
