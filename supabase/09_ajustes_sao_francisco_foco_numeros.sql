-- Impacto no Controle - Ajustes da campanha Sao Francisco em Acao
-- Rode no Supabase > SQL Editor.
-- Objetivo: manter a campanha focada nos 100 numeros, atualizar datas e mensagens.

begin;

update public.campaigns
set
  ends_at = '2026-06-24 23:59:59-03'::timestamptz,
  subtitle = '40 kg de amor: transforme uma imagem de São Francisco em alimento real para cães e gatos.',
  regulation_text = 'Ação solidária com 100 números a R$ 10,00 cada. A participação só será confirmada após conferência do Pix pela organização. Caso algum número não seja aprovado, ele poderá voltar a ficar disponível.

A campanha encerra-se em 24/06/2026. O sorteio será feito em 25/06/2026 e será divulgado vídeo com o número e o nome do ganhador.'
where slug = 'sao-francisco-em-racao';

-- Mantém as cotas cadastradas para histórico/outros usos, mas a página pública desta campanha
-- foi ajustada no front-end para focar apenas na aquisição dos 100 números.

-- Atualizar mensagens prontas de WhatsApp para refletir o foco nos números e a data de sorteio.
delete from public.message_templates
where campaign_id in (select id from public.campaigns where slug = 'sao-francisco-em-racao')
  and channel = 'whatsapp';

insert into public.message_templates (campaign_id, channel, purpose, title, body, sort_order)
select ca.id, 'whatsapp', 'launch', 'Mensagem de lançamento', $$Pessoal, estamos iniciando a ação São Francisco em Ação 🐾

A imagem de São Francisco foi doada pela Claudia e queremos transformar essa doação em ração para cães e gatos.

Cada número para participar do sorteio custa R$ 10,00. São 100 números disponíveis, e cada participação ajuda a transformar essa imagem em alimento real.

A campanha encerra em 24/06/2026. O sorteio será feito em 25/06/2026, com divulgação em vídeo do número e nome do ganhador.

Participe pela página da ação:
[LINK_ACAO]

Mais do que concorrer ao prêmio, a ideia é transformar carinho em alimento real.$$,
1
from public.campaigns ca where ca.slug = 'sao-francisco-em-racao'
union all
select ca.id, 'whatsapp', 'progress', 'Mensagem de andamento', $$Atualização da ação São Francisco em Ação 🐾

Já arrecadamos [VALOR], o que representa aproximadamente [KG] kg de ração para cães e gatos.

Faltam [FALTA] para bater a meta ideal. Quem ainda quiser participar pode escolher um número disponível.

A campanha encerra em 24/06/2026 e o sorteio será em 25/06/2026, com vídeo do número e nome do ganhador.

Acompanhe ou participe aqui:
[LINK_ANDAMENTO]

Obrigado a todos que já ajudaram. A prestação de contas será compartilhada ao final.$$,
2
from public.campaigns ca where ca.slug = 'sao-francisco-em-racao'
union all
select ca.id, 'whatsapp', 'last_call', 'Última chamada', $$Última chamada para a ação São Francisco em Ação 🐾

A campanha encerra em 24/06/2026. Ainda dá tempo de escolher um número para participar do sorteio da imagem de São Francisco.

O sorteio será feito em 25/06/2026, com divulgação em vídeo do número e nome do ganhador.

Cada número ajuda a transformar a imagem de São Francisco em ração para cães e gatos.

Participe ou compartilhe este link com alguém que também ame essa causa:
[LINK_ULTIMA_CHAMADA]$$,
3
from public.campaigns ca where ca.slug = 'sao-francisco-em-racao'
union all
select ca.id, 'whatsapp', 'accountability', 'Prestação de contas', $$Prestação de contas da ação São Francisco em Ação 🐾

Arrecadamos [VALOR_FINAL] e isso foi transformado em [KG_FINAL] kg de ração para cães e gatos.

Nossa gratidão a todos que participaram, divulgaram e ajudaram. A imagem de São Francisco cumpriu seu propósito: virar alimento, cuidado e amor em ação.

Acompanhe a página da ação:
[LINK_PRESTACAO]$$,
4
from public.campaigns ca where ca.slug = 'sao-francisco-em-racao';

commit;
