import Link from "next/link";

export function PublicHeader() {
  return (
    <header className="sticky top-0 z-20 border-b border-[var(--border)] bg-white/90 backdrop-blur">
      <div className="container-page flex flex-wrap items-center justify-between gap-3 py-3">
        <Link href="/" className="flex min-w-0 items-center gap-3 font-extrabold text-[var(--brand-dark)]">
          <span className="grid h-10 w-10 shrink-0 place-items-center rounded-2xl bg-[var(--brand)] text-white">IC</span>
          <span className="truncate">Impacto no Controle</span>
        </Link>
        <nav className="flex items-center gap-2 text-sm font-bold">
          <Link className="btn-secondary !w-auto !px-4 !py-2" href="/cliente/login">Cliente</Link>
          <Link className="btn-secondary !w-auto !px-4 !py-2" href="/gestao/login">Gestão</Link>
        </nav>
      </div>
    </header>
  );
}
