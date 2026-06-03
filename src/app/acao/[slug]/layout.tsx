import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "São Francisco em Ação | Impacto no Controle",
  description:
    "Participe da ação São Francisco em Ação da ONG Amigos de Pet: escolha seu número, faça o Pix e acompanhe a arrecadação em ração para cães e gatos.",
  openGraph: {
    title: "São Francisco em Ação",
    description:
      "Ajude a ONG Amigos de Pet a transformar a imagem de São Francisco em ração para cães e gatos. Escolha seu número, faça o Pix e acompanhe a ação.",
    url: "/acao/sao-francisco-em-racao",
    siteName: "Impacto no Controle",
    type: "website",
    images: [
      {
        url: "/images/amigos-de-pet-og.jpg",
        width: 1200,
        height: 630,
        alt: "São Francisco em Ação - ONG Amigos de Pet",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "São Francisco em Ação",
    description:
      "Ajude a ONG Amigos de Pet a transformar a imagem de São Francisco em ração para cães e gatos.",
    images: ["/images/amigos-de-pet-og.jpg"],
  },
};

export default function CampaignLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return children;
}
