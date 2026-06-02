-- Limpa somente dados relacionados às aquisições/participações.
-- Preserva clientes, campanhas, cotas, configurações, mensagens e usuários.
-- Rode no SQL Editor do Supabase quando quiser zerar os testes de aquisição.

begin;

-- 1) Volta todos os números para disponíveis.
update public.campaign_numbers
set
  status = 'available',
  participant_id = null,
  contribution_id = null,
  buyer_display_name = null,
  reserved_until = null,
  confirmed_at = null,
  updated_at = now()
where status <> 'available'
   or participant_id is not null
   or contribution_id is not null
   or buyer_display_name is not null
   or reserved_until is not null
   or confirmed_at is not null;

-- 2) Remove arquivos de comprovantes do bucket proofs, caso existam.
delete from storage.objects
where bucket_id = 'proofs';

-- 3) Remove aquisições/participações.
delete from public.contributions;

-- 4) Remove participantes que não têm mais aquisição vinculada.
delete from public.participants p
where not exists (
  select 1
  from public.contributions c
  where c.participant_id = p.id
);

commit;
