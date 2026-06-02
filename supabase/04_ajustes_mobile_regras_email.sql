-- Ajustes incrementais: remove texto jurídico da página pública e mantém regras limpas para leads.
-- Rode no SQL Editor do Supabase.

update public.campaigns
set regulation_text = trim(regexp_replace(
  coalesce(regulation_text, ''),
  '\s*Para ações públicas ou de maior alcance, recomenda-se validar as regras aplicáveis a sorteios, promoções e arrecadações\.?',
  '',
  'gi'
))
where slug = 'sao-francisco-em-racao';
