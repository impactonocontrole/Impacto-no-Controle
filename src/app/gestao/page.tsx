import { AdminShell } from "@/components/AdminShell";
import { MetricCard } from "@/components/MetricCard";

export default function AdminHome() {
  return (
    <AdminShell>
      <section>
        <h1 className="text-3xl font-black text-[var(--brand-dark)]">Painel de Gestão</h1>
        <p className="mt-2 text-[var(--muted)]">Acompanhe ações solidárias, aprovações pendentes e resultados.</p>
        <div className="mt-6 grid gap-4 md:grid-cols-3">
          <MetricCard title="MVP" value="Ativo" hint="Campanha piloto São Francisco em Ração" />
          <MetricCard title="Modelo" value="Números + cotas" hint="Preparado para vaquinha e repasses" />
          <MetricCard title="Próximo passo" value="Aprovar Pix" hint="Acesse Campanhas para operar" />
        </div>
      </section>
    </AdminShell>
  );
}
