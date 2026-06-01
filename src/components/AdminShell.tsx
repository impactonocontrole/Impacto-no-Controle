"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { createSupabaseBrowserClient } from "@/lib/supabase/browser";

export function AdminShell({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const supabase = createSupabaseBrowserClient();

  async function logout() {
    await supabase.auth.signOut();
    router.push("/gestao/login");
  }

  return (
    <div className="min-h-screen bg-[#f7f6ef]">
      <header className="sticky top-0 z-20 border-b border-[var(--border)] bg-white/90 backdrop-blur">
        <div className="container-page flex flex-wrap items-center justify-between gap-3 py-3">
          <Link href="/gestao" className="font-extrabold text-[var(--brand-dark)]">Impacto no Controle • Gestão</Link>
          <nav className="flex flex-wrap gap-2 text-sm font-bold">
            <Link className="btn-secondary !w-auto !py-2" href="/gestao">Dashboard</Link>
            <Link className="btn-secondary !w-auto !py-2" href="/gestao/campanhas">Campanhas</Link>
            <Link className="btn-secondary !w-auto !py-2" href="/gestao/clientes">Clientes</Link>
            <button className="btn-secondary !w-auto !py-2" onClick={logout}>Sair</button>
          </nav>
        </div>
      </header>
      <main className="container-page py-6">{children}</main>
    </div>
  );
}
