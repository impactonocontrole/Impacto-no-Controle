"use client";

import { useEffect, useState } from "react";
import { AdminShell } from "@/components/AdminShell";
import { createSupabaseBrowserClient } from "@/lib/supabase/browser";
import { formatMoneyFromCents, kgFromAmount } from "@/lib/format";

type CampaignDetail = {
  campaign: any;
  contributions: any[];
  numbers: any[];
  messages: any[];
  stats: any;
};

export function CampaignDetailClient({ id }: { id: string }) {
  const supabase = createSupabaseBrowserClient();
  const [detail, setDetail] = useState<CampaignDetail | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);


  async function token() {
    const { data } = await supabase.auth.getSession();
    return data.session?.access_token || "";
  }

  async function load() {
    if (!id) return;
    setLoading(true);
    const accessToken = await token();
    if (!accessToken) {
      setError("Faça login para acessar a gestão.");
      setLoading(false);
      return;
    }
    const res = await fetch(`/api/admin/campaigns/${id}`, { headers: { Authorization: `Bearer ${accessToken}` } });
    const json = await res.json();
    if (!res.ok) setError(json.error || "Erro ao carregar campanha.");
    else setDetail(json);
    setLoading(false);
  }

  useEffect(() => { load(); /* eslint-disable-next-line react-hooks/exhaustive-deps */ }, [id]);

  async function approve(contributionId: string) {
    const accessToken = await token();
    const res = await fetch(`/api/admin/contributions/${contributionId}/approve`, { method: "POST", headers: { Authorization: `Bearer ${accessToken}` } });
    const json = await res.json();
    if (!res.ok) alert(json.error || "Erro ao aprovar.");
    await load();
  }

  async function reject(contributionId: string) {
    const reason = prompt("Motivo da rejeição/cancelamento:") || "Pagamento não localizado.";
    const accessToken = await token();
    const res = await fetch(`/api/admin/contributions/${contributionId}/reject`, {
      method: "POST",
      headers: { Authorization: `Bearer ${accessToken}`, "Content-Type": "application/json" },
      body: JSON.stringify({ reason }),
    });
    const json = await res.json();
    if (!res.ok) alert(json.error || "Erro ao rejeitar.");
    await load();
  }

  async function openProof(path: string) {
    const accessToken = await token();
    const res = await fetch(`/api/admin/proof-url?path=${encodeURIComponent(path)}`, { headers: { Authorization: `Bearer ${accessToken}` } });
    const json = await res.json();
    if (!res.ok) return alert(json.error || "Erro ao abrir comprovante.");
    window.open(json.url, "_blank");
  }

  return (
    <AdminShell>
      {loading ? <p>Carregando...</p> : null}
      {error ? <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-red-700">{error}</div> : null}
      {detail ? (
        <div>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <span className="badge">{detail.campaign.client_name}</span>
              <h1 className="mt-2 text-3xl font-black text-[var(--brand-dark)]">{detail.campaign.title}</h1>
              <p className="mt-1 text-[var(--muted)]">/{detail.campaign.slug}</p>
            </div>
            <a className="btn-secondary !w-auto" href={`/acao/${detail.campaign.slug}`} target="_blank">Página pública</a>
          </div>

          <div className="mt-6 grid gap-4 md:grid-cols-4">
            <div className="card p-4"><p className="text-sm text-[var(--muted)]">Confirmado</p><strong className="text-2xl">{formatMoneyFromCents(detail.stats?.confirmed_amount_cents || 0)}</strong></div>
            <div className="card p-4"><p className="text-sm text-[var(--muted)]">Pendente</p><strong className="text-2xl">{formatMoneyFromCents(detail.stats?.pending_amount_cents || 0)}</strong></div>
            <div className="card p-4"><p className="text-sm text-[var(--muted)]">Kg estimados</p><strong className="text-2xl">{kgFromAmount(detail.stats?.confirmed_amount_cents || 0, detail.campaign.impact_value_cents)} kg</strong></div>
            <div className="card p-4"><p className="text-sm text-[var(--muted)]">Meta</p><strong className="text-2xl">{formatMoneyFromCents(detail.campaign.target_amount_cents)}</strong></div>
          </div>

          <section className="card mt-6 p-5">
            <h2 className="text-2xl font-black text-[var(--brand-dark)]">Pagamentos e participações</h2>
            <div className="table-wrap mt-4">
              <table>
                <thead><tr><th>Participante</th><th>Status</th><th>Valor</th><th>Números</th><th>Comprovante</th><th>Ações</th></tr></thead>
                <tbody>
                  {detail.contributions.map((c) => (
                    <tr key={c.id}>
                      <td><strong>{c.participant_name}</strong><br /><small>{c.phone} {c.email ? `• ${c.email}` : ""}</small></td>
                      <td>{c.status}</td>
                      <td>{formatMoneyFromCents(c.amount_cents)}</td>
                      <td>{c.selected_numbers?.join(", ") || "-"}</td>
                      <td>{c.proof_file_path ? <button className="btn-secondary !w-auto !py-2" onClick={() => openProof(c.proof_file_path)}>Abrir</button> : "-"}</td>
                      <td className="flex flex-wrap gap-2">
                        {c.status === "pending_approval" ? <button className="btn-primary !w-auto !py-2" onClick={() => approve(c.id)}>Aprovar</button> : null}
                        {c.status === "pending_approval" ? <button className="btn-secondary !w-auto !py-2" onClick={() => reject(c.id)}>Rejeitar</button> : null}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>

          <section className="card mt-6 p-5">
            <h2 className="text-2xl font-black text-[var(--brand-dark)]">Números</h2>
            <div className="mt-4 grid grid-cols-5 gap-2 sm:grid-cols-8 md:grid-cols-12">
              {detail.numbers.map((n) => (
                <div key={n.number} className={`number-button ${n.status === "confirmed" ? "confirmed" : ""} ${n.status !== "available" && n.status !== "confirmed" ? "pending" : ""}`}>
                  {String(n.number).padStart(2, "0")}
                  {n.buyer_display_name ? <small>{n.buyer_display_name}</small> : null}
                </div>
              ))}
            </div>
          </section>

          <section className="card mt-6 p-5">
            <h2 className="text-2xl font-black text-[var(--brand-dark)]">Mensagens prontas</h2>
            <div className="mt-4 grid gap-4">
              {detail.messages.map((m) => (
                <div key={m.id} className="rounded-2xl border border-[var(--border)] bg-white p-4">
                  <p className="font-extrabold">{m.title}</p>
                  <textarea className="input mt-2 min-h-32" readOnly value={m.body} />
                  <button className="btn-secondary mt-2 !w-auto" onClick={() => navigator.clipboard.writeText(m.body)}>Copiar</button>
                </div>
              ))}
            </div>
          </section>
        </div>
      ) : null}
    </AdminShell>
  );
}
