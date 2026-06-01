export function formatMoneyFromCents(cents: number | null | undefined) {
  const value = (cents || 0) / 100;
  return value.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

export function onlyDigits(value: string) {
  return value.replace(/\D/g, "");
}

export function normalizePhone(value: string) {
  return onlyDigits(value).slice(0, 14);
}

export function buyerDisplayName(name: string, phone?: string | null) {
  const clean = name.trim().replace(/\s+/g, " ");
  const parts = clean.split(" ");
  const first = parts[0] || "Participante";
  const lastInitial = parts.length > 1 ? ` ${parts[parts.length - 1][0]}.` : "";
  const suffix = phone ? ` • ${phone.slice(-4)}` : "";
  return `${first}${lastInitial}${suffix}`;
}

export function kgFromAmount(amountCents: number, impactValueCents: number) {
  if (!impactValueCents) return 0;
  return Math.floor((amountCents / impactValueCents) * 10) / 10;
}
