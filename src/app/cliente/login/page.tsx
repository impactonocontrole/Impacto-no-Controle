import { AuthLoginCard } from "@/components/AuthLoginCard";

export default function ClientLoginPage() {
  return (
    <AuthLoginCard
      title="Área do Cliente"
      description="Entre para configurar suas ações, acompanhar pagamentos, copiar mensagens e publicar prestação de contas."
      defaultEmail="sementinhapetz@gmail.com"
    />
  );
}
