import { NextResponse } from "next/server";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { buyerDisplayName, formatMoneyFromCents, normalizePhone } from "@/lib/format";
import { escapeHtml, sendEmail } from "@/lib/email";

export const runtime = "nodejs";

type EmailStatus = {
  participant?: { sent: boolean; skipped?: boolean; error?: string };
  admin?: { sent: boolean; skipped?: boolean; error?: string };
};

function safeJson<T>(value: FormDataEntryValue | null, fallback: T): T {
  try {
    return value ? (JSON.parse(String(value)) as T) : fallback;
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

function numbersText(numbers: number[]) {
  return numbers.length ? numbers.map((n) => String(n).padStart(2, "0")).join(", ") : "Nenhum número escolhido";
}

function quotasText(quotas: string[]) {
  return quotas.length ? quotas.join("; ") : "Nenhuma cota escolhida";
}

function normalizeText(value: unknown) {
  return String(value || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();
}

function onlyDigits(value: unknown) {
  return String(value || "").replace(/\D/g, "");
}

function amountPattern(amountCents: number) {
  const amount = (amountCents / 100).toFixed(2);
  const [integer, decimal] = amount.split(".");
  const integerWithDots = integer.replace(/\B(?=(\d{3})+(?!\d))/g, ".");
  const integerWithCommas = integer.replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  const escaped = [
    `${integer},${decimal}`,
    `${integer}.${decimal}`,
    `${integerWithDots},${decimal}`,
    `${integerWithCommas}.${decimal}`,
  ].map((item) => item.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"));

  return new RegExp(`(?:r\\$\\s*)?(?:${escaped.join("|")})`, "i");
}

function extractReadableText(buffer: Buffer, mimeType: string, fileName: string) {
  const type = `${mimeType || ""} ${fileName || ""}`.toLowerCase();

  if (type.includes("image/")) {
    return { text: "", canValidate: false, reason: "image_without_ocr" };
  }

  const utf8 = buffer.toString("utf8");
  const latin1 = buffer.toString("latin1");
  const combined = `${utf8}\n${latin1}`
    .replace(/\0/g, " ")
    .replace(/[^\x09\x0A\x0D\x20-\x7EÀ-ÿ]/g, " ")
    .replace(/\s+/g, " ")
    .trim();

  const normalized = normalizeText(combined);
  const hasPaymentContext = /(pix|comprovante|pagamento|transferencia|transacao|favorecido|beneficiario|destinatario|efetivado|concluido|realizado)/i.test(normalized);
  const canValidate = combined.length >= 80 && hasPaymentContext;

  return { text: combined, canValidate, reason: canValidate ? "readable" : "unreadable" };
}

function validateProofFile(input: {
  buffer: Buffer;
  fileName: string;
  mimeType: string;
  expectedAmountCents: number;
  expectedPixKey?: string | null;
  expectedReceiver?: string | null;
}) {
  const extracted = extractReadableText(input.buffer, input.mimeType, input.fileName);

  if (!extracted.canValidate) {
    return {
      ok: true,
      manualReview: true,
      warning:
        "Não foi possível validar automaticamente todos os dados do comprovante. Ele seguirá para conferência manual da organização.",
    };
  }

  const text = extracted.text;
  const normalized = normalizeText(text);
  const digits = onlyDigits(text);
  const divergences: string[] = [];

  if (!amountPattern(input.expectedAmountCents).test(text)) {
    divergences.push(`valor esperado ${formatMoneyFromCents(input.expectedAmountCents)}`);
  }

  const expectedKeyDigits = onlyDigits(input.expectedPixKey || "");
  const receiverTokens = normalizeText(input.expectedReceiver || "")
    .split(/\s+/)
    .filter((part) => part.length >= 4);

  const keyFound = expectedKeyDigits.length >= 5 && digits.includes(expectedKeyDigits);
  const receiverFound = receiverTokens.length > 0 && receiverTokens.some((token) => normalized.includes(token));

  if (!keyFound && !receiverFound) {
    divergences.push("favorecido ou chave Pix esperada");
  }

  const negativeStatus = /(agendad[oa]|pendente|cancelad[oa]|falhou|estornad[oa]|recusad[oa]|nao efetivad[oa]|não efetivad[oa])/i.test(normalized);
  const positiveStatus = /(efetivad[oa]|concluid[oa]|realizad[oa]|aprovad[oa]|pago|sucesso|confirmad[oa]|transacao concluida|pagamento efetuado)/i.test(normalized);

  if (negativeStatus || !positiveStatus) {
    divergences.push("status de pagamento efetivado/concluído");
  }

  if (divergences.length) {
    return {
      ok: false,
      manualReview: false,
      warning: `O comprovante enviado não bateu com: ${divergences.join(", ")}. Confira o Pix, envie o comprovante correto e tente novamente. Se o problema persistir, fale com o suporte pelo WhatsApp.`,
    };
  }

  return { ok: true, manualReview: false, warning: null };
}

function buildAcquisitionEmailContent(input: {
  participantName: string;
  participantPhone: string;
  participantEmail: string | null;
  campaignTitle: string;
  clientName: string;
  amountCents: number;
  numbers: number[];
  quotas: string[];
  thanksUrl: string;
  trackUrl: string;
  systemUrl: string;
  isAdmin: boolean;
}) {
  const nText = numbersText(input.numbers);
  const qText = quotasText(input.quotas);
  const statusText = "aguardando conferência do Pix pela organização";

  const subject = input.isAdmin
    ? `Nova aquisição registrada - ${input.campaignTitle}`
    : `Participação registrada - ${input.campaignTitle}`;

  const intro = input.isAdmin
    ? `Uma nova aquisição foi registrada na campanha ${input.campaignTitle}.`
    : `Sua participação foi registrada na campanha ${input.campaignTitle}.`;

  const text = `${intro}\n\nCliente: ${input.clientName}\nParticipante: ${input.participantName}\nCelular: ${input.participantPhone}\nE-mail: ${input.participantEmail || "não informado"}\nValor: ${formatMoneyFromCents(input.amountCents)}\nNúmeros: ${nText}\nCotas: ${qText}\nStatus: ${statusText}\n\nPágina de obrigado: ${input.thanksUrl}\nAcompanhamento: ${input.trackUrl}\n${input.isAdmin ? `Sistema/Gestão: ${input.systemUrl}\n` : ""}\nSalve o link de acompanhamento nos favoritos do navegador ou crie um atalho na tela inicial do celular.`;

  const html = `
    <div style="font-family:Arial,sans-serif;line-height:1.55;color:#1d2a1f">
      <h2>${input.isAdmin ? "Nova aquisição registrada" : "Participação registrada"}</h2>
      <p>${escapeHtml(intro)}</p>
      <ul>
        <li><strong>Cliente:</strong> ${escapeHtml(input.clientName)}</li>
        <li><strong>Participante:</strong> ${escapeHtml(input.participantName)}</li>
        <li><strong>Celular:</strong> ${escapeHtml(input.participantPhone)}</li>
        <li><strong>E-mail:</strong> ${escapeHtml(input.participantEmail || "não informado")}</li>
        <li><strong>Valor:</strong> ${escapeHtml(formatMoneyFromCents(input.amountCents))}</li>
        <li><strong>Números:</strong> ${escapeHtml(nText)}</li>
        <li><strong>Cotas:</strong> ${escapeHtml(qText)}</li>
        <li><strong>Status:</strong> ${escapeHtml(statusText)}</li>
      </ul>
      <p><a href="${escapeHtml(input.thanksUrl)}">Abrir página de obrigado</a></p>
      <p><a href="${escapeHtml(input.trackUrl)}">Acompanhar participação</a></p>
      ${input.isAdmin ? `<p><a href="${escapeHtml(input.systemUrl)}">Abrir no sistema</a></p>` : ""}
      <p>Salve o link de acompanhamento nos favoritos do navegador ou crie um atalho na tela inicial do celular.</p>
    </div>
  `;

  return { subject, text, html };
}

async function sendAcquisitionEmails(input: {
  request: Request;
  participantEmail: string | null;
  participantName: string;
  participantPhone: string;
  campaignId: string;
  campaignTitle: string;
  clientName: string;
  amountCents: number;
  numbers: number[];
  quotas: string[];
  token: string;
}) {
  const appUrl = getAppUrl(input.request);
  const adminEmail = process.env.IMPACTO_ADMIN_EMAIL || "impactonocontrole@gmail.com";
  const thanksUrl = `${appUrl}/obrigado/${input.token}`;
  const trackUrl = `${appUrl}/acompanhar/${input.token}`;
  const systemUrl = `${appUrl}/gestao/campanhas/${input.campaignId}`;
  const status: EmailStatus = {};

  if (input.participantEmail) {
    try {
      const participantContent = buildAcquisitionEmailContent({
        ...input,
        participantEmail: input.participantEmail,
        participantPhone: input.participantPhone,
        thanksUrl,
        trackUrl,
        systemUrl,
        isAdmin: false,
      });

      const result = await sendEmail({
        to: input.participantEmail,
        subject: participantContent.subject,
        text: participantContent.text,
        html: participantContent.html,
      });

      status.participant = { sent: true, skipped: Boolean((result as any)?.skipped) };
    } catch (error) {
      const message = error instanceof Error ? error.message : "Falha desconhecida ao enviar e-mail.";
      status.participant = { sent: false, error: message };
      console.warn("Falha ao enviar e-mail para participante", error);
    }
  } else {
    status.participant = { sent: false, skipped: true };
  }

  try {
    const adminContent = buildAcquisitionEmailContent({
      ...input,
      participantEmail: input.participantEmail,
      participantPhone: input.participantPhone,
      thanksUrl,
      trackUrl,
      systemUrl,
      isAdmin: true,
    });

    const result = await sendEmail({
      to: adminEmail,
      subject: adminContent.subject,
      text: adminContent.text,
      html: adminContent.html,
    });

    status.admin = { sent: true, skipped: Boolean((result as any)?.skipped) };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Falha desconhecida ao enviar e-mail.";
    status.admin = { sent: false, error: message };
    console.warn("Falha ao enviar e-mail administrativo", error);
  }

  return status;
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

    const proofBuffer = Buffer.from(await proof.arrayBuffer());

    const { data: campaign, error: campaignError } = await supabase
      .from("campaigns")
      .select("id, client_id, slug, title, status, number_price_cents, starts_at, ends_at, pix_key, pix_receiver_name, clients(name,pix_key,pix_receiver_name)")
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

    const clientData = campaign.clients as any;
    const expectedPixKey = campaign.pix_key || clientData?.pix_key || "";
    const expectedReceiver = campaign.pix_receiver_name || clientData?.pix_receiver_name || clientData?.name || "";
    const proofValidation = validateProofFile({
      buffer: proofBuffer,
      fileName: proof.name,
      mimeType: proof.type || "application/octet-stream",
      expectedAmountCents: amountCents,
      expectedPixKey,
      expectedReceiver,
    });

    if (!proofValidation.ok) {
      return NextResponse.json({ error: proofValidation.warning }, { status: 400 });
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

    const { error: uploadError } = await supabase.storage
      .from("proofs")
      .upload(filePath, proofBuffer, { contentType: proof.type || "application/octet-stream", upsert: false });

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

    const emailStatus = await sendAcquisitionEmails({
      request,
      participantEmail: email,
      participantName: name,
      participantPhone: phone,
      campaignId: campaign.id,
      campaignTitle: campaign.title,
      clientName: clientData?.name || "Impacto no Controle",
      amountCents,
      numbers: uniqueNumbers,
      quotas: quotaMessages,
      token: contribution.acompanhamento_token,
    });

    return NextResponse.json({
      ok: true,
      token: contribution.acompanhamento_token,
      email: emailStatus,
      proof_validation: proofValidation.manualReview ? "manual_review" : "validated",
      message: proofValidation.manualReview
        ? "Participação registrada. O comprovante seguirá para conferência manual da organização."
        : "Participação registrada. O comprovante passou pela validação inicial e a organização irá conferir o Pix.",
    });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Erro ao registrar participação. Tente novamente." }, { status: 500 });
  }
}
