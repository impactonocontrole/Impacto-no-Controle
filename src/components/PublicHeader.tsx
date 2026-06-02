import Link from "next/link";

type PublicHeaderProps = {
  showAccessLinks?: boolean;
};

export function PublicHeader({ showAccessLinks = true }: PublicHeaderProps) {
  return (
    <header className="sticky top-0 z-20 border-b border-[var(--border)] bg-white/95 backdrop-blur">
      <div className="container-page public-header py-2">
        <div className="public-header-main">
          <Link href="/" className="brand-link font-extrabold text-[var(--brand-dark)]">
            <span className="grid h-10 w-10 shrink-0 place-items-center rounded-2xl bg-[var(--brand)] text-white">IC</span>
            <span className="brand-title truncate">Impacto no Controle</span>
          </Link>

          {showAccessLinks ? (
            <nav className="header-access-nav" aria-label="Acessos">
              <Link className="btn-secondary header-access-button" href="/cliente/login">Cliente</Link>
              <Link className="btn-secondary header-access-button" href="/gestao/login">Gestão</Link>
            </nav>
          ) : null}
        </div>

        <a
          href="https://automacao-extrema.vercel.app/"
          target="_blank"
          rel="noreferrer"
          className="ae-header-badge"
          aria-label="Abrir site da Automação Extrema"
        >
          <span>Desenvolvido por</span>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/images/ae-logo.png" alt="Automação Extrema" />
        </a>
      </div>
    </header>
  );
}
