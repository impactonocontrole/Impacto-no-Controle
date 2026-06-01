import Link from "next/link";

export function PublicHeader() {
  return (
    <header className="sticky top-0 z-20 border-b border-[var(--border)] bg-white/85 backdrop-blur">
      <div className="container-page flex items-center justify-between py-3">
        <Link href="/" className="flex items-center gap-3 font-extrabold text-[var(--brand-dark)]">
          <span className="grid h-10 w-10 place-items-center rounded-2xl bg-[var(--brand)] text-white">IC</span>
          <span>Impacto no Controle</span>
        </Link>
        <Link className="btn-secondary !w-auto !py-2" href="/gestao/login">Gestão</Link>
      </div>
    </header>
  );
}
