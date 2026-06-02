import { NextResponse } from "next/server";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { buyerDisplayName, formatMoneyFromCents, normalizePhone } from "@/lib/format";
import { escapeHtml, sendEmail } from "@/lib/email";

export const runtime = "nodejs";

function safeJson<T>(value: FormDataEntryValue | null, fallback: T): T {
  try {
    return value ? JSON.parse(String(value)) as T : fallback;
  } catch {
    return fallback;
  }
}

function getAppUrl(request: Request) {
  return process.env.NEXT_PUBLIC_APP_URL || new URL(request.url).origin;
}

function formatSelectedQuotas(selectedQuotas: Record<string, number>, quotaMap: Record<string, { title: string; amount_cents: number }>) {
  return Object.entries(selectedQuotas)
    .map(([id, qty]) => {
      const quota = quotaMap[id];
      if (!quota || Number(qty) <= 0) return null;
      return `${qty}x ${quota.title} (${formatMoneyFromCents(quota.amount_cents * Number(qty))})`;
    })
    .filter(Boolean) as string[];
}

async function notifyParticipantByEmail(input: {
  request: Request;
  email: string | null;
  participantName: string;
  campaignTitle: string;
  clientName: string;
  amountCents: number;
  numbers: number[];
  quotas: string[];
  token: string;
}) {
  if (!input.email) return;

  const appUrl = getAppUrl(input.request);
  const thanksUrl = `${appUrl}/obrigado/${input.token}`;
  const trackUrl = `${appUrl}/acompanhar/${input.token}`;
  const numbersText = input.numbers.length ? input.numbers.map((n) => String(n).padStart(2, "0")).join(", ") : "Nenhum número escolhido";
  const quotasText = input.quotas.length ? input.quotas.join("; ") : "Nenhuma cota escolhida";

  const subject = `Participação registrada - ${input.campaignTitle}`;
  const text = `Olá, ${input.participantName}!\n\nSua participação foi registrada em ${input.campaignTitle}.\nCliente: ${input.clientName}\nValor: ${formatMoneyFromCents(input.amountCents)}\nNúmeros: ${numbersText}\nCotas: ${quotasText}\nStatus: aguardando conferência do Pix pela organização\n\nA organização irá conferir o Pix e aprovar o pagamento. Salve o link de acompanhamento nos favoritos do navegador ou crie um atalho na tela inicial do celular.\n\nPágina de obrigado: ${thanksUrl}\nAcompanhamento: ${trackUrl}`;
  const html = `
    <div style="font-family:Arial,sans-serif;line-height:1.55;color:#1d2a1f">
      <h2>Participação registrada</h2>
      <p>Olá, <strong>${escapeHtml(input.participantName)}</strong>!</p>
      <p>Sua participação foi registrada na campanha <strong>${escapeHtml(input.campaignTitle)}</strong>.</p>
      <ul>
        <li><strong>Cliente:</strong> ${escapeHtml(input.clientName)}</li>
        <li><strong>Valor:</strong> ${escapeHtml(formatMoneyFromCents(input.amountCents))}</li>
        <li><strong>Números:</strong> ${escapeHtml(numbersText)}</li>
        <li><strong>Cotas:</strong> ${escapeHtml(quotasText)}</li>
        <li><strong>Status:</strong> aguardando conferência do Pix pela organização</li>
      </ul>
      <p>Salve o link abaixo para acompanhar sua participação:</p>
      <p><a href="${escapeHtml(trackUrl)}">Acompanhar minha participação</a></p>
      <p>Também deixamos uma página de obrigado com as orientações para salvar nos favoritos ou criar atalho na tela inicial do celular:</p>
      <p><a href="${escapeHtml(thanksUrl)}">Abrir página de obrigado</a></p>
      <p>Gratidão por transformar solidariedade em impacto real.</p>
    </div>
  `;

  await sendEmail({
    to: input.email,
    cc: [process.env.IMPACTO_ADMIN_EMAIL || "impactonocontrole@gmail.com"],
    subject,
    text,
    html,
  });
}

