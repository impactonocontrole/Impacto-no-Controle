import Link from "next/link";
import { notFound } from "next/navigation";
import { PublicHeader } from "@/components/PublicHeader";
import { createSupabasePublicClient } from "@/lib/supabase/public";
import { formatMoneyFromCents, kgFromAmount } from "@/lib/format";

type PageProps = { params: Promise<{ cliente: string }> };

export const revalidate = 0;

export default async function ClientActionsPage({ params }: PageProps) {
  const { cliente } = await params;
  const supabase = createSupabasePublicClient();
  const { data: client } = await supabase.from("clients_public").select("*").eq("slug", cliente).maybeSingle();
  if (!client) notFound();

  const { data: campaigns } = await supabase.from("campaigns_public").select("*").eq("client_slug", cliente).order("created_at", { ascending: false });
  const ids = (campaigns || []).map((c) => c.id);
  const { data: stats } = ids.length ? await supabase.from("campaign_stats_public").select("*").in("campaign_id", ids) : { data: [] as any[] };

  return (
    <>
      <PublicHeader />
      <main className="container-page py-8">
        <div className="card p-6">
          <span className="badge">Ações solidárias</span>
          <h1 className="mt-3 text-3xl font-black text-[var(--brand-dark)]">{client.name}</h1>
          <p className="mt-2 text-[var(--muted)]">Escolha uma ação para participar ou acompanhar.</p>
        </div>
        <div className="mt-6 grid gap-4 md:grid-cols-2">
          {(campaigns || []).map((campaign) => {
            const stat = stats?.find((s) => s.campaign_id === campaign.id);
            return (
              <Link key={campaign.id} href={`/acao/${campaign.slug}`} className="card block overflow-hidden hover:shadow-lg">
                <div className="p-5">
                  <span className="badge">{campaign.status === "active" ? "Ativa" : "Campanha"}</span>
                  <h2 className="mt-3 text-2xl font-black text-[var(--brand-dark)]">{campaign.title}</h2>
                  <p className="mt-2 text-[var(--muted)] line-clamp-3">{campaign.story}</p>
                  <div className="mt-4 grid grid-cols-2 gap-3">
                    <div><p className="text-sm text-[var(--muted)]">Arrecadado</p><strong>{formatMoneyFromCents(stat?.confirmed_amount_cents || 0)}</strong></div>
                    <div><p className="text-sm text-[var(--muted)]">Impacto</p><strong>{kgFromAmount(stat?.confirmed_amount_cents || 0, campaign.impact_value_cents)} kg</strong></div>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      </main>
    </>
  );
}
