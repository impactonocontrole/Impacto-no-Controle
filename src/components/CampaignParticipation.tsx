"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { HelpCircle, MessageCircle } from "lucide-react";
import QRCode from "qrcode";
import { buildPixPayload } from "@/lib/pix";
import { formatMoneyFromCents, normalizePhone } from "@/lib/format";

type Campaign = {
  id: string;
  slug: string;
  client_name: string;
  title: string;
  number_price_cents: number;
  pix_key: string;
  pix_receiver_name: string;
  pix_city: string;
  data_consent_text: string;
  status?: string;
  starts_at?: string | null;
  ends_at?: string | null;
};

type NumberItem = { number: number; status: string; buyer_display_name: string | null };
type Quota = { id: string; title: string; description: string | null; amount_cents: number; impact_qty: number | null };

export function CampaignParticipation({ campaign, numbers, quotas }: { campaign: Campaign; numbers: NumberItem[]; quotas: Quota[] }) {
  const router = useRouter();
  const [selectedNumbers, setSelectedNumbers] = useState<number[]>([]);
  const [selectedQuotas, setSelectedQuotas] = useState<Record<string, number>>({});
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [consent, setConsent] = useState(false);
  const [proof, setProof] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [qrCode, setQrCode] = useState<string | null>(null);
  const [copyFeedback, setCopyFeedback] = useState<{ target: "pix" | "key"; text: string; tone: "success" | "error" } | null>(null);

  const quotasEnabled = campaign.slug !== "sao-francisco-em-racao" && quotas.length > 0;

  const isOpen = useMemo(() => {
    if (campaign.status && campaign.status !== "active") return false;
    const now = Date.now();
    const starts = campaign.starts_at ? new Date(campaign.starts_at).getTime() : null;
    const ends = campaign.ends_at ? new Date(campaign.ends_at).getTime() : null;
    return (!starts || now >= starts) && (!ends || now <= ends);
  }, [campaign.ends_at, campaign.starts_at, campaign.status]);

  const totalCents = useMemo(() => {
    const numberAmount = selectedNumbers.length * campaign.number_price_cents;
    const quotaAmount = quotasEnabled
      ? Object.entries(selectedQuotas).reduce((sum, [id, qty]) => {
          const quota = quotas.find((q) => q.id === id);
          return sum + (quota?.amount_cents || 0) * qty;
        }, 0)
      : 0;
    return numberAmount + quotaAmount;
  }, [campaign.number_price_cents, quotas, quotasEnabled, selectedNumbers.length, selectedQuotas]);

  const pixPayload = useMemo(() => {
    if (totalCents <= 0) return "";
    return buildPixPayload({
      key: campaign.pix_key,
      merchantName: campaign.pix_receiver_name || campaign.client_name,
      merchantCity: campaign.pix_city || "CAMPINAS",
      amount: totalCents / 100,
      txid: "IMPACTO",
      description: campaign.title,
    });
  }, [campaign, totalCents]);

  async function generateQr() {
    if (!pixPayload) return;
    const dataUrl = await QRCode.toDataURL(pixPayload, { margin: 1, width: 220 });
    setQrCode(dataUrl);
  }

  function toggleNumber(item: NumberItem) {
    if (item.status !== "available") return;
    setSelectedNumbers((current) => current.includes(item.number) ? current.filter((n) => n !== item.number) : [...current, item.number].sort((a, b) => a - b));
  }

  function updateQuota(id: string, qty: number) {
    setSelectedQuotas((current) => {
      const next = { ...current };
      if (qty <= 0) delete next[id];
      else next[id] = qty;
      return next;
    });
  }

  async function writeToClipboard(text: string) {
    if (navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(text);
      return;
    }

    const textarea = document.createElement("textarea");
    textarea.value = text;
    textarea.setAttribute("readonly", "");
    textarea.style.position = "fixed";
    textarea.style.left = "-9999px";
    document.body.appendChild(textarea);
    textarea.select();
    document.execCommand("copy");
    document.body.removeChild(textarea);
  }

  async function copyPix() {
    if (!pixPayload) return;

    try {
      await writeToClipboard(pixPayload);
      setCopyFeedback({
        target: "pix",
        tone: "success",
        text: "✅ Pix copia e cola copiado! Agora abra o app do seu banco, escolha Pix Copia e Cola e cole o código para pagar.",
      });
    } catch {
      setCopyFeedback({
        target: "pix",
        tone: "error",
        text: "Não foi possível copiar automaticamente. Abra a opção ‘Ver código Pix copia e cola’ e copie o código manualmente.",
      });
    }
  }

  async function copyPixKey() {
    try {
      await writeToClipboard(campaign.pix_key.trim());
      setCopyFeedback({
        target: "key",
        tone: "success",
        text: "✅ Chave Pix copiada! Agora cole a chave no app do banco para pagar.",
      });
    } catch {
      setCopyFeedback({
        target: "key",
        tone: "error",
        text: "Não foi possível copiar automaticamente. Copie manualmente a chave Pix exibida acima.",
      });
    }
  }

  async function submit() {
    setError(null);

    if (!isOpen) return setError("Esta campanha ainda não está aberta ou já foi encerrada.");
    if (totalCents <= 0) return setError(quotasEnabled ? "Escolha pelo menos um número ou uma cota solidária." : "Escolha pelo menos um número para participar do sorteio.");
    if (!name.trim()) return setError("Informe seu nome.");
    if (normalizePhone(phone).length < 10) return setError("Informe um celular válido com DDD.");
    if (!consent) return setError("Confirme o aviso de uso dos dados para continuar.");
    if (!proof) return setError("Inclua o comprovante do Pix antes de finalizar.");

    setLoading(true);
    try {
      const formData = new FormData();
      formData.append("campaign_slug", campaign.slug);
      formData.append("name", name.trim());
      formData.append("phone", normalizePhone(phone));
      formData.append("email", email.trim());
      formData.append("selected_numbers", JSON.stringify(selectedNumbers));
      formData.append("selected_quotas", JSON.stringify(quotasEnabled ? selectedQuotas : {}));
      formData.append("amount_cents", String(totalCents));
      formData.append("proof", proof);

      const response = await fetch("/api/participate", { method: "POST", body: formData });
      const json = await response.json();
      if (!response.ok) throw new Error(json.error || "Não foi possível registrar sua participação.");
      router.push(`/obrigado/${json.token}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro inesperado.");
      setLoading(false);
    }
  }

  return (
    <div className="card p-5">
      <h2 className="text-2xl font-black text-[var(--brand-dark)]">Participe da ação</h2>
      <p className="mt-2 text-[var(--muted)]">
        {quotasEnabled
          ? "Escolha seu número para o sorteio da imagem. Depois, se desejar, aumente sua colaboração com cotas extras de amor."
          : "Escolha um ou mais números disponíveis para participar do sorteio da imagem."}
      </p>

      <div className="mt-4 rounded-2xl border border-[var(--border)] bg-[#fff8e8] p-4 text-sm leading-6 text-[var(--brand-dark)]">
        <div className="flex gap-3">
          <HelpCircle className="mt-1 h-5 w-5 shrink-0" />
          <div>
            <p className="font-extrabold">Como funciona</p>
            <p className="mt-1">
              {quotasEnabled
                ? "1) Escolha um ou mais números para participar do sorteio. 2) Se quiser, aumente sua colaboração com cotas extras. 3) Confira o valor total. 4) Faça o Pix usando o QR Code, o Pix Copia e Cola ou a chave Pix. 5) Anexe o comprovante antes de finalizar. A organização irá conferir o pagamento e confirmar sua participação."
                : "1) Escolha um ou mais números para participar do sorteio. 2) Confira o valor total. 3) Faça o Pix usando o QR Code, o Pix Copia e Cola ou a chave Pix. 4) Anexe o comprovante antes de finalizar. A organização irá conferir o pagamento e confirmar sua participação."}
            </p>
            <a className="mt-3 inline-flex items-center gap-2 font-extrabold underline" href="https://wa.me/5519989848246?text=Ol%C3%A1%21%20Estou%20com%20d%C3%BAvida%20para%20participar%20de%20uma%20a%C3%A7%C3%A3o%20no%20Impacto%20no%20Controle.%20Gostaria%20de%20falar%20com%20o%20M%C3%A1rcio%20Alexandre." target="_blank" rel="noreferrer">
              <MessageCircle className="h-4 w-4" /> Preciso falar com o Márcio Alexandre no WhatsApp
            </a>
          </div>
        </div>
      </div>

      {!isOpen ? (
        <div className="mt-4 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          Esta campanha não está aberta para novas aquisições neste momento.
        </div>
      ) : null}

      <div className="mt-6">
        <h3 className="font-extrabold text-[var(--brand-dark)]">1. Escolha seus números para o sorteio da imagem</h3>
        <p className="mt-1 text-sm text-[var(--muted)]">Cada número custa <strong>{formatMoneyFromCents(campaign.number_price_cents)}</strong>. Números claros estão disponíveis; números escuros já estão reservados ou confirmados.</p>
        <div className="mt-3 grid grid-cols-5 gap-2 sm:grid-cols-8 md:grid-cols-10">
          {numbers.map((item) => (
            <button
              key={item.number}
              type="button"
              onClick={() => toggleNumber(item)}
              className={`number-button ${selectedNumbers.includes(item.number) ? "selected" : ""} ${item.status === "confirmed" ? "confirmed unavailable" : ""} ${item.status !== "available" && item.status !== "confirmed" ? "pending unavailable" : ""}`}
              disabled={!isOpen || item.status !== "available"}
              title={item.buyer_display_name || undefined}
            >
              {item.number.toString().padStart(2, "0")}
              {item.buyer_display_name ? <small>{item.buyer_display_name}</small> : null}
            </button>
          ))}
        </div>
      </div>

      {quotasEnabled ? (
      <div className="mt-7 border-t border-[var(--border)] pt-6">
        <span className="badge">Colaboração extra opcional</span>
        <h3 className="mt-3 font-extrabold text-[var(--brand-dark)]">2. Quer aumentar sua colaboração?</h3>
        <p className="mt-2 text-sm leading-6 text-[var(--muted)]">
          A participação no sorteio da imagem é feita pelos números de <strong>{formatMoneyFromCents(campaign.number_price_cents)}</strong>.
          As cotas abaixo são opcionais e servem para ampliar o impacto da ação, ajudando a transformar a arrecadação em mais ração para cães e gatos.
        </p>
        <div className="mt-3 grid gap-3 sm:grid-cols-2">
          {quotas.map((quota) => (
            <div key={quota.id} className="rounded-2xl border border-[var(--border)] bg-white p-4">
              <p className="font-extrabold">{quota.title}</p>
              <p className="mt-1 text-sm text-[var(--muted)]">{quota.description}</p>
              <div className="mt-3 flex items-center justify-between gap-3">
                <strong>{formatMoneyFromCents(quota.amount_cents)}</strong>
                <select className="input max-w-24" disabled={!isOpen} value={selectedQuotas[quota.id] || 0} onChange={(e) => updateQuota(quota.id, Number(e.target.value))}>
                  {[0, 1, 2, 3, 4, 5, 10].map((n) => <option key={n} value={n}>{n}</option>)}
                </select>
              </div>
            </div>
          ))}
        </div>
      </div>
      ) : null}

      <div className="mt-7 rounded-2xl bg-[#eef5ec] p-4">
        <p className="text-sm font-bold text-[var(--muted)]">Total da participação</p>
        <p className="mt-1 text-3xl font-black text-[var(--brand-dark)]">{formatMoneyFromCents(totalCents)}</p>
        <p className="mt-1 text-sm text-[var(--muted)]">Números: {selectedNumbers.length ? selectedNumbers.join(", ") : "nenhum"}</p>
      </div>

      <div className="mt-7 grid gap-4 sm:grid-cols-2">
        <div>
          <label className="label">Nome *</label>
          <input className="input" value={name} onChange={(e) => setName(e.target.value)} placeholder="Seu nome" />
        </div>
        <div>
          <label className="label">Celular com DDD *</label>
          <input className="input" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="(19) 99999-9999" />
        </div>
        <div className="sm:col-span-2">
          <label className="label">E-mail opcional</label>
          <input className="input" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="seuemail@exemplo.com" />
        </div>
      </div>

      <label className="mt-4 flex gap-3 rounded-2xl border border-[var(--border)] bg-white p-4 text-sm leading-6 text-[var(--muted)]">
        <input type="checkbox" checked={consent} onChange={(e) => setConsent(e.target.checked)} className="mt-1" />
        <span>{campaign.data_consent_text}</span>
      </label>

      <div className="mt-7 rounded-2xl border border-[var(--border)] bg-white p-4">
        <h3 className="font-extrabold text-[var(--brand-dark)]">3. Faça o Pix</h3>
        <p className="mt-2 text-sm text-[var(--muted)]">Chave Pix: <strong>{campaign.pix_key}</strong></p>
        <p className="mt-1 text-xs leading-5 text-[var(--muted)]">
          O botão “Pix copia e cola” copia o código completo para colar no aplicativo do banco. Se preferir, use “Copiar chave Pix”.
        </p>
        <div className="mt-3 grid gap-3 sm:grid-cols-3">
          <div>
            <button type="button" className="btn-secondary w-full" onClick={generateQr} disabled={!isOpen || totalCents <= 0}>Gerar QR Code</button>
          </div>
          <div>
            <button type="button" className="btn-primary w-full" onClick={copyPix} disabled={!isOpen || totalCents <= 0}>Copiar Pix copia e cola</button>
            {copyFeedback?.target === "pix" ? (
              <div className={`mt-3 rounded-2xl border-2 p-4 text-sm font-extrabold leading-6 shadow-sm ${copyFeedback.tone === "success" ? "border-[#f59e0b] bg-[#fff1a8] text-[#3f2a00]" : "border-red-400 bg-red-50 text-red-800"}`} role="status" aria-live="polite">
                {copyFeedback.text}
              </div>
            ) : null}
          </div>
          <div>
            <button type="button" className="btn-secondary w-full" onClick={copyPixKey} disabled={!isOpen}>Copiar chave Pix</button>
            {copyFeedback?.target === "key" ? (
              <div className={`mt-3 rounded-2xl border-2 p-4 text-sm font-extrabold leading-6 shadow-sm ${copyFeedback.tone === "success" ? "border-[#f59e0b] bg-[#fff1a8] text-[#3f2a00]" : "border-red-400 bg-red-50 text-red-800"}`} role="status" aria-live="polite">
                {copyFeedback.text}
              </div>
            ) : null}
          </div>
        </div>
        {pixPayload && totalCents > 0 ? (
          <details className="mt-3 rounded-2xl border border-[var(--border)] bg-[#fffdf7] p-3 text-sm">
            <summary className="cursor-pointer font-extrabold text-[var(--brand-dark)]">Ver código Pix copia e cola</summary>
            <textarea className="input mt-3 min-h-28 text-xs" readOnly value={pixPayload} />
          </details>
        ) : null}
        {qrCode ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img className="mt-4 rounded-2xl border border-[var(--border)] bg-white p-2" src={qrCode} alt="QR Code Pix" />
        ) : null}
      </div>


      <div className="mt-5 rounded-2xl border border-[var(--border)] bg-[#fff8e8] p-4">
        <p className="text-sm font-extrabold text-[var(--brand-dark)]">Está com dificuldade para enviar o comprovante?</p>
        <p className="mt-1 text-sm leading-6 text-[var(--muted)]">Fale com o Márcio Alexandre no WhatsApp antes de finalizar. Ele ajuda você a concluir sua participação com segurança.</p>
        <a
          className="btn-secondary mt-3"
          href="https://wa.me/5519989848246?text=Ol%C3%A1%2C%20M%C3%A1rcio%20Alexandre%21%20Preciso%20de%20ajuda%20para%20enviar%20o%20comprovante%20do%20Pix%20na%20a%C3%A7%C3%A3o%20do%20Impacto%20no%20Controle."
          target="_blank"
          rel="noreferrer"
        >
          <MessageCircle className="h-4 w-4" /> Preciso falar com o Márcio Alexandre no WhatsApp
        </a>
      </div>

      <div className="mt-5">
        <label className="label">4. Envie o comprovante do Pix *</label>
        <input className="input" type="file" accept="image/*,.pdf" disabled={!isOpen} onChange={(e) => setProof(e.target.files?.[0] || null)} />
        <p className="mt-2 text-sm text-[var(--muted)]">O comprovante é obrigatório. O sistema faz uma validação inicial quando consegue ler os dados do arquivo e, depois, a organização confere o pagamento para confirmar sua participação.</p>
      </div>

      {error ? <div className="mt-4 rounded-2xl border border-red-200 bg-red-50 p-4 text-red-700">{error}</div> : null}

      <button type="button" className="btn-primary mt-5" onClick={submit} disabled={loading || !isOpen}>
        {loading ? "Enviando..." : "Finalizar participação"}
      </button>
    </div>
  );
}
