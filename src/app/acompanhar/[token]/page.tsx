import { notFound } from "next/navigation";
import Link from "next/link";
import { PublicHeader } from "@/components/PublicHeader";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { formatMoneyFromCents } from "@/lib/format";

type PageProps = { params: Promise<{ token: string }> };

export const revalidate = 0;

export default async function TrackPage({ params }: PageProps) {
  const { token } = await params;
  const supabase = createSupabaseAdminClient();
  const { data, error } = await supabase
    .from("contribution_tracking")
    .select("*")
    .eq("acompanhamento_token", token)
    .maybeSingle();

  if (error || !data) notFound();

  const statusLabel: Record<string, string> = {
    pending_approval: "Aguardando conferência do Pix",
    approved: "Pagamento aprovado",
    rejected: "Pagamento não aprovado",
    canceled: "Cancelado",
  };

  return (
    <>
      <PublicHeader />
      <main className="container-page py-8">
        <div className="card mx-auto max-w-2xl p-6">
          <span className="badge">Acompanhamento</span>
          <h1 className="mt-3 text-3xl font-black text-[var(--brand-dark)]">{data.campaign_title}</h1>
          <p className="mt-3 text-[var(--muted)]">Olá, {data.participant_name}. Aqui você acompanha a sua participação.</p>
          <div className="mt-6 grid gap-3 sm:grid-cols-2">
            <div className="rounded-2xl bg-[#eef5ec] p-4">
              <p className="text-sm font-bold text-[var(--muted)]">Status</p>
              <p className="mt-1 font-extrabold text-[var(--brand-dark)]">{statusLabel[data.status] || data.status}</p>
            </div>
            <div className="rounded-2xl bg-[#eef5ec] p-4">
              <p className="text-sm font-bold text-[var(--muted)]">Valor</p>
              <p className="mt-1 font-extrabold text-[var(--brand-dark)]">{formatMoneyFromCents(data.amount_cents)}</p>
            </div>
          </div>
          <div className="mt-5 rounded-2xl border border-[var(--border)] bg-white p-4">
            <p className="font-bold text-[var(--brand-dark)]">Números escolhidos</p>
            <p className="mt-2 text-[var(--muted)]">{data.selected_numbers?.length ? data.selected_numbers.join(", ") : "Nenhum número escolhido. Participação por cota/doação."}</p>
          </div>
          <Link className="btn-primary mt-6" href={`/acao/${data.campaign_slug}`}>Voltar para a campanha</Link>
        </div>
      </main>
    </>
  );
}
