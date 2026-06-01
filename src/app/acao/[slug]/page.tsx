import { notFound } from "next/navigation";
import { PublicHeader } from "@/components/PublicHeader";
import { createSupabasePublicClient } from "@/lib/supabase/public";
import { formatMoneyFromCents, kgFromAmount } from "@/lib/format";
import { CampaignParticipation } from "@/components/CampaignParticipation";

type PageProps = { params: Promise<{ slug: string }> };

export const revalidate = 0;

export default async function CampaignPage({ params }: PageProps) {
  const { slug } = await params;
  const supabase = createSupabasePublicClient();

  const { data: campaign, error } = await supabase
    .from("campaigns_public")
    .select("*")
    .eq("slug", slug)
    .maybeSingle();

  if (error || !campaign) notFound();

  const [{ data: numbers }, { data: quotas }, { data: stats }] = await Promise.all([
    supabase.from("campaign_numbers_public").select("number,status,buyer_display_name").eq("campaign_id", campaign.id).order("number"),
    supabase.from("campaign_quotas_public").select("id,title,description,amount_cents,impact_qty,sort_order").eq("campaign_id", campaign.id).order("sort_order"),
    supabase.from("campaign_stats_public").select("*").eq("campaign_id", campaign.id).maybeSingle(),
  ]);

  const raised = stats?.confirmed_amount_cents || 0;
  const target = campaign.target_amount_cents || 1;
  const progress = Math.min(100, Math.round((raised / target) * 100));
  const kg = kgFromAmount(raised, campaign.impact_value_cents || 1);

  return (
    <>
      <PublicHeader />
      <main className="container-page py-6 md:py-10">
        <section className="grid gap-6 md:grid-cols-[0.9fr_1.1fr] md:items-start">
          <div className="card overflow-hidden">
            <div className="aspect-[4/3] bg-[#dfe8dd]">
              {campaign.main_image_url ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={campaign.main_image_url} alt={campaign.title} className="h-full w-full object-cover" />
              ) : (
                <div className="grid h-full place-items-center p-8 text-center text-[var(--brand-dark)]">
                  <div>
                    <p className="text-5xl">🐾</p>
                    <p className="mt-3 font-extrabold">Imagem da campanha</p>
                  </div>
                </div>
              )}
            </div>
            <div className="p-5">
              {campaign.client_logo_url ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={campaign.client_logo_url} alt={campaign.client_name} className="mb-4 h-16 w-16 rounded-2xl border border-[var(--border)] bg-white object-contain p-1" />
              ) : null}
              <span className="badge">{campaign.client_name}</span>
              <h1 className="mt-3 text-3xl font-black leading-tight text-[var(--brand-dark)] md:text-4xl">{campaign.title}</h1>
              <p className="mt-3 leading-7 text-[var(--muted)]">{campaign.story}</p>
              {campaign.regulation_text ? (
                <details className="mt-4 rounded-2xl border border-[var(--border)] bg-white p-4 text-sm leading-6 text-[var(--muted)]">
                  <summary className="cursor-pointer font-extrabold text-[var(--brand-dark)]">Regras e observações da ação</summary>
                  <p className="mt-2 whitespace-pre-line">{campaign.regulation_text}</p>
                </details>
              ) : null}
              <div className="mt-5 rounded-2xl bg-[#f7f2e4] p-4">
                <p className="text-sm font-bold text-[var(--brand-dark)]">Prêmio / reconhecimento da ação</p>
                <p className="mt-1 font-extrabold">{campaign.prize_title}</p>
                <p className="mt-1 text-sm text-[var(--muted)]">{campaign.prize_description}</p>
              </div>
            </div>
          </div>

          <div className="space-y-5">
            <div className="card p-5">
              <div className="flex flex-wrap items-end justify-between gap-3">
                <div>
                  <p className="text-sm font-bold text-[var(--muted)]">Andamento da arrecadação</p>
                  <p className="mt-1 text-3xl font-black text-[var(--brand-dark)]">{formatMoneyFromCents(raised)}</p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-bold text-[var(--muted)]">Impacto estimado</p>
                  <p className="mt-1 text-2xl font-black text-[var(--brand-dark)]">{kg} kg</p>
                </div>
              </div>
              <div className="mt-4 progressbar"><span style={{ width: `${progress}%` }} /></div>
              <p className="mt-2 text-sm text-[var(--muted)]">
                Meta ideal: {formatMoneyFromCents(campaign.target_amount_cents)} • Meta estendida: {formatMoneyFromCents(campaign.extended_amount_cents)}
              </p>
            </div>

            <CampaignParticipation campaign={campaign} numbers={numbers || []} quotas={quotas || []} />
          </div>
        </section>
      </main>
    </>
  );
}
