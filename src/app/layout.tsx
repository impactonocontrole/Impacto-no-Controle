import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Impacto no Controle",
  description: "Ações solidárias com arrecadação, engajamento, gestão e prestação de contas.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="pt-BR">
      <body>{children}</body>
    </html>
  );
}
