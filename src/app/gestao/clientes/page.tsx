import { AdminShell } from "@/components/AdminShell";

export default function ClientsPage() {
  return (
    <AdminShell>
      <div className="card p-6">
        <h1 className="text-3xl font-black text-[var(--brand-dark)]">Clientes</h1>
        <p className="mt-2 text-[var(--muted)]">
          O MVP já cria o cliente Sementinha Petz/Tucxa via SQL. Na próxima etapa, esta tela pode receber cadastro visual de novos clientes, logo, cores, Pix e responsáveis.
        </p>
      </div>
    </AdminShell>
  );
}
