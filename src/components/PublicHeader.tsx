import Link from "next/link";

type PublicHeaderProps = {
  showAccessLinks?: boolean;
};

export function PublicHeader({ showAccessLinks = true }: PublicHeaderProps) {
  return (
    <header className="sticky top-0 z-20 border-b border-[var(--border)] bg-white/95 backdrop-blur">
      <div className="container-page flex flex-wrap items-center justify-between gap-3 py-2">
        <div className="flex min-w-0 flex-wrap items-center gap-3">
          <Link href="/" className="flex min-w-0 items-center gap-3 font-extrabold text-[var(--brand-dark)]">
            <span className="grid h-10 w-10 shrink-0 place-items-center rounded-2xl bg-[var(--brand)] text-white">IC</span>
            <span className="truncate">Impacto no Controle</span>
          </Link>

          <a
            href="https://automacao-extrema.vercel.app/"
            target="_blank"
            rel="noreferrer"
            className="ae-header-badge"
            aria-label="Abrir site da Automação Extrema"
          >
            <span>uma solução da</span>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/images/ae-logo.png" alt="Automação Extrema" />
          </a>
        </div>

        {showAccessLinks ? (
          <nav className="flex items-center gap-2 text-sm font-bold">
            <Link className="btn-secondary !w-auto !px-4 !py-2" href="/cliente/login">Cliente</Link>
            <Link className="btn-secondary !w-auto !px-4 !py-2" href="/gestao/login">Gestão</Link>
          </nav>
        ) : null}
      </div>
    </header>
  );
}
