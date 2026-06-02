import { notFound } from "next/navigation";
import { MessageCircle } from "lucide-react";
import { PublicHeader } from "@/components/PublicHeader";
import { createSupabasePublicClient } from "@/lib/supabase/public";
import { formatMoneyFromCents, kgFromAmount } from "@/lib/format";
import { CampaignParticipation } from "@/components/CampaignParticipation";

type PageProps = { params: Promise<{ slug: string }> };

export const revalidate = 0;

function publicRegulationText(value: string | null | undefined) {
  return String(value || "")
    .replace(
      /\s*Para ações públicas ou de maior alcance, recomenda-se validar as regras aplicáveis a sorteios, promoções e arrecadações\.?/gi,
      ""
    )
    .trim();
}

function normalizeCampaignStatus(status: string) {
  const normalized = String(status || "").trim().toLowerCase();
  if (["pausada", "pausado"].includes(normalized)) return "paused";
  if (["ativa", "ativo"].includes(normalized)) return "active";
  if (["encerrada", "encerrado"].includes(normalized)) return "closed";
  if (["prestacao_publicada", "prestação publicada"].includes(normalized)) return "accountability_published";
  if (["rascunho"].includes(normalized)) return "draft";
  return normalized;
}

function campaignStatusNotice(status: string) {
  const normalizedStatus = normalizeCampaignStatus(status);
  if (normalizedStatus === "paused") {
    return {
      title: "Campanha pausada no momento",
      text: "As novas participações estão temporariamente suspensas. Para saber quando a ação será retomada ou tirar dúvidas, fale com o Márcio Alexandre pelo WhatsApp.",
    };
  }

  if (normalizedStatus === "closed") {
    return {
      title: "Campanha encerrada",
      text: "Esta ação já foi encerrada e não está recebendo novas participações. Acompanhe a prestação de contas ou fale com a organização para mais informações.",
    };
  }

  if (normalizedStatus === "accountability_published") {
    return {
      title: "Prestação de contas publicada",
      text: "Esta campanha foi encerrada e a prestação de contas já pode ser acompanhada pela organização. Obrigado a todos que ajudaram a transformar solidariedade em resultado real.",
    };
  }

  return null;
}

export default async function CampaignPage({ params }: PageProps) {
  const { slug } = await params;
  const supabase = createSupabasePublicClient();

  const { data: campaign, error } = await supabase
    .from("campaigns_public")
    .select("*")
    .eq("slug", slug)
    .maybeSingle();

  const normalizedStatus = normalizeCampaignStatus(campaign?.status || "");

  if (error || !campaign || normalizedStatus === "draft") notFound();

  const [{ data: numbers }, { data: quotas }, { data: stats }] = await Promise.all([
    supabase.from("campaign_numbers_public").select("number,status,buyer_display_name").eq("campaign_id", campaign.id).order("number"),
    supabase.from("campaign_quotas_public").select("id,title,description,amount_cents,impact_qty,sort_order").eq("campaign_id", campaign.id).order("sort_order"),
    supabase.from("campaign_stats_public").select("*").eq("campaign_id", campaign.id).maybeSingle(),
  ]);

  const raised = stats?.confirmed_amount_cents || 0;
  const target = campaign.target_amount_cents || 1;
  const progress = Math.min(100, Math.round((raised / target) * 100));
  const kg = kgFromAmount(raised, campaign.impact_value_cents || 1);
  const regulation = publicRegulationText(campaign.regulation_text);
  const statusNotice = campaignStatusNotice(normalizedStatus);
  const canParticipate = normalizedStatus === "active";

  return (
    <>
      <PublicHeader />
      <main className="container-page pb-6 pt-3 md:pb-10 md:pt-4">
        {statusNotice ? (
          <section className="mb-5 rounded-3xl border border-[var(--border)] bg-[#fff8e8] p-5 shadow-sm">
            <span className="badge">Atenção</span>
            <h1 className="mt-2 text-2xl font-black text-[var(--brand-dark)]">{statusNotice.title}</h1>
            <p className="mt-2 leading-7 text-[var(--muted)]">{statusNotice.text}</p>
            <a
              className="btn-primary mt-4 !w-auto"
              href="https://wa.me/5519989848246?text=Ol%C3%A1%2C%20M%C3%A1rcio%20Alexandre%21%20Gostaria%20de%20informa%C3%A7%C3%B5es%20sobre%20a%20campanha%20S%C3%A3o%20Francisco%20em%20A%C3%A7%C3%A3o."
              target="_blank"
              rel="noreferrer"
            >
              <MessageCircle className="h-4 w-4" /> Falar com o Márcio Alexandre no WhatsApp
            </a>
          </section>
        ) : null}

        <section className="grid gap-6 md:grid-cols-[0.9fr_1.1fr] md:items-start">
          <div className="card overflow-hidden">
            <div className="p-5">
              <div className="campaign-client-row">
                {campaign.client_logo_url ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={campaign.client_logo_url} alt={campaign.client_name} className="h-12 w-12 rounded-2xl border border-[var(--border)] bg-white object-contain p-1 md:h-14 md:w-14" />
                ) : null}
                <span className="badge">{campaign.client_name}</span>
              </div>
              <h1 className="mt-4 text-3xl font-black leading-tight text-[var(--brand-dark)] md:text-4xl">{campaign.title}</h1>
              {campaign.subtitle ? <p className="mt-2 text-base font-bold leading-7 text-[var(--muted)] md:text-lg">{campaign.subtitle}</p> : null}
              {campaign.slug === "sao-francisco-em-racao" ? (
                <div className="mt-4 rounded-2xl border border-[var(--border)] bg-[#eef5ec] p-4 text-sm leading-6 text-[var(--brand-dark)]">
                  <strong>Encerramento da campanha:</strong> 24/06/2026. <strong>Sorteio:</strong> 25/06/2026, com divulgação em vídeo do número e nome do ganhador.
                </div>
              ) : null}
              {canParticipate ? (
                <a
                  className="btn-primary mt-4 !w-auto"
                  href="https://wa.me/5519989848246?text=Ol%C3%A1%2C%20M%C3%A1rcio%20Alexandre%21%20Tenho%20d%C3%BAvidas%20sobre%20a%20a%C3%A7%C3%A3o%20S%C3%A3o%20Francisco%20em%20A%C3%A7%C3%A3o."
                  target="_blank"
                  rel="noreferrer"
                >
                  <MessageCircle className="h-4 w-4" /> Dúvidas: fale com o Márcio Alexandre no WhatsApp
                </a>
              ) : null}
            </div>

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
              <p className="leading-7 text-[var(--muted)]">{campaign.story}</p>
              {regulation ? (
                <details open className="mt-4 rounded-2xl border border-[var(--border)] bg-white p-4 text-sm leading-6 text-[var(--muted)]">
                  <summary className="cursor-pointer font-extrabold text-[var(--brand-dark)]">Regras e observações da ação</summary>
                  <p className="mt-2 whitespace-pre-line">{regulation}</p>
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

            {canParticipate ? (
              <CampaignParticipation campaign={campaign} numbers={numbers || []} quotas={quotas || []} />
            ) : (
              <div className="card p-5">
                <h2 className="text-2xl font-black text-[var(--brand-dark)]">Participações indisponíveis</h2>
                <p className="mt-2 leading-7 text-[var(--muted)]">No momento, esta campanha não está recebendo novas aquisições de números. Para mais informações, use o botão de WhatsApp acima e fale com o Márcio Alexandre.</p>
              </div>
            )}
          </div>
        </section>
      </main>
    </>
  );
}
