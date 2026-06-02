import { HeartHandshake, MessageCircle, PiggyBank, ShieldCheck, Smartphone, Trophy, type LucideIcon } from "lucide-react";
import { PublicHeader } from "@/components/PublicHeader";
import { InterestSelector } from "@/components/landing/InterestSelector";

const actionTypes: Array<[LucideIcon, string, string, string]> = [
  [Trophy, "Rifa / ação com números", "A pessoa escolhe números disponíveis, envia Pix e comprovante.", "Dá velocidade, meta previsível e fácil divulgação por WhatsApp."],
  [HeartHandshake, "Cotas solidárias", "Cotas como “1 kg de amor”, “5 kg de amor” ou valor livre.", "Transforma dinheiro em impacto concreto e emociona mais do que apenas pedir doação."],
  [PiggyBank, "Vaquinha", "Campanha com meta aberta, cotas sugeridas e barra de progresso.", "Boa para causas sem prêmio, com transparência e prestação de contas."],
  [MessageCircle, "Leilão beneficente", "Lances com horário final, incremento mínimo e confirmação por Pix.", "Valoriza itens simbólicos e aumenta engajamento no grupo."],
  [ShieldCheck, "Repasse fixo ou percentual", "Parte de uma venda, evento ou serviço é destinada à causa.", "Permite parcerias com empresas, bazares e ações recorrentes."],
  [Smartphone, "Compra direta de itens", "Participante registra doação de ração, cesta, fralda ou outro item.", "Inclui quem prefere doar produto em vez de dinheiro."],
];

export default function Home() {
  return (
    <>
      <PublicHeader />
      <main>
        <section className="container-page grid gap-8 py-6 md:grid-cols-[1.1fr_0.9fr] md:items-center md:py-10">
          <div>
            <h1 className="text-4xl font-black leading-tight text-[var(--brand-dark)] md:text-6xl">
              Transforme boas intenções em impacto organizado e transparente.
            </h1>
            <p className="mt-5 text-lg leading-8 text-[var(--muted)]">
              Plataforma para ONGs, centros, grupos voluntários e empresas criarem ações com números, cotas, vaquinhas, Pix, comprovantes, gestão, mensagens prontas e prestação de contas.
            </p>
            <p className="mt-4 leading-7 text-[var(--muted)]">
              O diferencial não é apenas arrecadar: é dar confiança, mostrar o avanço da meta e provar que cada participação virou resultado real.
            </p>
          </div>

          <div className="card p-6">
            <h2 className="text-2xl font-black text-[var(--brand-dark)]">O que torna o Impacto no Controle diferente?</h2>
            <p className="mt-3 leading-7 text-[var(--muted)]">
              Em vez de ser só mais uma página de Pix, rifa ou vaquinha, o Impacto no Controle organiza a ação completa: história da causa, escolha do formato, pagamento, comprovante, aprovação, acompanhamento e prestação de contas. Assim, a pessoa entende o impacto, confia no processo e participa com mais segurança.
            </p>
            <div className="mt-5 grid gap-3 sm:grid-cols-2">
              {[
                ["Mobile friendly", "Participação rápida pelo celular."],
                ["Gestão", "Aprovação e acompanhamento em um painel."],
                ["Transparência", "Valor arrecadado convertido em impacto."],
                ["Recorrência", "Histórico para próximas campanhas."],
              ].map(([title, text]) => (
                <div key={title} className="rounded-2xl border border-[var(--border)] bg-white p-4">
                  <h3 className="font-extrabold text-[var(--brand-dark)]">{title}</h3>
                  <p className="mt-1 text-sm text-[var(--muted)]">{text}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="container-page pb-10">
          <div className="mb-5">
            <span className="badge">Alternativas de arrecadação</span>
            <h2 className="mt-3 text-3xl font-black text-[var(--brand-dark)]">Escolha um formato ou combine vários na mesma campanha.</h2>
            <p className="mt-3 max-w-3xl leading-7 text-[var(--muted)]">
              O sistema permite adaptar a ação ao público, ao prêmio, à urgência e à causa. A comunicação deve vender menos e influenciar mais: a pessoa participa porque entende o impacto e confia no processo.
            </p>
          </div>
          <div className="grid gap-4 md:grid-cols-3">
            {actionTypes.map(([Icon, title, how, value]) => (
              <div key={title} className="card p-5">
                <Icon className="h-7 w-7 text-[var(--brand)]" />
                <h3 className="mt-3 text-xl font-black text-[var(--brand-dark)]">{title}</h3>
                <p className="mt-2 text-sm leading-6 text-[var(--muted)]">{how}</p>
                <p className="mt-3 rounded-2xl bg-[#eef5ec] p-3 text-sm font-bold leading-6 text-[var(--brand-dark)]">{value}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="container-page pb-12">
          <InterestSelector />
        </section>
      </main>
    </>
  );
}
