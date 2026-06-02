-- Impacto no Controle - limpar somente aquisições/testes no banco
-- Preserva clientes, campanhas, configurações, cotas, mensagens e usuários.
-- Não apaga arquivos do Supabase Storage, pois o Supabase bloqueia delete direto em storage.objects.

begin;

-- 1) Liberar todos os números das campanhas, deixando-os disponíveis novamente.
update public.campaign_numbers
set
  status = 'available',
  participant_id = null,
  contribution_id = null,
  buyer_display_name = null,
  reserved_until = null,
  confirmed_at = null
where campaign_id in (
  select id from public.campaigns
);

-- 2) Apagar aquisições/participações registradas.
delete from public.contributions;

-- 3) Apagar participantes que ficaram sem nenhuma aquisição vinculada.
delete from public.participants p
where not exists (
  select 1
  from public.contributions c
  where c.participant_id = p.id
);

commit;
