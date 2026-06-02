import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL || "https://impacto-no-controle.vercel.app"),
  title: "Impacto no Controle",
  description: "Ações solidárias com arrecadação, engajamento, gestão e prestação de contas.",
  openGraph: {
    title: "Impacto no Controle",
    description: "Ações solidárias com arrecadação, engajamento, gestão e prestação de contas.",
    siteName: "Impacto no Controle",
    type: "website",
    images: [
      {
        url: "/images/sao-francisco-og.jpg",
        width: 1200,
        height: 630,
        alt: "Impacto no Controle - ações solidárias com transparência",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Impacto no Controle",
    description: "Ações solidárias com arrecadação, engajamento, gestão e prestação de contas.",
    images: ["/images/sao-francisco-og.jpg"],
  },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="pt-BR">
      <body>{children}</body>
    </html>
  );
}
