import Link from "next/link";
import { HeartHandshake, MessageCircle, ShieldCheck, Smartphone, type LucideIcon } from "lucide-react";
import { PublicHeader } from "@/components/PublicHeader";

export default function Home() {
  return (
    <>
      <PublicHeader />
      <main>
        <section className="container-page grid gap-8 py-10 md:grid-cols-[1.1fr_0.9fr] md:items-center md:py-16">
          <div>
            <span className="badge">Ações solidárias mobile-first</span>
            <h1 className="mt-5 text-4xl font-black leading-tight text-[var(--brand-dark)] md:text-6xl">
              Transforme boas intenções em impacto organizado e transparente.
            </h1>
            <p className="mt-5 text-lg leading-8 text-[var(--muted)]">
              Plataforma para ONGs, centros, grupos voluntários e empresas criarem ações com números, cotas, vaquinhas, Pix, comprovantes, gestão e prestação de contas.
            </p>
            <div className="mt-7 flex flex-col gap-3 sm:flex-row">
              <Link className="btn-primary" href="/acao/sao-francisco-em-racao">Ver campanha piloto</Link>
              <Link className="btn-secondary" href="/gestao/login">Acessar Gestão</Link>
            </div>
          </div>
          <div className="card p-6">
            <div className="rounded-3xl bg-[#eef5ec] p-6">
              <p className="text-sm font-bold uppercase tracking-wide text-[var(--brand)]">Campanha piloto</p>
              <h2 className="mt-2 text-3xl font-black text-[var(--brand-dark)]">São Francisco em Ração</h2>
              <p className="mt-3 text-[var(--muted)]">Rifa solidária com 80 números + cotas “1 kg de amor” para transformar a imagem de São Francisco em alimento para cães e gatos.</p>
            </div>
            <div className="mt-5 grid gap-3 sm:grid-cols-2">
              {( [
                [Smartphone, "Página mobile", "Participação simples pelo celular."],
                [ShieldCheck, "Comprovante", "Aprovação manual e rastreável."],
                [MessageCircle, "WhatsApp", "Mensagens prontas para divulgação."],
                [HeartHandshake, "Prestação", "Resultado em valor e kg de ração."],
              ] as Array<[LucideIcon, string, string]> ).map(([Icon, title, text]) => (
                <div key={title} className="rounded-2xl border border-[var(--border)] bg-white p-4">
                  <Icon className="h-6 w-6 text-[var(--brand)]" />
                  <h3 className="mt-3 font-extrabold">{title}</h3>
                  <p className="mt-1 text-sm text-[var(--muted)]">{text}</p>
                </div>
              ))}
            </div>
          </div>
        </section>
      </main>
    </>
  );
}