export async function POST(request: Request) {
  try {
    const supabase = createSupabaseAdminClient();
    const formData = await request.formData();

    const campaignSlug = String(formData.get("campaign_slug") || "");
    const name = String(formData.get("name") || "").trim();
    const phone = normalizePhone(String(formData.get("phone") || ""));
    const email = String(formData.get("email") || "").trim() || null;
    const selectedNumbers = safeJson<number[]>(formData.get("selected_numbers"), []);
    const selectedQuotas = safeJson<Record<string, number>>(formData.get("selected_quotas"), {});
    const amountCents = Number(formData.get("amount_cents") || 0);
    const proof = formData.get("proof");

    if (!campaignSlug) return NextResponse.json({ error: "Campanha inválida." }, { status: 400 });
    if (!name) return NextResponse.json({ error: "Informe o nome." }, { status: 400 });
    if (phone.length < 10) return NextResponse.json({ error: "Informe um celular válido." }, { status: 400 });
    if (!amountCents || amountCents <= 0) return NextResponse.json({ error: "Valor inválido." }, { status: 400 });
    if (!(proof instanceof File)) return NextResponse.json({ error: "Comprovante obrigatório." }, { status: 400 });

    const { data: campaign, error: campaignError } = await supabase
      .from("campaigns")
      .select("id, client_id, slug, title, status, number_price_cents, starts_at, ends_at, clients(name)")
      .eq("slug", campaignSlug)
      .maybeSingle();

    if (campaignError || !campaign || campaign.status !== "active") {
      return NextResponse.json({ error: "Campanha não encontrada ou encerrada." }, { status: 404 });
    }

    const now = Date.now();
    const startsAt = campaign.starts_at ? new Date(campaign.starts_at).getTime() : null;
    const endsAt = campaign.ends_at ? new Date(campaign.ends_at).getTime() : null;
    if ((startsAt && now < startsAt) || (endsAt && now > endsAt)) {
      return NextResponse.json({ error: "Esta campanha ainda não está aberta ou já foi encerrada." }, { status: 400 });
    }

    const uniqueNumbers = Array.from(new Set(selectedNumbers.map(Number).filter((n) => Number.isInteger(n) && n > 0))).sort((a, b) => a - b);

    if (uniqueNumbers.length) {
      const { data: available, error: numError } = await supabase
        .from("campaign_numbers")
        .select("number,status")
        .eq("campaign_id", campaign.id)
        .in("number", uniqueNumbers);

      if (numError) throw numError;
      if (!available || available.length !== uniqueNumbers.length || available.some((n) => n.status !== "available")) {
        return NextResponse.json({ error: "Um ou mais números escolhidos já foram reservados. Atualize a página e escolha novamente." }, { status: 409 });
      }
    }

    const quotaArray = Object.entries(selectedQuotas)
      .map(([quotaId, qty]) => ({ quota_id: quotaId, qty: Number(qty) }))
      .filter((item) => item.qty > 0);

    const quotaIds = quotaArray.map((q) => q.quota_id);
    const { data: quotaRows, error: quotaError } = quotaIds.length
      ? await supabase.from("campaign_quotas").select("id,title,amount_cents").eq("campaign_id", campaign.id).in("id", quotaIds)
      : { data: [], error: null };
    if (quotaError) throw quotaError;

    const quotaMap = Object.fromEntries((quotaRows || []).map((q: any) => [q.id, { title: q.title, amount_cents: q.amount_cents }]));
    const quotaMessages = formatSelectedQuotas(selectedQuotas, quotaMap);

    const { data: participant, error: participantError } = await supabase
      .from("participants")
      .upsert({ client_id: campaign.client_id, name, phone, email, consent_at: new Date().toISOString() }, { onConflict: "client_id,phone" })
      .select("id")
      .single();

    if (participantError) throw participantError;

    const contributionType = uniqueNumbers.length && quotaArray.length ? "mixed" : uniqueNumbers.length ? "numbers" : "quota";

    const { data: contribution, error: contributionError } = await supabase
      .from("contributions")
      .insert({
        campaign_id: campaign.id,
        participant_id: participant.id,
        type: contributionType,
        status: "pending_approval",
        amount_cents: amountCents,
        selected_numbers: uniqueNumbers,
        selected_quotas: quotaArray,
      })
      .select("id, acompanhamento_token")
      .single();

    if (contributionError) throw contributionError;

    const fileExt = proof.name.split(".").pop()?.toLowerCase() || "bin";
    const filePath = `${campaign.id}/${contribution.id}-${Date.now()}.${fileExt}`;
    const buffer = Buffer.from(await proof.arrayBuffer());

    const { error: uploadError } = await supabase.storage
      .from("proofs")
      .upload(filePath, buffer, { contentType: proof.type || "application/octet-stream", upsert: false });

    if (uploadError) throw uploadError;

    const { error: updateProofError } = await supabase
      .from("contributions")
      .update({ proof_file_path: filePath })
      .eq("id", contribution.id);

    if (updateProofError) throw updateProofError;

    if (uniqueNumbers.length) {
      const display = buyerDisplayName(name, phone);
      const reservedUntil = new Date(Date.now() + 1000 * 60 * 60 * 24).toISOString();
      const { error: updateNumbersError } = await supabase
        .from("campaign_numbers")
        .update({
          status: "pending_approval",
          participant_id: participant.id,
          contribution_id: contribution.id,
          buyer_display_name: display,
          reserved_until: reservedUntil,
        })
        .eq("campaign_id", campaign.id)
        .in("number", uniqueNumbers);
      if (updateNumbersError) throw updateNumbersError;
    }

    try {
      await notifyParticipantByEmail({
        request,
        email,
        participantName: name,
        campaignTitle: campaign.title,
        clientName: (campaign.clients as any)?.name || "Impacto no Controle",
        amountCents,
        numbers: uniqueNumbers,
        quotas: quotaMessages,
        token: contribution.acompanhamento_token,
      });
    } catch (emailError) {
      console.warn("Falha ao enviar e-mail de participação", emailError);
    }

    return NextResponse.json({
      ok: true,
      token: contribution.acompanhamento_token,
      message: "Participação registrada. A organização irá conferir o Pix e aprovar o pagamento.",
    });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Erro ao registrar participação. Tente novamente." }, { status: 500 });
  }
}
