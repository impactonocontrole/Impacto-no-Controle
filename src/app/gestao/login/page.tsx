"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createSupabaseBrowserClient } from "@/lib/supabase/browser";

export default function LoginPage() {
  const router = useRouter();
  const supabase = createSupabaseBrowserClient();
  const [email, setEmail] = useState("impactonocontrole@gmail.com");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function login() {
    setError(null);
    setLoading(true);
    const { error: authError } = await supabase.auth.signInWithPassword({ email, password });
    setLoading(false);
    if (authError) return setError("Não foi possível entrar. Verifique e-mail e senha.");
    router.push("/gestao");
  }

  return (
    <main className="container-page grid min-h-screen place-items-center py-8">
      <div className="card w-full max-w-md p-6">
        <Link href="/" className="text-sm font-bold text-[var(--brand)]">← Voltar</Link>
        <h1 className="mt-4 text-3xl font-black text-[var(--brand-dark)]">Gestão</h1>
        <p className="mt-2 text-[var(--muted)]">Acesse campanhas, aprovações, mensagens e prestação de contas.</p>
        <div className="mt-6 space-y-4">
          <div>
            <label className="label">E-mail</label>
            <input className="input" type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
          </div>
          <div>
            <label className="label">Senha</label>
            <input className="input" type="password" value={password} onChange={(e) => setPassword(e.target.value)} />
          </div>
          {error ? <div className="rounded-2xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">{error}</div> : null}
          <button className="btn-primary" onClick={login} disabled={loading}>{loading ? "Entrando..." : "Entrar"}</button>
        </div>
      </div>
    </main>
  );
}
