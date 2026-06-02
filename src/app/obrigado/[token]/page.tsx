import Link from "next/link";
import { notFound } from "next/navigation";
import { CheckCircle2, Home, Star } from "lucide-react";
import { PublicHeader } from "@/components/PublicHeader";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { formatMoneyFromCents } from "@/lib/format";

type PageProps = { params: Promise<{ token: string }> };

type SelectedQuota = { quota_id: string; qty: number };

export const revalidate = 0;

export default async function ThankYouPage({ params }: PageProps) {
  const { token } = await params;
  const supabase = createSupabaseAdminClient();

  const { data, error } = await supabase
    .from("contribution_tracking")
    .select("*")
    .eq("acompanhamento_token", token)
    .maybeSingle();

  if (error || !data) notFound();

  const selectedQuotas = Array.isArray(data.selected_quotas) ? data.selected_quotas as SelectedQuota[] : [];
  const quotaIds = selectedQuotas.map((item) => item.quota_id).filter(Boolean);
  const { data: quotaRows } = quotaIds.length
    ? await supabase.from("campaign_quotas").select("id,title,amount_cents").in("id", quotaIds)
    : { data: [] as any[] };

  const quotaMap = new Map((quotaRows || []).map((q: any) => [q.id, q]));
  const quotasText = selectedQuotas
    .map((item) => {
      const quota = quotaMap.get(item.quota_id);
      if (!quota) return null;
      return `${item.qty}x ${quota.title}`;
    })
    .filter(Boolean);

  const statusLabel: Record<string, string> = {
    pending_approval: "Aguardando conferência do Pix",
    approved: "Pagamento aprovado",
    rejected: "Pagamento não aprovado",
    canceled: "Cancelado",
  };

  return (
    <>
      <PublicHeader showAccessLinks={false} />
      <main className="container-page py-4 md:py-6">
        <div className="mx-auto max-w-3xl">
          <div className="card p-6 text-center">
            <CheckCircle2 className="mx-auto h-14 w-14 text-[var(--brand)]" />
            <span className="badge mt-4">Obrigado pela participação</span>
            <h1 className="mt-3 text-3xl font-black text-[var(--brand-dark)] md:text-4xl">Sua participação foi registrada.</h1>
            <p className="mt-3 leading-7 text-[var(--muted)]">
              A organização irá conferir o Pix e confirmar o pagamento. Salve esta página para acompanhar tudo com facilidade.
            </p>
          </div>

          <div className="card mt-5 p-6">
            <h2 className="text-2xl font-black text-[var(--brand-dark)]">Resumo da aquisição</h2>
            <div className="mt-5 grid gap-3 sm:grid-cols-2">
              <div className="rounded-2xl bg-[#eef5ec] p-4">
                <p className="text-sm font-bold text-[var(--muted)]">Campanha</p>
                <p className="mt-1 font-extrabold text-[var(--brand-dark)]">{data.campaign_title}</p>
              </div>
              <div className="rounded-2xl bg-[#eef5ec] p-4">
                <p className="text-sm font-bold text-[var(--muted)]">Participante</p>
                <p className="mt-1 font-extrabold text-[var(--brand-dark)]">{data.participant_name}</p>
              </div>
              <div className="rounded-2xl bg-[#eef5ec] p-4">
                <p className="text-sm font-bold text-[var(--muted)]">Valor</p>
                <p className="mt-1 font-extrabold text-[var(--brand-dark)]">{formatMoneyFromCents(data.amount_cents)}</p>
              </div>
              <div className="rounded-2xl bg-[#eef5ec] p-4">
                <p className="text-sm font-bold text-[var(--muted)]">Status</p>
                <p className="mt-1 font-extrabold text-[var(--brand-dark)]">{statusLabel[data.status] || data.status}</p>
              </div>
            </div>

            <div className="mt-5 rounded-2xl border border-[var(--border)] bg-white p-4">
              <p className="font-bold text-[var(--brand-dark)]">Números escolhidos</p>
              <p className="mt-2 text-[var(--muted)]">{data.selected_numbers?.length ? data.selected_numbers.map((n: number) => String(n).padStart(2, "0")).join(", ") : "Nenhum número escolhido. Participação por cota/doação."}</p>
            </div>

            <div className="mt-4 rounded-2xl border border-[var(--border)] bg-white p-4">
              <p className="font-bold text-[var(--brand-dark)]">Cotas escolhidas</p>
              <p className="mt-2 text-[var(--muted)]">{quotasText.length ? quotasText.join("; ") : "Nenhuma cota escolhida."}</p>
            </div>

            <div className="mt-5 flex flex-col gap-3 sm:flex-row">
              <Link className="btn-primary" href={`/acompanhar/${token}`}>Acompanhar participação</Link>
              <Link className="btn-secondary" href={`/acao/${data.campaign_slug}`}>Voltar para a campanha</Link>
            </div>
          </div>

          <div className="card mt-5 p-6">
            <div className="flex gap-3">
              <Star className="mt-1 h-6 w-6 shrink-0 text-[var(--accent)]" />
              <div>
                <h2 className="text-xl font-black text-[var(--brand-dark)]">Salve esta página</h2>
                <p className="mt-2 leading-7 text-[var(--muted)]">
                  Para não perder o acompanhamento, salve esta página nos favoritos do navegador. No celular, você também pode tocar no menu do navegador e escolher “Adicionar à tela inicial” ou “Adicionar aos favoritos”.
                </p>
              </div>
            </div>
            <div className="mt-4 flex gap-3 rounded-2xl bg-[#fff8e8] p-4 text-sm leading-6 text-[var(--brand-dark)]">
              <Home className="mt-1 h-5 w-5 shrink-0" />
              <p>
                O link de acompanhamento mostra se o pagamento ainda está em conferência, aprovado ou se a organização precisa de algum ajuste no comprovante.
              </p>
            </div>
          </div>
        </div>
      </main>
    </>
  );
}
