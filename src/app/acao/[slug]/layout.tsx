import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "São Francisco em Ação | Impacto no Controle",
  description:
    "Participe da ação São Francisco em Ação: escolha números, contribua com cotas de amor, faça o Pix e acompanhe a arrecadação em ração para cães e gatos.",
  openGraph: {
    title: "São Francisco em Ação",
    description:
      "Ajude a transformar a imagem de São Francisco em ração para cães e gatos. Escolha seu número, faça o Pix e acompanhe a prestação de contas.",
    url: "/acao/sao-francisco-em-racao",
    siteName: "Impacto no Controle",
    type: "website",
    images: [
      {
        url: "/images/sao-francisco-og.jpg",
        width: 1200,
        height: 630,
        alt: "Imagem de São Francisco para ação solidária de ração",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "São Francisco em Ação",
    description:
      "Ajude a transformar a imagem de São Francisco em ração para cães e gatos.",
    images: ["/images/sao-francisco-og.jpg"],
  },
};

export default function CampaignLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return children;
}
