-- Impacto no Controle - limpeza segura de reservas/aquisições de teste
-- Use quando quiser zerar testes da campanha e liberar todos os números.
-- Não apaga campanhas, clientes, configurações nem imagens.

begin;

-- Libera números vinculados a reservas/aquisições.
update public.campaign_numbers
set
  status = 'available',
  participant_id = null,
  contribution_id = null,
  buyer_display_name = null,
  reserved_until = null,
  confirmed_at = null,
  updated_at = now()
where campaign_id in (select id from public.campaigns where slug = 'sao-francisco-em-racao');

-- Apaga aquisições/reservas da campanha.
delete from public.contributions
where campaign_id in (select id from public.campaigns where slug = 'sao-francisco-em-racao');

-- Remove participantes que ficaram sem nenhuma aquisição vinculada.
delete from public.participants p
where not exists (
  select 1 from public.contributions c where c.participant_id = p.id
);

commit;

-- Observação: arquivos de comprovantes no Storage devem ser removidos pelo painel do Supabase Storage ou pela Storage API.
