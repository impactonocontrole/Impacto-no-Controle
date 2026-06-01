import { NextResponse } from "next/server";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { buyerDisplayName, normalizePhone } from "@/lib/format";

export const runtime = "nodejs";

function safeJson<T>(value: FormDataEntryValue | null, fallback: T): T {
  try {
    return value ? JSON.parse(String(value)) as T : fallback;
  } catch {
    return fallback;
  }
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
      .select("id, client_id, slug, status, number_price_cents, starts_at, ends_at")
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

    const { data: participant, error: participantError } = await supabase
      .from("participants")
      .upsert({ client_id: campaign.client_id, name, phone, email, consent_at: new Date().toISOString() }, { onConflict: "client_id,phone" })
      .select("id")
      .single();

    if (participantError) throw participantError;

    const quotaArray = Object.entries(selectedQuotas)
      .map(([quotaId, qty]) => ({ quota_id: quotaId, qty: Number(qty) }))
      .filter((item) => item.qty > 0);

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
